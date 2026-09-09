<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * یک پیام در گفتگوی تیکت.
 *
 * @property int $id
 * @property int $ticket_id
 * @property bool $is_staff
 * @property string $body
 */
class TicketMessage extends Model
{
    use HasFactory;

    protected $fillable = ['ticket_id', 'user_id', 'is_staff', 'body'];

    /** تبدیل خودکار نوع ستون‌ها. */
    protected function casts(): array
    {
        return ['is_staff' => 'boolean'];
    }

    /** تیکتی که این پیام به آن تعلق دارد. */
    /** @return BelongsTo<Ticket, $this> */
    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    /**
     * فرستنده.
     *
     * ممکن است null باشد اگر حساب کاربری بعداً حذف شده باشد —
     * پیام می‌ماند تا تاریخچه‌ی گفتگو نصفه نشود.
     */
    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
