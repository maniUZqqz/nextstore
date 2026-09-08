<?php

namespace App\Services\Order;

use App\Enums\OrderStatus;
use App\Exceptions\InsufficientStockException;
use App\Models\Address;
use App\Models\Cart;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\Cart\CartService;
use App\Services\Cart\CouponService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * سرویس ثبت و مدیریت سفارش — حساس‌ترین بخش منطق تجاری پروژه.
 * ===========================================================================
 * ⚠️ چرا این کلاس باید بی‌نقص باشد؟
 *    اینجا پول و موجودی انبار هم‌زمان تغییر می‌کنند. یک خطا یعنی
 *    فروش کالای ناموجود، یا کم شدن موجودی بدون ثبت سفارش.
 *
 * سه اصل رعایت‌شده:
 *
 *   ۱. تراکنش اتمیک — یا همه‌چیز انجام می‌شود یا هیچ‌چیز.
 *      اگر وسط کار خطا رخ دهد، موجودی کم‌شده برمی‌گردد.
 *
 *   ۲. قفل ردیف محصول — جلوگیری از Race Condition وقتی دو کاربر
 *      هم‌زمان آخرین کالا را می‌خرند.
 *
 *   ۳. اعتبارسنجی مجدد قیمت — قیمت از دیتابیس خوانده می‌شود، نه از
 *      سبد کاربر. وگرنه کاربر می‌تواند با دستکاری درخواست، محصول
 *      ۹۰ میلیونی را ۱۰۰۰ تومان بخرد.
 */
class OrderService
{
    public function __construct(
        private readonly CartService $cartService,
        private readonly CouponService $coupons,
    ) {}

