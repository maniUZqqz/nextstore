<?php

namespace App\Http\Controllers\Api\V1\Shop;

use App\Http\Controllers\Controller;
use App\Http\Resources\BrandResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ProductResource;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * کنترلر داده‌های ثابت فروشگاه: دسته‌بندی‌ها، برندها و صفحه اصلی.
 * ===========================================================================
 * این داده‌ها به‌ندرت تغییر می‌کنند اما در هر بازدید صفحه لازم‌اند،
 * پس کش کردنشان بیشترین تأثیر را روی سرعت دارد.
 *
 * ⚠️ درس مهمی که در این کلاس رعایت شده — «چه چیزی را کش کنیم؟»
 *
 *    ❌ اشتباه رایج: کش کردن مجموعه‌ی Eloquent
 *        Cache::remember('x', 60, fn () => Category::with(...)->get());
 *
 *        چرا خراب می‌شود؟ لاراول برای ذخیره در کش، شیء را serialize
 *        می‌کند. هنگام خواندن، unserialize نمی‌تواند مدل‌ها و رابطه‌های
 *        تودرتو را بازسازی کند و خطای زیر رخ می‌دهد:
 *            "The script tried to call a method on an incomplete object"
 *
 *        بدتر اینکه بار *اول* کار می‌کند (کش خالی است و مقدار تازه
 *        برمی‌گردد) و از بار دوم می‌شکند — باگی که به‌راحتی از تست
 *        دستی فرار می‌کند.
 *
 *    ✅ راه درست: خروجی نهایی (آرایه‌ی ساده) را کش کن
 *        - مشکل serialize ندارد
 *        - حجم کش کمتر است
 *        - در هر بازدید، هزینه‌ی ساخت مدل و تبدیل Resource حذف می‌شود
 */
class CatalogController extends Controller
{
    /** مدت کش داده‌های کم‌تغییر: ۱ ساعت. */
    private const CACHE_TTL_LONG = 3600;

    /** مدت کش صفحه اصلی: ۵ دقیقه (چون قیمت و موجودی تغییر می‌کند). */
    private const CACHE_TTL_SHORT = 300;

    /**
     * GET /api/v1/categories
     * درخت کامل دسته‌بندی‌ها برای ساخت منوی چندسطحی.
     */
    public function categories(Request $request): JsonResponse
    {
        $locale = app()->getLocale();

        /* کلید کش شامل زبان است چون خروجی محلی‌سازی‌شده متفاوت است */
        $data = Cache::remember(
            "categories.tree.{$locale}",
            self::CACHE_TTL_LONG,
            function () use ($request) {
                $categories = Category::query()
                    ->active()
                    ->roots()
                    /* childrenRecursive کل زیردرخت را با شمارش محصولات می‌آورد */
                    ->with('childrenRecursive')
                    ->withCount('products')
                    ->orderBy('sort_order')
                    ->get();

                /* تبدیل به آرایه‌ی ساده *قبل* از ذخیره در کش */
                return CategoryResource::collection($categories)->toArray($request);
            }
        );

        return response()->json(['data' => $data]);
    }

    /**
     * GET /api/v1/categories/{slug}
     * اطلاعات یک دسته به‌همراه مسیر آن (Breadcrumb).
     *
     * این اندپوینت کش نمی‌شود چون تعداد دسته‌ها زیاد است و هر کدام
     * فقط گاهی درخواست می‌شود — هزینه‌ی مدیریت کش بیش از سودش است.
     */
    public function category(Category $category): JsonResponse
    {
        abort_unless($category->is_active, 404);

        $locale = app()->getLocale();

        return response()->json([
            'data' => [
                'id' => $category->id,
                'name' => $category->translate('name', $locale),
                'description' => $category->translate('description', $locale),
                'slug' => $category->slug,
                'image' => $category->image,

                /* مسیر از ریشه تا این دسته — برای Breadcrumb در فرانت */
                'breadcrumb' => collect($category->breadcrumb())->map(fn ($node) => [
                    'name' => $node->translate('name', $locale),
                    'slug' => $node->slug,
                ])->values(),

                /* زیردسته‌ها — برای فیلتر دسته در همان صفحه */
                'children' => $category->children->map(fn ($child) => [
                    'id' => $child->id,
                    'name' => $child->translate('name', $locale),
                    'slug' => $child->slug,
                ])->values(),
            ],
        ]);
    }

