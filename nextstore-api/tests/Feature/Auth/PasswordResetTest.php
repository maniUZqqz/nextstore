<?php

/**
 * بازیابی رمز عبور — از درخواست پیوند تا مصرف توکن.
 */

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;

/** رمزی که قواعد سخت‌گیرانه را رد می‌کند و در نشت‌ها هم نیست. */
const FRESH_PASSWORD = 'Kh0rshid7Baran';

describe('درخواست پیوند بازیابی', function () {
    it('برای کاربر موجود ایمیل می‌فرستد', function () {
        Notification::fake();

        $user = User::factory()->create(['email' => 'reset-me@example.test']);

        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'reset-me@example.test'])
            ->assertOk();

        Notification::assertSentTo($user, ResetPasswordNotification::class);
    });

    /*
     * ⚠️ مهم‌ترین بررسی این فایل.
     *
     *    اگر پاسخ برای ایمیل ناموجود فرق کند، این اندپوینت به ابزار
     *    شمارش کاربر تبدیل می‌شود: کسی با فهرستی از ایمیل‌ها می‌فهمد
     *    کدام‌ها اینجا حساب دارند و همان فهرست را برای فیشینگ هدفمند
     *    به کار می‌برد.
     */
    it('برای ایمیل ناموجود همان پاسخ را می‌دهد', function () {
        Notification::fake();

        User::factory()->create(['email' => 'known@example.test']);

        $known = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'known@example.test']);
        $unknown = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'nobody@example.test']);

        expect($known->status())->toBe($unknown->status())
            ->and($known->json('message'))->toBe($unknown->json('message'));

        Notification::assertCount(1);
    });

    /*
     * ⚠️ حساب مسدود هم بی‌صدا رد می‌شود.
     *
     *    بازنشانی رمز راهی برای دور زدن مسدودیت نیست، ولی اگر پیام
     *    فرق کند کاربر فکر می‌کند مشکل از رمز است و بارها تلاش
     *    می‌کند.
     */
    it('برای حساب غیرفعال ایمیل نمی‌فرستد ولی پاسخ را عوض نمی‌کند', function () {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'blocked@example.test',
            'is_active' => false,
        ]);

        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'blocked@example.test'])
            ->assertOk();

        Notification::assertNothingSentTo($user);
    });

    it('ایمیل بی‌شکل را رد می‌کند', function () {
        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'not-an-email'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');
    });

    /*
     * ⚠️ پیوند باید به **فرانت‌اند** برود، نه به مسیر خود لاراول.
     *
     *    اعلان پیش‌فرض لاراول `route('password.reset')` می‌سازد؛ این
     *    پروژه API-only است و چنین مسیری ندارد، پس کاربر به ۴۰۴
     *    می‌رسید — و فقط در تولید معلوم می‌شد.
     */
    it('پیوند به صفحه‌ی فرانت‌اند اشاره می‌کند', function () {
        Notification::fake();

        config(['services.frontend.url' => 'https://shop.example']);

        $user = User::factory()->create(['email' => 'linked@example.test']);

        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'linked@example.test']);

        Notification::assertSentTo($user, function (ResetPasswordNotification $notification) use ($user) {
            $mail = $notification->toMail($user);
            $url = $mail->actionUrl;

            return str_starts_with($url, 'https://shop.example/')
                && str_contains($url, '/reset-password?')
                && str_contains($url, 'token=')
                && str_contains($url, urlencode($user->email));
        });
    });

    it('زبان درخواست را در ایمیل رعایت می‌کند', function () {
        Notification::fake();

        $user = User::factory()->create(['email' => 'lang@example.test']);

        $this->postJson(
            '/api/v1/auth/forgot-password',
            ['email' => 'lang@example.test'],
            ['Accept-Language' => 'en'],
        );

        Notification::assertSentTo($user, function (ResetPasswordNotification $notification) use ($user) {
            return $notification->toMail($user)->subject === 'Reset your password';
        });
    });
});

describe('بازنشانی با توکن', function () {
    /** ساخت کاربر و توکن خام آماده‌ی مصرف. */
    function userWithToken(): array
    {
        $user = User::factory()->create(['email' => 'token@example.test']);

        return [$user, Password::broker()->createToken($user)];
    }

    it('رمز را عوض می‌کند', function () {
        [$user, $token] = userWithToken();

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => FRESH_PASSWORD,
            'password_confirmation' => FRESH_PASSWORD,
        ])->assertOk();

        expect(Hash::check(FRESH_PASSWORD, $user->fresh()->password))->toBeTrue();
    });

    /*
     * ⚠️ بدون این، کسی که یک بار به ایمیل قربانی دسترسی پیدا کرده،
     *    می‌توانست ماه‌ها بعد هم با همان پیوند رمز را دوباره عوض کند.
     */
    it('توکن یک‌بارمصرف است', function () {
        [$user, $token] = userWithToken();

        $payload = [
            'token' => $token,
            'email' => $user->email,
            'password' => FRESH_PASSWORD,
            'password_confirmation' => FRESH_PASSWORD,
        ];

        $this->postJson('/api/v1/auth/reset-password', $payload)->assertOk();
        $this->postJson('/api/v1/auth/reset-password', $payload)->assertStatus(422);
    });

    /*
     * ⚠️ بازنشانی باید همه‌ی نشست‌ها را ببندد.
     *
     *    اگر کسی به حساب دسترسی پیدا کرده بود، توکن Sanctum او پس از
     *    تغییر رمز هم کار می‌کرد و بازیابی رمز هیچ چیزی را امن
     *    نمی‌کرد.
     */
    it('همه‌ی توکن‌های نشست را باطل می‌کند', function () {
        [$user, $token] = userWithToken();

        $user->createToken('device-a');
        $user->createToken('device-b');
        expect($user->tokens()->count())->toBe(2);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => FRESH_PASSWORD,
            'password_confirmation' => FRESH_PASSWORD,
        ])->assertOk();

        expect($user->tokens()->count())->toBe(0);
    });

    it('توکن ساختگی را رد می‌کند', function () {
        $user = User::factory()->create(['email' => 'fake@example.test']);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => str_repeat('a', 64),
            'email' => $user->email,
            'password' => FRESH_PASSWORD,
            'password_confirmation' => FRESH_PASSWORD,
        ])->assertStatus(422)->assertJsonPath('error.code', 'INVALID_RESET_TOKEN');
    });

    it('عدم تطابق دو رمز را رد می‌کند', function () {
        [$user, $token] = userWithToken();

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => FRESH_PASSWORD,
            'password_confirmation' => 'SomethingElse9x',
        ])->assertStatus(422)->assertJsonValidationErrors('password');
    });

    /*
     * ⚠️ همان سخت‌گیری ثبت‌نام، نه کمتر.
     *
     *    اگر قواعد اینجا ساده‌تر بود، بازیابی رمز به راه فرار از
     *    سیاست رمز تبدیل می‌شد: کاربر با یک ایمیل، رمز ضعیف را از
     *    درِ پشتی می‌گذاشت.
     */
    it('رمز ضعیف را همان‌طور که ثبت‌نام رد می‌کند، رد می‌کند', function () {
        [$user, $token] = userWithToken();

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'short',
            'password_confirmation' => 'short',
        ])->assertStatus(422)->assertJsonValidationErrors('password');
    });
});
