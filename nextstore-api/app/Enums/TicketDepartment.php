<?php

namespace App\Enums;

/**
 * دپارتمان مقصد تیکت.
 *
 * دسته‌بندی عمداً کوتاه است: هر گزینه‌ی اضافه یعنی یک تصمیم بیشتر
 * برای کاربری که فقط می‌خواهد مشکلش را بگوید — و در عمل بیشتر
 * تیکت‌ها در «سایر» می‌افتند.
 */
enum TicketDepartment: string
{
    case Technical = 'technical';
    case Orders = 'orders';
    case Billing = 'billing';
    case Other = 'other';

    /** برچسب فارسی یا انگلیسی. */
    public function label(string $locale = 'fa'): string
    {
        return match ($this) {
            self::Technical => $locale === 'fa' ? 'مشکل فنی' : 'Technical',
            self::Orders => $locale === 'fa' ? 'سفارش و ارسال' : 'Orders & delivery',
            self::Billing => $locale === 'fa' ? 'پرداخت و مالی' : 'Payments',
            self::Other => $locale === 'fa' ? 'سایر' : 'Other',
        };
    }
}
