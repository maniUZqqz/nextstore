<?php

namespace App\Enums;

/**
 * رنگ‌بندی بنر.
 * ---------------------------------------------------------------------------
 * ⚠️ اینجا فقط یک **کلید** است، نه کلاس CSS — و این تفاوت حیاتی است.
 *
 *    Tailwind کلاس‌ها را با اسکن متنِ فایل‌های سورس پیدا می‌کند. اگر
 *    کلاس کامل («from-info/20 via-accent») در دیتابیس ذخیره و در زمان
 *    اجرا ساخته شود، در بیلد تولیدی اصلاً وجود ندارد: بنر بی‌رنگ
 *    می‌شود، بی هیچ خطایی، و فقط در تولید — نه در حالت توسعه.
 *
 *    پس مدیر از میان همین چند گزینه یکی را برمی‌دارد و فرانت آن را به
 *    نگاشتی از کلاس‌های *ثابت و نوشته‌شده در سورس* می‌دهد.
 *
 * ⚠️ نام‌ها با توکن‌های رنگ پروژه یکی‌اند تا در تم روشن و تاریک هر دو
 *    درست بیفتند.
 */
enum BannerTheme: string
{
    case Primary = 'primary';
    case Info = 'info';
    case Success = 'success';
    case Sale = 'sale';
    case Warning = 'warning';

    /** برچسب فارسی یا انگلیسی. */
    public function label(string $locale = 'fa'): string
    {
        return match ($this) {
            self::Primary => $locale === 'fa' ? 'اصلی' : 'Primary',
            self::Info => $locale === 'fa' ? 'آبی' : 'Blue',
            self::Success => $locale === 'fa' ? 'سبز' : 'Green',
            self::Sale => $locale === 'fa' ? 'قرمز تخفیف' : 'Sale red',
            self::Warning => $locale === 'fa' ? 'کهربایی' : 'Amber',
        };
    }
}
