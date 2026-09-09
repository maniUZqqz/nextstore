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

        /*
         * نرخ‌های ارسال — از `config/shop.php`، نه از جدول تنظیمات.
         *
         * ⚠️ باگی که این چند خط حل می‌کند:
         *
         *    آستانه‌ی ارسال رایگان یک عدد است، ولی در **پنج جا** دستی
         *    نوشته شده بود: نوار بالای هدر، کارت خدمات صفحه‌ی اصلی،
         *    سؤالات متداول، صفحه‌ی شیوه‌های ارسال، و خود config.
         *    توضیح بالای همان config هم اعتراف می‌کرد که «اگر اینجا
         *    عوض شد، آن متن‌ها هم باید به‌روز شوند».
         *
         *    بدترین نمودش در نسخه‌ی انگلیسی بود: متن «$50» تبلیغ
         *    می‌کرد در حالی که آستانه ۵٬۰۰۰٬۰۰۰ ریال است که با نرخ
         *    تبدیل خود پروژه حدود **۸ دلار** می‌شود. سایت انگلیسی
         *    شش برابر اشتباه وعده می‌داد.
         *
         *    حالا عدد از یک منبع می‌آید و متن‌ها آن را درج می‌کنند.
         *
         * ⚠️ مقادیر به **ریال** می‌روند، مثل هر مبلغ دیگری در این API.
         *    تبدیل به تومان یا دلار کار `formatPrice` فرانت است.
         */
        $data['shipping'] = [
            'freeThreshold' => (int) config('shop.shipping.free_threshold'),
            'standard' => (int) config('shop.shipping.standard'),
            'express' => (int) config('shop.shipping.express'),
        ];

        return response()->json(['data' => $data]);
    }

    /** تبدیل snake_case به camelCase — قرارداد خروجی همه‌ی Resource ها. */
    private function camel(string $key): string
    {
        return lcfirst(str_replace(' ', '', ucwords(str_replace('_', ' ', $key))));
    }
}
