<?php

namespace App\Services\Product;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

/**
 * سرویس ساخت کوئری فیلتر و مرتب‌سازی محصولات.
 * ---------------------------------------------------------------------------
 * تمام منطق «چطور محصولات را پیدا کنیم» اینجاست، نه در کنترلر.
 *
 * مزیت این جداسازی:
 *   - کنترلر نازک و خوانا می‌ماند
 *   - همین منطق از Command، Job یا تست هم قابل استفاده است
 *   - تست کردن فیلترها بدون نیاز به درخواست HTTP ممکن است
 *
 * ⚠️ اصل امنیتی رعایت‌شده:
 *    نام ستون مرتب‌سازی هرگز مستقیم از ورودی کاربر به کوئری نمی‌رود.
 *    از یک نگاشت سفید (whitelist) استفاده می‌شود تا تزریق SQL ممکن نباشد.
 */
class ProductQueryService
{
    /**
     * نگاشت مقادیر مجاز مرتب‌سازی به ستون و جهت واقعی.
     * هر چیزی خارج از این فهرست نادیده گرفته می‌شود.
     *
     * @var array<string, array{0: string, 1: string}>
     */
    private const SORT_MAP = [
        'newest' => ['published_at', 'desc'],
        'oldest' => ['published_at', 'asc'],
        'price_asc' => ['price', 'asc'],
        'price_desc' => ['price', 'desc'],
        'popular' => ['sales_count', 'desc'],
        'rating' => ['rating_avg', 'desc'],
        'views' => ['views_count', 'desc'],
    ];

    /** حداکثر تعداد آیتم در هر صفحه — جلوگیری از درخواست سنگین عمدی. */
    private const MAX_PER_PAGE = 48;

    /**
     * زبان‌هایی که جستجوی متنی در آن‌ها انجام می‌شود.
     * چون این مقادیر ثابت و از کد می‌آیند (نه از ورودی کاربر)،
     * درج مستقیمشان در عبارت SQL امن است.
     *
     * @var array<int, string>
     */
    private const SEARCHABLE_LOCALES = ['fa', 'en'];

    /**
     * ساخت و اجرای کوئری محصولات با فیلترهای درخواستی.
     *
     * @param  array<string, mixed>  $filters  فیلترهای خام از Query String
     * @return LengthAwarePaginator<int, Product>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = Product::query()
            /* فقط محصولات منتشرشده به کاربر نشان داده می‌شود */
            ->active()
            /*
             * بارگذاری پیشین رابطه‌ها (Eager Loading).
             * بدون این خط، برای هر محصول یک کوئری جدا زده می‌شود:
             * ۲۴ محصول = ۷۳ کوئری. با این خط = ۴ کوئری. (مشکل N+1)
             */
            ->with(['images', 'category', 'brand']);

        $this->applyCategoryFilter($query, $filters);
        $this->applyBrandFilter($query, $filters);
        $this->applyPriceFilter($query, $filters);
        $this->applyAvailabilityFilter($query, $filters);
        $this->applySaleFilter($query, $filters);
        $this->applyRatingFilter($query, $filters);
        $this->applySearchFilter($query, $filters);
        $this->applySorting($query, $filters);

        /* محدود کردن اندازه صفحه بین ۱ تا ۴۸ */
        $perPage = min(
            max((int) ($filters['per_page'] ?? 12), 1),
            self::MAX_PER_PAGE
        );

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * فیلتر بر اساس دسته‌بندی.
     *
     * نکته مهم: محصولات زیردسته‌ها هم شامل می‌شوند.
     * اگر کاربر «الکترونیک» را انتخاب کند، محصولات «موبایل» و
     * «لپ‌تاپ» هم باید نمایش داده شوند.
     *
     * @param  array<string, mixed>  $filters
     * @param  Builder<Product>  $query
     */
    private function applyCategoryFilter(Builder $query, array $filters): void
    {
        if (empty($filters['category'])) {
            return;
        }

        $category = Category::where('slug', $filters['category'])
            ->with('children')
            ->first();

        if (! $category) {
            return;
        }

        $query->whereIn('category_id', $category->descendantIds());
    }

    /**
     * فیلتر بر اساس یک یا چند برند.
     * ورودی می‌تواند تک‌مقداری یا آرایه باشد: ?brand=apple&brand=samsung
     *
     * @param  array<string, mixed>  $filters
     * @param  Builder<Product>  $query
     */
    private function applyBrandFilter(Builder $query, array $filters): void
    {
        if (empty($filters['brand'])) {
            return;
        }

        $slugs = (array) $filters['brand'];

        $query->whereHas('brand', fn (Builder $q) => $q->whereIn('slug', $slugs));
    }

