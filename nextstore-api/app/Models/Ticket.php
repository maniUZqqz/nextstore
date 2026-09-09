<?php

namespace App\Models;

use App\Enums\TicketDepartment;
use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * مدل تیکت پشتیبانی.
 *
 * @property int $id
 * @property int $user_id
 * @property string $ticket_number
 * @property string $subject
 */
class Ticket extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'order_id', 'ticket_number',
        'subject', 'department', 'priority', 'status',
        'last_reply_at', 'closed_at',
    ];

    /** تبدیل خودکار نوع ستون‌ها. */
    protected function casts(): array
    {
        return [
            'department' => TicketDepartment::class,
            'priority' => TicketPriority::class,
            'status' => TicketStatus::class,
            'last_reply_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    /* =====================================================================
     * رابطه‌ها
     * ===================================================================== */

    /** صاحب تیکت. */
    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** سفارش مرتبط، در صورت وجود. */
    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** پیام‌های گفتگو به ترتیب زمان. */
    /** @return HasMany<TicketMessage, $this> */
    public function messages(): HasMany
    {
        return $this->hasMany(TicketMessage::class)->oldest();
    }

    /**
     * آخرین پیام — برای پیش‌نمایش در فهرست.
     *
     * @return HasMany<TicketMessage, $this>
     */
    public function latestMessage(): HasMany
    {
        return $this->hasMany(TicketMessage::class)->latest();
    }

    /* =====================================================================
     * Scope ها
     * ===================================================================== */

    /** تیکت‌هایی که منتظر پاسخ پشتیبانی‌اند — صف کاری تیم. */
    public function scopeNeedsAttention(Builder $query): Builder
    {
        return $query->whereIn('status', [
            TicketStatus::Open,
            TicketStatus::CustomerReply,
        ]);
    }

    /** تیکت‌های باز (هر وضعیتی جز بسته). */
    public function scopeOpen(Builder $query): Builder
    {
        return $query->where('status', '!=', TicketStatus::Closed);
    }

    /* =====================================================================
     * متدهای کمکی
     * ===================================================================== */

    /**
     * ساخت شماره‌ی یکتای تیکت.
     *
     * قالب: TK-<۶ رقم تصادفی>
     *
     * ⚠️ چرا تصادفی و نه شمارنده‌ی ترتیبی؟
     *    شماره‌ی ترتیبی تعداد کل تیکت‌ها را لو می‌دهد — هر کسی با
     *    ثبت دو تیکت می‌فهمد فروشگاه در آن بازه چند تیکت گرفته.
     *    برای یک فروشگاه، آن عدد اطلاعات تجاری است.
     */
    public static function generateNumber(): string
    {
        do {
            $number = 'TK-'.str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        } while (static::where('ticket_number', $number)->exists());

        return $number;
    }

    /** مسیریابی عمومی با شماره‌ی تیکت، نه شناسه. */
    public function getRouteKeyName(): string
    {
        return 'ticket_number';
    }

    /** آیا این تیکت پیام تازه می‌پذیرد؟ */
    public function acceptsReply(): bool
    {
        return $this->status->acceptsReply();
    }

    /** خلاصه‌ی کوتاه موضوع — برای عنوان صفحه و اعلان. */
    public function shortSubject(int $length = 60): string
    {
        return Str::limit($this->subject, $length);
    }
}
