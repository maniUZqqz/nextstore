<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * مدل علاقه‌مندی — پیوند بین یک کاربر و یک محصول.
 *
 * @property int $id
 * @property int $user_id
 * @property int $product_id
 */
class Wishlist extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'product_id'];

    /** کاربر مالک این علاقه‌مندی. */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** محصول پسندیده‌شده. */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
