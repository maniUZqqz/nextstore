<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

/**
 * بازیابی رمز عبور — درخواست پیوند و بازنشانی.
 * ---------------------------------------------------------------------------
 * ⚠️ صفحه‌ی ورود از روز اول به «/forgot-password» لینک می‌داد و صفحه‌ی
 *    سؤالات متداول هم به مشتری می‌گفت از آن استفاده کند — ولی نه
 *    صفحه‌ای وجود داشت و نه مسیری. کاربری که رمزش را فراموش می‌کرد،
 *    به ۴۰۴ می‌رسید و حسابش عملاً از دست می‌رفت.
 */
class PasswordResetController extends Controller
{
    /**
     * ارسال پیوند بازیابی رمز به ایمیل کاربر.
     *
     * POST /api/v1/auth/forgot-password
     *
     * ⚠️ پاسخ **همیشه** یکسان است، چه ایمیل وجود داشته باشد چه نه.
     *
     *    اگر «این ایمیل ثبت نشده» برگردانده شود، این اندپوینت به یک
     *    ابزار شمارش کاربر تبدیل می‌شود: کسی با فهرستی از ایمیل‌ها
     *    می‌تواند بفهمد کدام‌ها در این فروشگاه حساب دارند — و همان
     *    فهرست را برای فیشینگ هدفمند به کار ببرد.
     *
     *    هزینه‌اش این است که کاربرِ اشتباه‌نویس منتظر ایمیلی می‌ماند
     *    که نمی‌آید؛ به همین دلیل متن پاسخ می‌گوید «اگر این ایمیل نزد
     *    ما باشد».
     */
    public function forgot(ForgotPasswordRequest $request): JsonResponse
    {
        $email = $request->string('email')->trim()->lower()->value();
        $locale = app()->getLocale();

        $user = User::query()->where('email', $email)->first();

        /*
         * ⚠️ حساب غیرفعال هم ایمیل نمی‌گیرد — بی‌صدا.
         *
         *    بازنشانی رمز برای حسابی که مدیر مسدود کرده، راهی برای
         *    دور زدن مسدودیت نیست ولی کاربر را به فکر می‌اندازد که
         *    مشکل از رمز است. پاسخ همان پاسخ همیشگی است.
         */
        if ($user && $user->is_active) {
            /*
             * توکن خام فقط همین‌جا وجود دارد؛ آنچه در جدول می‌نشیند
             * درهم‌سازی‌شده است. پس اعلان باید همین لحظه ساخته شود.
             *
             * ⚠️ `createToken` صدا زده می‌شود نه `Password::sendResetLink`.
             *
             *    دلیلش این است که اعلان باید **زبان درخواست** را بگیرد و
             *    `sendResetLink` راهی برای پاس‌دادنش ندارد؛ باید زبان را
             *    روی مدل کاربر ذخیره می‌کردیم که داده‌ی نشست را به داده‌ی
             *    پایدار تبدیل می‌کند.
             *
             *    بهایش این است که سقف ۶۰ ثانیه‌ای درونی broker
             *    (`config/auth.php` → passwords.users.throttle) اعمال
             *    نمی‌شود. جایش را محدودکننده‌ی `password-forgot` پر
             *    می‌کند که سخت‌گیرانه‌تر هم هست.
             */
            $token = Password::broker()->createToken($user);

            $user->notify(new ResetPasswordNotification($token, $locale));
        }

        return response()->json([
            'message' => __('auth.reset_link_sent'),
        ]);
    }

    /**
     * ثبت رمز تازه با توکنی که در ایمیل آمده.
     *
     * POST /api/v1/auth/reset-password
     *
     * ⚠️ برخلاف مسیر بالا، اینجا خطای دقیق برگردانده می‌شود.
     *
     *    کسی که توکن دارد یا قبلاً ایمیل را دیده یا حدسش را زده؛
     *    پنهان‌کاری چیزی اضافه نمی‌کند، ولی «توکن منقضی شده» به کاربر
     *    واقعی می‌گوید باید دوباره درخواست بدهد — بدون آن، در حلقه‌ی
     *    «رمز اشتباه است» گیر می‌کند.
     */
    public function reset(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                /*
                 * ⚠️ همه‌ی نشست‌های باز بسته می‌شوند.
                 *
                 *    اگر کسی به حساب دسترسی پیدا کرده بود، بازنشانی
                 *    رمز باید بیرونش کند. بدون این خط، توکن Sanctum
                 *    او همچنان کار می‌کرد و بازیابی رمز هیچ چیزی را
                 *    امن نمی‌کرد.
                 */
                $user->tokens()->delete();

                event(new PasswordReset($user));
            },
        );

        if ($status !== Password::PasswordReset) {
            /*
             * دو حالت ممکن: توکن نامعتبر/منقضی، یا ایمیل ناموجود.
             * هر دو یک پیام می‌گیرند چون از دید کاربر یک کار دارند:
             * درخواست تازه بده.
             */
            return response()->json([
                'message' => __('auth.reset_token_invalid'),
                'error' => ['code' => 'INVALID_RESET_TOKEN'],
                'errors' => ['token' => [__('auth.reset_token_invalid')]],
            ], 422);
        }

        return response()->json([
            'message' => __('auth.password_reset'),
        ]);
    }
}
