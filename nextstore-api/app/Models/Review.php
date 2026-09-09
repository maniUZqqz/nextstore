<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * مدل نظر محصول.
 *
 * @property int $id
 * @property int $user_id
 * @property int $product_id
 * @property int|null $order_id
 * @property int $rating
 * @property bool $is_approved
 * @property bool $is_verified_purchase
 * @property int $helpful_count
 */
class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'product_id', 'order_id',
        'rating', 'title', 'comment', 'pros', 'cons',
        'is_approved', 'rejection_reason', 'is_verified_purchase',
    ];

    /** تبدیل خودکار نوع ستون‌ها. */
    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'helpful_count' => 'integer',
            'pros' => 'array',
            'cons' => 'array',
            'is_approved' => 'boolean',
            'is_verified_purchase' => 'boolean',
        ];
    }

    /* =====================================================================
     * رابطه‌ها
     * ===================================================================== */

    /** نویسنده نظر. */
    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** محصولی که درباره‌اش نظر داده شده. */
    /** @return BelongsTo<Product, $this> */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /** سفارشی که خرید تأییدشده را اثبات می‌کند. */
    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** آرای «مفید بود». */
    /** @return HasMany<ReviewVote, $this> */
    public function votes(): HasMany
    {
        return $this->hasMany(ReviewVote::class);
    }

    /* =====================================================================
     * Scope ها
     * ===================================================================== */

    /** فقط نظرات منتشرشده — همه‌ی مسیرهای عمومی باید از این بگذرند. */
    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('is_approved', true);
    }

    /** نظرات در انتظار تعدیل — صف پنل مدیریت. */
    public function scopePending(Builder $query): Builder
    {
        return $query->where('is_approved', false)->whereNull('rejection_reason');
    }

    /** نظرات ردشده. */
    public function scopeRejected(Builder $query): Builder
    {
        return $query->where('is_approved', false)->whereNotNull('rejection_reason');
    }

    /* =====================================================================
     * متدهای کمکی
     * ===================================================================== */

    /**
     * وضعیت نظر به‌صورت یک رشته — برای نمایش در پنل کاربر و مدیریت.
     *
     * سه حالت از ترکیب دو ستون ساخته می‌شود تا نیازی به ستون سوم
     * نباشد: تأییدشده، ردشده (دلیل دارد)، در انتظار.
     */
    public function status(): string
    {
        if ($this->is_approved) {
            return 'approved';
        }

        return $this->rejection_reason !== null ? 'rejected' : 'pending';
    }
}
