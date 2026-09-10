<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

/**
 * ایمیل تأیید نشانی.
 * ---------------------------------------------------------------------------
 * ⚠️ چرا اعلان سفارشی و نه `VerifyEmail` پیش‌فرض لاراول؟
 *
 *    همان تله‌ی بازیابی رمز: اعلان پیش‌فرض به مسیر خودِ لاراول لینک
 *    می‌دهد و این پروژه API-only است. لینک باید به صفحه‌ی نکست برود
 *    و آن صفحه خودش اندپوینت را صدا بزند.
 *
 * ⚠️ لینک **امضاشده** است و انقضا دارد.
 *
 *    بدون امضا، هر کسی که شناسه‌ی کاربر را حدس بزند می‌تواند ایمیل
 *    دیگران را «تأیید» کند. امضا این را غیرممکن می‌کند و هَش ایمیل
 *    تضمین می‌کند لینک بعد از تغییر ایمیل بی‌اثر شود.
 *
 * ⚠️ زبان در سازنده ذخیره می‌شود (`$mailLocale`، نه `$locale` که با
 *    خاصیت کلاس پایه تصادم دارد) چون کار صف بعداً و در فرایندی اجرا
 *    می‌شود که از زبان درخواست کاربر خبر ندارد.
 */
class VerifyEmailNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $mailLocale,
    ) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $fa = $this->mailLocale === 'fa';

        $minutes = (int) config('auth.verification.expire', 60);

        return (new MailMessage)
            ->subject($fa ? 'تأیید نشانی ایمیل' : 'Verify your email address')
            ->greeting($fa ? 'سلام' : 'Hello')
            ->line($fa
                ? 'برای تأیید نشانی ایمیل حسابتان، روی دکمه‌ی زیر بزنید.'
                : 'Please click the button below to verify your email address.')
            ->action(
                $fa ? 'تأیید ایمیل' : 'Verify email',
                $this->verificationUrl($notifiable),
            )
            ->line($fa
                ? "این پیوند تا {$minutes} دقیقه معتبر است."
                : "This link expires in {$minutes} minutes.")
            ->line($fa
                ? 'اگر شما حسابی نساخته‌اید، نیازی به هیچ کاری نیست.'
                : 'If you did not create an account, no further action is required.')
            ->salutation($fa ? 'با احترام' : 'Regards');
    }

    /**
     * نشانی صفحه‌ی تأیید در **فرانت‌اند**، با پارامترهای امضاشده.
     *
     * ⚠️ امضا روی مسیرِ *API* ساخته می‌شود، نه روی نشانی فرانت.
     *
     *    فرانت فقط پیام‌رسان است: پارامترها را می‌گیرد و همان‌ها را به
     *    اندپوینت پس می‌دهد. اگر امضا روی نشانی فرانت بود، لاراول
     *    نمی‌توانست اعتبارش را بسنجد چون دامنه و مسیر را نمی‌شناسد.
     *
     * ⚠️ اگر `FRONTEND_URL` تنظیم نشده باشد، مسیر نسبی برمی‌گردد —
     *    لینک شکسته بهتر از استثنای مرگبار وسط ارسال ایمیل است.
     */
    private function verificationUrl(object $notifiable): string
    {
        $path = URL::temporarySignedRoute(
            'api.auth.email.verify',
            now()->addMinutes((int) config('auth.verification.expire', 60)),
            [
                'id' => $notifiable->getKey(),
                /* هَش ایمیل: لینک بعد از تغییر ایمیل بی‌اثر می‌شود */
                'hash' => sha1((string) $notifiable->getEmailForVerification()),
            ],
            absolute: false,
        );

        $base = rtrim((string) config('services.frontend.url'), '/');

        /*
         * مسیر امضاشده به‌صورت یک پارامتر به صفحه‌ی فرانت داده
         * می‌شود و آن صفحه همان را بی‌کم‌وکاست به API پس می‌دهد.
         * دست‌کاری‌اش امضا را باطل می‌کند.
         */
        return "{$base}/{$this->mailLocale}/verify-email?path=".rawurlencode($path);
    }
}
