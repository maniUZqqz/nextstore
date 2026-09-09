<?php

namespace App\Models;

use App\Enums\ProductStatus;
use App\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * مدل محصول — موجودیت مرکزی فروشگاه.
 * ---------------------------------------------------------------------------
 * مسئولیت این کلاس:
 *   - تعریف رابطه‌ها با دسته، برند، تصاویر و نظرات
 *   - Scope های پرکاربرد برای کوئری‌های تمیزتر
 *   - مقادیر مشتق‌شده (قیمت نهایی، درصد تخفیف، وضعیت موجودی)
 *
 * ⚠️ منطق تجاری (افزودن به سبد، کسر موجودی، ثبت سفارش) اینجا نیست —
 *    در کلاس‌های Service قرار دارد. مدل فقط داده و رابطه را می‌شناسد.
 *
 * @property int $id
 * @property array $name نام چندزبانه
 * @property string $slug
 * @property string $sku
 * @property int $price به کمترین واحد پول
 * @property int|null $sale_price
 * @property int $stock
 * @property ProductStatus $status
 * @property float $rating_avg
 */
class Product extends Model
{
    use HasFactory;
    use HasTranslations;
    use SoftDeletes;

    /**
     * فیلدهایی که مقدارشان چندزبانه است و در ستون JSON ذخیره می‌شوند.
     * تِرِیت HasTranslations از این آرایه استفاده می‌کند.
     *
     * @var array<int, string>
     */
    protected array $translatable = [
        'name',
        'short_description',
        'description',
        'meta_title',
        'meta_description',
    ];

    /** ستون‌هایی که اجازه‌ی پر شدن انبوه دارند. */
    protected $fillable = [
        'category_id', 'brand_id',
        'name', 'short_description', 'description',
        'slug', 'sku', 'barcode',
        'price', 'sale_price', 'sale_starts_at', 'sale_ends_at', 'cost_price',
        'stock', 'low_stock_threshold', 'allow_backorder',
        'weight', 'dimensions',
        'status', 'is_featured', 'has_variants',
        'meta_title', 'meta_description', 'published_at',
    ];

    /**
     * ستون‌هایی که هرگز نباید در خروجی API ظاهر شوند.
     * قیمت تمام‌شده اطلاعات محرمانه کسب‌وکار است.
     */
    protected $hidden = ['cost_price'];

    /** تبدیل خودکار نوع ستون‌ها هنگام خواندن و نوشتن. */
    protected function casts(): array
    {
        return [
            /* فیلدهای چندزبانه به آرایه تبدیل می‌شوند */
            'name' => 'array',
            'short_description' => 'array',
            'description' => 'array',
            'meta_title' => 'array',
            'meta_description' => 'array',
            'dimensions' => 'array',

            /* رشته وضعیت به Enum تبدیل می‌شود → تایپ‌سیفتی */
            'status' => ProductStatus::class,

            'is_featured' => 'boolean',
            'has_variants' => 'boolean',
            'allow_backorder' => 'boolean',

            'price' => 'integer',
            'sale_price' => 'integer',
            'stock' => 'integer',
            'rating_avg' => 'float',

            'sale_starts_at' => 'datetime',
            'sale_ends_at' => 'datetime',
            'published_at' => 'datetime',
        ];
    }

    /* =====================================================================
     * رابطه‌ها
     * ===================================================================== */

    /** نظرات ثبت‌شده روی این محصول — شامل تأییدنشده‌ها. */
    /** @return HasMany<Review, $this> */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /** دسته‌بندی این محصول. */
    /** @return BelongsTo<Category, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /** برند سازنده این محصول. */
    /** @return BelongsTo<Brand, $this> */
    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    /** تمام تصاویر گالری، مرتب‌شده بر اساس ترتیب نمایش. */
    /** @return HasMany<ProductImage, $this> */
    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    /**
     * تصویر شاخص — همان که در کارت محصول نمایش داده می‌شود.
     *
     * @return HasMany<ProductImage, $this>
     */
    public function primaryImage(): HasMany
    {
        return $this->hasMany(ProductImage::class)->where('is_primary', true);
    }

    /* =====================================================================
     * Scope ها — قطعات قابل استفاده مجدد برای ساخت کوئری
     * استفاده:  Product::active()->featured()->get()
     * ===================================================================== */