    /**
     * ثبت سفارش از روی سبد خرید.
     *
     * @param  User  $user  کاربر سفارش‌دهنده
     * @param  Cart  $cart  سبد خرید
     * @param  int  $addressId  شناسه آدرس تحویل
     * @param  string  $shippingMethod  'standard' یا 'express'
     * @param  string|null  $note  یادداشت مشتری
     *
     * @throws ValidationException سبد خالی یا آدرس نامعتبر
     * @throws InsufficientStockException موجودی کافی نیست
     */
    public function placeOrder(
        User $user,
        Cart $cart,
        int $addressId,
        string $shippingMethod = 'standard',
        ?string $note = null,
    ): Order {
        /* --- بررسی‌های اولیه پیش از شروع تراکنش --- */

        if ($cart->items->isEmpty()) {
            throw ValidationException::withMessages([
                'cart' => [__('shop.cart_empty')],
            ]);
        }

        /* آدرس باید متعلق به همین کاربر باشد — جلوگیری از ارسال به آدرس دیگران */
        $address = Address::where('id', $addressId)
            ->where('user_id', $user->id)
            ->first();

        if (! $address) {
            throw ValidationException::withMessages([
                'address_id' => [__('shop.address_not_found')],
            ]);
        }

        return DB::transaction(function () use ($user, $cart, $address, $shippingMethod, $note) {

            $subtotal = 0;
            $itemsData = [];

            /* ==============================================================
             * گام ۱ — بررسی و قفل کردن هر محصول
             * ============================================================== */
            foreach ($cart->items as $cartItem) {
                /*
                 * lockForUpdate ردیف محصول را تا پایان تراکنش قفل می‌کند.
                 * بدون آن، دو سفارش هم‌زمان می‌توانند آخرین کالا را بخرند.
                 */
                $product = Product::query()
                    ->lockForUpdate()
                    ->find($cartItem->product_id);

                /* محصول حذف‌شده یا غیرفعال نباید سفارش شود */
                if (! $product || ! $product->status->isPurchasable()) {
                    throw ValidationException::withMessages([
                        'cart' => [__('shop.product_unavailable')],
                    ]);
                }

                if (! $product->allow_backorder && $cartItem->quantity > $product->stock) {
                    throw new InsufficientStockException(
                        product: $product,
                        requested: $cartItem->quantity,
                        available: $product->stock,
                    );
                }

                /*
                 * ⚠️ قیمت از دیتابیس خوانده می‌شود، نه از سبد کاربر.
                 *    این تنها دفاع در برابر دستکاری قیمت سمت کلاینت است.
                 */
                $unitPrice = $product->final_price;
                $lineTotal = $unitPrice * $cartItem->quantity;
                $subtotal += $lineTotal;

                $itemsData[] = [
                    'product' => $product,
                    'quantity' => $cartItem->quantity,
                    'unit_price' => $unitPrice,
                    'line_total' => $lineTotal,
                ];
            }

            /* ==============================================================
             * گام ۲ — محاسبه مبالغ
             * ============================================================== */
            $shippingCost = $this->calculateShipping($subtotal, $shippingMethod);
            $tax = 0;        // مالیات در فاز بعد

            /*
             * --- کوپن تخفیف ---
             *
             * ⚠️ کوپن **دوباره** اعتبارسنجی می‌شود، هرچند هنگام اعمال روی
             *    سبد هم بررسی شده بود. بین آن لحظه و اینجا می‌تواند
             *    ساعت‌ها فاصله باشد: کوپن منقضی شود، سقفش پر شود، یا
             *    مدیر غیرفعالش کند. بدون این بررسی، کاربری که سبدش را
             *    دیروز آماده کرده امروز با کوپن باطل خرید می‌کرد.
             *
             * ⚠️ اگر کوپن دیگر معتبر نباشد، ثبت سفارش **شکست نمی‌خورد** —
             *    فقط تخفیف اعمال نمی‌شود. انداختن استثنا یعنی کاربری که
             *    سه مرحله‌ی تسویه را طی کرده، در آخرین گام همه‌چیز را
             *    از دست بدهد؛ آن هم به‌خاطر چیزی که تقصیر او نیست.
             */
            $discount = 0;
            $appliedCoupon = null;

            if ($cart->coupon_id && $cart->coupon) {
                $check = $this->coupons->validate($cart->coupon->code, $subtotal, $user);

                if ($check['error'] === null) {
                    $appliedCoupon = $check['coupon'];
                    $discount = $check['discount'];
                }
            }

            $total = $subtotal - $discount + $shippingCost + $tax;

            /* ==============================================================
             * گام ۳ — ساخت سفارش با عکس لحظه‌ای آدرس
             * ============================================================== */
            $order = Order::create([
                'user_id' => $user->id,
                'status' => OrderStatus::Pending,

                'coupon_id' => $appliedCoupon?->id,
                /* کد در خود سفارش کپی می‌شود — فاکتور نباید با تغییر کوپن عوض شود */
                'coupon_code' => $appliedCoupon?->code,

                /* آدرس کپی می‌شود تا ویرایش بعدی پروفایل، فاکتور را تغییر ندهد */
                'shipping_address' => [
                    'recipientName' => $address->recipient_name,
                    'recipientPhone' => $address->recipient_phone,
                    'province' => $address->province,
                    'city' => $address->city,
                    'street' => $address->street,
                    'postalCode' => $address->postal_code,
                    'buildingNo' => $address->building_no,
                    'unit' => $address->unit,
                ],

                'subtotal' => $subtotal,
                'discount' => $discount,
                'shipping_cost' => $shippingCost,
                'tax' => $tax,
                'total' => $total,

                'shipping_method' => $shippingMethod,
                'customer_note' => $note,
            ]);

            /* ==============================================================
             * گام ۴ — ساخت اقلام و کاهش موجودی
             * ============================================================== */
            foreach ($itemsData as $data) {
                /** @var Product $product */
                $product = $data['product'];

                $order->items()->create([
                    'product_id' => $product->id,

                    /* عکس لحظه‌ای اطلاعات محصول */
                    'product_name' => $product->getTranslations('name'),
                    'product_sku' => $product->sku,
                    'product_image' => $product->images->first()?->url,

                    'unit_price' => $data['unit_price'],
                    'quantity' => $data['quantity'],
                    'line_total' => $data['line_total'],
                ]);

                /*
                 * کاهش موجودی و افزایش شمارنده فروش.
                 * decrement اتمیک است و در درخواست‌های همزمان
                 * مقدار را از دست نمی‌دهد.
                 */
                $product->decrement('stock', $data['quantity']);
                $product->increment('sales_count', $data['quantity']);
            }

            /* ==============================================================
             * گام ۵ — ثبت مصرف کوپن
             * ==============================================================
             *
             * ⚠️ **داخل همان تراکنش** و **پس از ساخت سفارش**.
             *
             *    بیرون از تراکنش: اگر ثبت سفارش شکست بخورد، یک مصرف
             *    ثبت‌شده باقی می‌ماند و ظرفیت کوپن بی‌دلیل می‌سوزد.
             *
             *    هنگام اعمال روی سبد (به‌جای اینجا): هر کاربری با زدن
             *    کد و رها کردن سبد یک ظرفیت را می‌سوزاند و کمپین پیش
             *    از شروع تمام می‌شد.
             */
            if ($appliedCoupon !== null) {
                $this->coupons->recordUsage($appliedCoupon, $user, $order, $discount);
            }

            /* ==============================================================
             * گام ۶ — خالی کردن سبد
             * ============================================================== */
            /*
             * ⚠️ کوپن هم باید از سبد برداشته شود.
             *
             *    `clear()` فقط اقلام را پاک می‌کند. بدون این خط، کاربر
             *    پس از خرید یک سبد خالی با کوپن چسبیده داشت و خرید
             *    بعدی‌اش بی‌آنکه کد را دوباره بزند تخفیف می‌گرفت — تا
             *    وقتی سقف «هر کاربر یک بار» جلویش را بگیرد، که پیام
             *    خطایی می‌داد که کاربر هیچ توضیحی برایش نداشت.
             */
            $this->cartService->clear($cart);
            $cart->update(['coupon_id' => null]);

            return $order->load('items');
        });
    }

