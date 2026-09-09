<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * رأی «این نظر مفید بود».
 *
 * جدول واسط ساده‌ای که تضمین می‌کند هر کاربر برای هر نظر فقط
 * یک بار رأی بدهد. شمارنده‌ی helpful_count روی خود نظر، کشِ
 * تعداد ردیف‌های همین جدول است.
 *
 * @property int $review_id
 * @property int $user_id
 */
class ReviewVote extends Model
{
    protected $fillable = ['review_id', 'user_id'];

    /** نظری که به آن رأی داده شده. */
    /** @return BelongsTo<Review, $this> */
    public function review(): BelongsTo
    {
        return $this->belongsTo(Review::class);
    }

    /** رأی‌دهنده. */
    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
