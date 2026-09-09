<?php

namespace Database\Seeders;

use App\Enums\ProductStatus;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * سیدر داده‌های نمونه‌ی کاتالوگ (دسته، برند، محصول).
 * ---------------------------------------------------------------------------
 * چرا داده‌ی واقع‌گرایانه مهم است؟
 *   یک نمونه‌کار با محصولاتی به نام «Product 1، Product 2» بلافاصله
 *   آماتور به‌نظر می‌رسد. داده‌ی باورپذیر با نام و قیمت واقعی،
 *   دموی پروژه را قابل ارائه به کارفرما می‌کند.
 *
 * ⚠️ تمام متن‌ها دوزبانه‌اند تا هر دو نسخه‌ی سایت پر و قابل نمایش باشد.
 */
class CatalogSeeder extends Seeder
{
    /**
     * ساختار درختی دسته‌بندی‌ها.
     * هر دسته: [نامک، نام فارسی، نام انگلیسی، آیکون، زیردسته‌ها]
     */
    private const CATEGORIES = [
        [
            'slug' => 'digital',
            'fa' => 'کالای دیجیتال',
            'en' => 'Digital',
            'icon' => 'smartphone',
            'featured' => true,
            'children' => [
                ['slug' => 'mobile-phones', 'fa' => 'گوشی موبایل', 'en' => 'Mobile Phones', 'icon' => 'smartphone'],
                ['slug' => 'laptops', 'fa' => 'لپ‌تاپ', 'en' => 'Laptops', 'icon' => 'laptop'],
                ['slug' => 'tablets', 'fa' => 'تبلت', 'en' => 'Tablets', 'icon' => 'tablet'],
                ['slug' => 'headphones', 'fa' => 'هدفون و هندزفری', 'en' => 'Headphones', 'icon' => 'headphones'],
                ['slug' => 'smartwatches', 'fa' => 'ساعت هوشمند', 'en' => 'Smartwatches', 'icon' => 'watch'],
            ],
        ],
        [
            'slug' => 'home-appliances',
            'fa' => 'لوازم خانگی',
            'en' => 'Home Appliances',
            'icon' => 'washing-machine',
            'featured' => true,
            'children' => [
                ['slug' => 'kitchen', 'fa' => 'آشپزخانه', 'en' => 'Kitchen', 'icon' => 'cooking-pot'],
                ['slug' => 'cleaning', 'fa' => 'نظافت', 'en' => 'Cleaning', 'icon' => 'spray-can'],
                ['slug' => 'climate', 'fa' => 'سرمایشی و گرمایشی', 'en' => 'Climate Control', 'icon' => 'air-vent'],
            ],
        ],
        [
            'slug' => 'fashion',
            'fa' => 'مد و پوشاک',
            'en' => 'Fashion',
            'icon' => 'shirt',
            'featured' => true,
            'children' => [
                ['slug' => 'mens-clothing', 'fa' => 'پوشاک مردانه', 'en' => "Men's Clothing", 'icon' => 'shirt'],
                ['slug' => 'womens-clothing', 'fa' => 'پوشاک زنانه', 'en' => "Women's Clothing", 'icon' => 'shirt'],
                ['slug' => 'shoes', 'fa' => 'کفش', 'en' => 'Shoes', 'icon' => 'footprints'],
                ['slug' => 'bags', 'fa' => 'کیف', 'en' => 'Bags', 'icon' => 'briefcase'],
            ],
        ],
        [
            'slug' => 'beauty',
            'fa' => 'آرایشی و بهداشتی',
            'en' => 'Beauty & Health',
            'icon' => 'sparkles',
            'featured' => true,
            'children' => [
                ['slug' => 'skincare', 'fa' => 'مراقبت پوست', 'en' => 'Skincare', 'icon' => 'droplet'],
                ['slug' => 'haircare', 'fa' => 'مراقبت مو', 'en' => 'Haircare', 'icon' => 'scissors'],
            ],
        ],
        [
            'slug' => 'books',
            'fa' => 'کتاب و لوازم تحریر',
            'en' => 'Books & Stationery',
            'icon' => 'book-open',
            'featured' => true,
            'children' => [
                ['slug' => 'books-literature', 'fa' => 'ادبیات', 'en' => 'Literature', 'icon' => 'book'],
                ['slug' => 'stationery', 'fa' => 'لوازم تحریر', 'en' => 'Stationery', 'icon' => 'pencil'],
            ],
        ],
        [
            'slug' => 'sports',
            'fa' => 'ورزش و سفر',
            'en' => 'Sports & Travel',
            'icon' => 'dumbbell',
            'featured' => true,
            'children' => [
                ['slug' => 'fitness', 'fa' => 'تناسب اندام', 'en' => 'Fitness', 'icon' => 'dumbbell'],
                ['slug' => 'camping', 'fa' => 'کمپینگ', 'en' => 'Camping', 'icon' => 'tent'],
            ],
        ],
    ];