    /**
     * فقط محصولات منتشرشده و قابل خرید.
     * در تمام کوئری‌های سمت فروشگاه باید استفاده شود تا
     * پیش‌نویس‌ها به کاربر نشت نکنند.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', ProductStatus::Active)
            /*
             * ⚠️ تاریخ انتشار هم بررسی می‌شود، نه فقط وضعیت.
             *
             *    پیش‌تر فقط `status` بررسی می‌شد و محصولی با تاریخ انتشارِ
             *    آینده بلافاصله در فروشگاه دیده می‌شد. امروز پنل تاریخ
             *    آینده نمی‌پذیرد (هنگام انتشار `now()` می‌گذارد)، پس
             *    نشتی در عمل رخ نمی‌داد — ولی همین که این ستون وجود
             *    دارد یعنی روزی کسی انتشار زمان‌بندی‌شده را اضافه می‌کند
             *    و آن روز، قیمت کمپین پیش از موعد لو می‌رفت.
             *
             *    `whereNotNull` هم لازم است: محصولی که هرگز منتشر نشده
             *    تاریخ ندارد و نباید فقط به‌خاطر وضعیتش دیده شود.
             */
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    /** فقط محصولات منتخب (برای صفحه اصلی). */
    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }

    /** فقط محصولات موجود در انبار یا قابل پیش‌سفارش. */
    public function scopeInStock(Builder $query): Builder
    {
        return $query->where(function (Builder $q) {
            $q->where('stock', '>', 0)->orWhere('allow_backorder', true);
        });
    }

    /**
     * فقط محصولاتی که هم‌اکنون تخفیف فعال دارند.
     * «فعال» یعنی هم قیمت تخفیف دارد و هم در بازه زمانی تخفیف هستیم.
     */
    public function scopeOnSale(Builder $query): Builder
    {
        $now = now();

        return $query
            ->whereNotNull('sale_price')
            ->where(fn (Builder $q) => $q->whereNull('sale_starts_at')->orWhere('sale_starts_at', '<=', $now))
            ->where(fn (Builder $q) => $q->whereNull('sale_ends_at')->orWhere('sale_ends_at', '>=', $now));
    }

    /* =====================================================================
     * مقادیر مشتق‌شده (Accessors)
     * این‌ها ستون دیتابیس نیستند — از روی ستون‌های دیگر محاسبه می‌شوند.
     * ===================================================================== */

    /**
     * آیا تخفیف این محصول در همین لحظه فعال است؟
     *
     * سه شرط باید برقرار باشد:
     *   ۱. قیمت تخفیف تعریف شده باشد
     *   ۲. قیمت تخفیف کمتر از قیمت اصلی باشد
     *   ۳. اکنون در بازه زمانی تخفیف باشیم
     */
    public function getIsOnSaleAttribute(): bool
    {
        if ($this->sale_price === null || $this->sale_price >= $this->price) {
            return false;
        }

        $now = now();

        if ($this->sale_starts_at && $now->lt($this->sale_starts_at)) {
            return false;
        }

        if ($this->sale_ends_at && $now->gt($this->sale_ends_at)) {
            return false;
        }

        return true;
    }

    /**
     * قیمتی که کاربر واقعاً پرداخت می‌کند.
     * ⚠️ در تمام محاسبات مالی باید از این استفاده شود، نه از price خام.
     */
    public function getFinalPriceAttribute(): int
    {
        return $this->is_on_sale ? $this->sale_price : $this->price;
    }

    /**
     * درصد تخفیف برای نمایش روی برچسب کارت محصول.
     * اگر تخفیفی فعال نباشد صفر برمی‌گرداند.
     */
    public function getDiscountPercentAttribute(): int
    {
        if (! $this->is_on_sale || $this->price === 0) {
            return 0;
        }

        return (int) round((($this->price - $this->sale_price) / $this->price) * 100);
    }

    /** آیا محصول قابل خرید است؟ (موجود یا قابل پیش‌سفارش) */
    public function getIsInStockAttribute(): bool
    {
        return $this->stock > 0 || $this->allow_backorder;
    }

    /**
     * آیا موجودی رو به اتمام است؟
     * برای نمایش هشدار «تنها ۳ عدد باقی مانده» استفاده می‌شود —
     * هم به کاربر کمک می‌کند هم حس فوریت ایجاد می‌کند.
     */
    public function getIsLowStockAttribute(): bool
    {
        return $this->stock > 0 && $this->stock <= $this->low_stock_threshold;
    }

    /**
     * کلید مسیریابی مدل.
     * با این تعریف، مسیر /products/{product} به‌جای شناسه عددی
     * با نامک کار می‌کند: /products/galaxy-s24
     * مزیت: آدرس خواناتر و بهتر برای سئو.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
