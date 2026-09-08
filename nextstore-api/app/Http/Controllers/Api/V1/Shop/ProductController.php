<?php

namespace App\Http\Controllers\Api\V1\Shop;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductDetailResource;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\Product\ProductQueryService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * کنترلر عمومی محصولات (بدون نیاز به احراز هویت).
 * ---------------------------------------------------------------------------
 * این کنترلر عمداً «نازک» است: فقط ورودی را می‌گیرد، سرویس را صدا می‌زند
 * و خروجی را به Resource می‌سپارد. هیچ منطق تجاری‌ای اینجا نوشته نمی‌شود.
 */
class ProductController extends Controller
{
    /**
     * تزریق وابستگی از طریق سازنده.
     * لاراول خودش نمونه‌ی ProductQueryService را می‌سازد و تحویل می‌دهد.
     */
    public function __construct(
        private readonly ProductQueryService $queryService,
    ) {}

    /**
     * GET /api/v1/products
     * لیست محصولات با فیلتر، مرتب‌سازی و صفحه‌بندی.
     *
     * پارامترهای پشتیبانی‌شده:
     *   category   — نامک دسته (زیردسته‌ها هم شامل می‌شوند)
     *   brand      — نامک برند (قابل تکرار برای چند برند)
     *   min_price  — حداقل قیمت
     *   max_price  — حداکثر قیمت
     *   in_stock   — فقط موجودها (true/false)
     *   on_sale    — فقط تخفیف‌دارها (true/false)
     *   min_rating — حداقل امتیاز
     *   q          — عبارت جستجو
     *   sort       — newest | oldest | price_asc | price_desc | popular | rating
     *   per_page   — تعداد در هر صفحه (۱ تا ۴۸)
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $products = $this->queryService->paginate($request->query());

        return ProductResource::collection($products);
    }

    /**
     * GET /api/v1/products/{slug}
     * نمایش جزئیات یک محصول.
     *
     * لاراول با Route Model Binding خودش محصول را از روی نامک پیدا می‌کند
     * (چون در مدل getRouteKeyName را روی slug تنظیم کرده‌ایم).
     * اگر پیدا نشود، خودکار پاسخ ۴۰۴ برمی‌گردد.
     */
    public function show(Product $product): ProductDetailResource
    {
        /*
         * محصول پیش‌نویس یا بایگانی‌شده نباید از طریق API عمومی
         * قابل مشاهده باشد — حتی اگر کاربر نامک آن را حدس بزند.
         */
        abort_unless($product->status->isPurchasable(), 404);

        /*
         * افزایش شمارنده بازدید.
         * از increment استفاده می‌کنیم نه خواندن-و-نوشتن، چون اتمیک است
         * و در درخواست‌های همزمان شمارش از دست نمی‌رود.
         * timestamps را هم دست نمی‌زند تا updated_at بی‌دلیل تغییر نکند.
         */
        $product->incrementQuietly('views_count');

        return new ProductDetailResource(
            $product->load(['images', 'category.parent', 'brand'])
        );
    }

    /**
     * GET /api/v1/products/{slug}/related
     * محصولات مشابه — برای بخش «شاید بپسندید» در صفحه محصول.
     *
     * منطق سادهٔ انتخاب: هم‌دسته بودن، به‌جز خود محصول، مرتب بر اساس فروش.
     */
    public function related(Product $product): AnonymousResourceCollection
    {
        $related = Product::query()
            ->active()
            ->where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->with(['images', 'brand'])
            ->orderByDesc('sales_count')
            ->limit(8)
            ->get();

        return ProductResource::collection($related);
    }
}