    /**
     * برندها: [نامک، نام فارسی، نام انگلیسی، کد کشور]
     */
    /**
     * برندها.
     * قالب: [نامک، نام فا، نام en، کد کشور، توضیح فا، توضیح en]
     *
     * ⚠️ توضیح‌ها عمداً کوتاه و کلی‌اند. صفحه‌ی اختصاصی هر برند بدون
     *    توضیح، فقط یک عنوان و یک شبکه محصول است و ناقص به نظر
     *    می‌رسد؛ اما ادعای آماری ساختگی هم درباره‌ی برندهای واقعی
     *    درست نیست. پس فقط چیزی نوشته شده که واقعاً درست است.
     */
    private const BRANDS = [
        ['apple', 'اپل', 'Apple', 'US',
            'سازنده‌ی آمریکایی گوشی، لپ‌تاپ و پوشیدنی‌های هوشمند.',
            'American maker of smartphones, laptops and wearables.'],
        ['samsung', 'سامسونگ', 'Samsung', 'KR',
            'غول کره‌ای الکترونیک، از گوشی تا لوازم خانگی.',
            'Korean electronics group, from phones to home appliances.'],
        ['xiaomi', 'شیائومی', 'Xiaomi', 'CN',
            'برند چینی با تمرکز بر نسبت کیفیت به قیمت.',
            'Chinese brand focused on value for money.'],
        ['sony', 'سونی', 'Sony', 'JP',
            'سازنده‌ی ژاپنی تجهیزات صوتی، تصویری و سرگرمی.',
            'Japanese maker of audio, imaging and entertainment gear.'],
        ['lg', 'ال‌جی', 'LG', 'KR',
            'تولیدکننده‌ی کره‌ای لوازم خانگی و نمایشگر.',
            'Korean manufacturer of home appliances and displays.'],
        ['asus', 'ایسوس', 'ASUS', 'TW',
            'برند تایوانی لپ‌تاپ و سخت‌افزار رایانه.',
            'Taiwanese laptop and computer hardware brand.'],
        ['lenovo', 'لنوو', 'Lenovo', 'CN',
            'بزرگ‌ترین سازنده‌ی رایانه‌ی شخصی در جهان.',
            'One of the largest personal computer makers in the world.'],
        ['nike', 'نایکی', 'Nike', 'US',
            'برند آمریکایی پوشاک و کفش ورزشی.',
            'American sportswear and footwear brand.'],
        ['adidas', 'آدیداس', 'Adidas', 'DE',
            'برند آلمانی لباس و کفش ورزشی.',
            'German sportswear and footwear brand.'],
        ['bosch', 'بوش', 'Bosch', 'DE',
            'سازنده‌ی آلمانی ابزار و لوازم خانگی.',
            'German maker of power tools and home appliances.'],
        ['philips', 'فیلیپس', 'Philips', 'NL',
            'برند هلندی سلامت شخصی و لوازم خانگی.',
            'Dutch personal-care and home-appliance brand.'],
        ['jbl', 'جی‌بی‌ال', 'JBL', 'US',
            'برند آمریکایی بلندگو و هدفون.',
            'American speaker and headphone brand.'],
    ];

