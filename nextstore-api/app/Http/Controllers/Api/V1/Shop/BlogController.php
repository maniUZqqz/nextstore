<?php

namespace App\Http\Controllers\Api\V1\Shop;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostCategoryResource;
use App\Http\Resources\PostDetailResource;
use App\Http\Resources\PostResource;
use App\Models\Post;
use App\Models\PostCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;

/**
 * کنترلر مجله (بلاگ).
 * ---------------------------------------------------------------------------
 * سه اندپوینت عمومی:
 *     GET /posts                 فهرست مقالات با فیلتر دسته و جستجو
 *     GET /posts/{post}          جزئیات یک مقاله + مقالات مرتبط
 *     GET /post-categories       فهرست دسته‌ها با شمارش
 *
 * ⚠️ همه‌ی کوئری‌ها از اسکوپ `published()` رد می‌شوند. فراموش‌کردنش
 *    یعنی پیش‌نویس‌های منتشرنشده در سایت عمومی دیده می‌شوند —
 *    نوعی نشت محتوا که هیچ خطایی تولید نمی‌کند.
 */
class BlogController extends Controller
{
    /** کش فهرست دسته‌ها — به‌ندرت تغییر می‌کند. */
    private const CACHE_TTL_LONG = 3600;

    /**
     * GET /api/v1/posts
     * فهرست مقالات منتشرشده.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Post::query()
            ->published()
            ->with('category');

        /* فیلتر دسته با نامک */
        if ($slug = $request->query('category')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $slug));
        }

        /*
         * جستجو در عنوان و خلاصه.
         *
         * ⚠️ json_extract لازم است، نه LIKE ساده روی ستون.
         *    json_encode حروف غیر ASCII را به \uXXXX تبدیل می‌کند،
         *    پس LIKE '%گوشی%' روی ستون خام همیشه صفر نتیجه می‌داد.
         *    همان تله‌ای که در جستجوی محصولات هم بود.
         */
        if ($term = trim((string) $request->query('q', ''))) {
            $like = "%{$term}%";

            $query->where(function ($q) use ($like) {
                foreach (['fa', 'en'] as $locale) {
                    $q->orWhereRaw("json_extract(title, '$.{$locale}') LIKE ?", [$like])
                        ->orWhereRaw("json_extract(excerpt, '$.{$locale}') LIKE ?", [$like]);
                }
            });
        }

        $perPage = min(max((int) $request->query('per_page', 9), 1), 24);

        return PostResource::collection(
            $query->orderByDesc('published_at')->paginate($perPage)->withQueryString()
        );
    }

    /**
     * GET /api/v1/posts/{post}
     * جزئیات یک مقاله.
     *
     * ⚠️ مقاله‌ی منتشرنشده ۴۰۴ می‌گیرد، حتی اگر نامکش درست باشد.
     *    اتکا به route model binding به‌تنهایی کافی نیست: باندینگ
     *    فقط نامک را می‌بیند، نه وضعیت انتشار را.
     */
    public function show(Request $request, Post $post): JsonResponse
    {
        abort_unless(
            $post->published_at !== null && $post->published_at->isPast(),
            404,
        );

        /*
         * شمارنده‌ی بازدید.
         *
         * ⚠️ `withoutTimestamps` و نه `incrementQuietly`.
         *
         *    هر دو یک کار می‌کنند — افزایش شمارنده بدون دست‌زدن به
         *    `updated_at`، وگرنه هر بازدید مقاله را «تازه ویرایش‌شده»
         *    نشان می‌داد و ترتیب‌های مبتنی بر آن ستون خراب می‌شد.
         *
         *    ولی `incrementQuietly` در لاراول **protected** است و فقط
         *    از راه `Model::__call` کار می‌کند؛ یعنی فراخوانی‌اش از
         *    بیرون به قرارداد عمومی کلاس تکیه نمی‌کند و هر تحلیل
         *    ایستایی آن را خطا می‌بیند. این شکل عمومی است و قصد را هم
         *    صریح‌تر می‌گوید.
         */
        Post::withoutTimestamps(fn () => $post->increment('views_count'));

        /* مقالات مرتبط: هم‌دسته، به‌جز خودش */
        $related = Post::query()
            ->published()
            ->where('post_category_id', $post->post_category_id)
            ->whereKeyNot($post->getKey())
            ->with('category')
            ->orderByDesc('published_at')
            ->limit(3)
            ->get();

        return response()->json([
            'data' => (new PostDetailResource($post->load('category')))->toArray($request),
            /*
             * مقالات مرتبط در همان پاسخ می‌آیند، نه با درخواست جدا.
             * صفحه‌ی مقاله همیشه هر دو را می‌خواهد؛ دو رفت‌وبرگشت
             * شبکه برای چیزی که با هم مصرف می‌شود، اتلاف است.
             */
            'related' => PostResource::collection($related)->toArray($request),
        ]);
    }

    /**
     * GET /api/v1/post-categories
     * فهرست دسته‌های مقاله با تعداد مقالات منتشرشده‌ی هرکدام.
     */
    public function categories(Request $request): JsonResponse
    {
        $locale = app()->getLocale();

        $data = Cache::remember(
            "post-categories.{$locale}",
            self::CACHE_TTL_LONG,
            function () use ($request) {
                $categories = PostCategory::query()
                    ->withCount('publishedPosts')
                    ->orderBy('sort_order')
                    ->get();

                /*
                 * ⚠️ آرایه‌ی تبدیل‌شده کش می‌شود، نه خود مدل‌ها.
                 *    کش‌کردن مدل الوکوئنت در بار دوم به
                 *    __PHP_Incomplete_Class تبدیل می‌شود — باگی که
                 *    در کش دسته‌بندی محصولات هم پیش آمد و چون بار
                 *    اول درست کار می‌کرد، دیر پیدا شد.
                 */
                return PostCategoryResource::collection($categories)->toArray($request);
            }
        );

        return response()->json(['data' => $data]);
    }
}
