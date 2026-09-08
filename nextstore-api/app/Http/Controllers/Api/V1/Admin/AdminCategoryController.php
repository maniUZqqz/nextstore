<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCategoryRequest;
use App\Http\Resources\AdminCategoryResource;
use App\Models\Category;
use App\Services\Catalog\CacheInvalidator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

/**
 * کنترلر مدیریت دسته‌بندی محصولات — پنل مدیریت.
 * ---------------------------------------------------------------------------
 * دسته‌بندی درخت است، نه فهرست تخت. همین یک تفاوت، سه قاعده می‌سازد
 * که در CRUD معمولی وجود ندارند:
 *
 *   ۱. دسته نمی‌تواند والد خودش یا والدِ یکی از فرزندانش شود
 *      (وگرنه حلقه می‌سازد و هر پیمایش درخت بی‌نهایت می‌شود)
 *   ۲. حذف دسته‌ای که فرزند دارد باید صریح رد شود
 *   ۳. غیرفعال کردن والد باید اثرش را روی فرزندان روشن کند
 *
 * ⚠️ بررسی نقش مدیر با میدل‌ور `admin` روی گروه مسیرها انجام
 *    می‌شود، نه اینجا.
 */
class AdminCategoryController extends Controller
{
    public function __construct(
        private readonly CacheInvalidator $cache,
    ) {}

    /**
     * GET /api/v1/admin/categories
     * درخت کامل دسته‌ها با شمارنده‌ها.
     *
     * برخلاف فهرست محصولات، اینجا صفحه‌بندی نداریم: تعداد دسته‌ها
     * ذاتاً کم است و درختِ نیمه‌بریده بی‌معناست.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Category::query()
            ->withCount(['products', 'children'])
            ->orderBy('sort_order')
            ->orderBy('id');

        /* --- جستجو در نام و نامک --- */
        if ($term = trim((string) $request->query('q', ''))) {
            $like = '%'.$term.'%';

            /*
             * نام ستون JSON دوزبانه است، پس جستجو روی کل رشته‌ی JSON
             * انجام می‌شود — همان رفتار جستجوی بین‌زبانی کاتالوگ.
             */
            $query->where(fn ($q) => $q->where('name', 'like', $like)->orWhere('slug', 'like', $like));

            /* در حالت جستجو، نتیجه تخت است نه درختی */
            return AdminCategoryResource::collection($query->get());
        }

        /*
         * حالت عادی: فقط ریشه‌ها با فرزندانشان.
         * whereNull('parent_id') لازم است وگرنه هر فرزند دو بار
         * می‌آید — یک بار مستقل و یک بار داخل والدش.
         */
        $categories = $query
            ->whereNull('parent_id')
            ->with(['children' => fn ($q) => $q->withCount(['products', 'children'])->orderBy('sort_order')])
            ->get();

