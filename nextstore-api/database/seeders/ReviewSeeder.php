<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use App\Services\Catalog\CacheInvalidator;
use App\Services\Review\ReviewService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * سیدر نظرات محصولات.
 * ---------------------------------------------------------------------------
 * ⚠️ چرا این سیدر لازم شد؟
 *    CatalogSeeder امتیاز و تعداد نظر را با rand() می‌ساخت — مثلاً
 *    «۴.۷ از ۱۶۱ نظر» — در حالی که هیچ ردیف نظری وجود نداشت. تا
 *    زمانی که سیستم نظرات نبود این فقط یک عدد تزئینی بود، ولی حالا
 *    هر تأیید یا حذف نظر، امتیاز را از روی ردیف‌های واقعی بازمحاسبه
 *    می‌کند. نتیجه: اولین نظر واقعی روی یک محصول، «۴.۷ از ۱۶۱» را
 *    بی‌صدا به «۵.۰ از ۱» تبدیل می‌کرد.
 *
 *    این سیدر ردیف‌های واقعی می‌سازد تا عدد نمایش‌داده‌شده پشتوانه
 *    داشته باشد و با هر تغییر، درست بماند.
 *
 * ⚠️ محدودیت ساختاری: کلید یکتای (user_id, product_id) یعنی تعداد
 *    نظرات هر محصول نمی‌تواند از تعداد کاربران بیشتر باشد. پس این
 *    سیدر ابتدا چند حساب نظردهنده می‌سازد.
 */
class ReviewSeeder extends Seeder
{
    /** نام‌های نظردهنده — دوزبانه تا فهرست در هر دو زبان طبیعی باشد. */
    private const REVIEWER_NAMES = [
        'سارا محمدی', 'علی رضایی', 'مریم حسینی', 'رضا کریمی',
        'زهرا نوری', 'محمد صادقی', 'فاطمه احمدی', 'امیر جعفری',
        'نگین رستمی', 'حسین موسوی', 'الهام قاسمی', 'بابک شریفی',
        'مهسا کاظمی', 'سعید عباسی', 'پریسا یوسفی', 'ناصر مرادی',
        'شیما اکبری', 'کاوه فرهادی', 'لیلا سلطانی', 'آرش بهرامی',
        'رویا امینی', 'مهدی طاهری', 'سمانه رحیمی', 'فرهاد زمانی',
    ];

    /**
     * متن نظر بر اساس امتیاز.
     *
     * متن باید با ستاره بخواند. نظر پنج‌ستاره با متن «افتضاح بود»
     * در یک نمونه‌کار فوراً به چشم می‌آید و بی‌دقتی را نشان می‌دهد.
     *
     * @var array<int, array<int, array{string, string, array<int,string>, array<int,string>}>>
     */
    private const TEMPLATES = [
        5 => [
            ['کاملاً راضی‌ام', 'کیفیت ساخت واقعاً بالاست و دقیقاً همان چیزی بود که انتظار داشتم. ارسال هم سریع انجام شد.', ['کیفیت ساخت عالی', 'ارسال سریع'], []],
            ['بهترین خریدم', 'مدت‌ها تحقیق کردم و بالاخره این را گرفتم. هیچ پشیمانی ندارم و به دوستانم هم پیشنهاد دادم.', ['ارزش خرید بالا', 'بسته‌بندی مناسب'], []],
            ['فراتر از انتظار', 'تصور نمی‌کردم در این قیمت این کیفیت را بگیرم. عملکردش در استفاده روزمره بی‌نقص بوده.', ['عملکرد قوی'], []],
        ],
        4 => [
            ['خوب ولی نه بی‌عیب', 'در مجموع راضی هستم و کارم را راه انداخته. فقط چند نکته‌ی کوچک هست که می‌شد بهتر باشد.', ['کارایی خوب'], ['قیمت کمی بالا']],
            ['ارزش خرید دارد', 'برای این بازه‌ی قیمتی گزینه‌ی منطقی‌ای است. اگر توقع بی‌نهایت نداشته باشید راضی می‌مانید.', ['نسبت قیمت به کیفیت'], ['بسته‌بندی معمولی']],
            ['پیشنهاد می‌کنم', 'بعد از یک ماه استفاده هنوز مشکلی ندیده‌ام. یکی دو مورد جزئی هست که به چشم نمی‌آید.', ['دوام مناسب'], ['راهنمای فارسی ندارد']],
        ],
        3 => [
            ['متوسط بود', 'نه بد بود نه فوق‌العاده. کار راه‌انداز است ولی اگر بودجه دارید گزینه‌های بهتری هم هست.', ['کار راه‌انداز'], ['کیفیت متوسط']],
            ['انتظار بیشتری داشتم', 'با توجه به توضیحات صفحه، فکر می‌کردم بهتر باشد. بد نیست ولی مرا هیجان‌زده نکرد.', [], ['مطابق توضیحات نبود']],
        ],
        2 => [
            ['راضی نیستم', 'بعد از چند هفته استفاده مشکلاتی پیدا کرد که برای این قیمت قابل قبول نیست.', [], ['دوام پایین', 'قیمت بالا']],
        ],
        1 => [
            ['اصلاً پیشنهاد نمی‌کنم', 'کیفیت با قیمتش هیچ تناسبی ندارد و پشتیبانی هم پاسخگو نبود. تجربه‌ی خوبی نداشتم.', [], ['کیفیت پایین']],
        ],
    ];

