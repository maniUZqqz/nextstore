<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * یک بار مصرف کد تخفیف.
 * ---------------------------------------------------------------------------
 * ⚠️ این رکورد فقط هنگام **ثبت سفارش** ساخته می‌شود، نه هنگام اعمال کوپن
 *    روی سبد. اگر با اعمال ساخته می‌شد، هر کاربری با یک بار زدن کد و رها
 *    کردن سبد، یک ظرفیت از کوپن را می‌سوزاند.
 *
 * ⚠️ `discount_amount` عکس لحظه‌ای است: اگر مدیر فردا درصد کوپن را عوض
 *    کند، گزارش «چقدر تخفیف دادیم» نباید بازنویسی شود.
 */
class CouponUsage extends Model
{
    protected $fillable = ['coupon_id', 'user_id', 'order_id', 'discount_amount'];

    protected function casts(): array
    {
        return ['discount_amount' => 'integer'];
    }

    /** @return BelongsTo<Coupon, $this> */
    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
