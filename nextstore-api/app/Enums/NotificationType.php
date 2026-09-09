<?php

namespace App\Enums;

/**
 * نوع رویدادی که اعلان از آن ساخته شده.
 * ---------------------------------------------------------------------------
 * ⚠️ متن اعلان **ذخیره نمی‌شود**؛ از روی نوع و پارامترها ساخته می‌شود.
 *
 *    اگر جمله‌ی آماده در دیتابیس می‌نشست، کاربری که زبان سایت را عوض
 *    می‌کند اعلان‌های قدیمی‌اش را برای همیشه به زبان قبلی می‌دید. بدتر:
 *    اصلاح یک غلط املایی فقط روی اعلان‌های *آینده* اثر می‌کرد.
 *
 * ⚠️ هر نوع تازه باید در `label()`, `body()` و `icon()` هم دیده شود.
 *    `match` بدون شاخه‌ی پیش‌فرض نوشته شده تا PHP همان‌جا خطا بدهد و
 *    نوعی بی‌متن از قلم نیفتد.
 */
enum NotificationType: string
{
    /** وضعیت سفارش عوض شد — ارسال شد، تحویل شد، لغو شد. */
    case OrderStatus = 'order_status';

    /** پشتیبانی به تیکت پاسخ داد. */
    case TicketReply = 'ticket_reply';

    /** نظر کاربر تأیید و منتشر شد. */
    case ReviewApproved = 'review_approved';

    /** نظر کاربر رد شد — با دلیل. */
    case ReviewRejected = 'review_rejected';

    /** عنوان کوتاه اعلان. */
    public function label(string $locale = 'fa'): string
    {
        $fa = $locale === 'fa';

        return match ($this) {
            self::OrderStatus => $fa ? 'وضعیت سفارش' : 'Order update',
            self::TicketReply => $fa ? 'پاسخ پشتیبانی' : 'Support reply',
            self::ReviewApproved => $fa ? 'نظر شما منتشر شد' : 'Your review is live',
            self::ReviewRejected => $fa ? 'نظر شما تأیید نشد' : 'Your review was not approved',
        };
    }

    /**
     * متن اعلان با جای‌گذاری پارامترها.
     *
     * ⚠️ هر پارامتر غایب با رشته‌ی خالی پر می‌شود، نه اینکه استثنا
     *    بدهد. اعلان ناقص از صفحه‌ی خطا بهتر است: کاربر دست‌کم می‌فهمد
     *    چیزی رخ داده و لینک هم کار می‌کند.
     *
     * @param  array<string, mixed>  $data
     */
    public function body(array $data, string $locale = 'fa'): string
    {
        $fa = $locale === 'fa';
        $get = fn (string $key) => (string) ($data[$key] ?? '');

        return match ($this) {
            self::OrderStatus => $fa
                ? "سفارش {$get('orderNumber')} به وضعیت «{$get('statusLabel')}» رسید."
                : "Order {$get('orderNumber')} is now “{$get('statusLabel')}”.",

            self::TicketReply => $fa
                ? "پشتیبانی به تیکت {$get('ticketNumber')} پاسخ داد."
                : "Support replied to ticket {$get('ticketNumber')}.",

            self::ReviewApproved => $fa
                ? "نظر شما درباره‌ی «{$get('productName')}» منتشر شد."
                : "Your review of “{$get('productName')}” is now public.",

            self::ReviewRejected => $fa
                ? "نظر شما درباره‌ی «{$get('productName')}» منتشر نشد. دلیل: {$get('reason')}"
                : "Your review of “{$get('productName')}” was not published. Reason: {$get('reason')}",
        };
    }

    /**
     * نام آیکون — از فهرست سفید فرانت.
     *
     * ⚠️ نام lucide است نه کلاس CSS: فرانت آن را به یک کامپوننت واقعی
     *    نگاشت می‌کند و نام ناشناخته به آیکون عمومی برمی‌گردد، نه
     *    اینکه صفحه را بیندازد.
     */
    public function icon(): string
    {
        return match ($this) {
            self::OrderStatus => 'package',
            self::TicketReply => 'life-buoy',
            self::ReviewApproved => 'star',
            self::ReviewRejected => 'star-off',
        };
    }

    /**
     * رنگ معنایی — همان توکن‌های رنگ پروژه.
     */
    public function color(): string
    {
        return match ($this) {
            self::OrderStatus => 'info',
            self::TicketReply => 'primary',
            self::ReviewApproved => 'success',
            self::ReviewRejected => 'warning',
        };
    }
}
