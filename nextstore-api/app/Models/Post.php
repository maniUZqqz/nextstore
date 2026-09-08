<?php

namespace App\Models;

use App\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * مقاله‌ی مجله.
 *
 * @property int $id
 * @property int|null $post_category_id
 * @property int|null $user_id
 * @property string|null $author_name
 * @property array $title
 * @property array|null $excerpt
 * @property array $body
 * @property string $slug
 * @property string|null $cover_image
 * @property int $reading_minutes
 * @property int $views_count
 * @property bool $is_featured
 * @property Carbon|null $published_at
 */
class Post extends Model
{
    use HasTranslations;

    protected $fillable = [
        'post_category_id', 'user_id', 'author_name',
        'title', 'excerpt', 'body',
        'slug', 'cover_image',
        'reading_minutes', 'views_count', 'is_featured', 'published_at',
    ];

    /** فیلدهایی که مقدارشان JSON چندزبانه است. */
    protected array $translatable = ['title', 'excerpt', 'body'];

    protected function casts(): array
    {
        return [
            'title' => 'array',
            'excerpt' => 'array',
            'body' => 'array',
            'reading_minutes' => 'integer',
            'views_count' => 'integer',
            'is_featured' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    /* =====================================================================
     * رابطه‌ها
     * ================================================================== */

    public function category(): BelongsTo
    {
        return $this->belongsTo(PostCategory::class, 'post_category_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /* =====================================================================
     * اسکوپ‌ها
     * ================================================================== */

    /**
     * فقط مقالات منتشرشده.
     *
     * ⚠️ شرط دوم (`<= now()`) عمدی است و بولین ساده آن را نمی‌داد:
     *    مقاله‌ای با تاریخ انتشار در آینده، زمان‌بندی‌شده است و
     *    نباید هنوز دیده شود. بدون این شرط، ادمین تاریخ آینده
     *    می‌گذاشت و مقاله بلافاصله منتشر می‌شد.
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    /** مقالات شاخص — برای بخش بالای صفحه‌ی مجله. */
    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }

    /* =====================================================================
     * ویژگی‌های محاسباتی
     * ================================================================== */

    /**
     * آدرس کامل تصویر شاخص.
     *
     * ⚠️ همان اکسسوری که Brand::logo لازم داشت. ستون مسیر نسبی
     *    نگه می‌دارد؛ بدون تبدیل به آدرس مطلق، فرانت‌اند آن را
     *    نسبت به دامنه‌ی خودش حل می‌کند و تصویر ۴۰۴ می‌گیرد.
     */
    public function getCoverImageAttribute(): ?string
    {
        $path = $this->attributes['cover_image'] ?? null;

        if (! $path) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return rtrim(config('app.url'), '/').'/'.ltrim($path, '/');
    }

    /**
     * تخمین زمان مطالعه از روی متن.
     *
     * مبنا: ۲۰۰ کلمه در دقیقه — عدد رایج برای خواندن متن عمومی.
     * حداقل یک دقیقه، چون «۰ دقیقه» بی‌معناست.
     *
     * این متد هنگام ذخیره صدا زده می‌شود تا نتیجه در ستون بنشیند؛
     * دلیل ذخیره‌کردن به‌جای محاسبه‌ی لحظه‌ای در مایگریشن آمده است.
     */
    public static function estimateReadingMinutes(string $body): int
    {
        $words = str_word_count(strip_tags($body));

        /*
         * str_word_count روی متن فارسی کار نمی‌کند (حروف غیر ASCII
         * را کلمه نمی‌شمارد). پس اگر صفر برگشت، با شمردن فاصله‌ها
         * تخمین می‌زنیم.
         */
        if ($words === 0) {
            $words = count(preg_split('/\s+/u', trim(strip_tags($body))) ?: []);
        }

        return max(1, (int) ceil($words / 200));
    }

    /** مسیریابی با نامک. */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
