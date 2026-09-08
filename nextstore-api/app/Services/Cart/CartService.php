<?php

namespace App\Services\Cart;

use App\Exceptions\InsufficientStockException;
use App\Models\Cart;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

/**
 * سرویس مدیریت سبد خرید — قلب منطق تجاری سبد.
 * ---------------------------------------------------------------------------
 * چرا Service و نه Controller؟
 *   - کنترلر باید نازک بماند و فقط HTTP را مدیریت کند
 *   - همین منطق از Command، Job یا تست هم قابل فراخوانی است
 *   - تست‌پذیری بسیار بالاتر
 */
class CartService
{
    /** حداکثر تعداد مجاز از هر محصول در سبد — جلوگیری از سوءاستفاده. */
    private const MAX_QUANTITY_PER_ITEM = 10;

    /** مدت اعتبار سبد (روز). */
    private const CART_LIFETIME_DAYS = 30;

    /** رابطه‌هایی که برای ساخت خروجی کامل سبد لازم‌اند. */
    private const EAGER_RELATIONS = ['items.product.images', 'items.product.brand'];

    /**
     * دریافت سبد فعلی یا ساخت سبد جدید.
     *
     * @param  int|null  $userId  شناسه کاربر لاگین‌کرده
     * @param  string|null  $sessionId  شناسه نشست برای مهمان
     */
    public function getOrCreate(?int $userId, ?string $sessionId): Cart
    {
        /*
         * کاربر واردشده همیشه سبد خودش را می‌گیرد.
         * برای مهمان، سبد با شناسه نشست پیدا می‌شود.
         */
        if ($userId) {
            $cart = Cart::firstOrCreate(
                ['user_id' => $userId],
                ['expires_at' => now()->addDays(self::CART_LIFETIME_DAYS)]
            );
        } else {
            /* مهمان بدون شناسه نشست نمی‌تواند سبد داشته باشد */
            abort_if(! $sessionId, 400, 'X-Session-Id header is required for guest carts.');

            $cart = Cart::firstOrCreate(
                ['session_id' => $sessionId, 'user_id' => null],
                ['expires_at' => now()->addDays(self::CART_LIFETIME_DAYS)]
            );
        }

        return $cart->load(self::EAGER_RELATIONS);
    }

    /**
     * افزودن محصول به سبد خرید.
     *
     * جریان کار:
     *   ۱. قفل کردن ردیف محصول (جلوگیری از Race Condition)
     *   ۲. بررسی وضعیت انتشار محصول
     *   ۳. بررسی موجودی انبار بر اساس تعداد نهایی
     *   ۴. افزایش تعداد یا ساخت ردیف جدید
     *
     * @throws InsufficientStockException وقتی موجودی کافی نیست
     */
    public function add(Cart $cart, int $productId, int $quantity): Cart
    {
        return DB::transaction(function () use ($cart, $productId, $quantity) {

            /*
             * lockForUpdate ردیف محصول را تا پایان تراکنش قفل می‌کند.
             *
             * چرا لازم است؟ اگر دو کاربر هم‌زمان آخرین کالای موجود را
             * به سبد اضافه کنند، بدون قفل هر دو موجودی را «۱» می‌بینند
             * و هر دو موفق می‌شوند — در حالی که فقط یکی باید موفق شود.
             */
            $product = Product::query()->lockForUpdate()->findOrFail($productId);

            /* محصول پیش‌نویس یا بایگانی‌شده قابل خرید نیست */
            abort_unless($product->status->isPurchasable(), 404);

            /* آیا این محصول از قبل در سبد هست؟ */
            $existing = $cart->items()->where('product_id', $productId)->first();

            /* تعداد نهایی = آنچه در سبد هست + آنچه الان خواسته شده */
            $newQuantity = ($existing?->quantity ?? 0) + $quantity;

            /* سقف تعداد در هر سفارش */
            $newQuantity = min($newQuantity, self::MAX_QUANTITY_PER_ITEM);

            /* بررسی موجودی — مگر اینکه محصول پیش‌سفارش را مجاز کرده باشد */
            if (! $product->allow_backorder && $newQuantity > $product->stock) {
                throw new InsufficientStockException(
                    product: $product,
                    requested: $newQuantity,
                    available: $product->stock,
                );
            }

            if ($existing) {
                $existing->update(['quantity' => $newQuantity]);
            } else {
                $cart->items()->create([
                    'product_id' => $productId,
                    'quantity' => $newQuantity,
                    /* قیمت لحظه‌ی افزودن برای تشخیص تغییر قیمت */
                    'price_at_add' => $product->final_price,
                ]);
            }

            /* هر تعامل، عمر سبد را تمدید می‌کند */
            $cart->update(['expires_at' => now()->addDays(self::CART_LIFETIME_DAYS)]);

            return $cart->fresh(self::EAGER_RELATIONS);
        });
    }