    /**
     * فیلتر بازه قیمت.
     *
     * ⚠️ مقایسه روی قیمت نهایی انجام می‌شود نه قیمت خام، وگرنه محصول
     * تخفیف‌خورده‌ای که در بازه‌ی کاربر است از نتایج حذف می‌شود.
     *
     * @param  array<string, mixed>  $filters
     * @param  Builder<Product>  $query
     */
    private function applyPriceFilter(Builder $query, array $filters): void
    {
        /* COALESCE قیمت تخفیف را در اولویت می‌گذارد و اگر null بود قیمت اصلی را می‌گیرد */
        $finalPrice = 'COALESCE(sale_price, price)';

        if (isset($filters['min_price']) && is_numeric($filters['min_price'])) {
            $query->whereRaw("$finalPrice >= ?", [(int) $filters['min_price']]);
        }

        if (isset($filters['max_price']) && is_numeric($filters['max_price'])) {
            $query->whereRaw("$finalPrice <= ?", [(int) $filters['max_price']]);
        }
    }

    /**
     * فیلتر «فقط کالاهای موجود».
     *
     * @param  array<string, mixed>  $filters
     * @param  Builder<Product>  $query
     */
    private function applyAvailabilityFilter(Builder $query, array $filters): void
    {
        if (filter_var($filters['in_stock'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            $query->inStock();
        }
    }

    /**
     * فیلتر «فقط کالاهای تخفیف‌دار».
     *
     * @param  array<string, mixed>  $filters
     * @param  Builder<Product>  $query
     */
    private function applySaleFilter(Builder $query, array $filters): void
    {
        if (filter_var($filters['on_sale'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            $query->onSale();
        }
    }

    /**
     * فیلتر حداقل امتیاز (مثلاً «۴ ستاره و بالاتر»).
     *
     * @param  array<string, mixed>  $filters
     * @param  Builder<Product>  $query
     */
    private function applyRatingFilter(Builder $query, array $filters): void
    {
        if (isset($filters['min_rating']) && is_numeric($filters['min_rating'])) {
            $query->where('rating_avg', '>=', (float) $filters['min_rating']);
        }
    }

    /**
     * جستجوی متنی در نام و توضیح کوتاه محصول.
     *
     * ⚠️ نکته‌ای که اشتباه رایج است و اینجا رفع شده:
     *    تابع json_encode در PHP کاراکترهای غیرانگلیسی را به‌صورت
     *    escape شده ذخیره می‌کند:
     *        {"fa":"گلکسی"}   ← نه «گلکسی»
     *
     *    بنابراین  WHERE name LIKE '%گلکسی%'  هرگز تطابق پیدا نمی‌کند
     *    و جستجوی فارسی همیشه صفر نتیجه می‌دهد.
     *
     *    راه‌حل: به‌جای جستجو روی ستون خام، ابتدا مقدار هر زبان را با
     *    json_extract استخراج و سپس روی مقدار رمزگشایی‌شده جستجو می‌کنیم.
     *
     * جستجو در هر دو زبان انجام می‌شود تا کاربر بتواند در سایت فارسی هم
     * نام انگلیسی محصول را تایپ کند و نتیجه بگیرد.
     *
     * 📌 در محیط تولید با حجم بالا، این روش کند است و باید با
     *    Meilisearch یا Laravel Scout جایگزین شود.
     *
     * @param  array<string, mixed>  $filters
     * @param  Builder<Product>  $query
     */
    private function applySearchFilter(Builder $query, array $filters): void
    {
        $term = trim((string) ($filters['q'] ?? ''));

        if ($term === '') {
            return;
        }

        $like = '%'.$term.'%';

        $query->where(function (Builder $q) use ($like) {
            /*
             * زبان‌ها از پیکربندی خوانده می‌شوند نه از ورودی کاربر،
             * پس درج مستقیم آن‌ها در SQL امن است (بدون خطر تزریق).
             */
            foreach (self::SEARCHABLE_LOCALES as $locale) {
                $q->orWhereRaw("json_extract(name, '$.{$locale}') LIKE ?", [$like])
                    ->orWhereRaw("json_extract(short_description, '$.{$locale}') LIKE ?", [$like]);
            }

            /* کد کالا رشته‌ی ساده است و نیازی به استخراج JSON ندارد */
            $q->orWhere('sku', 'like', $like);
        });
    }

    /**
     * اعمال مرتب‌سازی امن بر اساس نگاشت سفید.
     *
     * @param  array<string, mixed>  $filters
     * @param  Builder<Product>  $query
     */
    private function applySorting(Builder $query, array $filters): void
    {
        $key = (string) ($filters['sort'] ?? 'newest');

        /* اگر مقدار درخواستی مجاز نبود، به پیش‌فرض برمی‌گردیم */
        [$column, $direction] = self::SORT_MAP[$key] ?? self::SORT_MAP['newest'];

        $query->orderBy($column, $direction)
            /* مرتب‌سازی ثانویه تا ترتیب صفحه‌بندی پایدار و تکرارپذیر بماند */
            ->orderBy('id', 'desc');
    }
}
