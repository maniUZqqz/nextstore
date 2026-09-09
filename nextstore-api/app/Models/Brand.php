<?php

namespace App\Models;

use App\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * مدل برند (سازنده محصول).
 *
 * @property int $id
 * @property array $name
 * @property string $slug
 */
class Brand extends Model
{
    use HasFactory;
    use HasTranslations;

    /** فیلدهای چندزبانه. */
    protected array $translatable = ['name', 'description'];

    protected $fillable = [
        'name', 'description', 'slug', 'logo', 'website',
        'country_code', 'is_active', 'is_featured', 'sort_order',
    ];

    /** تبدیل خودکار نوع ستون‌ها. */
    protected function casts(): array
    {
        return [
            'name' => 'array',
            'description' => 'array',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /** محصولات این برند. */
    /** @return HasMany<Product, $this> */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /** فقط برندهای فعال. */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /** فقط برندهای منتخب (اسلایدر صفحه اصلی). */
    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }

    /**
     * آدرس کامل لوگو.
     *
     * ⚠️ چرا accessor لازم است؟
     *    ستون `logo` مسیر نسبی نگه می‌دارد (`/brands/apple.svg`).
     *    اگر همان مقدار خام به API برود، فرانت‌اند آن را نسبت به
     *    **دامنه‌ی خودش** حل می‌کند (localhost:3000/brands/apple.svg)
     *    نه نسبت به بک‌اند — و تصویر ۴۰۴ می‌گیرد. این نوع خطا در
     *    تست API دیده نمی‌شود چون پاسخ JSON کاملاً درست است؛
     *    فقط با نگاه کردن به صفحه پیدا می‌شود.
     *
     *    همان منطق ProductImage::getUrlAttribute اینجا هم لازم است.
     *
     * ⚠️ خواندن مستقیم از $this->attributes ضروری است؛ استفاده از
     *    $this->logo داخل accessor حلقه‌ی بی‌نهایت می‌سازد.
     */
    public function getLogoAttribute(): ?string
    {
        $path = $this->attributes['logo'] ?? null;

        if (! $path) {
            return null;
        }

        /* آدرس کامل خارجی همان‌طور که هست برمی‌گردد */
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return rtrim(config('app.url'), '/').'/'.ltrim($path, '/');
    }

    /** مسیریابی با نامک. */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
