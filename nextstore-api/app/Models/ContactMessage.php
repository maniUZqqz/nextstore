<?php

namespace App\Models;

use App\Http\Controllers\Api\V1\Shop\ContactController;
use Database\Factories\ContactMessageFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * یک پیام از فرم «تماس با ما».
 *
 * @see ContactController
 */
class ContactMessage extends Model
{
    /** @use HasFactory<ContactMessageFactory> */
    use HasFactory;

    protected $fillable = ['user_id', 'name', 'email', 'subject', 'message', 'ip'];

    protected function casts(): array
    {
        return [
            'is_read' => 'boolean',
            'read_at' => 'datetime',
        ];
    }

    /**
     * فرستنده، اگر هنگام ارسال وارد شده بود.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** فقط خوانده‌نشده‌ها. */
    public function scopeUnread(Builder $query): void
    {
        $query->where('is_read', false);
    }

    /**
     * علامت‌گذاری به‌عنوان خوانده‌شده.
     *
     * ⚠️ اگر قبلاً خوانده شده باشد کاری نمی‌کند. بدون این شرط، هر بار
     *    باز کردن پیام `read_at` را جلو می‌برد و «چقدر طول کشید تا
     *    دیده شود» — تنها چیزی که این ستون برایش هست — از بین می‌رفت.
     */
    public function markRead(): void
    {
        if ($this->is_read) {
            return;
        }

        $this->forceFill(['is_read' => true, 'read_at' => now()])->save();
    }
}
