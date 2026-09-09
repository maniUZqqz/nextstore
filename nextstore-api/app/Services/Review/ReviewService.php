<?php

namespace App\Services\Review;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use App\Services\Notification\NotificationService;
use Illuminate\Support\Facades\DB;

/**
 * سرویس نظرات محصولات.
 * ---------------------------------------------------------------------------
 * چرا سرویس و نه منطق داخل کنترلر؟
 *   ثبت یک نظر سه اثر جانبی دارد: تشخیص خرید تأییدشده، ساخت ردیف،
 *   و بازمحاسبه‌ی امتیاز محصول. اگر این‌ها در کنترلر باشند، مسیر
 *   بعدی که نظر می‌سازد (مثلاً ایمپورت یا سیدر) یکی‌شان را فراموش
 *   می‌کند و امتیاز محصول بی‌صدا از واقعیت جدا می‌افتد.
 */
class ReviewService
{
    public function __construct(
        private readonly NotificationService $notifications,
    ) {}

    /**
     * وضعیت‌هایی که یعنی کالا واقعاً به دست مشتری رسیده است.
     *
     * ⚠️ «پرداخت‌شده» کافی نیست. مشتری‌ای که همین الان پول داده و
     *    کالا را ندیده، نمی‌تواند درباره‌ی کیفیتش نظر بدهد. نشان
     *    «خرید تأییدشده» باید معنا داشته باشد، وگرنه اعتمادی که
     *    قرار است بسازد را از بین می‌برد.
     */
    private const FULFILLED_STATUSES = [
        OrderStatus::Shipped,
        OrderStatus::Delivered,
    ];

    /**
     * ثبت نظر تازه.
     *
     * @param  array{rating:int,title?:string|null,comment?:string|null,pros?:array|null,cons?:array|null}  $data
     */
    public function create(User $user, Product $product, array $data): Review
    {
        /*
         * سفارش تحویل‌شده‌ای که این محصول در آن بوده.
         * اگر پیدا شود، نظر نشان «خرید تأییدشده» می‌گیرد و به آن
         * سفارش گره می‌خورد.
         */
        $order = $this->findFulfilledOrder($user, $product);

        return DB::transaction(function () use ($user, $product, $data, $order) {
            $review = Review::create([
                'user_id' => $user->id,
                'product_id' => $product->id,
                'order_id' => $order?->id,
                'rating' => $data['rating'],
                'title' => $data['title'] ?? null,
                'comment' => $data['comment'] ?? null,
                'pros' => $this->cleanList($data['pros'] ?? null),
                'cons' => $this->cleanList($data['cons'] ?? null),
                'is_verified_purchase' => $order !== null,

                /* نظر تازه همیشه در انتظار تعدیل است */
                'is_approved' => false,
            ]);

            /*
             * بازمحاسبه اینجا هم لازم است هرچند نظر هنوز تأیید نشده.
             * دلیل: اگر کاربر نظر قبلی‌اش را ویرایش کرده باشد (که
             * تأییدش را باطل می‌کند)، میانگین باید بدون آن دوباره
             * حساب شود.
             */
            $this->recalculateProductRating($product);

            return $review;
        });
    }

    /**
     * تأیید یک نظر توسط مدیر.
     *
     * @return Review نظر به‌روزشده
     */
    public function approve(Review $review): Review
    {
        $updated = DB::transaction(function () use ($review) {
            $review->update([
                'is_approved' => true,
                /* دلیل رد قبلی پاک می‌شود تا وضعیت متناقض نماند */
                'rejection_reason' => null,
            ]);

            $this->recalculateProductRating($review->product);

            return $review->fresh();
        });

        /*
         * ⚠️ بیرون از تراکنش — همان دلیل همیشگی: اعلانی که به تغییری
         *    اشاره کند که برگشته، از نبودِ اعلان بدتر است.
         */
        $this->notifications->reviewApproved($updated->loadMissing(['user', 'product']));

        return $updated;
    }

