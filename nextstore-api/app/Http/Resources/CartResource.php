<?php

namespace App\Http\Resources;

use App\Models\CartItem;
use App\Services\Cart\CouponService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * تبدیل مدل Cart به خروجی JSON.
 *
 * تمام محاسبات مالی اینجا انجام و به فرانت‌اند داده می‌شود.
 *
 * ⚠️ چرا محاسبه در بک‌اند و نه فرانت؟
 *    اگر فرانت‌اند جمع را محاسبه کند، کاربر می‌تواند با ابزار توسعه‌دهنده
 *    آن را دستکاری کند. مبلغ نهایی همیشه باید از سرور بیاید و هنگام
 *    ثبت سفارش هم دوباره سمت سرور بررسی شود.
 */
class CartResource extends JsonResource
{
    /**
     * ساخت آرایه خروجی.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $locale = app()->getLocale();

        $subtotal = $this->subtotal;

        /*
         * کوپن و مبلغ تخفیفش.
         *
         * ⚠️ محاسبه اینجا انجام می‌شود و نه در فرانت: اگر کلاینت تخفیف
         *    را حساب کند، با ابزار توسعه‌دهنده قابل دستکاری است. همان
         *    اصلی که برای جمع سبد اعمال شده.
         */
        $coupon = app(CouponService::class)
            ->activeCouponFor($this->resource, $subtotal, $request->user());

        $discount = $coupon['discountAmount'] ?? 0;

        /*
         * همان نرخ‌هایی که OrderService هنگام پرداخت به کار می‌برد.
         * جدا بودنشان یعنی ریسک اینکه سبد یک مبلغ نشان دهد و
         * فاکتور نهایی مبلغ دیگری — بدترین نوع غافلگیری برای مشتری.
         */
        $rates = config('shop.shipping');

        $shipping = $subtotal >= $rates['free_threshold'] || $subtotal === 0
            ? 0
            : $rates['standard'];

        return [
            'id' => $this->id,

            /* --- اقلام سبد --- */
            'items' => $this->items->map(fn (CartItem $item) => [
                'id' => $item->id,
                'quantity' => $item->quantity,

                /* قیمت لحظه‌ی افزودن — برای مقایسه با قیمت فعلی */
                'priceAtAdd' => $item->price_at_add,
                'currentPrice' => $item->product->final_price,
                'lineTotal' => $item->line_total,

                /* اگر true باشد، فرانت‌اند هشدار تغییر قیمت نشان می‌دهد */
                'priceChanged' => $item->price_changed,

                /* سقف مجاز بر اساس موجودی انبار */
                'maxQuantity' => min($item->product->stock, 10),

                'product' => [
                    'id' => $item->product->id,
                    'name' => $item->product->translate('name', $locale),
                    'slug' => $item->product->slug,
                    'stock' => $item->product->stock,
                    'isInStock' => $item->product->is_in_stock,
                    'image' => $item->product->images->first()?->url,
                    'brand' => $item->product->brand?->translate('name', $locale),
                ],
            ])->values(),

            /** تعداد کل اقلام — برای نشانگر روی آیکون سبد در هدر */
            'itemsCount' => $this->total_quantity,

            /* --- خلاصه مالی --- */
            'summary' => [
                'subtotal' => $subtotal,
                'discount' => $discount,
                'shipping' => $shipping,
                'tax' => 0,        // مالیات در فاز تسویه محاسبه می‌شود
                'total' => $subtotal - $discount + $shipping,

                /* مبلغ باقی‌مانده تا ارسال رایگان — برای نوار پیشرفت */
                'freeShippingThreshold' => $rates['free_threshold'],
                'remainingForFreeShipping' => max($rates['free_threshold'] - $subtotal, 0),
                'hasFreeShipping' => $shipping === 0 && $subtotal > 0,
            ],

            /*
             * کوپن اعمال‌شده — تهی اگر کوپنی نباشد **یا دیگر معتبر نباشد**.
             *
             * ⚠️ نمایش سبد نباید به‌خاطر کوپنِ منقضی خطا بدهد. اگر کوپن
             *    بین اعمال و بازدید بعدی از اعتبار افتاده باشد، اینجا
             *    فقط ناپدید می‌شود؛ پیام صریح را کاربر هنگام ثبت سفارش
             *    می‌گیرد، جایی که واقعاً اهمیت دارد.
             */
            'coupon' => $coupon,
        ];
    }
}