    /**
     * الگوی محصولات نمونه.
     * قالب: [دسته، برند، نام فا، نام en، قیمت پایه (ریال)، توضیح فا، توضیح en]
     */
    private const PRODUCTS = [
        ['mobile-phones', 'apple', 'آیفون ۱۵ پرو مکس', 'iPhone 15 Pro Max', 89_000_000,
            'گوشی پرچم‌دار اپل با بدنه تیتانیومی و تراشه A17 Pro',
            'Apple flagship with titanium body and A17 Pro chip'],
        ['mobile-phones', 'samsung', 'گلکسی S24 اولترا', 'Galaxy S24 Ultra', 76_500_000,
            'دوربین ۲۰۰ مگاپیکسلی و قلم S Pen داخلی',
            '200MP camera with built-in S Pen'],
        ['mobile-phones', 'xiaomi', 'شیائومی ۱۴ اولترا', 'Xiaomi 14 Ultra', 52_000_000,
            'دوربین لایکا با دیافراگم متغیر',
            'Leica camera system with variable aperture'],
        ['mobile-phones', 'samsung', 'گلکسی A55', 'Galaxy A55', 21_900_000,
            'میان‌رده محبوب با نمایشگر سوپر امولد',
            'Popular mid-range with Super AMOLED display'],
        ['laptops', 'apple', 'مک‌بوک پرو ۱۴ اینچ M3', 'MacBook Pro 14" M3', 145_000_000,
            'تراشه M3 Pro با نمایشگر Liquid Retina XDR',
            'M3 Pro chip with Liquid Retina XDR display'],
        ['laptops', 'asus', 'ایسوس ROG Zephyrus G14', 'ASUS ROG Zephyrus G14', 98_000_000,
            'لپ‌تاپ گیمینگ سبک با RTX 4070',
            'Lightweight gaming laptop with RTX 4070'],
        ['laptops', 'lenovo', 'لنوو ThinkPad X1 Carbon', 'Lenovo ThinkPad X1 Carbon', 87_000_000,
            'لپ‌تاپ تجاری فوق‌سبک با کیبورد افسانه‌ای',
            'Ultra-light business laptop with legendary keyboard'],
        ['tablets', 'apple', 'آیپد ایر M2', 'iPad Air M2', 42_000_000,
            'تبلت قدرتمند برای کار و سرگرمی',
            'Powerful tablet for work and play'],
        ['tablets', 'samsung', 'گلکسی تب S9', 'Galaxy Tab S9', 38_500_000,
            'نمایشگر AMOLED با قلم S Pen همراه',
            'AMOLED display with included S Pen'],
        ['headphones', 'sony', 'سونی WH-1000XM5', 'Sony WH-1000XM5', 18_900_000,
            'بهترین حذف نویز فعال بازار',
            'Best-in-class active noise cancellation'],
        ['headphones', 'apple', 'ایرپاد پرو ۲', 'AirPods Pro 2', 14_200_000,
            'حذف نویز تطبیقی و صدای فضایی',
            'Adaptive noise cancellation and spatial audio'],
        ['headphones', 'jbl', 'جی‌بی‌ال Tune 770NC', 'JBL Tune 770NC', 4_900_000,
            'هدفون بی‌سیم با باتری ۷۰ ساعته',
            'Wireless headphones with 70-hour battery'],
        ['smartwatches', 'apple', 'اپل واچ سری ۹', 'Apple Watch Series 9', 24_500_000,
            'نمایشگر روشن‌تر و ژست دابل‌تپ',
            'Brighter display with Double Tap gesture'],
        ['smartwatches', 'samsung', 'گلکسی واچ ۶ کلاسیک', 'Galaxy Watch 6 Classic', 19_800_000,
            'رینگ چرخان و پایش سلامت پیشرفته',
            'Rotating bezel with advanced health tracking'],
        ['kitchen', 'bosch', 'مایکروویو بوش سری ۶', 'Bosch Series 6 Microwave', 32_000_000,
            'مایکروویو توکار با گریل',
            'Built-in microwave with grill function'],
        ['kitchen', 'philips', 'سرخ‌کن بدون روغن فیلیپس', 'Philips Airfryer XXL', 18_500_000,
            'پخت سالم با ۹۰٪ روغن کمتر',
            'Healthy cooking with 90% less fat'],
        ['cleaning', 'bosch', 'جاروبرقی بوش بی‌سیم', 'Bosch Cordless Vacuum', 22_000_000,
            'جاروی شارژی با ۶۰ دقیقه کارکرد',
            'Cordless vacuum with 60-minute runtime'],
        ['climate', 'lg', 'کولر گازی ال‌جی اینورتر', 'LG Inverter Air Conditioner', 68_000_000,
            'کم‌مصرف با فناوری دوال اینورتر',
            'Energy efficient with Dual Inverter technology'],
        ['mens-clothing', 'nike', 'تیشرت ورزشی نایکی Dri-FIT', 'Nike Dri-FIT T-Shirt', 2_450_000,
            'پارچه خنک‌کننده مخصوص تمرین',
            'Moisture-wicking fabric for training'],
        ['mens-clothing', 'adidas', 'هودی آدیداس اسنشالز', 'Adidas Essentials Hoodie', 4_200_000,
            'هودی راحتی با جنس فلیس نرم',
            'Comfortable hoodie in soft fleece'],
        ['womens-clothing', 'nike', 'لگینگ ورزشی نایکی', 'Nike Training Leggings', 3_100_000,
            'کشسانی بالا با کمر بلند',
            'High stretch with high-rise waist'],
        ['shoes', 'nike', 'کفش دویدن نایکی Pegasus 40', 'Nike Pegasus 40', 7_800_000,
            'کفش دویدن روزانه با کفی ری‌اکت',
            'Daily running shoe with React foam'],
        ['shoes', 'adidas', 'کفش آدیداس Ultraboost', 'Adidas Ultraboost', 9_200_000,
            'بازگشت انرژی بالا با میان‌کفی بوست',
            'High energy return with Boost midsole'],
        ['bags', 'nike', 'کوله‌پشتی نایکی Brasilia', 'Nike Brasilia Backpack', 2_900_000,
            'کوله ۳۰ لیتری با جیب لپ‌تاپ',
            '30L backpack with laptop compartment'],
        ['skincare', 'philips', 'دستگاه پاکسازی صورت فیلیپس', 'Philips Facial Cleansing Brush', 6_400_000,
            'پاکسازی عمقی با برس نرم',
            'Deep cleansing with soft brush'],
        ['haircare', 'philips', 'سشوار حرفه‌ای فیلیپس', 'Philips Professional Hair Dryer', 5_100_000,
            'یون‌ساز برای موی درخشان',
            'Ionic technology for shiny hair'],
        ['books-literature', 'apple', 'مجموعه اشعار حافظ', 'Divan of Hafez', 1_850_000,
            'چاپ نفیس با جلد سخت',
            'Deluxe hardcover edition'],
        ['stationery', 'apple', 'دفترچه یادداشت چرمی', 'Leather Notebook', 890_000,
            'دفتر A5 با کاغذ ۱۰۰ گرمی',
            'A5 notebook with 100gsm paper'],
        ['fitness', 'adidas', 'دمبل قابل تنظیم آدیداس', 'Adidas Adjustable Dumbbell', 12_500_000,
            'وزن قابل تنظیم از ۲ تا ۲۴ کیلوگرم',
            'Adjustable from 2 to 24 kg'],
        ['fitness', 'nike', 'مت یوگا نایکی', 'Nike Yoga Mat', 3_400_000,
            'ضخامت ۵ میلی‌متر با سطح ضدلغزش',
            '5mm thickness with non-slip surface'],
        ['camping', 'adidas', 'چادر مسافرتی ۴ نفره', '4-Person Camping Tent', 15_900_000,
            'ضدآب با نصب سریع',
            'Waterproof with quick setup'],
        ['camping', 'bosch', 'چراغ قوه شارژی بوش', 'Bosch Rechargeable Flashlight', 2_200_000,
            'روشنایی ۱۰۰۰ لومن با باتری لیتیومی',
            '1000 lumens with lithium battery'],
    ];

