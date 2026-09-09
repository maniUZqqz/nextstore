<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * مدل سبد خرید.
 * ---------------------------------------------------------------------------
 * مسئولیت این کلاس: نگهداری رابطه‌ها و محاسبات مشتق‌شده.
 *
 * ⚠️ منطق تجاری (افزودن، بررسی موجودی، ادغام) در CartService است،
 *    نه اینجا. مدل فقط داده را می‌شناسد.
 *
 * @property int $id
 * @property int|null $user_id
 * @property string|null $session_id
 */
class Cart extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'session_id', 'coupon_id', 'expires_at'];

    /** تبدیل خودکار نوع ستون‌ها. */
    protected function casts(): array
    {
        return ['expires_at' => 'datetime'];
    }

    /** کاربر مالک سبد (برای مهمان null). */
    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** اقلام داخل سبد. */
    /** @return HasMany<CartItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    /**
     * تعداد کل اقلام — مجموع quantity ها، نه تعداد ردیف‌ها.
     * مثال: ۲ عدد تیشرت + ۳ عدد شلوار = ۵
     */
    public function getTotalQuantityAttribute(): int
    {
        return (int) $this->items->sum('quantity');
    }

    /**
     * جمع مبلغ سبد بر اساس **قیمت فعلی** محصولات، نه قیمت لحظه‌ی افزودن.
     *
     * چرا قیمت فعلی؟ کاربر باید همان مبلغی را بپردازد که الان معتبر است.
     * قیمت لحظه‌ی افزودن فقط برای *اطلاع‌رسانی تغییر قیمت* نگه داشته می‌شود.
     */
    public function getSubtotalAttribute(): int
    {
        return (int) $this->items->sum(
            fn (CartItem $item) => $item->product->final_price * $item->quantity
        );
    }

    /** آیا سبد خالی است؟ */
    public function isEmpty(): bool
    {
        return $this->items->isEmpty();
    }

    /**
     * کد تخفیف اعمال‌شده روی این سبد.
     *
     * ⚠️ وجود این رابطه به معنای «تخفیف قطعی» نیست: کوپن می‌تواند بین
     *    اعمال و ثبت سفارش منقضی شود. اعتبارش هر بار در CouponService
     *    بررسی می‌شود.
     */
    /** @return BelongsTo<Coupon, $this> */
    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }
}
