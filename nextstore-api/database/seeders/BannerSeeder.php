<?php

namespace Database\Seeders;

use App\Models\Banner;
use Illuminate\Database\Seeder;

/**
 * بنرهای صفحه‌ی اصلی.
 * ---------------------------------------------------------------------------
 * ⚠️ محتوای اینجا **دقیقاً** همان چیزی است که پیش‌تر در کد و فایل
 *    ترجمه بود.
 *
 *    هدف این نبود که صفحه‌ی اصلی عوض شود؛ هدف این بود که مدیر بتواند
 *    عوضش کند. اگر سیدر محتوای تازه می‌ریخت، این تغییر ساختاری با یک
 *    تغییر ظاهری قاطی می‌شد و هر ایراد بصری بعدی معلوم نبود از کدام
 *    می‌آید.
 *
 * ⚠️ `updateOrCreate` روی `href` نیست، روی ترتیب و جایگاه است.
 *
 *    مدیر ممکن است مقصد یک بنر را عوض کند؛ اگر کلید یکتاسازی `href`
 *    بود، اجرای دوباره‌ی سیدر یک بنر تکراری می‌ساخت به‌جای آنکه
 *    همان را پیدا کند.
 */
class BannerSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->heroes() as $index => $banner) {
            $this->put('hero', $index, $banner);
        }

        foreach ($this->promos() as $index => $banner) {
            $this->put('promo', $index, $banner);
        }
    }

    /**
     * درج یا به‌روزرسانی یک بنر.
     *
     * ⚠️ `firstOrCreate` و نه `updateOrCreate`: اجرای دوباره‌ی سیدر
     *    نباید متنی را که مدیر ویرایش کرده به حالت اولیه برگرداند —
     *    همان درسی که در سیدر تنظیمات گرفته شد.
     *
     * @param  array<string, mixed>  $attributes
     */
    private function put(string $placement, int $index, array $attributes): void
    {
        Banner::query()->firstOrCreate(
            ['placement' => $placement, 'sort_order' => $index],
            $attributes + ['placement' => $placement, 'sort_order' => $index],
        );
    }

    /**
     * اسلایدهای بالای صفحه.
     *
     * @return list<array<string, mixed>>
     */
    private function heroes(): array
    {
        return [
            [
                'badge' => ['fa' => 'فروش ویژه پاییز', 'en' => 'Autumn Sale'],
                'title' => ['fa' => 'تا ۵۰٪ تخفیف کالای دیجیتال', 'en' => 'Up to 50% off electronics'],
                'subtitle' => [
                    'fa' => 'گوشی، لپ‌تاپ و لوازم جانبی با بهترین قیمت',
                    'en' => 'Phones, laptops and accessories at the best prices',
                ],
                'cta_label' => ['fa' => 'مشاهده تخفیف‌ها', 'en' => 'Shop deals'],
                'href' => '/products?on_sale=1',
                'theme' => 'primary',
            ],
            [
                'badge' => ['fa' => 'تازه رسید', 'en' => 'Just arrived'],
                'title' => ['fa' => 'جدیدترین گوشی‌های هوشمند', 'en' => 'The latest smartphones'],
                'subtitle' => [
                    'fa' => 'پرچم‌داران روز بازار با گارانتی اصالت',
                    'en' => "Today's flagships with an authenticity guarantee",
                ],
                'cta_label' => ['fa' => 'خرید کنید', 'en' => 'Shop now'],
                'href' => '/products?category=mobile-phones',
                'theme' => 'info',
            ],
            [
                'badge' => ['fa' => 'ارسال رایگان', 'en' => 'Free shipping'],
                'title' => ['fa' => 'خرید بالای ۵۰۰ هزار تومان', 'en' => 'On every order over $50'],
                'subtitle' => [
                    'fa' => 'ارسال رایگان به سراسر کشور، بدون شرط',
                    'en' => 'Free nationwide delivery, no conditions',
                ],
                'cta_label' => ['fa' => 'شروع خرید', 'en' => 'Start shopping'],
                'href' => '/products',
                'theme' => 'success',
            ],
        ];
    }

    /**
     * بنرهای شبکه‌ی میانی.
     *
     * @return list<array<string, mixed>>
     */
    private function promos(): array
    {
        return [
            [
                'title' => ['fa' => 'لوازم خانگی', 'en' => 'Home Appliances'],
                'subtitle' => ['fa' => 'تا ۳۰٪ تخفیف', 'en' => 'Up to 30% off'],
                'href' => '/products?category=home-appliances',
                'theme' => 'info',
                'icon' => 'washing-machine',
            ],
            [
                'title' => ['fa' => 'مد و پوشاک', 'en' => 'Fashion'],
                'subtitle' => ['fa' => 'کالکشن جدید فصل', 'en' => 'New season collection'],
                'href' => '/products?category=fashion',
                'theme' => 'sale',
                'icon' => 'shirt',
            ],
            [
                'title' => ['fa' => 'ورزش و سفر', 'en' => 'Sports & Travel'],
                'subtitle' => ['fa' => 'تجهیزات حرفه‌ای', 'en' => 'Pro-grade gear'],
                'href' => '/products?category=sports',
                'theme' => 'success',
                'icon' => 'dumbbell',
            ],
        ];
    }
}
