<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

/**
 * سیدر تنظیمات فروشگاه.
 * ---------------------------------------------------------------------------
 * ⚠️ مقادیر اینجا همان چیزهایی‌اند که تا امروز در فوتر و فایل‌های ترجمه
 *    **هاردکد** بودند. حالا منبعشان دیتابیس است و مدیر می‌تواند بدون
 *    دست‌زدن به کد عوضشان کند.
 *
 * ⚠️ لینک‌های شبکه‌های اجتماعی عمداً به صفحه‌ی خود پلتفرم اشاره می‌کنند
 *    و نه به یک حساب جعلی. فوتر پیش‌تر `href="#"` داشت — لینکی که
 *    هیچ‌جا نمی‌رفت و کاربر را گیج می‌کرد.
 */
class SettingSeeder extends Seeder
{
    /**
     * مقادیر پیش‌فرض.
     *
     * @var array<string, array{value: mixed, group: string, translatable: bool}>
     */
    private const DEFAULTS = [
        'site_name' => [
            'value' => ['fa' => 'نکست‌استور', 'en' => 'NextStore'],
            'group' => 'general',
            'translatable' => true,
        ],
        'site_description' => [
            'value' => [
                'fa' => 'نکست‌استور فروشگاهی اینترنتی با هزاران محصول اصل، ارسال سریع به سراسر کشور و ضمانت بازگشت وجه است.',
                'en' => 'NextStore is an online shop with thousands of genuine products, nationwide fast delivery and a money-back guarantee.',
            ],
            'group' => 'general',
            'translatable' => true,
        ],
        'support_hours' => [
            'value' => ['fa' => 'پشتیبانی ۲۴ ساعته', 'en' => '24/7 support'],
            'group' => 'general',
            'translatable' => true,
        ],

        'contact_phone' => [
            'value' => '۰۲۱-۱۲۳۴۵۶۷۸',
            'group' => 'contact',
            'translatable' => false,
        ],
        'contact_email' => [
            'value' => 'support@nextstore.dev',
            'group' => 'contact',
            'translatable' => false,
        ],
        'contact_address' => [
            'value' => [
                'fa' => 'تهران، خیابان ولیعصر، پلاک ۱۲۳',
                'en' => 'No. 123, Valiasr St., Tehran, Iran',
            ],
            'group' => 'contact',
            'translatable' => true,
        ],

        'social_instagram' => [
            'value' => 'https://instagram.com/',
            'group' => 'social',
            'translatable' => false,
        ],
        'social_telegram' => [
            'value' => 'https://telegram.org/',
            'group' => 'social',
            'translatable' => false,
        ],
        'social_x' => [
            'value' => 'https://x.com/',
            'group' => 'social',
            'translatable' => false,
        ],
        'social_linkedin' => [
            'value' => 'https://linkedin.com/',
            'group' => 'social',
            'translatable' => false,
        ],
    ];

    /** درج مقادیر پیش‌فرض. */
    public function run(): void
    {
        foreach (self::DEFAULTS as $key => $data) {
            /*
             * ⚠️ `firstOrCreate` و نه `updateOrCreate`.
             *
             *    اگر مدیر تلفن فروشگاه را عوض کرده باشد، اجرای دوباره‌ی
             *    سیدر نباید آن را به مقدار نمونه برگرداند. سیدر فقط
             *    شکاف‌ها را پر می‌کند.
             */
            Setting::query()->firstOrCreate(
                ['key' => $key],
                [
                    'value' => $data['value'],
                    'group' => $data['group'],
                    'is_translatable' => $data['translatable'],
                ],
            );
        }

        Setting::flushCache();

        $this->command?->info('  '.count(self::DEFAULTS).' تنظیم پیش‌فرض بررسی شد.');
    }
}