    /**
     * GET /api/v1/brands
     * فهرست برندهای فعال به‌همراه تعداد محصولات هرکدام.
     */
    public function brands(Request $request): JsonResponse
    {
        $locale = app()->getLocale();

        $data = Cache::remember(
            "brands.all.{$locale}",
            self::CACHE_TTL_LONG,
            function () use ($request) {
                $brands = Brand::query()
                    ->active()
                    ->withCount('products')
                    ->orderBy('sort_order')
                    ->get();

                return BrandResource::collection($brands)->toArray($request);
            }
        );

        return response()->json(['data' => $data]);
    }

    /**
     * GET /api/v1/brands/{brand}
     * جزئیات یک برند برای صفحه‌ی اختصاصی آن.
     *
     * ⚠️ چرا کش نمی‌شود؟
     *    برخلاف فهرست برندها که در هر بارگذاری صفحه‌ی اصلی خوانده
     *    می‌شود، صفحه‌ی یک برند خاص ترافیک کمی دارد. کش کردن هر
     *    برند به‌صورت جداگانه یعنی ده‌ها کلید کش که هیچ‌کدام
     *    hit نمی‌خورند، و پیچیدگی باطل کردن کش هنگام ویرایش برند.
     *
     * ⚠️ برند غیرفعال ۴۰۴ می‌گیرد، نه ۴۰۳. وجود یا نبود یک برند
     *    راز تجاری نیست، اما «هست ولی نمی‌بینی» برای بازدیدکننده
     *    معنایی ندارد و فقط سردرگمی می‌سازد.
     */
    public function brand(Brand $brand): JsonResponse
    {
        abort_unless($brand->is_active, 404);

        $brand->loadCount('products');

        return response()->json([
            'data' => (new BrandResource($brand))->toArray(request()),
        ]);
    }

    /**
     * GET /api/v1/home
     * تمام داده‌های صفحه اصلی در یک درخواست.
     *
     * چرا یک اندپوینت به‌جای شش تا؟
     *   اگر فرانت‌اند برای هر بخش صفحه اصلی یک درخواست جدا بزند،
     *   ۶ رفت‌وبرگشت شبکه لازم است و صفحه دیرتر کامل می‌شود.
     *   با یک اندپوینت ترکیبی، همه‌چیز در یک رفت‌وبرگشت می‌آید.
     */
    public function home(Request $request): JsonResponse
    {
        $locale = app()->getLocale();

        $data = Cache::remember(
            "home.{$locale}",
            self::CACHE_TTL_SHORT,
            fn () => [
                /* محصولات منتخب */
                'featured' => ProductResource::collection(
                    $this->productQuery()->featured()->limit(8)->get()
                )->toArray($request),

                /* تازه‌رسیده‌ها */
                'newArrivals' => ProductResource::collection(
                    $this->productQuery()->orderByDesc('published_at')->limit(8)->get()
                )->toArray($request),

                /* پرفروش‌ترین‌ها */
                'bestSellers' => ProductResource::collection(
                    $this->productQuery()->orderByDesc('sales_count')->limit(8)->get()
                )->toArray($request),

                /* فروش ویژه — فقط تخفیف‌دارهای فعال */
                'onSale' => ProductResource::collection(
                    $this->productQuery()->onSale()->limit(8)->get()
                )->toArray($request),

                /*
                 * دسته‌های منتخب.
                 * زیردرخت هم بارگذاری می‌شود تا شمارش محصولات درست باشد —
                 * دسته‌های منتخب همگی والدند و محصول مستقیم ندارند.
                 */
                'categories' => CategoryResource::collection(
                    Category::query()->active()->featured()
                        ->with('childrenRecursive')
                        ->withCount('products')
                        ->orderBy('sort_order')
                        ->limit(8)->get()
                )->toArray($request),

                /* برندهای منتخب برای اسلایدر */
                'brands' => BrandResource::collection(
                    Brand::query()->active()->featured()
                        ->orderBy('sort_order')
                        ->limit(12)->get()
                )->toArray($request),
            ]
        );

        return response()->json(['data' => $data]);
    }

    /**
     * کوئری پایه‌ی محصولات صفحه اصلی.
     * تکرار `active()->with(...)` در شش جا را حذف می‌کند.
     */
    private function productQuery()
    {
        return Product::query()
            ->active()
            ->with(['images', 'brand']);
    }
}
