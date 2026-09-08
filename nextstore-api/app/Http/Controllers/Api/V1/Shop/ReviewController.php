<?php

namespace App\Http\Controllers\Api\V1\Shop;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shop\StoreReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Product;
use App\Models\Review;
use App\Services\Review\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * کنترلر نظرات محصولات.
 * ---------------------------------------------------------------------------
 * سه گروه اکشن:
 *   عمومی  — فهرست نظرات یک محصول و آمار امتیاز
 *   کاربر  — ثبت نظر، فهرست نظرات خودم، رأی «مفید بود»
 *
 * ⚠️ اصل محوری: هر مسیر عمومی باید از scope approved بگذرد.
 *    نظر تأییدنشده نباید حتی به‌صورت اتفاقی بیرون برود.
 */
class ReviewController extends Controller
{
    public function __construct(
        private readonly ReviewService $reviews,
    ) {}

    /**
     * GET /api/v1/products/{product}/reviews
     * فهرست نظرات تأییدشده‌ی یک محصول.
     */
    public function index(Request $request, Product $product): AnonymousResourceCollection
    {
        $query = $product->reviews()
            ->approved()
            ->with('user');

        /*
         * اگر کاربر وارد شده باشد، رأی خودش را هم بارگذاری می‌کنیم
         * تا دکمه‌ی «مفید بود» در حالت درست رندر شود.
         *
         * فیلتر روی user_id داخل خودِ eager load انجام می‌شود، نه
         * بارگذاری همه‌ی رأی‌ها — نظری با هزار رأی نباید هزار ردیف
         * را به حافظه بیاورد تا فقط بفهمیم یکی‌شان مال ماست.
         *
         * ⚠️ user('sanctum') و نه user() — باگی که با تست مرورگر پیدا شد:
         *    این مسیر عمومی است و میدل‌ور auth:sanctum ندارد. روی چنین
         *    مسیری، user() گاردِ *پیش‌فرض* (web/session) را می‌خواند و
         *    توکن Bearer را اصلاً نگاه نمی‌کند — یعنی همیشه null
         *    برمی‌گرداند، حتی وقتی کاربر کاملاً معتبر وارد شده است.
         *
         *    نتیجه در عمل: کلید hasVoted هرگز فرستاده نمی‌شد، دکمه‌ی
         *    «مفید بود» پس از هر رفرش به حالت خنثی برمی‌گشت و کاربر
         *    فکر می‌کرد رأیش ثبت نشده — در حالی که در دیتابیس بود.
         *
         *    نام گارد را صریح می‌دهیم تا توکن خوانده شود؛ نبودِ توکن
         *    همچنان بی‌خطر است و null می‌دهد.
         */
        if ($user = $request->user('sanctum')) {
            $query->with(['votes' => fn ($q) => $q->where('user_id', $user->id)]);
        }

        $sort = $request->query('sort', 'recent');

        match ($sort) {
            /* مفیدترین اول — پیش‌فرض بسیاری از فروشگاه‌ها */
            'helpful' => $query->orderByDesc('helpful_count')->orderByDesc('created_at'),
            'rating_high' => $query->orderByDesc('rating')->orderByDesc('created_at'),
            'rating_low' => $query->orderBy('rating')->orderByDesc('created_at'),
            default => $query->orderByDesc('created_at'),
        };

        $perPage = min((int) $request->query('per_page', 10), 50);

        return ReviewResource::collection($query->paginate($perPage))
            /*
             * آمار توزیع امتیاز کنار فهرست می‌آید تا صفحه‌ی محصول
             * برای رسم نمودار میله‌ای درخواست دومی نزند.
             */
            ->additional(['stats' => $this->reviews->statsFor($product)]);
    }

    /**
     * POST /api/v1/products/{product}/reviews
     * ثبت نظر تازه — نیازمند ورود.
     */
    public function store(StoreReviewRequest $request, Product $product): JsonResponse
    {
        $user = $request->user();

        $eligibility = $this->reviews->eligibility($user, $product);

        if (! $eligibility['allowed']) {
            /*
             * ۴۰۹ و نه ۴۲۲: داده‌ی ارسالی مشکلی ندارد، وضعیت فعلی
             * سیستم است که با این درخواست تعارض دارد. فرانت‌اند
             * می‌تواند این را از خطای اعتبارسنجی تفکیک کند و
             * به‌جای هایلایت کردن فیلد، پیام مناسب نشان دهد.
             */
            return response()->json([
                'message' => __('shop.review_already_exists'),
                'error' => ['code' => 'ALREADY_REVIEWED'],
            ], 409);
        }

        $review = $this->reviews->create($user, $product, $request->validated());

        return (new ReviewResource($review->load('user')))
            ->additional(['message' => __('shop.review_submitted')])
            ->response()
            ->setStatusCode(201);
    }

    /**
     * GET /api/v1/reviews
     * نظرات خودِ کاربر — شامل در انتظار و ردشده.
     */
    public function mine(Request $request): AnonymousResourceCollection
    {
        $reviews = $request->user()
            ->reviews()
            ->with(['product.images'])
            ->latest()
            ->paginate(min((int) $request->query('per_page', 10), 50));

        return ReviewResource::collection($reviews);
    }

    /**
     * POST /api/v1/reviews/{review}/helpful
     * ثبت یا برداشتن رأی «این نظر مفید بود».
     */
    public function helpful(Request $request, Review $review): JsonResponse
    {
        /*
         * فقط روی نظر منتشرشده می‌توان رأی داد.
         * ۴۰۴ و نه ۴۰۳ — وجود نظرِ تأییدنشده نباید تأیید شود.
         */
        abort_unless($review->is_approved, 404);

        $user = $request->user();

        /*
         * رأی دادن به نظر خود بی‌معناست و به‌سادگی برای بالا بردن
         * نمایش نظر خودی استفاده می‌شود.
         */
        if ($review->user_id === $user->id) {
            return response()->json([
                'message' => __('shop.review_own_vote'),
                'error' => ['code' => 'OWN_REVIEW'],
            ], 422);
        }

        $result = $this->reviews->toggleHelpful($review, $user);

        return response()->json([
            'message' => __($result['voted'] ? 'shop.review_voted' : 'shop.review_unvoted'),
            'data' => [
                'hasVoted' => $result['voted'],
                'helpfulCount' => $result['count'],
            ],
        ]);
    }
}
