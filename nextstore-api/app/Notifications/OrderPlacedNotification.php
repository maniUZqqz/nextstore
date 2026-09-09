<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * ایمیل تأیید ثبت سفارش.
 * ---------------------------------------------------------------------------
 * ⚠️ `ShouldQueue` اینجا **الزامی** است، نه بهینه‌سازی.
 *
 *    بدون آن، ارسال ایمیل داخل همان درخواستی انجام می‌شود که سفارش را
 *    ثبت می‌کند. یعنی مشتری روی دکمه‌ی «ثبت سفارش» می‌زند و تا وقتی
 *    سرور SMTP جواب بدهد منتظر می‌ماند — گاهی چند ثانیه، و اگر سرویس
 *    ایمیل کند یا قطع باشد، **درخواست ثبت سفارش تایم‌اوت می‌شود** در
 *    حالی که سفارش کاملاً ثبت شده. مشتری خطا می‌بیند و دوباره سفارش
 *    می‌دهد.
 *
 *    با صف، ایمیل بعداً و جدا فرستاده می‌شود؛ شکستش هیچ اثری روی خرید
 *    ندارد.
 *
 * ⚠️ زبان در سازنده ذخیره می‌شود، نه در لحظه‌ی ارسال خوانده.
 *
 *    کار صف بعداً و در فرایند دیگری اجرا می‌شود که هیچ خبری از زبان
 *    درخواست کاربر ندارد. بدون این، هر ایمیل به زبان پیش‌فرض سرور
 *    می‌رفت.
 */
class OrderPlacedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Order $order,
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
        $number = $this->order->order_number;

        $message = (new MailMessage)
            ->subject($fa ? "سفارش {$number} ثبت شد" : "Order {$number} confirmed")
            ->greeting($fa ? 'سلام' : 'Hello')
            ->line($fa
                ? "سفارش شما با شماره‌ی {$number} ثبت شد و در حال بررسی است."
                : "Your order {$number} has been placed and is being reviewed.");

        /*
         * ⚠️ مبلغ به **تومان** نوشته می‌شود نه ریال.
         *
         *    کل API با ریال کار می‌کند (عدد صحیح، بدون خطای گِردکردن)
         *    ولی مشتری ایرانی قیمت را به تومان می‌فهمد. عدد ریالی در
         *    ایمیل، ده برابر به نظر می‌رسد.
         */
        $toman = number_format((int) round($this->order->total / 10));

        $message->line($fa
            ? "مبلغ قابل پرداخت: {$toman} تومان"
            : 'Total: '.number_format($this->order->total / 600_000, 2).' USD');

        return $message
            ->action(
                $fa ? 'مشاهده‌ی سفارش' : 'View your order',
                $this->orderUrl(),
            )
            ->line($fa
                ? 'از خرید شما سپاسگزاریم.'
                : 'Thank you for your purchase.')
            ->salutation($fa ? 'با احترام' : 'Regards');
    }

    /**
     * نشانی صفحه‌ی سفارش در فرانت‌اند.
     *
     * ⚠️ همان تله‌ی ایمیل بازیابی رمز: اعلان‌های پیش‌فرض لاراول به مسیر
     *    خودِ لاراول لینک می‌دهند و این پروژه API-only است.
     */
    private function orderUrl(): string
    {
        $base = rtrim((string) config('services.frontend.url'), '/');

        return "{$base}/{$this->mailLocale}/account/orders/{$this->order->order_number}";
    }
}
