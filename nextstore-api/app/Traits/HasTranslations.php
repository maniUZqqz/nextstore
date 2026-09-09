<?php

namespace App\Traits;

/**
 * تِرِیت مدیریت فیلدهای چندزبانه.
 * ---------------------------------------------------------------------------
 * هر مدلی که این تریت را استفاده کند، می‌تواند فیلدهایی داشته باشد که
 * مقدارشان در دیتابیس به‌صورت JSON ذخیره شده است:
 *
 *     {"fa": "گوشی هوشمند", "en": "Smartphone"}
 *
 * نحوه استفاده در مدل:
 *     use HasTranslations;
 *     protected array $translatable = ['name', 'description'];
 *
 * سپس:
 *     $product->translate('name');          // بر اساس زبان فعلی برنامه
 *     $product->translate('name', 'en');    // به زبان مشخص
 *     $product->setTranslation('name', 'fa', 'گوشی');
 *
 * چرا این روش به‌جای پکیج آماده؟
 *   - وابستگی کمتر و کنترل کامل روی رفتار
 *   - سازوکار fallback دلخواه: اگر ترجمه نبود، زبان پیش‌فرض برگردد
 */
trait HasTranslations
{
    /**
     * ⚠️ `$translatable` عمداً اینجا **اعلام نمی‌شود**.
     *
     *    نسخه‌ای از این تِرِیت آن را با مقدار پیش‌فرض `[]` تعریف کرد تا
     *    نوعش برای تحلیل ایستا روشن باشد. PHP آن را رد می‌کند: مدلی که
     *    همان ویژگی را با مقدار متفاوت تعریف کند خطای مرگبارِ
     *    «definition differs and is considered incompatible» می‌دهد و
     *    کل برنامه بالا نمی‌آید.
     *
     *    به‌جایش هر مدل خودش اعلامش می‌کند و امضای متد پایین قرارداد
     *    را روشن نگه می‌دارد.
     */

    /**
     * مقدار یک فیلد چندزبانه را به زبان خواسته‌شده برمی‌گرداند.
     *
     * ترتیب جست‌وجو (Fallback):
     *   ۱. زبان درخواستی
     *   ۲. زبان پیش‌فرض برنامه (fa)
     *   ۳. اولین مقدار موجود
     *   ۴. رشته خالی
     *
     * چرا fallback مهم است؟ اگر ادمین فقط نام فارسی را وارد کرده باشد،
     * کاربر انگلیسی‌زبان باید چیزی ببیند نه یک جای خالی.
     *
     * @param  string  $field  نام فیلد (مثلاً 'name')
     * @param  string|null  $locale  کد زبان؛ null یعنی زبان فعلی برنامه
     */
    public function translate(string $field, ?string $locale = null): string
    {
        $locale ??= app()->getLocale();

        /* مقدار خام از دیتابیس — آرایه است چون در مدل به json کست شده */
        $value = $this->getAttribute($field);

        if (! is_array($value)) {
            /* اگر رشته ساده بود (داده قدیمی یا فیلد غیرچندزبانه) همان را برگردان */
            return (string) ($value ?? '');
        }

        return $value[$locale]
            ?? $value[config('app.fallback_locale', 'fa')]
            ?? (reset($value) ?: '');
    }

    /**
     * مقدار یک زبان از فیلد چندزبانه را تنظیم می‌کند.
     * مقادیر زبان‌های دیگر دست‌نخورده باقی می‌مانند.
     *
     * @param  string  $field  نام فیلد
     * @param  string  $locale  کد زبان
     * @param  string  $value  مقدار جدید
     */
    public function setTranslation(string $field, string $locale, string $value): static
    {
        $current = $this->getAttribute($field);
        $current = is_array($current) ? $current : [];

        $current[$locale] = $value;
        $this->setAttribute($field, $current);

        return $this;
    }

    /**
     * تمام ترجمه‌های یک فیلد را برمی‌گرداند.
     * در پنل ادمین برای پر کردن فرم چندزبانه استفاده می‌شود.
     *
     * @return array<string, string> مثلاً ['fa' => '...', 'en' => '...']
     */
    public function getTranslations(string $field): array
    {
        $value = $this->getAttribute($field);

        return is_array($value) ? $value : [];
    }

    /**
     * ترجمه‌های خام یک فیلد، با تضمین وجود کلید *همه‌ی* زبان‌ها.
     *
     * تفاوتش با getTranslations: آن هرچه در دیتابیس هست را می‌دهد،
     * این همیشه شکل کامل {"fa": "...", "en": "..."} را می‌دهد و
     * کلیدهای غایب را با رشته‌ی خالی پر می‌کند.
     *
     * ⚠️ چرا این تضمین لازم است؟
     *    فرم دوزبانه‌ی پنل مدیریت این مقدار را مستقیم در input
     *    می‌گذارد. اگر ستون فقط {"fa": "..."} باشد، مقدار انگلیسی
     *    undefined می‌شود و ری‌اکت آن input را «کنترل‌نشده» می‌سازد؛
     *    با اولین تایپ، هشدار «تغییر از کنترل‌نشده به کنترل‌شده»
     *    می‌دهد و مقدار اولیه از دست می‌رود.
     *
     * ⚠️ فهرست زبان‌ها اینجا هاردکد نشده تا با SetLocale::SUPPORTED
     *    دو منبع حقیقتِ واگرا نسازد — از پیکربندی خوانده می‌شود و
     *    اگر روزی زبان سومی اضافه شود، فرم‌ها خودکار آن را می‌گیرند.
     *
     * @return array<string, string>
     */
    public function rawTranslations(string $field): array
    {
        $value = $this->getAttribute($field);
        $value = is_array($value) ? $value : [];

        $result = [];

        foreach (config('app.supported_locales', ['fa', 'en']) as $locale) {
            $result[$locale] = (string) ($value[$locale] ?? '');
        }

        return $result;
    }

    /**
     * فهرست فیلدهای چندزبانه این مدل.
     * مدل‌ها با تعریف $translatable این را مشخص می‌کنند.
     *
     * @return array<int, string>
     */
    public function translatableFields(): array
    {
        /*
         * ⚠️ `?? []` لازم است و «کد مرده» نیست.
         *
         *    تحلیل ایستا هر هشت مدلِ فعلی را می‌بیند که ویژگی را
         *    تعریف کرده‌اند و نتیجه می‌گیرد که هرگز تهی نیست. ولی
         *    تِرِیت قراردادش را با *مدل‌های آینده* هم می‌بندد، و مدلی
         *    که این تِرِیت را بگیرد و چیزی اعلام نکند بدون این خط
         *    خطای «ویژگی تعریف‌نشده» می‌دهد.
         */
        return $this->translatable ?? [];
    }
}
