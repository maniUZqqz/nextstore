<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

/**
 * خروجی JSON صفحه‌ی جزئیات محصول.
 * ---------------------------------------------------------------------------
 * از ProductResource ارث می‌برد و فیلدهای سنگین‌تری را اضافه می‌کند که
 * فقط در صفحه‌ی محصول لازم‌اند و نباید در لیست محصولات ارسال شوند.
 *
 * چرا دو Resource جدا؟
 *   لیست محصولات ممکن است ۲۴ آیتم داشته باشد. اگر توضیحات کامل و کل
 *   گالری هر محصول را بفرستیم، حجم پاسخ چند برابر می‌شود و صفحه کند
 *   بارگذاری می‌گردد. اصل: هر اندپوینت دقیقاً همان چیزی را بفرستد که لازم است.
 */
class ProductDetailResource extends ProductResource
{
    /**
     * ساخت آرایه خروجی — فیلدهای پایه به‌علاوه‌ی جزئیات کامل.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $locale = app()->getLocale();

        return array_merge(parent::toArray($request), [

            /* توضیحات کامل محصول — فقط در این صفحه لازم است */
            'description' => $this->translate('description', $locale),

            'barcode' => $this->barcode,

            /* --- مشخصات فیزیکی --- */
            'weight' => $this->weight,
            'dimensions' => $this->dimensions,

            /* --- بازه زمانی تخفیف --- */
            /* فرانت‌اند با این مقدار تایمر شمارش معکوس فروش ویژه را می‌سازد */
            'saleEndsAt' => $this->sale_ends_at?->toIso8601String(),

            /* --- گالری کامل تصاویر --- */
            'images' => $this->whenLoaded('images', fn () => $this->images->map(fn ($image) => [
                'id' => $image->id,
                'url' => $image->url,
                'alt' => $image->translate('alt', $locale) ?: $this->translate('name', $locale),
                'isPrimary' => $image->is_primary,
            ])->values()),

            /* --- متادیتای سئو --- */
            /* اگر ادمین متای اختصاصی ننوشته باشد، از نام و توضیح کوتاه استفاده می‌شود */
            'seo' => [
                'title' => $this->translate('meta_title', $locale)
                    ?: $this->translate('name', $locale),
                'description' => $this->translate('meta_description', $locale)
                    ?: $this->translate('short_description', $locale),
            ],

            'publishedAt' => $this->published_at?->toIso8601String(),
        ]);
    }
}
