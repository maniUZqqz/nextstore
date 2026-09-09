<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * مدل یک قلم در سبد خرید.
 *
 * @property int $id
 * @property int $cart_id
 * @property int $product_id
 * @property int $quantity
 * @property int $price_at_add قیمت لحظه‌ی افزودن به سبد
 */
class CartItem extends Model
{
    use HasFactory;

    protected $fillable = ['cart_id', 'product_id', 'quantity', 'price_at_add'];

    /** تبدیل خودکار نوع ستون‌ها. */
    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'price_at_add' => 'integer',
        ];
    }

    /** سبدی که این قلم به آن تعلق دارد. */
    /** @return BelongsTo<Cart, $this> */
    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    /** محصول این قلم. */
    /** @return BelongsTo<Product, $this> */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * جمع مبلغ این قلم بر اساس قیمت فعلی محصول.
     */
    public function getLineTotalAttribute(): int
    {
        return $this->product->final_price * $this->quantity;
    }

    /**
     * آیا قیمت محصول از زمان افزودن به سبد تغییر کرده است؟
     *
     * فرانت‌اند با این مقدار به کاربر هشدار می‌دهد — رفتاری که
     * اعتماد کاربر را جلب می‌کند و از شکایت بعد از خرید جلوگیری می‌کند.
     */
    public function getPriceChangedAttribute(): bool
    {
        return $this->product->final_price !== $this->price_at_add;
    }
}
