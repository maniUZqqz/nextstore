<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * تبدیل مدل Product به خروجی JSON برای لیست محصولات (کارت محصول).
 * ---------------------------------------------------------------------------
 * چرا Resource و نه برگرداندن مستقیم مدل؟
 *   ۱. امنیت — فیلدهای حساس مثل cost_price هرگز بیرون نمی‌روند
 *   ۲. پایداری — تغییر نام ستون در دیتابیس، قرارداد API را نمی‌شکند
 *   ۳. محلی‌سازی — فیلدهای چندزبانه به رشته‌ی زبان جاری تبدیل می‌شوند
 *   ۴. غنی‌سازی — مقادیر محاسباتی (درصد تخفیف) اضافه می‌شوند
 *
 * ⚠️ نکته مهم: خروجی این کلاس، نام فیلدها را camelCase می‌کند تا با
 *    قرارداد TypeScript در فرانت‌اند هماهنگ باشد.
 */
class ProductResource extends JsonResource
{
    /**
     * ساخت آرایه خروجی.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /* زبان درخواست از میدل‌ور SetLocale تعیین شده است */
        $locale = app()->getLocale();

        return [
            'id' => $this->id,

            /* --- محتوای محلی‌سازی‌شده --- */
            /* translate() مقدار زبان جاری را برمی‌گرداند، با fallback خودکار */
            'name' => $this->translate('name', $locale),
            'shortDescription' => $this->translate('short_description', $locale),

            'slug' => $this->slug,
            'sku' => $this->sku,

            /* --- قیمت‌گذاری --- */
            /*
             * قیمت‌ها به کمترین واحد پول (ریال) هستند.
             * فرمت‌بندی نمایشی وظیفه‌ی فرانت‌اند است، نه بک‌اند —
             * چون به زبان و ارز کاربر بستگی دارد.
             */
            'price' => $this->price,
            'finalPrice' => $this->final_price,
            'salePrice' => $this->sale_price,
            'isOnSale' => $this->is_on_sale,
            'discountPercent' => $this->discount_percent,

            /*
             * زمان پایان تخفیف.
             *
             * ⚠️ چرا در نمای فهرست هم لازم است؟
             *    صفحه اصلی برای «پیشنهاد شگفت‌انگیز» تایمر شمارش
             *    معکوس دارد. چون این فیلد قبلاً فقط در نمای جزئیات
             *    بود، فرانت‌اند ناچار بود زمانی ساختگی بسازد
             *    (همیشه ۲۴ ساعت بعد). نتیجه: تایمری که به کاربر
             *    دروغ می‌گفت و با هر بار رفرش صفحه از نو شروع
             *    می‌شد — بدترین نوع «فوریت جعلی».
             *
             *    وقتی تخفیف فعال نیست، کلید اصلاً فرستاده نمی‌شود
             *    تا حجم فهرست بی‌جهت بالا نرود.
             */
            'saleEndsAt' => $this->when(
                (bool) $this->is_on_sale,
                fn () => $this->sale_ends_at?->toIso8601String(),
            ),

            /* --- موجودی --- */
            'stock' => $this->stock,
            'isInStock' => $this->is_in_stock,
            'isLowStock' => $this->is_low_stock,

            /* --- امتیاز --- */
            'ratingAvg' => round($this->rating_avg, 1),
            'reviewsCount' => $this->reviews_count,

            /* --- نشانه‌ها --- */
            'isFeatured' => $this->is_featured,
            'hasVariants' => $this->has_variants,

            /*
             * تصویر شاخص.
             * whenLoaded تضمین می‌کند اگر رابطه بارگذاری نشده باشد،
             * کوئری اضافه‌ای زده نشود (جلوگیری از مشکل N+1).
             */
            'thumbnail' => $this->whenLoaded('images', function () use ($locale) {
                $image = $this->images->firstWhere('is_primary', true) ?? $this->images->first();

                return $image ? [
                    'url' => $image->url,
                    'alt' => $image->translate('alt', $locale) ?: $this->translate('name', $locale),
                ] : null;
            }),

            /* دسته‌بندی — فقط اگر با محصول بارگذاری شده باشد */
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->translate('name', $locale),
                'slug' => $this->category->slug,
            ]),

            /* برند — فقط اگر بارگذاری شده باشد */
            'brand' => $this->whenLoaded('brand', fn () => [
                'id' => $this->brand->id,
                'name' => $this->brand->translate('name', $locale),
                'slug' => $this->brand->slug,
            ]),
        ];
    }
}
