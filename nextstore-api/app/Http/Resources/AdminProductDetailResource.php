<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * خروجی محصول برای فرم ویرایش پنل مدیریت.
 * ---------------------------------------------------------------------------
 * ⚠️ تفاوت بنیادی با ProductDetailResource:
 *
 *    نسخه‌ی فروشگاه فیلدهای چندزبانه را به رشته‌ی زبان جاری تبدیل
 *    می‌کند:   name → "گوشی موبایل"
 *
 *    اما فرم ویرایش باید *هر دو* زبان را نشان دهد تا ادمین بتواند
 *    نسخه‌ی انگلیسی را هم اصلاح کند:
 *              name → { "fa": "گوشی موبایل", "en": "Mobile Phone" }
 *
 *    اگر از همان Resource فروشگاه استفاده می‌کردیم، ادمین با باز کردن
 *    فرم و ذخیره‌ی آن، بی‌آنکه بفهمد ترجمه‌ی زبان دیگر را پاک می‌کرد.
 *    این یک از دست رفتن خاموش داده است — بدترین نوع باگ.
 */
class AdminProductDetailResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $locale = app()->getLocale();

        return [
            'id' => $this->id,
            'slug' => $this->slug,

            /* --- محتوای خام چندزبانه (نه ترجمه‌شده) --- */
            'name' => $this->rawTranslations('name'),
            'shortDescription' => $this->rawTranslations('short_description'),
            'description' => $this->rawTranslations('description'),
            'metaTitle' => $this->rawTranslations('meta_title'),
            'metaDescription' => $this->rawTranslations('meta_description'),

            /* برچسب آماده برای عنوان صفحه — راحتی فرانت‌اند */
            'displayName' => $this->translate('name', $locale),

            /* --- شناسه‌ها --- */
            'sku' => $this->sku,
            'barcode' => $this->barcode,
            'categoryId' => $this->category_id,
            'brandId' => $this->brand_id,

            /* --- قیمت (ریال، عدد صحیح) --- */
            'price' => $this->price,
            'salePrice' => $this->sale_price,
            'costPrice' => $this->cost_price,
            'saleStartsAt' => $this->sale_starts_at?->toIso8601String(),
            'saleEndsAt' => $this->sale_ends_at?->toIso8601String(),

            /* --- انبار --- */
            'stock' => $this->stock,
            'lowStockThreshold' => $this->low_stock_threshold,
            'allowBackorder' => (bool) $this->allow_backorder,

            /* --- فیزیکی --- */
            'weight' => $this->weight,
            'dimensions' => $this->dimensions,

            /* --- انتشار --- */
            'status' => $this->status->value,
            'isFeatured' => (bool) $this->is_featured,
            'publishedAt' => $this->published_at?->toIso8601String(),

            /* تصاویر برای پیش‌نمایش در فرم */
            'images' => $this->whenLoaded('images', fn () => $this->images->map(fn ($image) => [
                'id' => $image->id,
                'url' => $image->url,
                'alt' => $image->translate('alt', $locale),
                'isPrimary' => (bool) $image->is_primary,
            ])->values()->all()),
        ];
    }

    /*
     * ⚠️ متد rawTranslations اینجا تعریف نشده — عمداً.
     *
     *    پیش‌تر یک نسخه‌ی خصوصی در همین کلاس بود. وقتی نمای مدیریت
     *    مقالات هم به آن نیاز پیدا کرد، کپی دومش لازم می‌شد و
     *    «تضمین وجود کلید هر دو زبان» در دو جا نگهداری می‌شد — با
     *    این ریسک که یکی به‌روز شود و دیگری نه.
     *
     *    حالا در HasTranslations نشسته و روی خودِ مدل است؛ فراخوانی
     *    $this->rawTranslations(...) از طریق Resource به مدل ارسال
     *    می‌شود. فهرست زبان‌ها را هم از config('app.supported_locales')
     *    می‌گیرد، نه هاردکد.
     */
}
