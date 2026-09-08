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