    /**
     * توزیع امتیاز.
     *
     * توزیع عمداً به سمت امتیاز بالا متمایل است، چون در فروشگاه‌های
     * واقعی هم همین‌طور است: کسی که راضی بوده بیشتر نظر می‌دهد.
     * توزیع یکنواخت (هر ستاره ۲۰٪) نمودار امتیاز را غیرواقعی می‌کند.
     */
    private const RATING_WEIGHTS = [5 => 55, 4 => 25, 3 => 12, 2 => 5, 1 => 3];

    public function __construct(
        private readonly ReviewService $reviews,
        private readonly CacheInvalidator $cache,
    ) {}

    /** ساخت نظرات نمونه برای همه‌ی محصولات. */
    public function run(): void
    {
        /*
         * بذر ثابت: هر بار سید، همان داده تولید می‌شود.
         * بدون این، اسکرین‌شات‌های نمونه‌کار بعد از هر migrate:fresh
         * عوض می‌شوند و مقایسه‌ی بصری بی‌معنا می‌شود.
         */
        mt_srand(20260101);

        /*
         * پاکسازی پیش از ساخت.
         * بدون این، اجرای دوباره‌ی سیدر روی دیتابیس موجود با خطای
         * کلید یکتای (user_id, product_id) متوقف می‌شود — و سیدری
         * که فقط یک بار قابل اجراست عملاً بی‌فایده است.
         */
        Review::query()->delete();

        $reviewers = $this->seedReviewers();
        $products = Product::query()->orderBy('id')->get();

        if ($products->isEmpty()) {
            $this->command->warn('محصولی یافت نشد — ReviewSeeder رد شد.');

            return;
        }

        $rows = [];
        $now = now();

        foreach ($products as $index => $product) {
            /*
             * تعداد نظر هر محصول متفاوت است و چند محصول عمداً بدون
             * نظر می‌مانند تا حالت «هنوز نظری ثبت نشده» هم در
             * نمونه‌کار دیده شود.
             */
            /*
             * ⚠️ شرط «بدون نظر» عمداً روی باقی‌مانده‌ی ۷ است نه صفر.
             *    با صفر، اولین محصول فهرست (آیفون — همان محصول شاخصی
             *    که در صفحه اصلی و اسکرین‌شات‌های نمونه‌کار دیده
             *    می‌شود) بدون نظر می‌ماند و بدترین ویترین ممکن را
             *    می‌سازد: محصول اصلی با «۰ نظر».
             */
            $count = match (true) {
                $index % 11 === 7 => 0,
                $index % 5 === 3 => mt_rand(2, 4),
                default => mt_rand(5, min(14, $reviewers->count())),
            };

            if ($count === 0) {
                continue;
            }

            /* نظردهنده‌های متمایز — کلید یکتا تکرار را نمی‌پذیرد */
            $chosen = $reviewers->shuffle()->take($count);

            foreach ($chosen as $position => $reviewer) {
                $rating = $this->weightedRating();
                [$title, $comment, $pros, $cons] = $this->template($rating);

                /*
                 * آخرین نظر هر محصول در انتظار تعدیل می‌ماند تا صف
                 * پنل مدیریت خالی نباشد و بتوان جریان تأیید را
                 * بدون ساختن دستی داده نشان داد.
                 */
                $isPending = $position === $count - 1 && $index % 3 === 0;

                $rows[] = [
                    'user_id' => $reviewer->id,
                    'product_id' => $product->id,
                    'order_id' => null,
                    'rating' => $rating,
                    'title' => $title,
                    'comment' => $comment,
                    'pros' => $pros === [] ? null : json_encode($pros, JSON_UNESCAPED_UNICODE),
                    'cons' => $cons === [] ? null : json_encode($cons, JSON_UNESCAPED_UNICODE),
                    'is_approved' => ! $isPending,
                    'rejection_reason' => null,
                    /* دوسوم نظرات نشان «خرید تأییدشده» می‌گیرند */
                    'is_verified_purchase' => mt_rand(1, 3) > 1,
                    'helpful_count' => 0,
                    'created_at' => $now->copy()->subDays(mt_rand(1, 240)),
                    'updated_at' => $now,
                ];
            }
        }

        /*
         * درج دسته‌ای به‌جای Review::create در حلقه.
         * چند صد insert جداگانه روی SQLite کند است و سید را
         * از چند ثانیه به چند ده ثانیه می‌برد.
         */
        foreach (array_chunk($rows, 200) as $chunk) {
            Review::insert($chunk);
        }

        $this->recalculateAll();

        /*
         * ⚠️ باطل کردن کش پس از بازنویسی امتیازها.
         *
         *    بدون این، API عدد جدید می‌دهد ولی صفحه‌ی محصول همچنان
         *    امتیاز قدیمی را نشان می‌دهد — چون هم لاراول کلیدهای
         *    home/categories/brands را کش کرده و هم نکست صفحه را
         *    با ISR نگه داشته است.
         *
         *    این دقیقاً همان باگ گمراه‌کننده‌ای است که در
         *    app/api/revalidate/route.ts توضیح داده شده: با curl
         *    داده‌ی درست می‌بینی و در مرورگر داده‌ی قدیمی. کنترلرهای
         *    ادمین این را صدا می‌زنند؛ سیدر هم باید بزند.
         */
        $this->cache->flushCatalog();

        $this->command->info(sprintf(
            '%d نظر برای %d محصول ساخته شد.',
            count($rows),
            $products->count(),
        ));
    }

