<?php

namespace App\Models;

use App\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

/**
 * مدل تصویر محصول (یک قلم از گالری).
 *
 * @property int $id
 * @property int $product_id
 * @property string $path
 * @property array|null $alt
 * @property bool $is_primary
 */
class ProductImage extends Model
{
    use HasFactory;
    use HasTranslations;

    /** متن جایگزین تصویر در هر دو زبان ذخیره می‌شود. */
    protected array $translatable = ['alt'];

    protected $fillable = ['product_id', 'path', 'alt', 'is_primary', 'sort_order'];

    /** تبدیل خودکار نوع ستون‌ها. */
    protected function casts(): array
    {
        return [
            'alt' => 'array',
            'is_primary' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /** محصولی که این تصویر به آن تعلق دارد. */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * آدرس کامل و قابل استفاده‌ی تصویر برای فرانت‌اند.
     *
     * سه حالت مسیر پشتیبانی می‌شود:
     *
     *   ۱. URL کامل (https://…)      → همان برگردانده می‌شود
     *   ۲. مسیر مطلق (/products/…)   → فایل ثابت در پوشه public لاراول،
     *                                   با دامنه‌ی برنامه کامل می‌شود
     *   ۳. مسیر نسبی (uploads/…)     → فایل آپلودی در استوریج
     *
     * ⚠️ حالت دوم قبلاً پشتیبانی نمی‌شد و مسیر `/products/x.svg` را
     *    به `Storage::url()` می‌داد که خروجی معیوب `/storage//products/x.svg`
     *    تولید می‌کرد (اسلش دوتایی + پیشوند اشتباه) و تصویر بارگذاری نمی‌شد.
     */
    public function getUrlAttribute(): string
    {
        /* حالت ۱ — آدرس کامل خارجی */
        if (str_starts_with($this->path, 'http://') || str_starts_with($this->path, 'https://')) {
            return $this->path;
        }

        /* حالت ۲ — فایل ثابت در public لاراول */
        if (str_starts_with($this->path, '/')) {
            return rtrim(config('app.url'), '/').$this->path;
        }

        /* حالت ۳ — فایل آپلودی در استوریج */
        return Storage::url($this->path);
    }
}
