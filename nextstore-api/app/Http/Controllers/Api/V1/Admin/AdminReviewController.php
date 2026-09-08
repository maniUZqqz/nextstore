<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Models\Review;
use App\Services\Review\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * کنترلر تعدیل نظرات — پنل مدیریت.
 * ---------------------------------------------------------------------------
 * نظر تازه منتشر نمی‌شود تا مدیر آن را ببیند. این کنترلر صف تعدیل
 * و دو کنش تأیید و رد را فراهم می‌کند.
 *
 * ⚠️ بررسی نقش مدیر با میدل‌ور `admin` روی گروه مسیرها انجام
 *    می‌شود، نه اینجا — تا اکشن جدیدی که فردا اضافه شود، به‌طور
 *    خودکار محافظت‌شده باشد.
 */
class AdminReviewController extends Controller
{
    public function __construct(
        private readonly ReviewService $reviews,
    ) {}

    /**
     * GET /api/v1/admin/reviews?status=pending
     * فهرست نظرات با فیلتر وضعیت.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Review::query()->with(['user', 'product']);

        match ($request->query('status', 'pending')) {
            'approved' => $query->approved(),
            'rejected' => $query->rejected(),
            'all' => null,
            /* پیش‌فرض صف تعدیل است — همان چیزی که مدیر روزانه می‌بیند */
            default => $query->pending(),
        };

        /* قدیمی‌ترین اول: نظری که بیشتر منتظر مانده، اول رسیدگی شود */
        $reviews = $query->oldest()
            ->paginate(min((int) $request->query('per_page', 20), 100));

        /*
         * ⚠️ شمارش‌ها زیر کلید مستقل «counts» می‌رود، نه داخل «meta».
         *    لاراول خودش meta را با اطلاعات صفحه‌بندی پر می‌کند و
         *    additional(['meta' => ...]) آن را کامل بازنویسی می‌کرد —
         *    یعنی current_page و last_page و total از پاسخ حذف
         *    می‌شدند و صفحه‌بندی پنل بی‌صدا می‌شکست.
         */
        return ReviewResource::collection($reviews)
            ->additional(['counts' => $this->counts()]);
    }

    /**
     * PATCH /api/v1/admin/reviews/{review}/approve
     * تأیید و انتشار نظر.
     */
    public function approve(Review $review): JsonResponse
    {
        $updated = $this->reviews->approve($review);

        return (new ReviewResource($updated->load(['user', 'product'])))
            ->additional(['message' => __('shop.review_approved')])
            ->response();
    }

    /**
     * PATCH /api/v1/admin/reviews/{review}/reject
     * رد نظر با ذکر دلیل.
     */
    public function reject(Request $request, Review $review): JsonResponse
    {
        $validated = $request->validate([
            /*
             * دلیل الزامی است. رد بی‌دلیل یعنی کاربر در «نظرات من»
             * فقط می‌بیند نظرش رد شده و نمی‌داند چه چیزی را اصلاح کند.
             */
            'reason' => ['required', 'string', 'min:3', 'max:255'],
        ]);

        $updated = $this->reviews->reject($review, $validated['reason']);

        return (new ReviewResource($updated->load(['user', 'product'])))
            ->additional(['message' => __('shop.review_rejected')])
            ->response();
    }

    /**
     * DELETE /api/v1/admin/reviews/{review}
     * حذف کامل نظر — برای محتوای توهین‌آمیز.
     */
    public function destroy(Review $review): JsonResponse
    {
        $product = $review->product;

        $review->delete();

        /* میانگین باید بدون نظر حذف‌شده دوباره حساب شود */
        $this->reviews->recalculateProductRating($product);

        return response()->json(['message' => __('shop.review_deleted')]);
    }

    /**
     * شمارش نظرات در هر وضعیت — برای نشان‌های عددی روی تب‌های پنل.
     *
     * @return array<string,int>
     */
    private function counts(): array
    {
        return [
            'pending' => Review::query()->pending()->count(),
            'approved' => Review::query()->approved()->count(),
            'rejected' => Review::query()->rejected()->count(),
        ];
    }
}
