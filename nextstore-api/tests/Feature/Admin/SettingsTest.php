<?php

/**
 * تنظیمات فروشگاه — ذخیره، کش، و مرز عمومی/خصوصی.
 */

use App\Models\Setting;

describe('اندپوینت عمومی', function () {
    it('بدون احراز هویت کار می‌کند', function () {
        $this->getJson('/api/v1/settings')->assertOk();
    });

    it('مقدار دوزبانه را برای زبان جاری برمی‌گرداند', function () {
        Setting::query()->create([
            'key' => 'site_name',
            'value' => ['fa' => 'فروشگاه من', 'en' => 'My Store'],
            'group' => 'general',
            'is_translatable' => true,
        ]);

        $this->getJson('/api/v1/settings', ['Accept-Language' => 'fa'])
            ->assertOk()->assertJsonPath('data.siteName', 'فروشگاه من');

        $this->getJson('/api/v1/settings', ['Accept-Language' => 'en'])
            ->assertOk()->assertJsonPath('data.siteName', 'My Store');
    });

    /*
     * ⚠️ مهم‌ترین تست این فایل.
     *
     *    تنظیمات جایی است که فردا کلید درگاه پرداخت و توکن سرویس پیامک
     *    هم در آن می‌نشیند. اندپوینت عمومی فهرست سفید دارد؛ بدون آن،
     *    آن روز رازها بی‌صدا منتشر می‌شدند.
     */
    it('کلید خارج از فهرست سفید را منتشر نمی‌کند', function () {
        Setting::query()->create([
            'key' => 'payment_gateway_secret',
            'value' => 'super-secret-key',
            'group' => 'general',
            'is_translatable' => false,
        ]);

        $response = $this->getJson('/api/v1/settings')->assertOk();

        expect($response->getContent())->not->toContain('super-secret-key')
            ->and($response->json('data'))->not->toHaveKey('paymentGatewaySecret');
    });

    it('کلید تنظیم‌نشده را با مقدار تهی برمی‌گرداند', function () {
        $response = $this->getJson('/api/v1/settings')->assertOk();

        /* کلید باید باشد تا فرانت بتواند `?? fallback` بزند */
        expect($response->json('data'))->toHaveKey('contactPhone')
            ->and($response->json('data.contactPhone'))->toBeNull();
    });
});

describe('ذخیره‌ی تنظیمات در پنل', function () {
    it('مقادیر را ذخیره می‌کند', function () {
        actingAsAdmin();

        $this->putJson('/api/v1/admin/settings', [
            'settings' => [
                ['key' => 'contact_phone', 'value' => '۰۲۱-۵۵۵۵۵۵۵۵'],
                ['key' => 'site_name', 'value' => ['fa' => 'نام تازه', 'en' => 'New Name']],
            ],
        ])->assertOk();

        expect(Setting::get('contact_phone'))->toBe('۰۲۱-۵۵۵۵۵۵۵۵')
            ->and(Setting::get('site_name', null, 'en'))->toBe('New Name');
    });

    /*
     * ⚠️ کلید ناشناخته بی‌صدا رد می‌شود، نه اینکه کل ذخیره را بشکند.
     *
     *    فرم پنل فقط کلیدهای شما را می‌فرستد؛ کلید ناشناخته یعنی یا
     *    نسخه‌ی قدیمی فرم است یا دستکاری. شکستن کل ذخیره به‌خاطر یک
     *    کلید اضافه، مدیر را بی‌دلیل گیر می‌اندازد.
     */
    it('کلید ناشناخته را نادیده می‌گیرد', function () {
        actingAsAdmin();

        $this->putJson('/api/v1/admin/settings', [
            'settings' => [
                ['key' => 'contact_phone', 'value' => '۰۲۱-۱۱۱۱۱۱۱۱'],
                ['key' => 'hacked_key', 'value' => 'nope'],
            ],
        ])->assertOk();

        expect(Setting::get('contact_phone'))->toBe('۰۲۱-۱۱۱۱۱۱۱۱')
            ->and(Setting::query()->where('key', 'hacked_key')->exists())->toBeFalse();
    });

    /*
     * ⚠️ کش باید با هر نوشتن باطل شود، نه با انقضای زمانی.
     *
     *    مدیری که تلفن فروشگاه را عوض می‌کند نباید ده دقیقه منتظر بماند
     *    و شک کند که ذخیره شده یا نه.
     */
    it('کش را پس از ذخیره باطل می‌کند', function () {
        Setting::query()->create([
            'key' => 'contact_phone',
            'value' => 'قدیمی',
            'group' => 'contact',
            'is_translatable' => false,
        ]);

        /* کش را گرم می‌کنیم */
        expect(Setting::get('contact_phone'))->toBe('قدیمی');

        actingAsAdmin();

        $this->putJson('/api/v1/admin/settings', [
            'settings' => [['key' => 'contact_phone', 'value' => 'جدید']],
        ])->assertOk();

        expect(Setting::get('contact_phone'))->toBe('جدید');
    });

    it('مقدار خالی را می‌پذیرد', function () {
        Setting::query()->create([
            'key' => 'social_linkedin',
            'value' => 'https://linkedin.com/',
            'group' => 'social',
            'is_translatable' => false,
        ]);

        actingAsAdmin();

        $this->putJson('/api/v1/admin/settings', [
            'settings' => [['key' => 'social_linkedin', 'value' => '']],
        ])->assertOk();

        /*
         * ⚠️ رشته‌ی خالی یعنی «مدیر عمداً پاکش کرده» و باید همان بماند.
         *    برگرداندن پیش‌فرض اینجا یعنی حذف یک شبکه‌ی اجتماعی از پنل
         *    هیچ اثری نداشت.
         */
        expect(Setting::get('social_linkedin'))->toBe('');
    });

    it('مشتری نمی‌تواند تنظیمات را عوض کند', function () {
        actingAsCustomer();

        $this->putJson('/api/v1/admin/settings', [
            'settings' => [['key' => 'contact_phone', 'value' => 'hacked']],
        ])->assertForbidden();
    });
});
