<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePostRequest;
use App\Http\Resources\AdminPostDetailResource;
use App\Http\Resources\AdminPostResource;
use App\Http\Resources\PostCategoryResource;
use App\Models\Post;
use App\Models\PostCategory;
use App\Services\Catalog\CacheInvalidator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

/**
 * کنترلر مدیریت مقالات مجله — پنل مدیریت.
 * ---------------------------------------------------------------------------
 * CRUD کامل: فهرست با فیلتر، ساخت، ویرایش، حذف، و تغییر سریع وضعیت
 * انتشار.
 *
 * ⚠️ بررسی نقش مدیر با میدل‌ور `admin` روی گروه مسیرها انجام
 *    می‌شود، نه اینجا — تا اکشن تازه‌ای که فردا اضافه شود خودکار
 *    محافظت‌شده باشد.
 *
 * ⚠️ هر تغییری کش را باطل می‌کند. بدون آن، ادمین مقاله را منتشر
 *    می‌کند و در سایت چیزی نمی‌بیند — چون هم لاراول و هم نکست
 *    نسخه‌ی قبلی را کش کرده‌اند.
 */
class AdminPostController extends Controller
{
    public function __construct(
        private readonly CacheInvalidator $cache,
    ) {}

    /**
     * GET /api/v1/admin/posts
     * فهرست مقالات با فیلتر وضعیت، دسته و جستجو.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Post::query()->with('category');

        /* --- فیلتر وضعیت انتشار --- */
        match ($request->query('status')) {
            'published' => $query->whereNotNull('published_at')->where('published_at', '<=', now()),
            'scheduled' => $query->whereNotNull('published_at')->where('published_at', '>', now()),
            'draft' => $query->whereNull('published_at'),
            default => null,
        };

        /* --- فیلتر دسته --- */
        if ($categoryId = $request->query('category_id')) {
            $query->where('post_category_id', (int) $categoryId);
        }

        /* --- جستجو در عنوان و نامک --- */
        if ($term = trim((string) $request->query('q', ''))) {
            $like = '%'.$term.'%';

            /*
             * عنوان ستون JSON دوزبانه است، پس جستجو روی *کل* رشته‌ی
             * JSON انجام می‌شود. نتیجه: تایپ «phone» در پنل فارسی هم
             * مقاله را پیدا می‌کند — همان رفتار جستجوی بین‌زبانی که
             * کاتالوگ دارد.
             */
            $query->where(function ($q) use ($like) {
                $q->where('title', 'like', $like)
                    ->orWhere('slug', 'like', $like)
                    ->orWhere('author_name', 'like', $like);
            });
        }

        $perPage = min(max((int) $request->query('per_page', 20), 1), 100);

        $posts = $query->orderByRaw('published_at IS NULL DESC')
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();

