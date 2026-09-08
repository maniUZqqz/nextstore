<?php

namespace App\Enums;

/**
 * اولویت تیکت.
 *
 * ⚠️ اولویت را *کاربر* انتخاب می‌کند، پس مبنای مرتب‌سازی صف نیست.
 *    اگر بود، همه «فوری» می‌زدند و اولویت بی‌معنا می‌شد. صف بر
 *    اساس زمان انتظار مرتب می‌شود و اولویت فقط یک نشانه‌ی بصری
 *    برای پشتیبان است.
 */
enum TicketPriority: string
{
    case Low = 'low';
    case Normal = 'normal';
    case High = 'high';

    /** برچسب فارسی یا انگلیسی. */
    public function label(string $locale = 'fa'): string
    {
        return match ($this) {
            self::Low => $locale === 'fa' ? 'کم' : 'Low',
            self::Normal => $locale === 'fa' ? 'عادی' : 'Normal',
            self::High => $locale === 'fa' ? 'زیاد' : 'High',
        };
    }

    /** رنگ معنایی. */
    public function color(): string
    {
        return match ($this) {
            self::Low => 'muted',
            self::Normal => 'info',
            self::High => 'destructive',
        };
    }
}
