<?php

namespace App\Services\Catalog;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * باطل کردن کش کاتالوگ در هر دو طرف
 * ---------------------------------------------------------------------------
 * ⚠️ باگی که این کلاس حل می‌کند:
 *
 *    تا پیش از این، AdminProductController فقط کش لاراول را پاک
 *    می‌کرد. اما فرانت‌اند نکست هم پاسخ‌های API را کش می‌کند:
 *
 *        محصولات    → ۳۰۰ ثانیه
 *        دسته‌بندی‌ها → ۳۶۰۰ ثانیه
 *        برندها     → ۳۶۰۰ ثانیه
 *
 *    نتیجه: ادمین محصولی را ویرایش می‌کرد، لاراول درست جواب می‌داد،
 *    دیتابیس درست بود — اما فروشگاه تا یک ساعت داده‌ی قدیمی نشان
 *    می‌داد. تشخیص این باگ سخت است چون همه‌ی لایه‌ها «درست» به نظر
 *    می‌رسند و فقط صفحه اشتباه است.
 *
 *    حالا پاک کردن کش یک عملیات دوطرفه است.
 *
 * ⚠️ چرا خطای فراخوانی نکست، عملیات ادمین را نمی‌شکند؟
 *    اگر فرانت‌اند خاموش باشد (که در توسعه عادی است) ذخیره‌ی محصول
 *    نباید شکست بخورد. خطا فقط لاگ می‌شود؛ بدترین پیامدش این است
 *    که کش تا انقضای طبیعی‌اش کهنه بماند.
 */
class CacheInvalidator
{
    /** برچسب‌هایی که سمت نکست تعریف شده‌اند. */
    public const TAG_PRODUCTS = 'products';

    public const TAG_CATEGORIES = 'categories';

    public const TAG_BRANDS = 'brands';

    public const TAG_HOME = 'home';

    public const TAG_SETTINGS = 'settings';

    public const TAG_BANNERS = 'banners';

    /**
     * پاک کردن کامل کش کاتالوگ — لاراول و نکست.
     *
     * @param  list<string>  $tags  برچسب‌های نکست که باید باطل شوند
     */
    public function flushCatalog(array $tags = [
        self::TAG_PRODUCTS,
        self::TAG_CATEGORIES,
        self::TAG_BRANDS,
        self::TAG_HOME,
    ]): void
    {
        $this->flushLaravelCache();
        $this->notifyFrontend($tags);
    }

    /**
     * باطل کردن کش تنظیمات فروشگاه.
     *
     * ⚠️ جدا از `flushCatalog` است و عمداً کش کاتالوگ را دست نمی‌زند:
     *    عوض کردن شماره‌ی تلفن نباید کش صدها محصول را بسوزاند و
     *    اولین بازدیدکننده‌ی بعدی را منتظر بگذارد.
     */
    public function flushSettings(): void
    {
        Setting::flushCache();
        $this->notifyFrontend([self::TAG_SETTINGS]);
    }

    /**
     * باطل کردن کش بنرهای صفحه‌ی اصلی.
     *
     * ⚠️ برچسب `home` هم باطل می‌شود، نه فقط `banners`.
     *
     *    بنرها روی صفحه‌ی اصلی رندر می‌شوند و آن صفحه با برچسب `home`
     *    کش شده است. باطل‌کردن تنها `banners` یعنی تابع گرفتن بنر
     *    دوباره اجرا می‌شود ولی صفحه‌ای که آن را نشان می‌دهد از کش
     *    قدیمی می‌آید — و مدیر بنری را که خاموش کرده هنوز روی سایت
     *    می‌بیند.
     *
     * ⚠️ کش کاتالوگ دست نمی‌خورد: عوض کردن یک بنر نباید کش صدها
     *    محصول را بسوزاند.
     */
    public function flushBanners(): void
    {
        $this->notifyFrontend([self::TAG_BANNERS, self::TAG_HOME]);
    }

    /**
     * پاک کردن کلیدهای کش داخلی لاراول.
     *
     * کلیدها به تفکیک زبان‌اند، پس هر دو باید پاک شوند؛ وگرنه
     * نسخه‌ی انگلیسی سایت داده‌ی قدیمی نشان می‌دهد در حالی که
     * نسخه‌ی فارسی به‌روز است — تناقضی که پیدا کردنش سخت است.
     */
    private function flushLaravelCache(): void
    {
        foreach (['fa', 'en'] as $locale) {
            Cache::forget("home.{$locale}");
            Cache::forget("categories.tree.{$locale}");
            Cache::forget("brands.all.{$locale}");
        }
    }

    /**
     * اطلاع به نکست برای باطل کردن کش داده‌اش.
     *
     * @param  list<string>  $tags
     */
    private function notifyFrontend(array $tags): void
    {
        $baseUrl = config('services.frontend.url');
        $secret = config('services.frontend.revalidate_secret');

        /* پیکربندی نشده = این قابلیت خاموش است، نه اینکه خطا باشد */
        if (! $baseUrl || ! $secret) {
            return;
        }

        try {
            $response = Http::timeout(3)
                ->withHeaders(['X-Revalidate-Secret' => $secret])
                ->post(rtrim($baseUrl, '/').'/api/revalidate', ['tags' => $tags]);

            if ($response->failed()) {
                Log::warning('باطل کردن کش نکست ناموفق بود', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }
        } catch (\Throwable $exception) {
            /*
             * تایم‌اوت یا خاموش بودن فرانت‌اند نباید ذخیره‌ی محصول را
             * برگرداند. ادمین کارش را کرده؛ کش خودش منقضی می‌شود.
             */
            Log::warning('اتصال به فرانت‌اند برای باطل کردن کش برقرار نشد', [
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