    /**
     * محاسبه هزینه ارسال.
     *
     * @param  int  $subtotal  جمع اقلام به ریال
     * @param  string  $method  روش ارسال
     */
    public function calculateShipping(int $subtotal, string $method): int
    {
        /*
         * نرخ‌ها از config/shop.php خوانده می‌شوند، نه ثابت محلی.
         * پیش‌تر همین اعداد در سه فایل تکرار شده بودند و سیدر با
         * بقیه نمی‌خواند — یعنی سبد خرید یک عدد نشان می‌داد و
         * پرداخت عدد دیگری می‌گرفت.
         */
        $rates = config('shop.shipping');

        /* ارسال عادی برای سفارش‌های بالای آستانه رایگان است */
        if ($method === 'standard' && $subtotal >= $rates['free_threshold']) {
            return 0;
        }

        return match ($method) {
            'express' => $rates['express'],
            default => $rates['standard'],
        };
    }

    /**
     * تغییر وضعیت سفارش با رعایت قواعد انتقال.
     *
     * @throws ValidationException وقتی انتقال مجاز نیست
     */
    public function changeStatus(Order $order, OrderStatus $target): Order
    {
        if (! $order->status->canTransitionTo($target)) {
            throw ValidationException::withMessages([
                'status' => [__('shop.invalid_status_transition', [
                    'from' => $order->status->label(),
                    'to' => $target->label(),
                ])],
            ]);
        }

        return DB::transaction(function () use ($order, $target) {
            /* ثبت زمان مرحله — برای نمایش خط زمانی سفارش به مشتری */
            $timestamps = match ($target) {
                OrderStatus::Paid => ['paid_at' => now()],
                OrderStatus::Shipped => ['shipped_at' => now()],
                OrderStatus::Delivered => ['delivered_at' => now()],
                OrderStatus::Cancelled => ['cancelled_at' => now()],
                default => [],
            };

            $order->update(['status' => $target, ...$timestamps]);

            /*
             * بازگرداندن موجودی هنگام لغو یا بازگشت وجه.
             * بدون این، کالاهایی که فروخته نشدند برای همیشه از
             * موجودی کم می‌مانند.
             */
            if (in_array($target, [OrderStatus::Cancelled, OrderStatus::Refunded], true)) {
                $this->restoreStock($order);
            }

            return $order->fresh('items');
        });
    }

    /**
     * بازگرداندن موجودی اقلام یک سفارش لغوشده.
     */
    private function restoreStock(Order $order): void
    {
        foreach ($order->items as $item) {
            if ($item->product_id) {
                Product::where('id', $item->product_id)->update([
                    'stock' => DB::raw("stock + {$item->quantity}"),
                    'sales_count' => DB::raw("MAX(sales_count - {$item->quantity}, 0)"),
                ]);
            }
        }
    }
}