    /**
     * اجرای سیدر: ساخت دسته‌ها، برندها و محصولات.
     */
    public function run(): void
    {
        $this->command->info('ساخت دسته‌بندی‌ها...');
        $categoryMap = $this->seedCategories();

        $this->command->info('ساخت برندها...');
        $brandMap = $this->seedBrands();

        $this->command->info('ساخت محصولات...');
        $this->seedProducts($categoryMap, $brandMap);

        $this->command->info('✓ کاتالوگ با موفقیت ساخته شد.');
    }

    /**
     * ساخت درخت دسته‌بندی‌ها.
     *
     * @return array<string, int> نگاشت نامک به شناسه، برای استفاده در محصولات
     */
    private function seedCategories(): array
    {
        $map = [];
        $order = 0;

        foreach (self::CATEGORIES as $parentData) {
            $parent = Category::create([
                'name' => ['fa' => $parentData['fa'], 'en' => $parentData['en']],
                'slug' => $parentData['slug'],
                'icon' => $parentData['icon'],
                'is_active' => true,
                /*
                 * ⚠️ بدون `?? false`.
                 *
                 *    هر شش دسته‌ی سطح اول این کلید را دارند. با
                 *    مقدار پیش‌فرض، اگر روزی کسی دسته‌ی هفتمی اضافه
                 *    کند و کلید را جا بیندازد، بی‌صدا «شاخص نیست»
                 *    می‌شود. بدون آن، هم PHP هشدار می‌دهد و هم
                 *    تحلیل ایستا همان لحظه می‌گیردش.
                 */
                'is_featured' => $parentData['featured'],
                'sort_order' => $order++,
            ]);

            $map[$parent->slug] = $parent->id;

            /* ساخت زیردسته‌ها */
            $childOrder = 0;
            foreach ($parentData['children'] as $childData) {
                $child = Category::create([
                    'parent_id' => $parent->id,
                    'name' => ['fa' => $childData['fa'], 'en' => $childData['en']],
                    'slug' => $childData['slug'],
                    'icon' => $childData['icon'],
                    'is_active' => true,
                    'sort_order' => $childOrder++,
                ]);

                $map[$child->slug] = $child->id;
            }
        }

        return $map;
    }

