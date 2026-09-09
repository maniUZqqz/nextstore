<?php

namespace App\Services\Notification;

use App\Enums\NotificationType;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Review;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * ساخت اعلان‌های درون‌برنامه‌ای.
 * ---------------------------------------------------------------------------
 * ⚠️ هر متد این کلاس **هرگز استثنا بیرون نمی‌دهد**.
 *
 *    اعلان یک عارضه‌ی جانبی است، نه بخشی از عملیات اصلی. اگر ساختن
 *    اعلانِ «سفارش ارسال شد» شکست بخورد، تغییر وضعیت سفارش نباید
 *    شکست بخورد — مدیر می‌بیند که «خطایی رخ داد» و دوباره تلاش
 *    می‌کند، در حالی که سفارش همان بار اول عوض شده بود.
 *
 *    خطا فقط لاگ می‌شود. بدترین پیامدش این است که کاربر یک اعلان
 *    نمی‌گیرد؛ بهترین حالتِ خرابی.
 *
 * ⚠️ فراخوانی‌ها **بیرون از تراکنش** انجام می‌شوند.
 *
 *    اگر داخل تراکنش بودند و تراکنش برمی‌گشت، اعلانی می‌ماند که به
 *    رویدادی اشاره می‌کند که هرگز رخ نداده — بدتر از نبودِ اعلان.
 */
class NotificationService
{
    /**
     * ساخت یک اعلان با مدیریت خطا.
     *
     * @param  array<string, mixed>  $data
     */
    private function push(
        User $user,
        NotificationType $type,
        array $data,
        ?string $link = null,
    ): void {
        try {
            Notification::query()->create([
                'user_id' => $user->id,
                'type' => $type,
                'data' => $data,
                'link' => $link,
            ]);
        } catch (Throwable $e) {
            Log::warning('ساخت اعلان ناموفق بود', [
                'user' => $user->id,
                'type' => $type->value,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * وضعیت سفارش عوض شد.
     *
     * ⚠️ متن وضعیت **هر دو زبان** ذخیره می‌شود، نه فقط زبان جاری.
     *
     *    برچسب وضعیت از یک enum می‌آید و در لحظه‌ی خواندن هم قابل
     *    ساختن است — ولی آن یعنی اعلان به enum امروز وابسته بماند. اگر
     *    فردا وضعیتی حذف شود، اعلان‌های قدیمی متنشان را از دست
     *    می‌دهند. ذخیره‌ی هر دو برچسب، اعلان را از تغییرات آینده جدا
     *    می‌کند.
     */
    public function orderStatusChanged(Order $order): void
    {
        $this->push(
            $order->user,
            NotificationType::OrderStatus,
            [
                'orderNumber' => $order->order_number,
                'status' => $order->status->value,
                'statusLabel' => $order->status->label(app()->getLocale()),
                'statusLabelFa' => $order->status->label('fa'),
                'statusLabelEn' => $order->status->label('en'),
            ],
            "/account/orders/{$order->order_number}",
        );
    }

    /**
     * پشتیبانی به تیکت پاسخ داد.
     *
     * ⚠️ فقط پاسخ **کارکنان** اعلان می‌سازد. اگر پاسخ خود کاربر هم
     *    اعلان می‌ساخت، هر پیامی که می‌فرستاد یک اعلان برای خودش
     *    می‌آورد — که هم بی‌معناست و هم نشان زنگوله را برای همیشه قرمز
     *    نگه می‌دارد.
     */
    public function ticketReplied(Ticket $ticket): void
    {
        $this->push(
            $ticket->user,
            NotificationType::TicketReply,
            [
                'ticketNumber' => $ticket->ticket_number,
                'subject' => $ticket->subject,
            ],
            "/account/tickets/{$ticket->ticket_number}",
        );
    }

    /** نظر کاربر تأیید و منتشر شد. */
    public function reviewApproved(Review $review): void
    {
        $this->push(
            $review->user,
            NotificationType::ReviewApproved,
            [
                'productName' => $review->product?->translate('name') ?? '',
            ],
            $review->product ? "/products/{$review->product->slug}" : '/account/reviews',
        );
    }

    /**
     * نظر کاربر رد شد.
     *
     * ⚠️ دلیل هم می‌رود. اعلانِ «نظرت رد شد» بدون دلیل، کاربر را به
     *    نوشتن همان نظر دوباره وامی‌دارد — و پشتیبانی دوباره ردش
     *    می‌کند.
     */
    public function reviewRejected(Review $review, string $reason): void
    {
        $this->push(
            $review->user,
            NotificationType::ReviewRejected,
            [
                'productName' => $review->product?->translate('name') ?? '',
                'reason' => $reason,
            ],
            '/account/reviews',
        );
    }
}
