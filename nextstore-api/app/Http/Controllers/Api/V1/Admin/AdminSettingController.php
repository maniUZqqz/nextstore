<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\Catalog\CacheInvalidator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * کنترلر تنظیمات فروشگاه — پنل مدیریت.
 * ---------------------------------------------------------------------------
 * ⚠️ فهرست تنظیمات **در کد** تعریف شده، نه در دیتابیس.
 *
 *    اگر مدیر می‌توانست کلید دلخواه بسازد، هر غلط تایپی یک تنظیم مرده
 *    می‌ساخت که هیچ‌جای برنامه نمی‌خواندش — و هیچ راهی هم برای فهمیدنش
 *    نبود. جدول فقط *مقادیر* را نگه می‌دارد؛ *شمای* تنظیمات همین‌جاست.
 */
class AdminSettingController extends Controller
{
    /**
     * شمای تنظیمات.
     *
     * هر ردیف: کلید، گروه، آیا دوزبانه است، و نوع ورودی برای فرم پنل.
     *
     * @var array<string, array{group: string, translatable: bool, input: string}>
     */
    private const SCHEMA = [
        /* --- عمومی --- */
        'site_name' => ['group' => 'general', 'translatable' => true, 'input' => 'text'],
        'site_description' => ['group' => 'general', 'translatable' => true, 'input' => 'textarea'],
        'support_hours' => ['group' => 'general', 'translatable' => true, 'input' => 'text'],

        /* --- تماس --- */
        'contact_phone' => ['group' => 'contact', 'translatable' => false, 'input' => 'text'],
        'contact_email' => ['group' => 'contact', 'translatable' => false, 'input' => 'email'],
        'contact_address' => ['group' => 'contact', 'translatable' => true, 'input' => 'textarea'],

        /* --- شبکه‌های اجتماعی --- */
        'social_instagram' => ['group' => 'social', 'translatable' => false, 'input' => 'url'],
        'social_telegram' => ['group' => 'social', 'translatable' => false, 'input' => 'url'],
        'social_x' => ['group' => 'social', 'translatable' => false, 'input' => 'url'],
        'social_linkedin' => ['group' => 'social', 'translatable' => false, 'input' => 'url'],
    ];

    /**
     * GET /api/v1/admin/settings
     * همه‌ی تنظیمات با مقدار خام — دوزبانه‌ها با هر دو زبان.
     */
    public function index(): JsonResponse
    {
        $stored = Setting::query()->get()->keyBy('key');

        $data = [];

        foreach (self::SCHEMA as $key => $meta) {
            $value = $stored->get($key)?->value;

            $data[] = [
                'key' => $key,
                'group' => $meta['group'],
                'translatable' => $meta['translatable'],
                'input' => $meta['input'],

                /*
                 * مقدار دوزبانه همیشه به‌صورت شیء با هر دو کلید برمی‌گردد،
                 * حتی وقتی یکی خالی است. بدون این، فرم پنل باید هر بار
                 * وجود کلید را بررسی کند و یک `undefined` به ورودی
                 * کنترل‌شده‌ی React می‌داد.
                 */
                'value' => $meta['translatable']
                    ? ['fa' => $value['fa'] ?? '', 'en' => $value['en'] ?? '']
                    : (is_string($value) ? $value : ''),
            ];
        }

        return response()->json(['data' => $data]);
    }

    /**
     * PUT /api/v1/admin/settings
     * ذخیره‌ی دسته‌جمعی.
     *
     * ⚠️ همه‌ی تنظیمات با هم ذخیره می‌شوند، نه یکی‌یکی. فرم تنظیمات یک
     *    واحد است و ذخیره‌ی جزئی یعنی حالتی که نیمی از مقادیر تازه‌اند
     *    و نیمی کهنه — بدترین حالت برای عیب‌یابی.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.key' => ['required', 'string'],
            'settings.*.value' => ['nullable'],
        ]);

        DB::transaction(function () use ($validated) {
            foreach ($validated['settings'] as $item) {
                $key = $item['key'];

                /*
                 * ⚠️ کلید ناشناخته بی‌صدا رد می‌شود، نه اینکه خطا بدهد.
                 *
                 *    فرم پنل فقط کلیدهای شما را می‌فرستد؛ کلید ناشناخته
                 *    یعنی یا نسخه‌ی قدیمی فرم است یا دستکاری. در هر دو
                 *    حالت، ننوشتنش درست است و شکستن کل ذخیره به‌خاطر
                 *    یک کلید اضافه، مدیر را بی‌دلیل گیر می‌اندازد.
                 */
                if (! isset(self::SCHEMA[$key])) {
                    continue;
                }

                $meta = self::SCHEMA[$key];
                $value = $item['value'] ?? null;

                if ($meta['translatable']) {
                    $value = [
                        'fa' => trim((string) ($value['fa'] ?? '')),
                        'en' => trim((string) ($value['en'] ?? '')),
                    ];
                } else {
                    $value = trim((string) $value);
                }

                Setting::query()->updateOrCreate(
                    ['key' => $key],
                    [
                        'value' => $value,
                        'group' => $meta['group'],
                        'is_translatable' => $meta['translatable'],
                    ],
                );
            }
        });

        /*
         * باطل کردن کش در هر دو سمت.
         *
         * ⚠️ کش لاراول با هوک `saved` مدل خودکار پاک شده، ولی نکست هم
         *    پاسخ `/settings` را با `revalidate: 3600` کش می‌کند. بدون
         *    این اطلاع‌رسانی، مدیر تلفن را عوض می‌کرد و تا یک ساعت
         *    شماره‌ی قدیمی در فوتر می‌ماند — و فکر می‌کرد ذخیره نشده.
         */
        app(CacheInvalidator::class)->flushSettings();

        return response()->json([
            'message' => __('shop.settings_saved'),
            'data' => $this->index()->getData(true)['data'],
        ]);
    }
}
