<?php

namespace App\Models;

use App\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * مدل دسته‌بندی محصولات — ساختار درختی چندسطحی.
 * ---------------------------------------------------------------------------
 * مثال درخت:
 *     الکترونیک
 *       ├── موبایل
 *       │     ├── گوشی هوشمند
 *       │     └── لوازم جانبی موبایل
 *       └── لپ‌تاپ
 *
 * @property int $id
 * @property int|null $parent_id
 * @property array $name
 * @property string $slug
 */
class Category extends Model
{
    use HasFactory;
    use HasTranslations;

    /** فیلدهای چندزبانه این مدل. */
    protected array $translatable = ['name', 'description', 'meta_title', 'meta_description'];

    protected $fillable = [
        'parent_id', 'name', 'description', 'slug', 'icon', 'image',
        'sort_order', 'is_active', 'is_featured',
        'meta_title', 'meta_description',
    ];

    /** تبدیل خودکار نوع ستون‌ها. */
    protected function casts(): array
    {
        return [
            'name' => 'array',
            'description' => 'array',
            'meta_title' => 'array',
            'meta_description' => 'array',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /* =====================================================================
     * رابطه‌ها
     * ===================================================================== */

    /** دسته والد — برای دسته‌های سطح اول null است. */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    /** زیردسته‌های مستقیم (یک سطح پایین‌تر). */
    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id')->orderBy('sort_order');
    }

    /**
     * زیردسته‌ها به‌صورت بازگشتی (کل زیردرخت).
     *
     * ⚠️ نکته‌ی مهم: این رابطه عمداً همان `children` را با بارگذاری
     *    بازگشتی خودش برمی‌گرداند. با `->with('childrenRecursive')`
     *    کل درخت در تعداد کوئری محدود بارگذاری می‌شود.
     *
     *    نام آن باید در Resource هم دقیقاً همین باشد، وگرنه
     *    `whenLoaded('children')` مقدار خالی برمی‌گرداند —
     *    باگی که به‌سادگی از چشم پنهان می‌ماند.
     */
    public function childrenRecursive(): HasMany
    {
        return $this->children()
            ->with('childrenRecursive')
            ->withCount('products');
    }

    /** محصولات مستقیمِ این دسته. */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /* =====================================================================
     * Scope ها
     * ===================================================================== */

    /** فقط دسته‌های فعال. */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /** فقط دسته‌های سطح اول (بدون والد). */
    public function scopeRoots(Builder $query): Builder
    {
        return $query->whereNull('parent_id');
    }

    /** فقط دسته‌های منتخب برای نمایش در صفحه اصلی. */
    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }

    /* =====================================================================
     * متدهای کمکی
     * ===================================================================== */

    /**
     * شناسه‌ی این دسته به‌همراه تمام زیردسته‌ها را برمی‌گرداند.
     *
     * کاربرد: وقتی کاربر روی دسته «الکترونیک» کلیک می‌کند، باید محصولات
     * «موبایل» و «لپ‌تاپ» را هم ببیند، نه فقط محصولاتی که مستقیماً
     * در «الکترونیک» ثبت شده‌اند.
     *
     * @return array<int, int>
     */
    public function descendantIds(): array
    {
        $ids = [$this->id];

        foreach ($this->children as $child) {
            $ids = array_merge($ids, $child->descendantIds());
        }

        return $ids;
    }

    /**
     * مسیر کامل دسته از ریشه تا اینجا — برای نمایش Breadcrumb.
     * خروجی: [الکترونیک, موبایل, گوشی هوشمند]
     *
     * @return array<int, Category>
     */
    public function breadcrumb(): array
    {
        $path = [$this];
        $node = $this;

        while ($node->parent) {
            $node = $node->parent;
            array_unshift($path, $node);
        }

        return $path;
    }

    /** مسیریابی با نامک به‌جای شناسه عددی. */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