    /**
     * ساخت حساب‌های نظردهنده.
     *
     * @return Collection<int, User>
     */
    private function seedReviewers()
    {
        $created = collect();

        foreach (self::REVIEWER_NAMES as $index => $name) {
            $email = sprintf('reviewer%02d@demo.dev', $index + 1);

            /*
             * firstOrCreate و نه create: سیدر باید بتواند روی
             * دیتابیس موجود هم اجرا شود بدون خطای ایمیل تکراری.
             */
            $created->push(User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'phone' => sprintf('0912%07d', 1000 + $index),
                    'password' => 'password',
                    'role' => UserRole::Customer,
                    'email_verified_at' => now(),
                    'is_active' => true,
                ],
            ));
        }

        return $created;
    }

    /** انتخاب امتیاز بر اساس وزن‌های تعریف‌شده. */
    private function weightedRating(): int
    {
        $roll = mt_rand(1, array_sum(self::RATING_WEIGHTS));

        foreach (self::RATING_WEIGHTS as $rating => $weight) {
            $roll -= $weight;
            if ($roll <= 0) {
                return $rating;
            }
        }

        return 5;
    }

    /**
     * انتخاب یک قالب متن متناسب با امتیاز.
     *
     * @return array{string, string, array<int,string>, array<int,string>}
     */
    private function template(int $rating): array
    {
        $options = self::TEMPLATES[$rating];

        return $options[mt_rand(0, count($options) - 1)];
    }

    /**
     * بازمحاسبه‌ی امتیاز همه‌ی محصولات از روی نظرات تأییدشده.
     *
     * ⚠️ این مرحله جایگزین مقادیر rand() سیدر کاتالوگ می‌شود.
     *    یک کوئری گروهی به‌جای صدا زدن سرویس در حلقه — روی ۴۴
     *    محصول تفاوتی ندارد ولی روی ۲۰۰۰ محصول تفاوت چشمگیر است.
     */
    private function recalculateAll(): void
    {
        $stats = Review::query()
            ->where('is_approved', true)
            ->selectRaw('product_id, COUNT(*) as total, AVG(rating) as average')
            ->groupBy('product_id')
            ->get()
            ->keyBy('product_id');

        DB::transaction(function () use ($stats) {
            /* محصولات بدون نظر تأییدشده باید صفر شوند، نه اینکه عدد قبلی بماند */
            Product::query()->update(['rating_avg' => 0, 'reviews_count' => 0]);

            foreach ($stats as $productId => $row) {
                Product::query()->whereKey($productId)->update([
                    'rating_avg' => round((float) $row->average, 2),
                    'reviews_count' => (int) $row->total,
                ]);
            }
        });
    }
}
