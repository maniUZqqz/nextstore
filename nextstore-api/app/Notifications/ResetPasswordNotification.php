<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * ایمیل بازیابی رمز عبور.
 * ---------------------------------------------------------------------------
 * ⚠️ چرا اعلان سفارشی و نه پیش‌فرض لاراول؟
 *
 *    اعلان پیش‌فرض لینکی به **مسیر خودِ لاراول** می‌سازد
 *    (`route('password.reset')`). این پروژه API-only است و چنین
 *    مسیری ندارد؛ کاربر باید به صفحه‌ی نکست برود. لینک پیش‌فرض به
 *    ۴۰۴ می‌رسید — و بدتر، فقط در تولید معلوم می‌شد.
 *
 * ⚠️ متن دوزبانه است و زبان از **درخواست** می‌آید نه از تنظیمات
 *    کاربر: کسی که سایت را انگلیسی می‌بیند، انتظار ایمیل انگلیسی
 *    دارد.
 */
class ResetPasswordNotification extends Notification
{
    use Queueable;

    public function __construct(
        /** توکن خام — همانی که در لینک می‌رود. */
        private readonly string $token,
        /*
         * زبان ایمیل: fa یا en.
         *
         * ⚠️ نامش `$mailLocale` است نه `$locale`.
         *
         *    کلاس پایه‌ی `Notification` خودش یک `$locale` عمومی دارد
         *    (برای `->locale()`), و ارتقای پارامتر سازنده به‌صورت
         *    readonly، PHP را با خطای مرگبار «Cannot redeclare
         *    non-readonly property … as readonly» متوقف می‌کرد.
         *
         *    این خطا فقط هنگام *ارسال واقعی* رخ می‌داد: درخواست
         *    بازیابی برای ایمیل ناموجود سالم جواب می‌داد و برای ایمیل
         *    موجود می‌شکست — یعنی همان تفاوت پاسخی که این جریان
         *    عمداً برای پنهان‌کردنش ساخته شده بود.
         */
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

        $minutes = config('auth.passwords.users.expire', 60);

        return (new MailMessage)
            ->subject($fa ? 'بازیابی رمز عبور' : 'Reset your password')
            ->greeting($fa ? 'سلام' : 'Hello')
            ->line($fa
                ? 'این ایمیل را به این دلیل دریافت کرده‌اید که درخواست بازیابی رمز عبور برای حساب شما ثبت شده است.'
                : 'You are receiving this email because we received a password reset request for your account.')
            ->action(
                $fa ? 'ساخت رمز تازه' : 'Choose a new password',
                $this->resetUrl($notifiable),
            )
            ->line($fa
                ? "این پیوند تا {$minutes} دقیقه معتبر است."
                : "This link expires in {$minutes} minutes.")
            /*
             * ⚠️ این جمله را حذف نکن.
             *
             *    کسی که درخواست نداده و این ایمیل را می‌گیرد باید
             *    بلافاصله بداند که لازم نیست کاری کند — وگرنه فرض
             *    می‌کند حسابش لو رفته و رمزش را عوض می‌کند، که خودش
             *    یک اتفاق ناخواسته است.
             */
            ->line($fa
                ? 'اگر شما این درخواست را نداده‌اید، نیازی به هیچ کاری نیست؛ رمز عبورتان تغییر نمی‌کند.'
                : 'If you did not request a password reset, no further action is required - your password will not change.')
            ->salutation($fa ? 'با احترام' : 'Regards');
    }

    /**
     * نشانی صفحه‌ی بازنشانی در **فرانت‌اند**.
     *
     * ⚠️ ایمیل هم می‌رود، پس هر دو پارامتر باید در نشانی باشند: توکن
     *    به‌تنهایی کافی نیست چون `Password::reset` ایمیل را هم برای
     *    یافتن کاربر لازم دارد.
     *
     * ⚠️ اگر `FRONTEND_URL` تنظیم نشده باشد، به مسیر نسبی برمی‌گردد.
     *    لینک شکسته بهتر از استثنای مرگبار وسط ارسال ایمیل است — آن
     *    یکی درخواست کاربر را با خطای ۵۰۰ می‌شکند.
     */
    private function resetUrl(object $notifiable): string
    {
        $base = rtrim((string) config('services.frontend.url'), '/');

        return $base."/{$this->mailLocale}/reset-password?".http_build_query([
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ]);
    }
}
