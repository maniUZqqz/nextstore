<?php

namespace App\Http\Controllers\Api\V1\Shop;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;

/**
 * تنظیمات عمومی فروشگاه — بدون احراز هویت.
 * ---------------------------------------------------------------------------
 * فوتر و نوار بالای هدر از این اندپوینت تغذیه می‌شوند.
 *
 * ⚠️ فقط کلیدهای **فهرست سفید** برگردانده می‌شوند، نه کل جدول.
 *
 *    تنظیمات جایی است که فردا کلید درگاه پرداخت و توکن سرویس پیامک هم
 *    در آن می‌نشیند. برگرداندن `Setting::all()` یعنی آن روز، یک
 *    اندپوینت عمومی رازها را منتشر می‌کند بدون اینکه کسی متوجه شود.
 */
class SettingsController extends Controller
{
    /**
     * کلیدهایی که نمایش عمومی دارند.
     *
     * هر کلید تازه‌ای که فوتر یا هدر لازم داشته باشد باید صریحاً اینجا
     * اضافه شود — این سخت‌گیری عمدی است.
     */
    private const PUBLIC_KEYS = [
        'site_name',
        'site_description',
        'contact_phone',
        'contact_email',
        'contact_address',
        'support_hours',
        'social_instagram',
        'social_telegram',
        'social_x',
        'social_linkedin',
    ];

    /**
     * GET /api/v1/settings
     * تنظیمات عمومی برای زبان جاری.
     */
    public function index(): JsonResponse
    {
        $data = [];

        foreach (self::PUBLIC_KEYS as $key) {
            /*
             * کلید همیشه در خروجی هست، حتی وقتی مقداری ندارد.
             *
             * فرانت با `?? fallback` تصمیم می‌گیرد؛ نبودِ کلید و
             * تهی بودنش را نمی‌تواند تفکیک کند اگر کلید اصلاً نیاید.
             */
            $data[$this->camel($key)] = Setting::get($key);
        }

        return response()->json(['data' => $data]);
    }

    /** تبدیل snake_case به camelCase — قرارداد خروجی همه‌ی Resource ها. */
    private function camel(string $key): string
    {
        return lcfirst(str_replace(' ', '', ucwords(str_replace('_', ' ', $key))));
    }
}
