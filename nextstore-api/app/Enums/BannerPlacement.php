<?php

namespace App\Enums;

/**
 * جایگاه بنر در صفحه‌ی اصلی.
 *
 * ⚠️ دو جایگاه، یک جدول. ستون‌ها و رفتار مدیریتی‌شان یکی است؛ جدا
 *    کردنشان یعنی دو کنترلر و دو صفحه‌ی پنل که کدشان کپی هم است.
 */
enum BannerPlacement: string
{
    /** اسلایدر چرخان بالای صفحه — یک بنر تمام‌عرض در هر لحظه. */
    case Hero = 'hero';

    /** شبکه‌ی سه‌ستونه‌ی میان صفحه — همه هم‌زمان دیده می‌شوند. */
    case Promo = 'promo';

    /** برچسب فارسی یا انگلیسی. */
    public function label(string $locale = 'fa'): string
    {
        return match ($this) {
            self::Hero => $locale === 'fa' ? 'اسلایدر بالای صفحه' : 'Hero slider',
            self::Promo => $locale === 'fa' ? 'بنرهای میانی' : 'Promo grid',
        };
    }
}