    /**
     * ساخت برندها.
     *
     * @return array<string, int> نگاشت نامک به شناسه
     */
    private function seedBrands(): array
    {
        $map = [];

        foreach (self::BRANDS as $index => [$slug, $fa, $en, $country, $descFa, $descEn]) {
            $brand = Brand::create([
                'name' => ['fa' => $fa, 'en' => $en],
                'description' => ['fa' => $descFa, 'en' => $descEn],
                'slug' => $slug,
                /*
                 * لوگو یک SVG مونوگرام تولیدشده است، نه لوگوی واقعی برند.
                 * استفاده از لوگوی اصلی شرکت‌ها در یک نمونه‌کار، هم مسئله‌ی
                 * علامت تجاری دارد و هم فایل‌های بیرونی به پروژه اضافه می‌کند.
                 * مونوگرام حرف اول، هویت بصری کافی برای کارت برند می‌سازد.
                 */
                'logo' => "/brands/{$slug}.svg",
                'country_code' => $country,
                'is_active' => true,
                /* ۶ برند اول در اسلایدر صفحه اصلی نمایش داده می‌شوند */
                'is_featured' => $index < 6,
                'sort_order' => $index,
            ]);

            $map[$slug] = $brand->id;
        }

        return $map;
    }

    /**
     * ساخت محصولات به‌همراه تصاویر.
     *
     * @param  array<string, int>  $categoryMap
     * @param  array<string, int>  $brandMap
     */
    private function seedProducts(array $categoryMap, array $brandMap): void
    {
        foreach (self::PRODUCTS as $index => [$categorySlug, $brandSlug, $nameFa, $nameEn, $price, $descFa, $descEn]) {

            /*
             * تولید تنوع واقع‌گرایانه در داده‌ها:
             *   - هر محصول سوم تخفیف دارد
             *   - موجودی تصادفی، بعضی محصولات موجودی کم دارند
             *   - امتیاز و تعداد نظر تصادفی اما منطقی
             */
            $hasSale = $index % 3 === 0;
            $discountPercent = $hasSale ? [10, 15, 20, 25, 30][$index % 5] : 0;
            $salePrice = $hasSale ? (int) round($price * (100 - $discountPercent) / 100) : null;

            /*
             * توزیع موجودی برای پوشش همه‌ی حالت‌های رابط کاربری.
             *
             * ⚠️ نکته‌ی دمو: محصول اول (پرچم‌دار فروشگاه) عمداً از این
             *    توزیع مستثنی است. اگر گران‌ترین و شاخص‌ترین محصول
             *    «ناموجود» باشد، اولین چیزی که بازدیدکننده می‌بیند یک
             *    کارت خاکستریِ غیرقابل خرید است — بدترین شروع ممکن.
             */
            $stock = match (true) {
                $index < 3 => rand(20, 90),   // محصولات شاخص همیشه موجود
                $index % 8 === 3 => 0,        // ناموجود
                $index % 8 === 4 => rand(1, 4), // موجودی کم
                default => rand(10, 120),
            };

            $product = Product::create([
                'category_id' => $categoryMap[$categorySlug] ?? null,
                'brand_id' => $brandMap[$brandSlug] ?? null,

                'name' => ['fa' => $nameFa, 'en' => $nameEn],
                'short_description' => ['fa' => $descFa, 'en' => $descEn],
                'description' => [
                    'fa' => $descFa.'. این محصول با گارانتی اصالت و سلامت فیزیکی کالا عرضه می‌شود و امکان بازگشت تا ۷ روز پس از تحویل وجود دارد.',
                    'en' => $descEn.'. This product comes with an authenticity guarantee and can be returned within 7 days of delivery.',
                ],

                'slug' => Str::slug($nameEn),
                'sku' => 'NS-'.str_pad((string) ($index + 1), 5, '0', STR_PAD_LEFT),

                'price' => $price,
                'sale_price' => $salePrice,
                /* تخفیف‌ها تا ۱۰ روز آینده اعتبار دارند — برای تست تایمر فروش ویژه */
                'sale_ends_at' => $hasSale ? now()->addDays(10) : null,
                'cost_price' => (int) round($price * 0.72),

                'stock' => $stock,
                'low_stock_threshold' => 5,

                'weight' => rand(150, 3000),

                'status' => ProductStatus::Active,
                /* هر محصول چهارم منتخب است */
                'is_featured' => $index % 4 === 0,

                /* آمار باورپذیر */
                'views_count' => rand(50, 5000),
                'sales_count' => rand(0, 400),

                /*
                 * ⚠️ امتیاز و تعداد نظر عمداً صفر گذاشته می‌شوند.
                 *
                 *    قبلاً اینجا rand() بود و مثلاً «۴.۷ از ۱۶۱ نظر»
                 *    می‌ساخت در حالی که هیچ ردیف نظری وجود نداشت.
                 *    حالا که سیستم نظرات این دو ستون را از روی
                 *    ردیف‌های واقعی بازمحاسبه می‌کند، آن عددها با
                 *    اولین تأیید یا حذف نظر بی‌صدا فرو می‌ریختند.
                 *
                 *    مقدار واقعی را ReviewSeeder می‌نویسد.
                 */
                'rating_avg' => 0,
                'reviews_count' => 0,

                /* زمان انتشار پلکانی تا مرتب‌سازی «جدیدترین» معنادار باشد */
                'published_at' => now()->subDays(count(self::PRODUCTS) - $index),
            ]);

            $this->seedProductImages($product, $categorySlug, $index);
        }
    }