    /**
     * تغییر تعداد یک قلم.
     * تعداد صفر یا کمتر یعنی حذف آن قلم از سبد.
     *
     * @throws InsufficientStockException
     */
    public function updateQuantity(Cart $cart, int $itemId, int $quantity): Cart
    {
        return DB::transaction(function () use ($cart, $itemId, $quantity) {

            /* قلم باید متعلق به همین سبد باشد — جلوگیری از دستکاری سبد دیگران */
            $item = $cart->items()->where('id', $itemId)->firstOrFail();

            if ($quantity <= 0) {
                $item->delete();

                return $cart->fresh(self::EAGER_RELATIONS);
            }

            $product = Product::query()->lockForUpdate()->findOrFail($item->product_id);

            $quantity = min($quantity, self::MAX_QUANTITY_PER_ITEM);

            if (! $product->allow_backorder && $quantity > $product->stock) {
                throw new InsufficientStockException(
                    product: $product,
                    requested: $quantity,
                    available: $product->stock,
                );
            }

            $item->update(['quantity' => $quantity]);

            return $cart->fresh(self::EAGER_RELATIONS);
        });
    }

    /** حذف یک قلم از سبد. */
    public function removeItem(Cart $cart, int $itemId): Cart
    {
        $cart->items()->where('id', $itemId)->delete();

        return $cart->fresh(self::EAGER_RELATIONS);
    }

    /** خالی کردن کامل سبد — پس از ثبت موفق سفارش. */
    public function clear(Cart $cart): Cart
    {
        $cart->items()->delete();

        return $cart->fresh(self::EAGER_RELATIONS);
    }

    /**
     * ادغام سبد مهمان با سبد کاربر پس از ورود به حساب.
     *
     * ⚠️ این متد باید بلافاصله پس از ورود موفق فراخوانی شود، وگرنه
     *    کاربری که محصولاتی را به‌عنوان مهمان انتخاب کرده، پس از ورود
     *    سبدش را خالی می‌بیند — یکی از آزاردهنده‌ترین باگ‌های فروشگاهی.
     *
     * @param  string  $sessionId  شناسه نشست مهمان
     * @param  int  $userId  شناسه کاربر واردشده
     */
    public function merge(string $sessionId, int $userId): void
    {
        $guestCart = Cart::where('session_id', $sessionId)
            ->whereNull('user_id')
            ->with('items')
            ->first();

        if (! $guestCart || $guestCart->items->isEmpty()) {
            return;
        }

        $userCart = $this->getOrCreate($userId, null);

        foreach ($guestCart->items as $item) {
            try {
                $this->add($userCart, $item->product_id, $item->quantity);
            } catch (InsufficientStockException) {
                /*
                 * اقلامی که دیگر موجود نیستند بی‌صدا رد می‌شوند.
                 * شکست کل ادغام به‌خاطر یک قلم ناموجود، تجربه‌ی
                 * بدتری از دست دادن همان یک قلم است.
                 */
                continue;
            }
        }

        $guestCart->delete();
    }
}
