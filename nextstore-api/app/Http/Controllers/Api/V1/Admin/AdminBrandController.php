<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBrandRequest;
use App\Http\Resources\AdminBrandResource;
use App\Models\Brand;
use App\Services\Catalog\CacheInvalidator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

/**
 * کنترلر مدیریت برندها — پنل مدیریت.
 * ---------------------------------------------------------------------------
 * ساده‌تر از دسته‌بندی است چون برند فهرست تخت است، نه درخت.
 *
 * ⚠️ بررسی نقش مدیر با میدل‌ور `admin` روی گروه مسیرها انجام
 *    می‌شود، نه اینجا.
 */
class AdminBrandController extends Controller
{
    public function __construct(
        private readonly CacheInvalidator $cache,
    ) {}

    /**
     * GET /api/v1/admin/brands
     * فهرست برندها با تعداد محصول هر کدام.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Brand::query()->withCount('products');

        /* --- جستجو در نام و نامک --- */
        if ($term = trim((string) $request->query('q', ''))) {
            $like = '%'.$term.'%';
            $query->where(fn ($q) => $q->where('name', 'like', $like)->orWhere('slug', 'like', $like));
        }

        /* --- فیلتر وضعیت --- */
        match ($request->query('status')) {
            'active' => $query->where('is_active', true),
            'inactive' => $query->where('is_active', false),
            default => null,
        };

        $brands = $query->orderBy('sort_order')->orderBy('id')->get();

        return AdminBrandResource::collection($brands);
    }

    /**
     * GET /api/v1/admin/brands/{brand}
     * جزئیات یک برند برای فرم ویرایش.
     */
    public function show(Brand $brand): AdminBrandResource
    {
        return new AdminBrandResource($brand->loadCount('products'));
    }

    /**
     * POST /api/v1/admin/brands
     * ساخت برند تازه.
     */
    public function store(StoreBrandRequest $request): JsonResponse
    {
        $brand = Brand::create($this->buildAttributes($request->validated()));

        $this->cache->flushCatalog();

        return (new AdminBrandResource($brand->loadCount('products')))
            ->additional(['message' => __('shop.brand_created')])
            ->response()
            ->setStatusCode(201);
    }

    /**
     * PUT /api/v1/admin/brands/{brand}
     * ویرایش برند.
     */
    public function update(StoreBrandRequest $request, Brand $brand): JsonResponse
    {
        $brand->update($this->buildAttributes($request->validated(), $brand));

        $this->cache->flushCatalog();

        return (new AdminBrandResource($brand->fresh()->loadCount('products')))
            ->additional(['message' => __('shop.brand_updated')])
            ->response();
    }

    /**
     * DELETE /api/v1/admin/brands/{brand}
     * حذف برند.
     */
    public function destroy(Brand $brand): JsonResponse
    {
        $brand->loadCount('products');

        /*
         * ⚠️ برندی که محصول دارد حذف نمی‌شود.
         *
         *    محصولاتش بدون برند می‌مانند و از فیلتر برند ناپدید
         *    می‌شوند — خرابی‌ای که تا مدت‌ها دیده نمی‌شود. اگر ادمین
         *    واقعاً می‌خواهد برند را کنار بگذارد، «غیرفعال کردن»
         *    کارِ درست است نه حذف.
         */
        if ($brand->products_count > 0) {
            return response()->json([
                'message' => __('shop.brand_has_products', ['count' => $brand->products_count]),
                'error' => ['code' => 'HAS_PRODUCTS'],
            ], 409);
        }

        $brand->delete();

        $this->cache->flushCatalog();

        return response()->json(['message' => __('shop.brand_deleted')]);
    }

    /* =====================================================================
     * کمکی‌های داخلی
     * ===================================================================== */

    /**
     * ساخت آرایه‌ی ستون‌ها از داده‌ی اعتبارسنجی‌شده.
     *
     * @param  array<string,mixed>  $data
     * @return array<string,mixed>
     */
    private function buildAttributes(array $data, ?Brand $existing = null): array
    {
        return [
            'name' => $data['name'],
            'description' => $data['description'] ?? null,

            'slug' => $this->resolveSlug($data, $existing),
            'logo' => $data['logo'] ?? $existing?->getRawOriginal('logo'),
            'website' => $data['website'] ?? null,

            /* کد کشور همیشه بزرگ ذخیره می‌شود تا مقایسه‌ها یکدست بماند */
            'country_code' => isset($data['country_code'])
                ? strtoupper($data['country_code'])
                : null,

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
    private function resolveSlug(array $data, ?Brand $existing): string
    {
        if (! empty($data['slug'])) {
            return $data['slug'];
        }

        if ($existing) {
            return $existing->slug;
        }

        /* Str::slug روی فارسی رشته‌ی خالی می‌دهد — پس از نام انگلیسی */
        $base = Str::slug($data['name']['en'] ?? '') ?: 'brand';

        $slug = $base;
        $suffix = 2;

        while (Brand::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
