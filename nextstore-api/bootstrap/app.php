<?php

/**
 * نقطه‌ی راه‌اندازی و پیکربندی برنامه لاراول
 * ===========================================================================
 * در لاراول ۱۱ به بعد، پیکربندی مسیرها، میدل‌ورها و مدیریت خطا
 * همگی در همین یک فایل انجام می‌شود.
 */

use App\Exceptions\InsufficientStockException;
use App\Http\Middleware\EnsureIsAdmin;
use App\Http\Middleware\SetLocale;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',

        /*
         * ثبت فایل مسیرهای API.
         * تمام مسیرهای داخل آن خودکار پیشوند «/api» می‌گیرند.
         */
        api: __DIR__.'/../routes/api.php',

        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )

    /*
     * ⚠️ کشف خودکار فرمان‌های `app/Console/Commands`.
     *
     *    لاراول ۱۱ به بعد این کار را **خودکار انجام نمی‌دهد**؛ فقط
     *    `routes/console.php` را می‌خواند. کلاس فرمانی که آنجا ثبت
     *    نشود، با «There are no commands defined» رد می‌شود — پیامی که
     *    شبیه غلط تایپی نام فرمان به نظر می‌رسد، نه ثبت‌نشدن کلاس.
     */
    ->withCommands([
        __DIR__.'/../app/Console/Commands',
    ])

    ->withMiddleware(function (Middleware $middleware): void {
        /*
         * تشخیص زبان از هدر Accept-Language برای تمام مسیرهای API.
         */
        $middleware->api(append: [
            SetLocale::class,
        ]);

        /* محدودیت تعداد درخواست — جلوگیری از سوءاستفاده */
        $middleware->throttleApi();

        /*
         * نام مستعار میدل‌ور پنل مدیریت.
         * با این ثبت، در فایل روت می‌توان نوشت: ->middleware('admin')
         */
        $middleware->alias([
            'admin' => EnsureIsAdmin::class,
        ]);
    })

    ->withExceptions(function (Exceptions $exceptions): void {
        /*
         * تمام خطاهای مسیرهای API باید JSON برگردانند، نه صفحه HTML.
         * بدون این، فرانت‌اند هنگام parse کردن JSON با خطای مبهم
         * مواجه می‌شود.
         */
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        /* =================================================================
         * تبدیل استثناها به پاسخ JSON با ساختار یکسان
         *
         * چرا مهم است؟ فرانت‌اند فقط با یک ساختار خطا کار می‌کند و
         * لازم نیست برای هر نوع خطا کد جداگانه بنویسد:
         *     { message, error: { code }, errors? }
         * ================================================================= */

        /** موجودی ناکافی — خطای تجاری اختصاصی */
        $exceptions->render(function (InsufficientStockException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'message' => $e->getMessage(),
                'error' => ['code' => 'INSUFFICIENT_STOCK'],
                'errors' => [
                    'quantity' => [$e->getMessage()],
                ],
                'meta' => [
                    'available' => $e->available,
                    'requested' => $e->requested,
                ],
            ], 422);
        });

        /*
         * خطای اعتبارسنجی فرم.
         *
         * ⚠️ بدون این هندلر، لاراول پیام را با متد `summarize` می‌سازد و
         *    نتیجه‌اش در رابط فارسی چنین چیزی بود:
         *
         *        «نام باید دست‌کم ۳ نویسه باشد. (and 3 more errors)»
         *
         *    آن پسوند انگلیسی محلی‌سازی‌شدنی نیست — در کد خود فریم‌ورک
         *    hard-code شده — و روی **هر فرم پروژه** ظاهر می‌شد، نه فقط
         *    یکی.
         *
         * ⚠️ یک خطا پیام خودش را می‌گیرد و چند خطا پیام عمومی.
         *
         *    وقتی فقط یک فیلد ایراد دارد، «ایمیل معتبر نیست» دقیق‌تر از
         *    هر جمله‌ی کلی است. وقتی چهار فیلد ایراد دارند، خواندن یکی
         *    از آن‌ها در toast گمراه‌کننده است چون کاربر فکر می‌کند
         *    همان یکی مشکل دارد — جزئیات هر فیلد همین حالا زیر خودش
         *    نشسته و `errors` هم دست‌نخورده فرستاده می‌شود.
         */
        $exceptions->render(function (ValidationException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            $errors = $e->errors();
            $first = collect($errors)->flatten();

            return response()->json([
                'message' => $first->count() === 1
                    ? $first->first()
                    : __('errors.validation_failed'),
                'error' => ['code' => 'VALIDATION_FAILED'],
                'errors' => $errors,
            ], 422);
        });

        /** عدم احراز هویت */
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'message' => __('errors.unauthenticated'),
                'error' => ['code' => 'UNAUTHENTICATED'],
            ], 401);
        });

        /** منبع یافت نشد */
        $exceptions->render(function (ModelNotFoundException|NotFoundHttpException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'message' => __('errors.not_found'),
                'error' => ['code' => 'NOT_FOUND'],
            ], 404);
        });
    })

    ->create();
