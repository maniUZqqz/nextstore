<?php

namespace App\Enums;

/**
 * وضعیت سفارش — چرخه‌ی عمر کامل یک سفارش.
 * ---------------------------------------------------------------------------
 * مسیر عادی:
 *   Pending → Paid → Processing → Shipped → Delivered
 *
 * مسیرهای انحرافی:
 *   Pending → Cancelled     (کاربر منصرف شد یا پرداخت انجام نشد)
 *   هر مرحله → Refunded     (بازگشت وجه)
 *
 * ⚠️ چرا انتقال وضعیت باید کنترل شود؟
 *    بدون قانون، ادمین می‌تواند سفارش «تحویل‌شده» را به «در انتظار
 *    پرداخت» برگرداند یا سفارش لغوشده را «ارسال‌شده» کند. متد
 *    canTransitionTo این را غیرممکن می‌کند.
 */
enum OrderStatus: string
{
    /** در انتظار پرداخت — سفارش ثبت شده ولی پول نرسیده */
    case Pending = 'pending';

    /** پرداخت‌شده — منتظر آماده‌سازی */
    case Paid = 'paid';

    /** در حال آماده‌سازی — بسته‌بندی در انبار */
    case Processing = 'processing';

    /** ارسال‌شده — تحویل شرکت پست */
    case Shipped = 'shipped';

    /** تحویل‌شده — به دست مشتری رسیده */
    case Delivered = 'delivered';

    /** لغوشده */
    case Cancelled = 'cancelled';

    /** بازگشت وجه */
    case Refunded = 'refunded';

    /**
     * برچسب قابل نمایش وضعیت.
     *
     * @param  string  $locale  کد زبان
     */
    public function label(string $locale = 'fa'): string
    {
        return match ($this) {
            self::Pending => $locale === 'fa' ? 'در انتظار پرداخت' : 'Awaiting payment',
            self::Paid => $locale === 'fa' ? 'پرداخت شده' : 'Paid',
            self::Processing => $locale === 'fa' ? 'در حال آماده‌سازی' : 'Processing',
            self::Shipped => $locale === 'fa' ? 'ارسال شده' : 'Shipped',
            self::Delivered => $locale === 'fa' ? 'تحویل شده' : 'Delivered',
            self::Cancelled => $locale === 'fa' ? 'لغو شده' : 'Cancelled',
            self::Refunded => $locale === 'fa' ? 'بازگشت وجه' : 'Refunded',
        };
    }

    /**
     * رنگ معنایی برای نمایش در رابط کاربری.
     * فرانت‌اند از این مقدار برای انتخاب کلاس رنگ استفاده می‌کند،
     * پس منطق رنگ در یک نقطه متمرکز می‌ماند.
     */
    public function color(): string
    {
        return match ($this) {
            self::Pending => 'warning',
            self::Paid, self::Processing => 'info',
            self::Shipped => 'info',
            self::Delivered => 'success',
            self::Cancelled, self::Refunded => 'destructive',
        };
    }

    /**
     * وضعیت‌هایی که می‌توان از وضعیت فعلی به آن‌ها رفت.
     *
     * @return array<int, self>
     */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Pending => [self::Paid, self::Cancelled],
            self::Paid => [self::Processing, self::Cancelled, self::Refunded],
            self::Processing => [self::Shipped, self::Cancelled, self::Refunded],
            self::Shipped => [self::Delivered, self::Refunded],
            /* وضعیت‌های پایانی — از اینجا جایی نمی‌رود */
            self::Delivered, self::Cancelled, self::Refunded => [],
        };
    }

    /** آیا انتقال به وضعیت داده‌شده مجاز است؟ */
    public function canTransitionTo(self $target): bool
    {
        return in_array($target, $this->allowedTransitions(), true);
    }

    /**
     * آیا سفارش هنوز قابل لغو توسط مشتری است؟
     * پس از ارسال، لغو ممکن نیست و باید مرجوعی ثبت شود.
     */
    public function isCancellableByCustomer(): bool
    {
        return in_array($this, [self::Pending, self::Paid], true);
    }

    /** آیا سفارش به پایان رسیده (چه موفق چه ناموفق)؟ */
    public function isFinal(): bool
    {
        return in_array($this, [self::Delivered, self::Cancelled, self::Refunded], true);
    }

    /**
     * شماره‌ی مرحله در نوار پیشرفت سفارش (۱ تا ۵).
     * برای وضعیت‌های انحرافی صفر برمی‌گردد.
     */
    public function step(): int
    {
        return match ($this) {
            self::Pending => 1,
            self::Paid => 2,
            self::Processing => 3,
            self::Shipped => 4,
            self::Delivered => 5,
            self::Cancelled, self::Refunded => 0,
        };
    }
}
