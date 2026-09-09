<?php

namespace App\Models;

use App\Enums\BannerPlacement;
use App\Enums\BannerTheme;
use App\Http\Controllers\Api\V1\Shop\BannerController;
use App\Traits\HasTranslations;
use Database\Factories\BannerFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * یک بنر تبلیغاتی صفحه‌ی اصلی.
 *
 * @see BannerController
 */
class Banner extends Model
{
    /** @use HasFactory<BannerFactory> */
    use HasFactory;

    use HasTranslations;

    /** @var array<int, string> */
    protected array $translatable = ['badge', 'title', 'subtitle', 'cta_label'];

    protected $fillable = [
        'placement', 'badge', 'title', 'subtitle', 'cta_label', 'href',
        'theme', 'icon', 'sort_order', 'is_active', 'starts_at', 'ends_at',
    ];

    protected function casts(): array
    {
        return [
            'placement' => BannerPlacement::class,
            'theme' => BannerTheme::class,
            'badge' => 'array',
            'title' => 'array',
            'subtitle' => 'array',
            'cta_label' => 'array',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    /**
     * بنرهایی که همین حالا باید دیده شوند.
     *
     * ⚠️ سه شرط، نه یکی.
     *
     *    «فعال» تصمیم مدیر است؛ بازه‌ی زمانی تصمیم تقویم. بنر کمپین
     *    نوروز باید فعال بماند ولی فقط در بازه‌اش دیده شود، وگرنه
     *    کسی باید نیمه‌شب بیدار شود و خاموشش کند.
     *
     * ⚠️ تاریخ خالی یعنی «بی‌قید»، نه «هرگز» — بنر همیشگی هیچ تاریخی
     *    ندارد و باید همیشه دیده شود.
     */
    public function scopeVisible(Builder $query): void
    {
        $now = now();

        $query->where('is_active', true)
            ->where(fn (Builder $q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now))
            ->where(fn (Builder $q) => $q->whereNull('ends_at')->orWhere('ends_at', '>=', $now));
    }

    /** بنرهای یک جایگاه، به ترتیب نمایش. */
    public function scopeOrdered(Builder $query): void
    {
        /*
         * ⚠️ `id` هم در مرتب‌سازی هست.
         *
         *    اگر مدیر به سه بنر ترتیب صفر بدهد (که پیش‌فرض است)،
         *    SQLite ترتیب دلخواه خودش را می‌دهد و هر بار متفاوت.
         *    نتیجه‌اش اسلایدری بود که با هر بارگذاری، اسلایدها را
         *    جابه‌جا نشان می‌داد.
         */
        $query->orderBy('sort_order')->orderBy('id');
    }

    /**
     * وضعیت خوانا برای پنل — چرا این بنر دیده می‌شود یا نمی‌شود.
     *
     * ⚠️ بدون این، مدیر بنری را می‌دید که «فعال» است ولی در سایت
     *    نبود، و هیچ راهی نداشت بفهمد تاریخش گذشته یا هنوز نرسیده.
     */
    public function state(): string
    {
        if (! $this->is_active) {
            return 'disabled';
        }

        if ($this->starts_at && $this->starts_at->isFuture()) {
            return 'scheduled';
        }

        if ($this->ends_at && $this->ends_at->isPast()) {
            return 'expired';
        }

        return 'live';
    }
}
