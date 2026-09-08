<?php

namespace App\Models;

use App\Enums\CouponType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * کد تخفیف.
 * ---------------------------------------------------------------------------
 * ⚠️ این مدل فقط *وضعیت* کوپن را می‌داند (فعال است؟ منقضی شده؟ سقفش پر
 *    شده؟). تصمیم «آیا این کاربر با این سبد می‌تواند از آن استفاده کند؟»
 *    در CouponService است، چون به کاربر و سبد نیاز دارد و اینجا نوشتنش
 *    مدل را به لایه‌های بالاتر گره می‌زد.
 */
class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'code', 'description', 'type', 'value', 'max_discount',
        'min_order_total', 'usage_limit', 'per_user_limit',
        'starts_at', 'expires_at', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'type' => CouponType::class,
            'value' => 'integer',
            'max_discount' => 'integer',
            'min_order_total' => 'integer',
            'usage_limit' => 'integer',
            'per_user_limit' => 'integer',
            'used_count' => 'integer',
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    /* =====================================================================
     * نرمال‌سازی کد
     * ===================================================================== */

    /**
     * کد همیشه بزرگ‌حرف و بدون فاصله ذخیره می‌شود.
     *
     * ⚠️ بدون این، مدیر «Summer25» می‌ساخت و کاربری که «SUMMER25» تایپ
     *    می‌کرد پیام «کد نامعتبر» می‌گرفت — خطایی که هیچ‌کدامشان
     *    نمی‌توانستند علتش را بفهمند.
     */
    public function setCodeAttribute(string $value): void
    {
        $this->attributes['code'] = mb_strtoupper(trim($value));
    }

    /* =====================================================================
     * روابط
     * ===================================================================== */

    /** رکوردهای مصرف این کوپن. */
    public function usages(): HasMany
    {
        return $this->hasMany(CouponUsage::class);
    }

    /* =====================================================================
     * Scope ها
     * ===================================================================== */

    /**
     * کوپن‌هایی که همین حالا قابل استفاده‌اند.
     *
     * ⚠️ سقف مصرف اینجا بررسی *نمی‌شود*: مقایسه‌ی دو ستون با هم
     *    (`used_count < usage_limit`) در کوئری ممکن است ولی خوانایی را
     *    می‌کشد و کوپن بی‌سقف را هم باید جدا در نظر بگیرد. آن بررسی در
     *    `hasCapacity()` است که روی نمونه اجرا می‌شود.
     */
    public function scopeUsable(Builder $query): Builder
    {
        $now = now();

        return $query->where('is_active', true)
            ->where(fn (Builder $q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now))
            ->where(fn (Builder $q) => $q->whereNull('expires_at')->orWhere('expires_at', '>=', $now));
    }

    /* =====================================================================
     * متدهای وضعیت
     * ===================================================================== */

    /** آیا بازه‌ی اعتبار هنوز شروع نشده؟ */
    public function hasNotStarted(): bool
    {
        return $this->starts_at !== null && $this->starts_at->isFuture();
    }

    /** آیا منقضی شده؟ */
    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    /** آیا هنوز ظرفیت مصرف دارد؟ تهی بودن سقف یعنی نامحدود. */
    public function hasCapacity(): bool
    {
        return $this->usage_limit === null || $this->used_count < $this->usage_limit;
    }

    /**
     * مبلغ تخفیف روی یک جمع سبد.
     *
     * محاسبه به enum سپرده شده تا دوگانگی معنای `value` فقط یک جا باشد.
     */
    public function discountFor(int $subtotal): int
    {
        return $this->type->discountFor($subtotal, $this->value, $this->max_discount);
    }

    /** آیا این جمع سبد به حداقل لازم رسیده است؟ */
    public function meetsMinimum(int $subtotal): bool
    {
        return $subtotal >= $this->min_order_total;
    }

    /** تاریخ انقضا برای نمایش — تهی یعنی بدون انقضا. */
    public function expiresAt(): ?Carbon
    {
        return $this->expires_at;
    }
}
