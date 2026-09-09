<?php

/**
 * تنظیمات عمومی — فهرست سفید و نرخ‌های ارسال.
 */

use App\Models\Setting;

describe('اندپوینت عمومی تنظیمات', function () {
    it('بدون ورود در دسترس است', function () {
        $this->getJson('/api/v1/settings')->assertOk();
    });

    /*
     * ⚠️ مهم‌ترین بررسی این فایل.
     *
     *    جدول تنظیمات جایی است که فردا کلید درگاه پرداخت و توکن سرویس
     *    پیامک هم در آن می‌نشیند. اگر کنترلر روزی به `Setting::all()`
     *    تغییر کند، یک اندپوینت **عمومی** رازها را منتشر می‌کند بدون
     *    اینکه کسی متوجه شود. این تست همان روز را می‌گیرد.
     */
    it('کلید خارج از فهرست سفید را منتشر نمی‌کند', function () {
        Setting::query()->create([
            'key' => 'payment_gateway_secret',
            'value' => 'sk_live_do_not_leak_this_value',
            'group' => 'payment',
            'is_translatable' => false,
        ]);

        $response = $this->getJson('/api/v1/settings')->assertOk();

        expect($response->json('data'))->not->toHaveKey('paymentGatewaySecret')
            ->and($response->getContent())->not->toContain('sk_live_do_not_leak_this_value');
    });

    it('کلید تعریف‌نشده را با مقدار null می‌دهد نه اینکه حذفش کند', function () {
        /*
         * فرانت با `?? fallback` تصمیم می‌گیرد؛ نبودِ کلید و تهی بودنش
         * را نمی‌تواند تفکیک کند اگر کلید اصلاً نیاید.
         */
        $response = $this->getJson('/api/v1/settings')->assertOk();

        expect($response->json('data'))->toHaveKey('siteName');
    });
});

describe('نرخ‌های ارسال', function () {
    /*
     * ⚠️ باگی که این بخش نگه می‌دارد:
     *
     *    آستانه‌ی ارسال رایگان یک عدد است، ولی در پنج جا دستی نوشته
     *    شده بود: نوار بالای هدر، کارت خدمات صفحه‌ی اصلی، سؤالات
     *    متداول، صفحه‌ی شیوه‌های ارسال، و خود config.
     *
     *    بدترین نمودش در نسخه‌ی انگلیسی بود: «$50» تبلیغ می‌کرد در
     *    حالی که آستانه ۵٬۰۰۰٬۰۰۰ ریال است — با نرخ تبدیل خود پروژه
     *    حدود ۸ دلار. سایت انگلیسی شش برابر اشتباه وعده می‌داد.
     */
    it('نرخ‌ها را در پاسخ عمومی می‌دهد', function () {
        $response = $this->getJson('/api/v1/settings')->assertOk();

        expect($response->json('data.shipping'))
            ->toHaveKeys(['freeThreshold', 'standard', 'express']);
    });

    /* پول نباید بیش از یک منبع حقیقت داشته باشد */
    it('همان عددی را می‌دهد که منطق سفارش با آن حساب می‌کند', function () {
        $response = $this->getJson('/api/v1/settings')->assertOk();

        expect($response->json('data.shipping.freeThreshold'))
            ->toBe(config('shop.shipping.free_threshold'))
            ->and($response->json('data.shipping.standard'))
            ->toBe(config('shop.shipping.standard'))
            ->and($response->json('data.shipping.express'))
            ->toBe(config('shop.shipping.express'));
    });

    it('مبالغ عدد صحیح ریالی‌اند نه رشته', function () {
        $shipping = $this->getJson('/api/v1/settings')->json('data.shipping');

        foreach ($shipping as $amount) {
            expect($amount)->toBeInt();
        }
    });

    /*
     * ⚠️ همان نرخی که سبد خرید نشان می‌دهد.
     *
     *    اگر این دو واگرا شوند، مشتری در سبد یک عدد می‌بیند و در
     *    لحظه‌ی پرداخت چیز دیگری — همان تله‌ای که `config/shop.php`
     *    برای بستنش ساخته شد.
     */
    it('با آستانه‌ای که سبد خرید اعلام می‌کند یکی است', function () {
        actingAsCustomer();

        $cart = $this->getJson('/api/v1/cart')->assertOk();
        $settings = $this->getJson('/api/v1/settings')->assertOk();

        expect($cart->json('data.summary.freeShippingThreshold'))
            ->toBe($settings->json('data.shipping.freeThreshold'));
    });
});
