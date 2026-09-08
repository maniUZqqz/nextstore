<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * یک تنظیم فروشگاه.
 * ---------------------------------------------------------------------------
 * ⚠️ خواندن تنظیمات از راه `Setting::all()` **کش می‌شود**، چون فوتر و
 *    هدر در هر درخواستی رندر می‌شوند. بدون کش، هر بازدید از هر صفحه یک
 *    کوئری اضافه می‌داد برای داده‌ای که ماه‌ها عوض نمی‌شود.
 *
 * ⚠️ کش با هر نوشتن باطل می‌شود — نه با انقضای زمانی. مدیری که تلفن
 *    فروشگاه را عوض می‌کند نباید ده دقیقه منتظر بماند و شک کند که
 *    ذخیره شده یا نه.
 */
class Setting extends Model
{
    protected $fillable = ['key', 'value', 'group', 'is_translatable'];

    protected function casts(): array
    {
        return [
            'value' => 'array',
            'is_translatable' => 'boolean',
        ];
    }

    /** کلید کش نگاشت کامل تنظیمات. */
    private const CACHE_KEY = 'settings.map';

    /**
     * نگاشت کامل کلید → [value, is_translatable].
     *
     * @return array<string, array{value: mixed, translatable: bool}>
     */
    public static function map(): array
    {
        return Cache::rememberForever(self::CACHE_KEY, function () {
            /*
             * ⚠️ آرایه کش می‌شود، نه مجموعه‌ی مدل‌ها.
             *
             *    unserialize نمی‌تواند مدل‌های Eloquent را با روابطشان
             *    بازسازی کند و خطای «incomplete object» می‌دهد — بدتر
             *    اینکه بار اول (کش خالی) کار می‌کند و از بار دوم
             *    می‌شکند. همان درسی که برای کش کاتالوگ گرفته شد.
             */
            return static::query()->get()->mapWithKeys(fn (self $s) => [
                $s->key => ['value' => $s->value, 'translatable' => $s->is_translatable],
            ])->all();
        });
    }

    /**
     * مقدار یک تنظیم برای زبان جاری.
     *
     * @param  string  $key  کلید تنظیم
     * @param  string|null  $default  مقدار جایگزین وقتی تنظیم نشده باشد
     * @param  string|null  $locale  زبان؛ تهی یعنی زبان جاری برنامه
     */
    public static function get(string $key, ?string $default = null, ?string $locale = null): ?string
    {
        $entry = static::map()[$key] ?? null;

        /*
         * ⚠️ «کلید وجود ندارد» با «مقدار تهی است» فرق دارد.
         *
         *    اولی یعنی از پیش‌فرض استفاده کن. دومی یعنی مدیر عمداً
         *    خالی گذاشته و نباید پیش‌فرض جایش بنشیند — وگرنه حذف یک
         *    شبکه‌ی اجتماعی از پنل هیچ اثری نداشت.
         */
        if ($entry === null) {
            return $default;
        }

        $value = $entry['value'];

        if ($entry['translatable'] && is_array($value)) {
            $locale ??= app()->getLocale();

            /* بازگشت به فارسی اگر ترجمه‌ی زبان جاری خالی باشد */
            return $value[$locale] ?? $value['fa'] ?? $default;
        }

        return is_string($value) ? $value : $default;
    }

    /** باطل کردن کش — پس از هر نوشتن. */
    public static function flushCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * کش با هر ذخیره یا حذف خودکار باطل می‌شود.
     *
     * ⚠️ در مدل و نه در کنترلر: هر مسیر نوشتنی — سیدر، tinker، پنل —
     *    باید کش را باطل کند و سپردنش به فراخواننده یعنی یکی از آن‌ها
     *    فراموش می‌شود.
     */
    protected static function booted(): void
    {
        static::saved(fn () => static::flushCache());
        static::deleted(fn () => static::flushCache());
    }
}
