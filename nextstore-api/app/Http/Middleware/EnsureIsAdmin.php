<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * میدل‌ور محافظت از مسیرهای پنل مدیریت.
 * ---------------------------------------------------------------------------
 * ⚠️ چرا میدل‌ور جدا و نه بررسی داخل هر کنترلر؟
 *    اگر بررسی نقش در کنترلرها پخش باشد، فراموش کردن آن در یک
 *    اکشن جدید یعنی یک در باز به پنل مدیریت. با میدل‌ور، محافظت
 *    یک بار روی کل گروه مسیر اعمال می‌شود و امکان فراموشی نیست.
 *
 * ترتیب اجرا: پس از auth:sanctum قرار می‌گیرد، پس کاربر حتماً
 * احراز هویت شده است و فقط نقش بررسی می‌شود.
 */
class EnsureIsAdmin
{
    /**
     * بررسی دسترسی کاربر به پنل مدیریت.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        /*
         * پاسخ ۴۰۳ می‌دهیم نه ۴۰۴.
         *
         * تفاوت با مسیرهای منابع کاربر: آنجا ۴۰۴ می‌دادیم تا وجود
         * منبع لو نرود. اینجا وجود پنل مدیریت راز نیست — هر
         * فروشگاهی پنل دارد. پیام صریح «دسترسی ندارید» تجربه‌ی
         * بهتری می‌دهد و کاربر را سردرگم نمی‌کند.
         */
        abort_unless(
            $user && $user->isAdmin(),
            403,
            __('errors.forbidden'),
        );

        return $next($request);
    }
}
