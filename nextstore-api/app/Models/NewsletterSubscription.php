<?php

namespace App\Models;

use App\Http\Controllers\Api\V1\Shop\NewsletterController;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * یک عضویت در خبرنامه.
 *
 * @see NewsletterController
 */
class NewsletterSubscription extends Model
{
    protected $fillable = ['user_id', 'email', 'token', 'unsubscribed_at', 'ip'];

    protected function casts(): array
    {
        return [
            'unsubscribed_at' => 'datetime',
        ];
    }

    /**
     * عضو، اگر هنگام ثبت وارد شده بود.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** آیا این عضویت هنوز فعال است؟ */
    public function isActive(): bool
    {
        return $this->unsubscribed_at === null;
    }

    /**
     * فقط عضویت‌های فعال.
     *
     * @param  Builder<NewsletterSubscription>  $query
     * @return Builder<NewsletterSubscription>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('unsubscribed_at');
    }

    /**
     * توکن تصادفی لغو عضویت.
     *
     * ⚠️ ۶۴ نویسه‌ی هگز، نه شناسه‌ی ردیف. لینک لغو در پای ایمیل بدون
     *    ورود کار می‌کند، پس تنها چیزی که جلوی لغو عضویتِ دیگران را
     *    می‌گیرد همین غیرقابل‌حدس بودن است.
     */
    public static function freshToken(): string
    {
        return Str::random(64);
    }
}
