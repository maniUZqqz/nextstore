<?php

namespace App\Models;

use App\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * مدل یک قلم از سفارش.
 *
 * ⚠️ نام و قیمت اینجا کپی شده‌اند، نه ارجاع به محصول.
 *    اگر ادمین فردا نام یا قیمت محصول را عوض کند، فاکتور قدیمی
 *    نباید تغییر کند — این یک سند مالی است.
 *
 * @property int $id
 * @property array $product_name نام چندزبانه در لحظه‌ی خرید
 * @property int $unit_price
 * @property int $quantity
 * @property int $line_total
 */
class OrderItem extends Model
{
    use HasFactory;
    use HasTranslations;

    /** نام محصول در لحظه‌ی خرید، چندزبانه ذخیره شده است. */
    protected array $translatable = ['product_name'];

    protected $fillable = [
        'order_id', 'product_id',
        'product_name', 'product_sku', 'product_image',
        'unit_price', 'quantity', 'line_total',
    ];

    /** تبدیل خودکار نوع ستون‌ها. */
    protected function casts(): array
    {
        return [
            'product_name' => 'array',
            'unit_price' => 'integer',
            'quantity' => 'integer',
            'line_total' => 'integer',
        ];
    }

    /** سفارشی که این قلم به آن تعلق دارد. */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * محصول اصلی.
     * ممکن است null باشد اگر محصول از کاتالوگ حذف شده باشد —
     * در این حالت قلم سفارش همچنان نام و قیمت خودش را دارد.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
