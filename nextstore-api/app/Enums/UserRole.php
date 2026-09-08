<?php

namespace App\Enums;

/**
 * نقش کاربر در سیستم.
 *
 * سلسله‌مراتب دسترسی:
 *   Customer < Manager < Admin
 * هر نقش بالاتر، تمام دسترسی‌های نقش پایین‌تر را هم دارد.
 */
enum UserRole: string
{
    /** مشتری عادی — فقط پنل کاربری خودش */
    case Customer = 'customer';

    /** مدیر محتوا — محصولات و سفارش‌ها، بدون دسترسی به تنظیمات و کاربران */
    case Manager = 'manager';

    /** مدیر کل — دسترسی کامل */
    case Admin = 'admin';

    /**
     * برچسب قابل نمایش نقش.
     *
     * @param  string  $locale  کد زبان
     */
    public function label(string $locale = 'fa'): string
    {
        return match ($this) {
            self::Customer => $locale === 'fa' ? 'مشتری' : 'Customer',
            self::Manager => $locale === 'fa' ? 'مدیر محتوا' : 'Manager',
            self::Admin => $locale === 'fa' ? 'مدیر کل' : 'Administrator',
        };
    }

    /**
     * آیا این نقش به پنل مدیریت دسترسی دارد؟
     */
    public function canAccessAdmin(): bool
    {
        return in_array($this, [self::Manager, self::Admin], true);
    }

    /**
     * آیا این نقش دسترسی کامل دارد؟
     * برای عملیات حساس مثل حذف کاربر یا تغییر تنظیمات پرداخت.
     */
    public function isSuperAdmin(): bool
    {
        return $this === self::Admin;
    }
}
