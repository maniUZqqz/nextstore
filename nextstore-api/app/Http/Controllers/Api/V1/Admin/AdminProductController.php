<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ProductStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Http\Resources\AdminProductDetailResource;
use App\Http\Resources\AdminProductResource;
use App\Models\Product;
use App\Services\Catalog\CacheInvalidator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

/**
 * کنترلر مدیریت محصولات در پنل ادمین.
 * ---------------------------------------------------------------------------
 * تفاوت با ProductController فروشگاه:
 *   - محصولات پیش‌نویس و بایگانی را هم می‌بیند
 *   - امکان ساخت، ویرایش و حذف دارد
 *   - می‌تواند موجودی را مستقیم تغییر دهد
 *
 * ⚠️ پس از هر تغییر، کش کاتالوگ پاک می‌شود. بدون این، محصول
 *    جدید تا یک ساعت در صفحه اصلی دیده نمی‌شد و ادمین فکر
 *    می‌کرد ثبت نشده است.
 */
class AdminProductController extends Controller
{
    public function __construct(
        private readonly CacheInvalidator $cache,
    ) {}

    /**
     * GET /api/v1/admin/products
     * فهرست همه محصولات (شامل پیش‌نویس و بایگانی).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Product::query()->with(['images', 'category', 'brand']);

        /* فیلتر وضعیت انتشار */
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        /* فیلتر دسته‌بندی */
        if ($categoryId = $request->query('category_id')) {
            $query->where('category_id', $categoryId);
        }

        /* فقط محصولات کم‌موجود — نمای پرکاربرد انبارداری */
        if ($request->boolean('low_stock')) {
            $query->whereColumn('stock', '<=', 'low_stock_threshold');
        }

        /* جستجو در نام چندزبانه و کد کالا */
        if ($term = trim((string) $request->query('q', ''))) {
            $like = "%{$term}%";
            $query->where(function ($q) use ($like) {
                foreach (['fa', 'en'] as $locale) {
                    $q->orWhereRaw("json_extract(name, '$.{$locale}') LIKE ?", [$like]);
                }
                $q->orWhere('sku', 'like', $like);
            });
        }

        $perPage = min(max((int) $request->query('per_page', 20), 1), 50);

        return AdminProductResource::collection(
            $query->latest()->paginate($perPage)->withQueryString()
        );
    }

    /**
     * GET /api/v1/admin/products/{product}
     * جزئیات کامل یک محصول برای فرم ویرایش.
     */
    public function show(Product $product): AdminProductDetailResource
    {
        return new AdminProductDetailResource(
            $product->load(['images', 'category', 'brand'])
        );
    }

    /**
     * POST /api/v1/admin/products
     * ساخت محصول جدید.
     */
    public function store(StoreProductRequest $request): JsonResponse
    {
        $data = $request->validated();

        /* نامک از نام انگلیسی ساخته می‌شود تا آدرس در هر دو زبان یکسان بماند */
        $data['slug'] = $this->uniqueSlug($data['name']['en'] ?? $data['name']['fa']);

        /* کد کالا اگر داده نشده باشد، خودکار تولید می‌شود */
        $data['sku'] ??= $this->generateSku();

        /* محصول تازه‌ساخته اگر منتشر شود، زمان انتشار می‌گیرد */
        if (($data['status'] ?? null) === ProductStatus::Active->value) {
            $data['published_at'] = now();
        }

        $product = Product::create($data);

        $this->flushCatalogCache();

        return (new AdminProductDetailResource($product->load(['images', 'category', 'brand'])))
            ->additional(['message' => __('shop.product_created')])
            ->response()
            ->setStatusCode(201);
    }

    /**
     * PUT /api/v1/admin/products/{product}
     * ویرایش محصول.
     */
    public function update(StoreProductRequest $request, Product $product): JsonResponse
    {
        $data = $request->validated();

        /*
         * نامک فقط وقتی تغییر می‌کند که نام انگلیسی عوض شده باشد.
         *
         * ⚠️ تغییر خودکار نامک، لینک‌های موجود را می‌شکند و رتبه‌ی
         *    سئوی صفحه را از بین می‌برد. پس عمداً محافظه‌کارانه است.
         */
        $newEnglishName = $data['name']['en'] ?? null;
        if ($newEnglishName && $newEnglishName !== ($product->getTranslations('name')['en'] ?? null)) {
            $data['slug'] = $this->uniqueSlug($newEnglishName, $product->id);
        }

        /* اولین انتشار، زمان انتشار را ثبت می‌کند */
        if (
            ($data['status'] ?? null) === ProductStatus::Active->value
            && ! $product->published_at
        ) {
            $data['published_at'] = now();
        }

        $product->update($data);

        $this->flushCatalogCache();

        return (new AdminProductDetailResource($product->fresh(['images', 'category', 'brand'])))
            ->additional(['message' => __('shop.product_updated')])
            ->response();
    }

    /**
     * DELETE /api/v1/admin/products/{product}
     * حذف نرم محصول.
     *
     * ⚠️ حذف نرم است (softDeletes) نه حذف واقعی — چون اقلام سفارش‌های
     *    قبلی به این محصول ارجاع دارند و حذف فیزیکی، سوابق مالی را
     *    خراب می‌کند.
     */
    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        $this->flushCatalogCache();

        return response()->json(['message' => __('shop.product_deleted')]);
    }

    /**
     * PATCH /api/v1/admin/products/{product}/stock
     * تغییر سریع موجودی — پرکاربردترین عملیات انبارداری.
     */
    public function updateStock(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'stock' => ['required', 'integer', 'min:0', 'max:100000'],
        ]);

        $product->update(['stock' => $validated['stock']]);

        $this->flushCatalogCache();

        return (new AdminProductResource($product->fresh(['images', 'category', 'brand'])))
            ->additional(['message' => __('shop.stock_updated')])
            ->response();
    }

    /**
     * ساخت نامک یکتا از روی نام.
     *
     * @param  string  $name  نام مبنا
     * @param  int|null  $exceptId  شناسه محصولی که باید نادیده گرفته شود (هنگام ویرایش)
     */
    private function uniqueSlug(string $name, ?int $exceptId = null): string
    {
        $base = Str::slug($name) ?: 'product';
        $slug = $base;
        $counter = 1;

        while (
            Product::withTrashed()
                ->where('slug', $slug)
                ->when($exceptId, fn ($q) => $q->where('id', '!=', $exceptId))
                ->exists()
        ) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    /** تولید کد کالای یکتا. */
    private function generateSku(): string
    {
        do {
            $sku = 'NS-'.str_pad((string) random_int(1, 99999), 5, '0', STR_PAD_LEFT);
        } while (Product::withTrashed()->where('sku', $sku)->exists());

        return $sku;
    }

    /**
     * پاک کردن کش کاتالوگ در هر دو طرف.
     *
     * ⚠️ نسخه‌ی قبلی فقط کش لاراول را پاک می‌کرد و کش نکست دست‌نخورده
     *    می‌ماند. نتیجه: ادمین محصول را ذخیره می‌کرد، API درست جواب
     *    می‌داد، اما فروشگاه تا یک ساعت داده‌ی قدیمی نشان می‌داد.
     *    جزئیات در CacheInvalidator توضیح داده شده است.
     */
    private function flushCatalogCache(): void
    {
        $this->cache->flushCatalog();
    }
}
