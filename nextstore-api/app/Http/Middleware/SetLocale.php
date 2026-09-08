<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * میدل‌ور تعیین زبان پاسخ API.
 * ---------------------------------------------------------------------------
 * فرانت‌اند نکست در هر درخواست هدر Accept-Language می‌فرستد:
 *     Accept-Language: fa
 *
 * این میدل‌ور آن را می‌خواند و زبان برنامه را تنظیم می‌کند تا:
 *   - Resource ها فیلدهای چندزبانه را به زبان درست برگردانند
 *   - پیام‌های خطا و اعتبارسنجی به زبان کاربر باشند
 *
 * ⚠️ اعتبارسنجی الزامی است: مقدار هدر از سمت کاربر می‌آید و قابل
 *    دستکاری است. اگر مستقیم به setLocale بدهیم، مقدار نامعتبر
 *    می‌تواند باعث خطا یا رفتار غیرمنتظره شود.
 */
class SetLocale
{
    /**
     * زبان‌های مجاز.
     * باید با فهرست LOCALES در فرانت‌اند هماهنگ باشد.
     *
     * @var array<int, string>
     */
    private const SUPPORTED = ['fa', 'en'];

    /**
     * پردازش درخواست و تنظیم زبان.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        /*
         * ترتیب تشخیص زبان:
         *   ۱. هدر صریح X-Locale (اولویت بالا — کنترل مستقیم فرانت‌اند)
         *   ۲. هدر استاندارد Accept-Language
         *   ۳. زبان پیش‌فرض برنامه
         */
        $locale = $request->header('X-Locale')
            ?? $this->parseAcceptLanguage($request->header('Accept-Language'))
            ?? config('app.locale');

        /* فقط زبان‌های مجاز پذیرفته می‌شوند */
        if (! in_array($locale, self::SUPPORTED, true)) {
            $locale = config('app.locale');
        }

        app()->setLocale($locale);

        $response = $next($request);

        /*
         * اعلام زبان پاسخ در هدر.
         * مفید برای دیباگ و برای کش‌های میانی (CDN) تا نسخه‌ی هر زبان
         * را جداگانه کش کنند.
         */
        $response->headers->set('Content-Language', $locale);

        return $response;
    }

    /**
     * استخراج کد زبان از هدر Accept-Language.
     *
     * نمونه ورودی: "fa-IR,fa;q=0.9,en-US;q=0.8"
     * خروجی: "fa"
     */
    private function parseAcceptLanguage(?string $header): ?string
    {
        if (! $header) {
            return null;
        }

        /* اولین زبان را برمی‌داریم و بخش منطقه و وزن را حذف می‌کنیم */
        $first = explode(',', $header)[0];
        $code = strtolower(trim(explode('-', explode(';', $first)[0])[0]));

        return $code !== '' ? $code : null;
    }
}