    /**
     * رد یک نظر با ذکر دلیل.
     */
    public function reject(Review $review, string $reason): Review
    {
        $updated = DB::transaction(function () use ($review, $reason) {
            $review->update([
                'is_approved' => false,
                'rejection_reason' => $reason,
            ]);

            /* نظر ردشده باید فوراً از میانگین بیرون برود */
            $this->recalculateProductRating($review->product);

            return $review->fresh();
        });

        /* دلیل هم می‌رود: «ردشد» بدون دلیل، کاربر را به نوشتن همان نظر وامی‌دارد */
        $this->notifications->reviewRejected(
            $updated->loadMissing(['user', 'product']),
            $reason,
        );

        return $updated;
    }

    /**
     * ثبت یا برداشتن رأی «مفید بود».
     *
     * عملیات دوحالته است: اگر کاربر قبلاً رأی داده باشد، رأیش
     * برداشته می‌شود. این یعنی کاربر می‌تواند اشتباهش را برگرداند
     * بدون اینکه به اندپوینت دوم نیاز باشد.
     *
     * @return array{voted:bool,count:int}
     */
    public function toggleHelpful(Review $review, User $user): array
    {
        return DB::transaction(function () use ($review, $user) {
            $existing = $review->votes()->where('user_id', $user->id)->first();

            if ($existing) {
                $existing->delete();
                $voted = false;
            } else {
                $review->votes()->create(['user_id' => $user->id]);
                $voted = true;
            }

            /*
             * شمارنده از روی خودِ جدول رأی‌ها نوشته می‌شود، نه با
             * increment/decrement. اگر دو درخواست هم‌زمان برسند،
             * شمردن دوباره همیشه عدد درست را می‌دهد در حالی که
             * افزایش نسبی می‌تواند یکی را گم کند.
             *
             * ⚠️ انتساب مستقیم و نه update() — باگی که با تست مرورگر پیدا شد:
             *    ستون helpful_count عمداً در $fillable نیست (کاربر نباید
             *    بتواند تعداد رأی را در بدنه‌ی درخواست تعیین کند). متد
             *    update از انتساب انبوه عبور می‌کند و ستون‌های بیرون از
             *    $fillable را **بدون هیچ خطایی** دور می‌اندازد.
             *
             *    نتیجه در عمل: پاسخ درخواست عدد درست را برمی‌گرداند
             *    (چون از همین $count می‌آید) ولی ستون دیتابیس همیشه صفر
             *    می‌ماند. یعنی رأی ثبت می‌شد، کاربر عدد ۱ می‌دید، و پس
             *    از رفرش دوباره ۰ — تستِ API هم آن را نمی‌گرفت چون فقط
             *    پاسخ را می‌سنجید، نه مقدار ذخیره‌شده را.
             *
             *    همان تله‌ای که در User::recordLogin() مستند شده است.
             */
            $count = $review->votes()->count();
            $review->helpful_count = $count;
            $review->save();

            return ['voted' => $voted, 'count' => $count];
        });
    }