        return AdminPostResource::collection($posts)
            /*
             * شمارش هر وضعیت زیر کلید مستقل «counts» می‌رود، نه داخل
             * «meta» — لاراول خودش meta را با صفحه‌بندی پر می‌کند و
             * بازنویسی‌اش current_page و total را از بین می‌برد.
             */
            ->additional(['counts' => $this->statusCounts()]);
    }

    /**
     * GET /api/v1/admin/posts/{post}
     * جزئیات کامل برای فرم ویرایش — با هر دو زبان.
     */
    public function show(Post $post): AdminPostDetailResource
    {
        return new AdminPostDetailResource($post->load('category'));
    }

    /**
     * POST /api/v1/admin/posts
     * ساخت مقاله‌ی تازه.
     */
    public function store(StorePostRequest $request): JsonResponse
    {
        $data = $request->validated();

        $post = Post::create($this->buildAttributes($data));

        $this->cache->flushCatalog();

        return (new AdminPostDetailResource($post->load('category')))
            ->additional(['message' => __('shop.post_created')])
            ->response()
            ->setStatusCode(201);
    }

    /**
     * PUT /api/v1/admin/posts/{post}
     * ویرایش مقاله.
     */
    public function update(StorePostRequest $request, Post $post): JsonResponse
    {
        $data = $request->validated();

        $post->update($this->buildAttributes($data, $post));

        $this->cache->flushCatalog();

        return (new AdminPostDetailResource($post->fresh()->load('category')))
            ->additional(['message' => __('shop.post_updated')])
            ->response();
    }

    /**
     * DELETE /api/v1/admin/posts/{post}
     * حذف مقاله.
     */
    public function destroy(Post $post): JsonResponse
    {
        $post->delete();

        $this->cache->flushCatalog();

        return response()->json(['message' => __('shop.post_deleted')]);
    }

    /**
     * PATCH /api/v1/admin/posts/{post}/publish
     * انتشار یا بازگرداندن به پیش‌نویس — بدون باز کردن فرم کامل.
     *
     * چرا اکشن جدا؟ تغییر وضعیت پرتکرارترین کار روی جدول مقالات
     * است. اگر فقط از راه PUT ممکن باشد، فرانت‌اند مجبور است کل
     * مقاله (شامل هر دو بدنه‌ی HTML) را بفرستد تا یک ستون عوض شود.
     */
    public function togglePublish(Request $request, Post $post): JsonResponse
    {
        $validated = $request->validate([
            'published' => ['required', 'boolean'],
        ]);

        $post->update([
            'published_at' => $validated['published'] ? now() : null,
        ]);

        $this->cache->flushCatalog();

        return (new AdminPostDetailResource($post->fresh()->load('category')))
            ->additional([
                'message' => __($validated['published'] ? 'shop.post_published' : 'shop.post_unpublished'),
            ])
            ->response();
    }

    /**
     * GET /api/v1/admin/post-categories
     * دسته‌های مجله — برای پرکردن انتخابگر فرم.
     */
    public function categories(): AnonymousResourceCollection
    {
        return PostCategoryResource::collection(
            PostCategory::query()->withCount('posts')->orderBy('sort_order')->get(),
        );
    }

    /**
     * ساخت آرایه‌ی ستون‌ها از داده‌ی اعتبارسنجی‌شده.
     *
     * @param  array<string,mixed>  $data
     * @return array<string,mixed>
     */
    private function buildAttributes(array $data, ?Post $existing = null): array
    {
        return [
            'post_category_id' => $data['post_category_id'],
            'author_name' => $data['author_name'] ?? null,

            'title' => $data['title'],
            'excerpt' => $data['excerpt'] ?? null,
            'body' => $data['body'],

            'slug' => $this->resolveSlug($data, $existing),
            'cover_image' => $data['cover_image'] ?? $existing?->getRawOriginal('cover_image'),

            /*
             * زمان مطالعه محاسبه می‌شود، نه از ورودی گرفته.
             * عددی که ادمین دستی وارد کند به‌سرعت با متن ناهماهنگ
             * می‌شود؛ محاسبه از روی خودِ متن همیشه درست است.
             */
            'reading_minutes' => Post::estimateReadingMinutes($data['body']['fa']),

            'is_featured' => (bool) ($data['is_featured'] ?? false),
            'published_at' => $data['published_at'] ?? null,
        ];
    }

    /**
     * تعیین نامک: ورودی ادمین، وگرنه ساخت خودکار از عنوان انگلیسی.
     *
     * @param  array<string,mixed>  $data
     */
    private function resolveSlug(array $data, ?Post $existing): string
    {
        if (! empty($data['slug'])) {
            return $data['slug'];
        }

        if ($existing) {
            return $existing->slug;
        }

        /*
         * نامک از عنوان *انگلیسی* ساخته می‌شود نه فارسی.
         * Str::slug روی فارسی رشته‌ی خالی می‌دهد (حروف غیرلاتین را
         * حذف می‌کند)، و نامک خالی یعنی مسیر شکسته.
         */
        $base = Str::slug($data['title']['en'] ?? '');

        if ($base === '') {
            $base = 'post';
        }

        /* تضمین یکتایی با افزودن شماره در صورت تکرار */
        $slug = $base;
        $suffix = 2;

        while (Post::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }

    /**
     * شمارش مقالات در هر وضعیت — برای نشان‌های عددی روی تب‌های پنل.
     *
     * @return array<string,int>
     */
    private function statusCounts(): array
    {
        return [
            'all' => Post::query()->count(),
            'published' => Post::query()->whereNotNull('published_at')->where('published_at', '<=', now())->count(),
            'scheduled' => Post::query()->whereNotNull('published_at')->where('published_at', '>', now())->count(),
            'draft' => Post::query()->whereNull('published_at')->count(),
        ];
    }
}
