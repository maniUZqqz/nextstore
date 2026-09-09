<?php

namespace App\Models;

use App\Enums\NotificationType;
use App\Services\Notification\NotificationService;
use Database\Factories\NotificationFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * یک اعلان درون‌برنامه‌ای.
 *
 * @property-read string $title  عنوان به زبان جاری — محاسبه‌شده
 * @property-read string $body   متن به زبان جاری — محاسبه‌شده
 *
 * @see NotificationService
 */
class Notification extends Model
{
    /** @use HasFactory<NotificationFactory> */
    use HasFactory;

    protected $fillable = ['user_id', 'type', 'data', 'link'];

    protected function casts(): array
    {
        return [
            'type' => NotificationType::class,
            'data' => 'array',
            'read_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** فقط خوانده‌نشده‌ها. */
    public function scopeUnread(Builder $query): void
    {
        $query->whereNull('read_at');
    }

    /**
     * علامت‌گذاری به‌عنوان خوانده‌شده.
     *
     * ⚠️ اگر قبلاً خوانده شده باشد کاری نمی‌کند: زمان خواندن باید
     *    **اولین** بار باشد، نه آخرین.
     */
    public function markRead(): void
    {
        if ($this->read_at !== null) {
            return;
        }

        $this->forceFill(['read_at' => now()])->save();
    }

    /** عنوان کوتاه به زبان خواسته‌شده. */
    public function title(?string $locale = null): string
    {
        return $this->type->label($locale ?? app()->getLocale());
    }

    /** متن کامل به زبان خواسته‌شده. */
    public function body(?string $locale = null): string
    {
        return $this->type->body($this->data ?? [], $locale ?? app()->getLocale());
    }
}
