<?php

namespace App\Enums;

/**
 * وضعیت گفتگوی تیکت.
 *
 * ⚠️ چهار حالت و نه دو تا («باز» و «بسته»).
 *    صف پشتیبانی باید بداند توپ زمین کیست: تیکتی که پشتیبان
 *    پاسخ داده و منتظر کاربر است، نباید در صفِ «نیاز به رسیدگی»
 *    بماند و وقت تیم را بگیرد.
 */
enum TicketStatus: string
{
    /** تازه ثبت شده، هنوز پاسخی نگرفته */
    case Open = 'open';

    /** پشتیبانی پاسخ داده — منتظر کاربر */
    case Answered = 'answered';

    /** کاربر دوباره پاسخ داده — نوبت پشتیبانی */
    case CustomerReply = 'customer_reply';

    /** گفتگو بسته شده */
    case Closed = 'closed';

    /** برچسب فارسی یا انگلیسی. */
    public function label(string $locale = 'fa'): string
    {
        return match ($this) {
            self::Open => $locale === 'fa' ? 'باز' : 'Open',
            self::Answered => $locale === 'fa' ? 'پاسخ داده شده' : 'Answered',
            self::CustomerReply => $locale === 'fa' ? 'پاسخ مشتری' : 'Customer replied',
            self::Closed => $locale === 'fa' ? 'بسته شده' : 'Closed',
        };
    }

    /** رنگ معنایی — نگاشت به کلاس در فرانت‌اند انجام می‌شود. */
    public function color(): string
    {
        return match ($this) {
            self::Open, self::CustomerReply => 'warning',
            self::Answered => 'info',
            self::Closed => 'success',
        };
    }

    /**
     * آیا این وضعیت نیاز به رسیدگی پشتیبانی دارد؟
     * مبنای شمارنده‌ی صف در پنل مدیریت.
     */
    public function needsStaffAttention(): bool
    {
        return in_array($this, [self::Open, self::CustomerReply], true);
    }

    /** آیا کاربر می‌تواند در این وضعیت پیام تازه بفرستد؟ */
    public function acceptsReply(): bool
    {
        return $this !== self::Closed;
    }
}
