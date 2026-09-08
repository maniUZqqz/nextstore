<?php

namespace Database\Seeders;

use App\Models\Post;
use App\Models\PostCategory;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * سیدر مجله.
 * ---------------------------------------------------------------------------
 * ⚠️ متن مقالات عمداً در این فایل نیست.
 *
 *    ده مقاله‌ی دوزبانه با بدنه‌ی HTML، چند هزار خط محتوا می‌شود.
 *    نگه‌داشتن آن‌ها کنار منطق سیدر یعنی فایلی که نه قابل مرور است
 *    نه قابل ویرایش. محتوا در database/data/blog-posts.php است و
 *    اینجا فقط خوانده و در دیتابیس نوشته می‌شود.
 *
 *    مزیت عملی: افزودن یا اصلاح یک مقاله، این فایل را دست نمی‌زند.
 *
 * ⚠️ تصاویر کاور از پیش در public/posts/<slug>.svg تولید شده‌اند
 *    (اسکریپت scripts/generate-post-covers.mjs). نامک مقاله باید
 *    دقیقاً با نام فایل کاور یکی باشد، وگرنه مقاله بدون تصویر
 *    نمایش داده می‌شود.
 */
class BlogSeeder extends Seeder
{
    /**
     * دسته‌بندی‌های مجله.
     *
     * قالب: نامک => [نام فارسی, نام انگلیسی, توضیح فارسی, توضیح انگلیسی]
     */
    private const CATEGORIES = [
        'buying-guides' => [
            'راهنمای خرید',
            'Buying guides',
            'پیش از خرید بخوانید: مقایسه، معیارها و اشتباه‌های رایج.',
            'Read before you buy: comparisons, criteria and common mistakes.',
        ],
        'technology' => [
            'فناوری',
            'Technology',
            'تازه‌های دنیای گجت و آنچه واقعاً به کار روزمره می‌آید.',
            'What is new in gadgets, and what actually matters day to day.',
        ],
        'lifestyle' => [
            'سبک زندگی',
            'Lifestyle',
            'انتخاب‌های کوچکی که کیفیت روزهایتان را بالا می‌برد.',
            'Small choices that make your days better.',
        ],
        'care-and-maintenance' => [
            'نگهداری و مراقبت',
            'Care & maintenance',
            'چطور از چیزهایی که خریده‌اید بیشتر عمر بگیرید.',
            'How to get more life out of the things you own.',
        ],
        'shopping-tips' => [
            'نکات خرید',
            'Shopping tips',
            'خرید اینترنتی مطمئن‌تر و کم‌دردسرتر.',
            'Safer, smoother online shopping.',
        ],
    ];

    /** ساخت دسته‌ها و مقالات مجله. */
    public function run(): void
    {
        $categories = $this->seedCategories();
        $author = $this->resolveAuthor();

        $posts = $this->loadPosts();

        if ($posts === []) {
            $this->command->warn('فایل داده‌ی مقالات خالی است — فقط دسته‌ها ساخته شدند.');

            return;
        }

        /*
         * پاکسازی پیش از ساخت تا سیدر بارها قابل اجرا باشد.
         * نامک مقاله یکتاست و بدون این، اجرای دوم شکست می‌خورد.
         */
        Post::query()->delete();

        $created = 0;

        foreach ($posts as $index => $data) {
            $categoryId = $categories[$data['category']] ?? null;

            if (! $categoryId) {
                $this->command->warn("دسته‌ی «{$data['category']}» یافت نشد — مقاله‌ی {$data['slug']} رد شد.");

                continue;
            }

            Post::create([
                'post_category_id' => $categoryId,
                'user_id' => $author?->id,
                'author_name' => $data['author'],

                'title' => ['fa' => $data['title_fa'], 'en' => $data['title_en']],
                'excerpt' => ['fa' => $data['excerpt_fa'], 'en' => $data['excerpt_en']],
                'body' => ['fa' => $data['body_fa'], 'en' => $data['body_en']],

                'slug' => $data['slug'],
                'cover_image' => "posts/{$data['slug']}.svg",

                /* زمان مطالعه از روی متن فارسی تخمین زده می‌شود */
                'reading_minutes' => Post::estimateReadingMinutes($data['body_fa']),

                /* آمار باورپذیر: مقالات قدیمی‌تر بازدید بیشتری دارند */
                'views_count' => 300 + ($index * 137) % 2400,
                'is_featured' => $index < 3,

                /*
                 * انتشار پلکانی — هر مقاله چند روز پیش از قبلی.
                 * بدون این، همه‌ی مقالات یک تاریخ می‌گیرند و
                 * مرتب‌سازی «جدیدترین» بی‌معنا می‌شود.
                 */
                'published_at' => now()->subDays($index * 9 + 2),
            ]);

            $created++;
        }

        $this->command->info("{$created} مقاله در ".count(self::CATEGORIES).' دسته ساخته شد.');
    }

    /**
     * ساخت یا به‌روزرسانی دسته‌های مجله.
     *
     * @return array<string,int> نگاشت نامک به شناسه
     */
    private function seedCategories(): array
    {
        $map = [];
        $order = 0;

        foreach (self::CATEGORIES as $slug => [$nameFa, $nameEn, $descFa, $descEn]) {
            /*
             * updateOrCreate و نه create: سیدر باید روی دیتابیس
             * موجود هم اجرا شود بدون خطای نامک تکراری، و در عین حال
             * اگر متن دسته را اصلاح کردیم، به‌روز شود.
             */
            $category = PostCategory::updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => ['fa' => $nameFa, 'en' => $nameEn],
                    'description' => ['fa' => $descFa, 'en' => $descEn],
                    'sort_order' => $order++,
                ],
            );

            $map[$slug] = $category->id;
        }

        return $map;
    }

    /**
     * نویسنده‌ی پیش‌فرض مقالات.
     *
     * به کاربر «مدیر محتوا» گره می‌خورد اگر وجود داشته باشد. نبودنش
     * خطا نیست — ستون user_id قابل تهی بودن است و نام نویسنده
     * جداگانه در author_name ذخیره می‌شود.
     */
    private function resolveAuthor(): ?User
    {
        return User::where('email', 'manager@demo.dev')->first()
            ?? User::where('email', 'admin@demo.dev')->first();
    }

    /**
     * خواندن محتوای مقالات از فایل داده.
     *
     * @return array<int,array<string,string>>
     */
    private function loadPosts(): array
    {
        $path = database_path('data/blog-posts.php');

        if (! file_exists($path)) {
            return [];
        }

        return require $path;
    }
}
