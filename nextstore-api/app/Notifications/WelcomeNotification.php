<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * ایمیل خوش‌آمد پس از ثبت‌نام.
 *
 * ⚠️ در صف می‌رود — همان دلیل ایمیل سفارش: بدون آن، ثبت‌نام تا جواب
 *    سرور SMTP معطل می‌ماند و اگر سرویس ایمیل قطع باشد، کاربر خطا
 *    می‌بیند در حالی که حسابش ساخته شده و دفعه‌ی بعد «این ایمیل قبلاً
 *    ثبت شده» می‌گیرد.
 */
class WelcomeNotification extends Notification implements ShouldQueue
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
        $store = config('app.name');
        $base = rtrim((string) config('services.frontend.url'), '/');

        return (new MailMessage)
            ->subject($fa ? "به {$store} خوش آمدید" : "Welcome to {$store}")
            ->greeting($fa ? "سلام {$notifiable->name}" : "Hello {$notifiable->name}")
            ->line($fa
                ? 'حساب شما ساخته شد. حالا می‌توانید خرید کنید، سفارش‌هایتان را پیگیری کنید و نظر بگذارید.'
                : 'Your account is ready. You can now shop, track your orders and leave reviews.')
            ->action(
                $fa ? 'شروع خرید' : 'Start shopping',
                "{$base}/{$this->mailLocale}/products",
            )
            /*
             * ⚠️ این جمله را حذف نکن.
             *
             *    کسی که ثبت‌نام نکرده و این ایمیل را می‌گیرد یعنی
             *    نشانی‌اش را کس دیگری وارد کرده. باید بداند که چه کار
             *    کند، وگرنه فرض می‌کند حسابی به نامش ساخته شده و
             *    نگران می‌شود.
             */
            ->line($fa
                ? 'اگر شما ثبت‌نام نکرده‌اید، این ایمیل را نادیده بگیرید یا با پشتیبانی تماس بگیرید.'
                : 'If you did not sign up, ignore this email or contact support.')
            ->salutation($fa ? 'با احترام' : 'Regards');
    }
}