    /**
     * بازمحاسبه‌ی میانگین امتیاز و تعداد نظرات یک محصول.
     *
     * ⚠️ فقط نظرات تأییدشده شمرده می‌شوند.
     *
     * ⚠️ نوشتن با updateQuietly و کوئری مستقیم:
     *    ستون‌های rating_avg و reviews_count عمداً در $fillable مدل
     *    Product نیستند (نباید از ورودی کاربر قابل تنظیم باشند)، پس
     *    update معمولی آن‌ها را بی‌صدا نادیده می‌گیرد — همان تله‌ای
     *    که قبلاً روی last_login_at رخ داده بود.
     */
    public function recalculateProductRating(Product $product): void
    {
        $stats = Review::query()
            ->where('product_id', $product->id)
            ->approved()
            ->selectRaw('COUNT(*) as total, COALESCE(AVG(rating), 0) as average')
            /*
             * ⚠️ `toBase()` پیش از `first()`.
             *
             *    بدون آن، لاراول یک مدل `Review` می‌سازد که
             *    هیچ‌کدام از ستون‌هایش را ندارد و فقط دو نام
             *    مستعار کوئری رویش نشسته است. هم گمراه‌کننده
             *    است (شیئی که Review نیست ولی Review نامیده
             *    می‌شود) و هم هزینه‌ی بی‌دلیل ساخت مدل و رویداد
             *    دارد. حالا یک `stdClass` ساده برمی‌گردد.
             */
            ->toBase()
            ->first();

        $product->newQuery()
            ->whereKey($product->id)
            ->update([
                'rating_avg' => round((float) $stats->average, 2),
                'reviews_count' => (int) $stats->total,
            ]);
    }

    /**
     * آمار توزیع امتیاز یک محصول — برای نمودار میله‌ای صفحه محصول.
     *
     * @return array{average:float,total:int,distribution:array<int,int>}
     */
    public function statsFor(Product $product): array
    {
        $rows = Review::query()
            ->where('product_id', $product->id)
            ->approved()
            ->selectRaw('rating, COUNT(*) as total')
            ->groupBy('rating')
            ->pluck('total', 'rating');

        /*
         * همه‌ی پنج ستاره حتی با مقدار صفر برگردانده می‌شوند.
         * بدون این، فرانت‌اند باید کلیدهای غایب را خودش پر کند و
         * نمودار برای محصولی که مثلاً هیچ نظر یک‌ستاره ندارد،
         * یک میله کم می‌آورد و چیدمانش می‌پرد.
         */
        $distribution = [];
        foreach ([5, 4, 3, 2, 1] as $star) {
            $distribution[$star] = (int) ($rows[$star] ?? 0);
        }

        $total = array_sum($distribution);

        return [
            'average' => $total > 0
                ? round(array_sum(array_map(
                    fn ($star, $count) => $star * $count,
                    array_keys($distribution),
                    $distribution,
                )) / $total, 2)
                : 0.0,
            'total' => $total,
            'distribution' => $distribution,
        ];
    }

    /**
     * آیا این کاربر اجازه‌ی نظر دادن روی این محصول را دارد؟
     *
     * @return array{allowed:bool,reason:string|null}
     */
    public function eligibility(User $user, Product $product): array
    {
        $existing = Review::where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->exists();

        if ($existing) {
            return ['allowed' => false, 'reason' => 'already_reviewed'];
        }

        return ['allowed' => true, 'reason' => null];
    }

    /* =====================================================================
     * کمکی‌های داخلی
     * ===================================================================== */

    /**
     * یافتن سفارش تحویل‌شده‌ای که این محصول در آن بوده.
     */
    private function findFulfilledOrder(User $user, Product $product): ?Order
    {
        return Order::query()
            ->where('user_id', $user->id)
            ->whereIn('status', self::FULFILLED_STATUSES)
            ->whereHas('items', fn ($q) => $q->where('product_id', $product->id))
            ->latest()
            ->first();
    }

    /**
     * پاکسازی فهرست نقاط مثبت و منفی.
     *
     * ورودی‌های خالی حذف و فضای اضافه گرفته می‌شود؛ فهرست تهی به
     * null تبدیل می‌شود تا در دیتابیس «[]» ذخیره نشود — چون در
     * خروجی API آرایه‌ی خالی و «نداشتن» دو معنای متفاوت‌اند.
     *
     * @param  array<int,string>|null  $list
     * @return array<int,string>|null
     */
    private function cleanList(?array $list): ?array
    {
        if ($list === null) {
            return null;
        }

        $clean = array_values(array_filter(
            array_map(static fn ($item) => trim((string) $item), $list),
            static fn ($item) => $item !== '',
        ));

        return $clean === [] ? null : $clean;
    }
}
