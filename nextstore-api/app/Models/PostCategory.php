<?php

namespace App\Models;

use App\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * دسته‌بندی مقالات مجله.
 *
 * ساختار تخت است، برخلاف Category محصولات که درختی است — دلیلش
 * در مایگریشن توضیح داده شده.
 *
 * @property int $id
 * @property array $name
 * @property array|null $description
 * @property string $slug
 * @property int $sort_order
 */
class PostCategory extends Model
{
    use HasTranslations;

    protected $fillable = ['name', 'description', 'slug', 'sort_order'];

    /** فیلدهایی که مقدارشان JSON چندزبانه است. */
    protected array $translatable = ['name', 'description'];

    protected function casts(): array
    {
        return [
            'name' => 'array',
            'description' => 'array',
            'sort_order' => 'integer',
        ];
    }

    /** مقالات این دسته. */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    /**
     * فقط مقالات منتشرشده‌ی این دسته.
     *
     * ⚠️ چرا رابطه‌ی جداگانه و نه فیلتر در محل استفاده؟
     *    شمارش مقالات یک دسته در چند جا لازم است (فهرست دسته‌ها،
     *    سربرگ صفحه‌ی دسته). اگر هر بار دستی فیلتر می‌شد، یک جا
     *    فراموش می‌شد و پیش‌نویس‌ها در شمارش عمومی می‌آمدند.
     */
    public function publishedPosts(): HasMany
    {
        return $this->posts()->published();
    }

    /** مسیریابی با نامک. */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