    /**
     * ساخت تصاویر گالری برای یک محصول.
     *
     * ⚠️ درسی که اینجا گرفته شد:
     *    نسخه‌ی اول از picsum.photos استفاده می‌کرد که عکس‌های تصادفی
     *    می‌دهد. نتیجه: «آیفون ۱۵ پرو مکس» با عکس جنگل و «کفش نایکی»
     *    با عکس جاده نمایش داده می‌شد — چیزی که فوراً به چشم می‌آید و
     *    کل فروشگاه را شبیه یک دموی ناتمام نشان می‌دهد.
     *
     *    حالا از تصاویر SVG اختصاصی هر دسته استفاده می‌شود که با
     *    scripts/generate-product-images.mjs ساخته شده‌اند: بدون
     *    وابستگی به شبکه، حجم زیر ۱ کیلوبایت، و متناسب با نوع کالا.
     *
     * @param  string  $categorySlug  نامک دسته — تصویر از روی آن انتخاب می‌شود
     * @param  int  $index  شماره محصول — برای تنوع بین محصولات هم‌دسته
     */
    private function seedProductImages(Product $product, string $categorySlug, int $index): void
    {
        /* اگر تصویر اختصاصی این دسته ساخته نشده باشد، تصویر عمومی استفاده می‌شود */
        $base = file_exists(public_path("products/{$categorySlug}-0.svg"))
            ? $categorySlug
            : 'default';

        /*
         * چرخش نوع تصویر بر اساس شماره محصول.
         * بدون این، دو محصول کنار هم در یک دسته تصویر کاملاً یکسان
         * می‌گرفتند و شبکه‌ی محصولات تکراری به نظر می‌رسید.
         */
        for ($i = 0; $i < 3; $i++) {
            $variant = ($index + $i) % 3;

            ProductImage::create([
                'product_id' => $product->id,
                'path' => "/products/{$base}-{$variant}.svg",

                /*
                 * ⚠️ متن جایگزین عمداً خالی می‌ماند.
                 *
                 *    نسخه‌ی قبلی نام محصول را اینجا *کپی* می‌کرد. نتیجه:
                 *    وقتی ادمین نام محصول را عوض می‌کرد، متن alt روی
                 *    نام قدیمی می‌ماند و صفحه‌خوان تا ابد نام اشتباه را
                 *    اعلام می‌کرد — چون فرم ادمین اصلاً فیلدی برای
                 *    ویرایش alt ندارد.
                 *
                 *    ProductResource از قبل این فالبک را دارد:
                 *        alt ?: نام محصول
                 *    با خالی گذاشتن، همان فالبک فعال می‌شود و متن
                 *    جایگزین همیشه با نام فعلی هم‌گام می‌ماند.
                 */
                'alt' => null,

                'is_primary' => $i === 0,
                'sort_order' => $i,
            ]);
        }
    }
}
