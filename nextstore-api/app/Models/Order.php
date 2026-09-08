<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * مدل سفارش.
 * ---------------------------------------------------------------------------
 * سفارش یک سند مالی است: اطلاعات محصول و آدرس در آن کپی شده‌اند،
 * پس تغییرات بعدی کاتالوگ یا پروفایل کاربر آن را تغییر نمی‌دهد.
 *
 * @property int $id
 * @property string $order_number
 * @property OrderStatus $status
 * @property int $total
 */
class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number', 'user_id', 'coupon_id', 'coupon_code', 'status',
        'shipping_address',
        'subtotal', 'discount', 'shipping_cost', 'tax', 'total',
        'shipping_method', 'customer_note', 'admin_note',
        'paid_at', 'shipped_at', 'delivered_at', 'cancelled_at',
        'tracking_code',
    ];

    /** تبدیل خودکار نوع ستون‌ها. */
    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'shipping_address' => 'array',

            'subtotal' => 'integer',
            'discount' => 'integer',
            'shipping_cost' => 'integer',
            'tax' => 'integer',
            'total' => 'integer',

            'paid_at' => 'datetime',
            'shipped_at' => 'datetime',
            'delivered_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    /**
     * تولید خودکار شماره سفارش هنگام ساخت.
     *
     * قالب:  NS-<سال دو رقمی><ماه><روز>-<۴ رقم تصادفی>
     * نمونه: NS-260906-4821
     *
     * چرا تصادفی و نه ترتیبی؟ شماره‌ی ترتیبی به رقیب می‌گوید روزانه
     * چند سفارش داریم — اطلاعات تجاری که نباید لو برود.
     */
    protected static function booted(): void
    {
        static::creating(function (Order $order) {
            if (! $order->order_number) {
                $order->order_number = static::generateOrderNumber();
            }
        });
    }

    /** ساخت شماره سفارش یکتا. */
    public static function generateOrderNumber(): string
    {
        do {
            $number = 'NS-'.now()->format('ymd').'-'.random_int(1000, 9999);
        } while (static::where('order_number', $number)->exists());

        return $number;
    }

    /* =====================================================================
     * رابطه‌ها
     * ===================================================================== */

    /** کاربر سفارش‌دهنده. */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** اقلام سفارش. */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /** تمام تلاش‌های پرداخت این سفارش. */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /** آخرین تلاش پرداخت — برای نمایش وضعیت جاری. */
    public function latestPayment(): HasMany
    {
        return $this->payments()->latest();
    }

    /* =====================================================================
     * Scope ها
     * ===================================================================== */

    /** فیلتر بر اساس وضعیت. */
    public function scopeWithStatus(Builder $query, OrderStatus $status): Builder
    {
        return $query->where('status', $status);
    }

    /** فقط سفارش‌های پرداخت‌شده — برای گزارش فروش. */
    public function scopePaid(Builder $query): Builder
    {
        return $query->whereNotNull('paid_at');
    }

    /* =====================================================================
     * متدهای کمکی
     * ===================================================================== */

    /** تعداد کل اقلام سفارش. */
    public function getTotalQuantityAttribute(): int
    {
        return (int) $this->items->sum('quantity');
    }

    /** آیا مشتری هنوز می‌تواند این سفارش را لغو کند؟ */
    public function isCancellableByCustomer(): bool
    {
        return $this->status->isCancellableByCustomer();
    }

    /** مسیریابی با شماره سفارش به‌جای شناسه عددی. */
    public function getRouteKeyName(): string
    {
        return 'order_number';
    }
}
