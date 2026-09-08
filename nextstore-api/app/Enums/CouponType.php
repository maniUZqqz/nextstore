<?php

namespace App\Enums;

/**
 * نوع تخفیف کوپن.
 * ---------------------------------------------------------------------------
 * ⚠️ معنای ستون `value` در جدول به این enum وابسته است:
 *      Percent → عددی بین ۱ تا ۱۰۰
 *      Fixed   → مبلغ ثابت به ریال
 *
 *    محاسبه‌ی تخفیف در یک جا انجام می‌شود (`discountFor`) تا این
 *    دوگانگی به سراسر کد نشت نکند.
 */
enum CouponType: string
{
    /** درصدی از جمع سبد */
    case Percent = 'percent';

    /** مبلغ ثابت به ریال */
    case Fixed = 'fixed';

    /** برچسب محلی‌سازی‌شده برای نمایش در پنل. */
    public function label(string $locale = 'fa'): string
    {
        return match ($this) {
            self::Percent => $locale === 'fa' ? 'درصدی' : 'Percentage',
            self::Fixed => $locale === 'fa' ? 'مبلغ ثابت' : 'Fixed amount',
        };
    }

    /**
     * محاسبه‌ی مبلغ تخفیف روی یک جمع سبد.
     *
     * @param  int  $subtotal  جمع سبد به ریال
     * @param  int  $value  مقدار کوپن (درصد یا ریال)
     * @param  int|null  $maxDiscount  سقف تخفیف به ریال؛ تهی یعنی بی‌سقف
     * @return int مبلغ تخفیف به ریال — هرگز بیشتر از خود جمع سبد
     */
    public function discountFor(int $subtotal, int $value, ?int $maxDiscount = null): int
    {
        $discount = match ($this) {
            /*
             * intdiv و نه تقسیم اعشاری: قیمت‌ها در این پروژه عدد صحیح
             * ریال‌اند و ورود یک float به محاسبات مالی، همان خطای
             * انباشتی است که کل استراتژی قیمت برای پرهیز از آن ساخته شد.
             */
            self::Percent => intdiv($subtotal * $value, 100),
            self::Fixed => $value,
        };

        if ($maxDiscount !== null) {
            $discount = min($discount, $maxDiscount);
        }

        /*
         * ⚠️ تخفیف هرگز از جمع سبد بیشتر نمی‌شود.
         *
         *    بدون این سقف، کوپن «۵۰۰ هزار تومان تخفیف» روی سبد ۲۰۰
         *    هزار تومانی، جمع کل را منفی می‌کرد — و مبلغ منفی به
         *    درگاه پرداخت فرستاده می‌شد.
         */
        return max(min($discount, $subtotal), 0);
    }
}
