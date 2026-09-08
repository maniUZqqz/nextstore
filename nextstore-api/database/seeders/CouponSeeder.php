<?php

namespace Database\Seeders;

use App\Enums\CouponType;
use App\Models\Coupon;
use Illuminate\Database\Seeder;

/**
 * سیدر کدهای تخفیف.
 * ---------------------------------------------------------------------------
 * ⚠️ کوپن‌ها عمداً **هر حالت خطا** را هم پوشش می‌دهند، نه فقط حالت موفق.
 *
 *    دموی خوب فقط مسیر خوش‌بینانه را نشان نمی‌دهد؛ کسی که پروژه را
 *    بررسی می‌کند باید بتواند بدون دستکاری دیتابیس ببیند که «کد منقضی»،
 *    «حداقل مبلغ» و «ظرفیت تکمیل» واقعاً پیام درست می‌دهند.
 *
 *    برای همین قابل حدس‌اند: WELCOME10 کار می‌کند، EXPIRED2025 منقضی
 *    است، و همین‌طور بقیه.
 */
class CouponSeeder extends Seeder
{
    /**
     * کوپن‌های نمونه.
     *
     * @var list<array<string,mixed>>
     */
    private const COUPONS = [
        [
            'code' => 'WELCOME10',
            'description' => 'خوش‌آمدگویی — ۱۰٪ تا سقف ۵۰۰ هزار تومان',
            'type' => CouponType::Percent,
            'value' => 10,
            /* سقف به ریال: ۵۰۰ هزار تومان */
            'max_discount' => 5_000_000,
            'min_order_total' => 0,
            'usage_limit' => null,
            'per_user_limit' => 1,
        ],
        [
            'code' => 'SAVE200K',
            'description' => 'تخفیف ثابت ۲۰۰ هزار تومان روی سبدهای بالای یک میلیون',
            'type' => CouponType::Fixed,
            'value' => 2_000_000,
            'max_discount' => null,
            /* حداقل سبد: یک میلیون تومان */
            'min_order_total' => 10_000_000,
            'usage_limit' => null,
            'per_user_limit' => 1,
        ],
        [
            'code' => 'BIGSPENDER',
            'description' => '۲۰٪ برای سبدهای بالای پنج میلیون تومان — سقف یک میلیون',
            'type' => CouponType::Percent,
            'value' => 20,
            'max_discount' => 10_000_000,
            'min_order_total' => 50_000_000,
            'usage_limit' => null,
            'per_user_limit' => 3,
        ],
        [
            /* برای دیدن پیام «مهلت تمام شده» بدون دستکاری دیتابیس */
            'code' => 'EXPIRED2025',
            'description' => 'کمپین تمام‌شده — برای آزمودن پیام انقضا',
            'type' => CouponType::Percent,
            'value' => 15,
            'max_discount' => null,
            'min_order_total' => 0,
            'usage_limit' => null,
            'per_user_limit' => 1,
            'expires_at' => '-30 days',
        ],
        [
            /* برای دیدن پیام «ظرفیت تکمیل» */
            'code' => 'SOLDOUT',
            'description' => 'ظرفیت تکمیل‌شده — برای آزمودن پیام سقف مصرف',
            'type' => CouponType::Fixed,
            'value' => 1_000_000,
            'max_discount' => null,
            'min_order_total' => 0,
            'usage_limit' => 50,
            'per_user_limit' => 1,
            'used_count' => 50,
        ],
        [
            /* برای دیدن پیام «هنوز فعال نشده» */
            'code' => 'NOWRUZ',
            'description' => 'کمپین آینده — برای آزمودن پیام شروع‌نشده',
            'type' => CouponType::Percent,
            'value' => 25,
            'max_discount' => 20_000_000,
            'min_order_total' => 0,
            'usage_limit' => 1000,
            'per_user_limit' => 1,
            'starts_at' => '+20 days',
            'expires_at' => '+40 days',
        ],
    ];

    /** ساخت کوپن‌های نمونه. */
    public function run(): void
    {
        /*
         * ⚠️ اگر کوپنی وجود دارد، سیدر کاری نمی‌کند — همان قاعده‌ی
         *    TicketSeeder: `db:seed` روی دیتابیس موجود نباید کوپن‌های
         *    واقعیِ ساخته‌شده در پنل را با نسخه‌های نمونه قاطی کند.
         */
        if (Coupon::query()->exists()) {
            $this->command?->info('  کدهای تخفیف از قبل وجود دارند — رد شد.');

            return;
        }

        foreach (self::COUPONS as $data) {
            /*
             * تاریخ‌ها نسبی نوشته شده‌اند (`-30 days`) نه ثابت.
             *
             * ⚠️ تاریخ ثابت یعنی کوپن «آینده» شش ماه بعد به گذشته تبدیل
             *    می‌شود و دمو بی‌صدا معنایش را از دست می‌دهد — همان تله‌ای
             *    که فیکسچرهای وابسته به زمان همیشه دارند.
             */
            $starts = isset($data['starts_at']) ? now()->modify($data['starts_at']) : null;
            $expires = isset($data['expires_at']) ? now()->modify($data['expires_at']) : null;

            $coupon = Coupon::query()->create([
                'code' => $data['code'],
                'description' => $data['description'],
                'type' => $data['type'],
                'value' => $data['value'],
                'max_discount' => $data['max_discount'],
                'min_order_total' => $data['min_order_total'],
                'usage_limit' => $data['usage_limit'],
                'per_user_limit' => $data['per_user_limit'],
                'starts_at' => $starts,
                'expires_at' => $expires,
                'is_active' => true,
            ]);

            /*
             * `used_count` در fillable نیست — عمداً، تا هیچ مسیر ورودی
             *    نتواند شمارنده‌ی مصرف را دستکاری کند. سیدر مستقیم
             *    می‌نویسدش.
             */
            if (isset($data['used_count'])) {
                $coupon->forceFill(['used_count' => $data['used_count']])->save();
            }
        }

        $this->command?->info('  '.count(self::COUPONS).' کد تخفیف نمونه ساخته شد.');
    }
}
