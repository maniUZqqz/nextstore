<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * مدل تراکنش پرداخت.
 *
 * هر سفارش می‌تواند چند تراکنش داشته باشد (تلاش ناموفق، سپس موفق).
 * نگه‌داشتن همه‌ی تلاش‌ها برای پیگیری اختلاف‌های مالی ضروری است.
 *
 * @property int $id
 * @property string $gateway
 * @property PaymentStatus $status
 * @property int $amount
 */
class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id', 'gateway', 'status', 'amount',
        'reference_id', 'tracking_number',
        'gateway_response', 'failure_reason', 'paid_at',
    ];

    /** تبدیل خودکار نوع ستون‌ها. */
    protected function casts(): array
    {
        return [
            'status' => PaymentStatus::class,
            'gateway_response' => 'array',
            'amount' => 'integer',
            'paid_at' => 'datetime',
        ];
    }

    /**
     * ستون‌هایی که در خروجی API نمی‌آیند.
     * پاسخ خام درگاه ممکن است اطلاعات حساس داشته باشد و فقط
     * برای بررسی داخلی نگه داشته می‌شود.
     */
    protected $hidden = ['gateway_response'];

    /** سفارش مربوط به این پرداخت. */
    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** آیا این پرداخت موفق بوده؟ */
    public function isSuccessful(): bool
    {
        return $this->status === PaymentStatus::Succeeded;
    }
}
