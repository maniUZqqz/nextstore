<?php

namespace App\Enums;

/**
 * وضعیت پرداخت.
 * ---------------------------------------------------------------------------
 * ⚠️ چرا از وضعیت سفارش جداست؟
 *    یک سفارش می‌تواند چند تراکنش پرداخت داشته باشد: کاربر یک بار
 *    ناموفق پرداخت می‌کند، دوباره تلاش می‌کند و موفق می‌شود. اگر
 *    وضعیت پرداخت را روی خود سفارش نگه داریم، تاریخچه‌ی تلاش‌ها
 *    از دست می‌رود و پیگیری مشکلات مالی غیرممکن می‌شود.
 */
enum PaymentStatus: string
{
    /** ایجادشده — کاربر هنوز به درگاه نرفته */
    case Initiated = 'initiated';

    /** در انتظار — کاربر در درگاه است */
    case Pending = 'pending';

    /** موفق */
    case Succeeded = 'succeeded';

    /** ناموفق — رد شده توسط بانک یا انصراف کاربر */
    case Failed = 'failed';

    /** بازگشت داده‌شده */
    case Refunded = 'refunded';

    /**
     * برچسب قابل نمایش.
     *
     * @param  string  $locale  کد زبان
     */
    public function label(string $locale = 'fa'): string
    {
        return match ($this) {
            self::Initiated => $locale === 'fa' ? 'ایجاد شده' : 'Initiated',
            self::Pending => $locale === 'fa' ? 'در انتظار پرداخت' : 'Pending',
            self::Succeeded => $locale === 'fa' ? 'موفق' : 'Succeeded',
            self::Failed => $locale === 'fa' ? 'ناموفق' : 'Failed',
            self::Refunded => $locale === 'fa' ? 'بازگشت داده شده' : 'Refunded',
        };
    }

    /** آیا این تراکنش نهایی شده و دیگر تغییر نمی‌کند؟ */
    public function isFinal(): bool
    {
        return in_array($this, [self::Succeeded, self::Failed, self::Refunded], true);
    }
}
