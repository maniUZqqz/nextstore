<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * مدل آدرس کاربر.
 *
 * @property int $id
 * @property int $user_id
 * @property string $recipient_name
 * @property bool $is_default
 */
class Address extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'label',
        'recipient_name', 'recipient_phone',
        'province', 'city', 'street', 'postal_code',
        'building_no', 'unit',
        'latitude', 'longitude', 'is_default',
    ];

    /** تبدیل خودکار نوع ستون‌ها. */
    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'latitude' => 'float',
            'longitude' => 'float',
        ];
    }

    /** کاربر مالک این آدرس. */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * آدرس کامل به‌صورت یک رشته — برای نمایش در فاکتور و کارت آدرس.
     */
    public function getFullAddressAttribute(): string
    {
        return collect([
            $this->province,
            $this->city,
            $this->street,
            $this->building_no ? "پلاک {$this->building_no}" : null,
            $this->unit ? "واحد {$this->unit}" : null,
        ])->filter()->implode('، ');
    }

    /**
     * تنظیم این آدرس به‌عنوان پیش‌فرض.
     *
     * ⚠️ نکته مهم: باید پیش‌فرض بودن بقیه آدرس‌های همین کاربر برداشته شود،
     * وگرنه دو آدرس هم‌زمان پیش‌فرض می‌شوند و هنگام تسویه معلوم نیست
     * کدام انتخاب شود.
     */
    public function makeDefault(): void
    {
        static::where('user_id', $this->user_id)
            ->where('id', '!=', $this->id)
            ->update(['is_default' => false]);

        $this->update(['is_default' => true]);
    }
}
