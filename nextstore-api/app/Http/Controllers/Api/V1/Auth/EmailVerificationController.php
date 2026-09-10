<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * تأیید نشانی ایمیل.
 * ---------------------------------------------------------------------------
 * ⚠️ چرا این جریان اضافه شد؟
 *
 *    صفحه‌ی پروفایل نشان «تأییدنشده» را نشان می‌داد و هیچ راهی برای
 *    تأیید وجود نداشت — یک بن‌بست. کاربر یک هشدار دائمی می‌دید که
 *    کاری از دستش برنمی‌آمد.
 *
 * ⚠️ تأیید ایمیل **دسترسی را محدود نمی‌کند**.
 *
 *    این یک فروشگاه است، نه بانک. اجبار به تأیید پیش از خرید، کاربری
 *    را که ایمیل تأییدش در هرزنامه افتاده از خرید بازمی‌دارد. نشان
 *    اطلاعاتی است، نه دروازه.
 */
class EmailVerificationController extends Controller
{
    /**
     * ارسال دوباره‌ی ایمیل تأیید.
     *
     * ⚠️ پاسخ برای «فرستاده شد» و «از قبل تأیید شده» یکسان نیست، و
     *    این اشکالی ندارد: کاربر **وارد شده** و درباره‌ی حساب خودش
     *    می‌پرسد، پس چیزی درباره‌ی دیگران لو نمی‌رود.
     */
    public function resend(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => __('auth.email_already_verified'),
            ]);
        }

        /*
         * ⚠️ خطای ارسال بلعیده می‌شود، مثل ایمیل خوش‌آمد.
         *
         *    اگر سرویس ایمیل قطع باشد، کاربر نباید خطای ۵۰۰ ببیند —
         *    فقط دکمه را دوباره می‌زند و هیچ‌چیز خراب نشده است.
         */
        try {
            $user->notify(new VerifyEmailNotification(app()->getLocale()));
        } catch (Throwable $e) {
            Log::warning('ارسال ایمیل تأیید ناموفق بود', [
                'user' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'message' => __('auth.email_verification_sent'),
        ]);
    }

    /**
     * تأیید با پیوند امضاشده.
     *
     * ⚠️ مسیر احراز هویت **نمی‌خواهد**.
     *
     *    کاربر ممکن است لینک را در مرورگر دیگری باز کند که آنجا وارد
     *    نشده. امضای موقت خودش هویت را تضمین می‌کند — همان الگویی که
     *    خود لاراول برای این کار دارد.
     *
     * ⚠️ هَش ایمیل جدا بررسی می‌شود.
     *
     *    امضا فقط می‌گوید پارامترها دست‌کاری نشده‌اند. اگر کاربر بعد
     *    از درخواست، ایمیلش را عوض کند، لینک قدیمی نباید ایمیل تازه
     *    را تأیید کند.
     */
    public function verify(Request $request, int $id, string $hash): JsonResponse
    {
        $user = User::query()->find($id);

        if ($user === null || ! hash_equals($hash, sha1((string) $user->getEmailForVerification()))) {
            return response()->json([
                'message' => __('auth.email_verification_invalid'),
                'error' => ['code' => 'INVALID_VERIFICATION_LINK'],
            ], 403);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => __('auth.email_already_verified'),
            ]);
        }

        $user->markEmailAsVerified();

        return response()->json([
            'message' => __('auth.email_verified'),
        ]);
    }
}
