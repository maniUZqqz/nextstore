<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

/**
 * سرویس‌پرووایدر اصلی برنامه.
 * ---------------------------------------------------------------------------
 * محل تعریف تنظیمات سراسری‌ای که در زمان راه‌اندازی برنامه باید اعمال شوند.
 */
class AppServiceProvider extends ServiceProvider
{
    /** ثبت سرویس‌ها در کانتینر (فعلاً چیزی لازم نیست). */
    public function register(): void
    {
        //
    }

    /** اجرای تنظیمات پس از ثبت همه‌ی سرویس‌ها. */
    public function boot(): void
    {
        $this->configureRateLimiting();
    }

    /**
     * تعریف محدودیت‌های تعداد درخواست (Rate Limiting).
     *
     * چرا لازم است؟
     *   بدون محدودیت، یک اسکریپت می‌تواند هزاران درخواست در ثانیه بفرستد
     *   و سرور را از کار بیندازد یا کل کاتالوگ را استخراج کند (Scraping).
     *
     * استراتژی تفکیک کاربر:
     *   کاربر لاگین‌کرده → بر اساس شناسه کاربر (سهم اختصاصی خودش)
     *   کاربر مهمان      → بر اساس آدرس IP
     *
     *   دلیل: چند کاربر پشت یک IP مشترک (مثلاً یک شرکت) نباید سهم
     *   یکدیگر را مصرف کنند.
     */
    private function configureRateLimiting(): void
    {
        /*
         * محدودیت عمومی API.
         * کاربر مهمان: ۶۰ درخواست در دقیقه
         * کاربر واردشده: ۱۲۰ درخواست در دقیقه (سهم بیشتر چون شناخته‌شده است)
         */
        RateLimiter::for('api', function (Request $request) {
            $user = $request->user();

            return $user
                ? Limit::perMinute(120)->by('user:'.$user->id)
                : Limit::perMinute(60)->by('ip:'.$request->ip());
        });

        /*
         * محدودیت سخت‌گیرانه برای ورود و ثبت‌نام.
         * هدف: جلوگیری از حمله‌ی حدس رمز عبور (Brute Force).
         * ۵ تلاش در دقیقه برای هر ترکیب ایمیل و IP.
         */
        RateLimiter::for('auth', function (Request $request) {
            $key = strtolower((string) $request->input('email')).'|'.$request->ip();

            return Limit::perMinute(5)->by($key);
        });

        /*
         * محدودیت جستجو.
         * جستجو کوئری سنگینی است، پس سهم کمتری می‌گیرد.
         */
        RateLimiter::for('search', function (Request $request) {
            return Limit::perMinute(30)->by($request->ip());
        });
    }
}
