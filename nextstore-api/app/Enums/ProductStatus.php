<?php

namespace App\Enums;

/**
 * وضعیت انتشار محصول.
 *
 * چرا Enum و نه رشته خام در دیتابیس؟
 *   - تایپ‌سیفتی: امکان ذخیره مقدار اشتباه مثل 'activ' وجود ندارد
 *   - خودمستندسازی: با نگاه به این فایل همه وضعیت‌های ممکن معلوم است
 *   - رفتار: می‌توانیم متد به وضعیت‌ها اضافه کنیم (مثل label و color)
 */
enum ProductStatus: string
{
    /** پیش‌نویس — فقط ادمین می‌بیند، در فروشگاه نمایش داده نمی‌شود */
    case Draft = 'draft';

    /** منتشرشده — در فروشگاه قابل مشاهده و خرید است */
    case Active = 'active';

    /** بایگانی‌شده — دیگر فروخته نمی‌شود اما سوابق سفارش حفظ می‌شود */
    case Archived = 'archived';

    /**
     * برچسب قابل نمایش وضعیت به زبان درخواستی.
     *
     * @param  string  $locale  کد زبان ('fa' یا 'en')
     */
    public function label(string $locale = 'fa'): string
    {
        return match ($this) {
            self::Draft => $locale === 'fa' ? 'پیش‌نویس' : 'Draft',
            self::Active => $locale === 'fa' ? 'منتشرشده' : 'Published',
            self::Archived => $locale === 'fa' ? 'بایگانی' : 'Archived',
        };
    }

    /**
     * آیا محصول با این وضعیت در فروشگاه قابل خرید است؟
     * در کوئری‌های عمومی برای فیلتر کردن استفاده می‌شود.
     */
    public function isPurchasable(): bool
    {
        return $this === self::Active;
    }
}