        return AdminCategoryResource::collection($categories);
    }

    /**
     * GET /api/v1/admin/categories/{category}
     * جزئیات یک دسته برای فرم ویرایش.
     */
    public function show(Category $category): AdminCategoryResource
    {
        return new AdminCategoryResource(
            $category->loadCount(['products', 'children']),
        );
    }

    /**
     * POST /api/v1/admin/categories
     * ساخت دسته‌ی تازه.
     */
    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = Category::create($this->buildAttributes($request->validated()));

        $this->cache->flushCatalog();

        return (new AdminCategoryResource($category->loadCount(['products', 'children'])))
            ->additional(['message' => __('shop.category_created')])
            ->response()
            ->setStatusCode(201);
    }

    /**
     * PUT /api/v1/admin/categories/{category}
     * ویرایش دسته.
     */
    public function update(StoreCategoryRequest $request, Category $category): JsonResponse
    {
        $data = $request->validated();

        /*
         * ⚠️ جلوگیری از حلقه در درخت.
         *
         *    قاعده‌ی notIn در FormRequest فقط «والد خودش» را می‌گیرد.
         *    حالت خطرناک‌تر این است: الف والدِ ب باشد و بعد ب را والدِ
         *    الف کنیم. آن‌وقت هیچ‌کدام ریشه ندارند، از فهرست ناپدید
         *    می‌شوند، و هر پیمایش بازگشتی درخت تا ته حافظه می‌رود.
         *
         *    پس زنجیره‌ی والدها از بالا پیمایش می‌شود و اگر به خودِ
         *    این دسته رسید، تغییر رد می‌شود.
         */
        if (! empty($data['parent_id']) && $this->wouldCreateCycle($category, (int) $data['parent_id'])) {
            return response()->json([
                'message' => __('shop.category_cycle'),
                'errors' => ['parent_id' => [__('shop.category_cycle')]],
            ], 422);
        }

        $category->update($this->buildAttributes($data, $category));

        $this->cache->flushCatalog();

        return (new AdminCategoryResource($category->fresh()->loadCount(['products', 'children'])))
            ->additional(['message' => __('shop.category_updated')])
            ->response();
    }

    /**
     * DELETE /api/v1/admin/categories/{category}
     * حذف دسته.
     */
    public function destroy(Category $category): JsonResponse
    {
        $category->loadCount(['products', 'children']);

        /*
         * ⚠️ دسته‌ای که فرزند دارد حذف نمی‌شود.
         *
         *    کلید خارجی روی parent_id با cascade تعریف نشده، پس حذف
         *    والد یا خطای دیتابیس می‌دهد یا فرزندان را یتیم می‌گذارد.
         *    هر دو بد است؛ پیام روشن بهتر از هر کدام.
         */
        if ($category->children_count > 0) {
            return response()->json([
                'message' => __('shop.category_has_children'),
                'error' => ['code' => 'HAS_CHILDREN'],
            ], 409);
        }

        /*
         * دسته‌ای که محصول دارد هم حذف نمی‌شود.
         * محصولاتش بدون دسته می‌مانند و از فیلترها ناپدید می‌شوند —
         * خرابی‌ای که تا مدت‌ها دیده نمی‌شود.
         */
        if ($category->products_count > 0) {
            return response()->json([
                'message' => __('shop.category_has_products', ['count' => $category->products_count]),
                'error' => ['code' => 'HAS_PRODUCTS'],
            ], 409);
        }

        $category->delete();

        $this->cache->flushCatalog();

        return response()->json(['message' => __('shop.category_deleted')]);
    }

    /**
     * PATCH /api/v1/admin/categories/reorder
     * تغییر ترتیب چند دسته با یک درخواست.
     *
     * چرا دسته‌ای؟ مرتب‌سازی با کشیدن و رها کردن، ترتیب *همه‌ی*
     * هم‌نیاها را عوض می‌کند. فرستادن یک درخواست به‌ازای هر دسته
     * یعنی ده درخواست هم‌زمان و حالت نیمه‌ذخیره‌شده اگر یکی شکست بخورد.
     */
    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1', 'max:200'],
            'items.*.id' => ['required', 'integer', 'exists:categories,id'],
            'items.*.sort_order' => ['required', 'integer', 'min:0', 'max:9999'],
        ]);

        foreach ($validated['items'] as $item) {
            Category::whereKey($item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        $this->cache->flushCatalog();

        return response()->json(['message' => __('shop.category_reordered')]);
    }

    /* =====================================================================
     * کمکی‌های داخلی
     * ===================================================================== */

    /**
     * آیا تعیین این والد، حلقه می‌سازد؟
     *
     * از والدِ پیشنهادی به سمت ریشه بالا می‌رویم؛ اگر به خودِ دسته
     * رسیدیم یعنی حلقه است.
     */
    private function wouldCreateCycle(Category $category, int $parentId): bool
    {
        $current = Category::find($parentId);

        /* سقف پیمایش — محافظت در برابر داده‌ی از پیش خراب */
        for ($depth = 0; $current && $depth < 20; $depth++) {
            if ($current->id === $category->id) {
                return true;
            }

            $current = $current->parent_id ? Category::find($current->parent_id) : null;
        }

        return false;
    }

    /**
     * ساخت آرایه‌ی ستون‌ها از داده‌ی اعتبارسنجی‌شده.
     *
     * @param  array<string,mixed>  $data
     * @return array<string,mixed>
     */
    private function buildAttributes(array $data, ?Category $existing = null): array
    {
        return [
            'parent_id' => $data['parent_id'] ?? null,

            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'meta_title' => $data['meta_title'] ?? null,
            'meta_description' => $data['meta_description'] ?? null,

            'slug' => $this->resolveSlug($data, $existing),
            'icon' => $data['icon'] ?? $existing?->icon,
            'image' => $data['image'] ?? $existing?->getRawOriginal('image'),

            'sort_order' => $data['sort_order'] ?? $existing?->sort_order ?? 0,
            'is_active' => (bool) ($data['is_active'] ?? true),
            'is_featured' => (bool) ($data['is_featured'] ?? false),
        ];
    }

    /**
     * تعیین نامک: ورودی ادمین، وگرنه ساخت خودکار از نام انگلیسی.
     *
     * @param  array<string,mixed>  $data
     */
    private function resolveSlug(array $data, ?Category $existing): string
    {
        if (! empty($data['slug'])) {
            return $data['slug'];
        }

        if ($existing) {
            return $existing->slug;
        }

        /*
         * نامک از نام *انگلیسی* ساخته می‌شود نه فارسی.
         * Str::slug روی فارسی رشته‌ی خالی می‌دهد و نامک خالی یعنی
         * مسیر شکسته.
         */
        $base = Str::slug($data['name']['en'] ?? '') ?: 'category';

        $slug = $base;
        $suffix = 2;

        while (Category::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
