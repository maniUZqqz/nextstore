<?php

/**
 * احراز هویت — ثبت‌نام، ورود، خروج.
 */

use App\Models\User;
use Illuminate\Support\Facades\Hash;

describe('ثبت‌نام', function () {
    it('کاربر می‌سازد و توکن می‌دهد', function () {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'کاربر تازه',
            'email' => 'new@example.test',
            'password' => 'Str0ngPass!',
            'password_confirmation' => 'Str0ngPass!',
            'accept_terms' => true,
        ]);

        $response->assertCreated()->assertJsonStructure(['data' => ['token', 'user']]);

        expect(User::query()->where('email', 'new@example.test')->exists())->toBeTrue();
    });

    /*
     * ⚠️ رمز باید هش شود، نه ذخیره‌ی خام.
     *
     *    بدیهی به نظر می‌رسد، ولی یک `$fillable` اشتباه یا حذف cast
     *    آن را بی‌صدا می‌شکند و هیچ تست دیگری متوجه نمی‌شود.
     */
    it('رمز را هش‌شده ذخیره می‌کند', function () {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'کاربر تازه',
            'email' => 'hash@example.test',
            'password' => 'Str0ngPass!',
            'password_confirmation' => 'Str0ngPass!',
            'accept_terms' => true,
        ])->assertCreated();

        $user = User::query()->where('email', 'hash@example.test')->first();

        expect($user->password)->not->toBe('Str0ngPass!')
            ->and(Hash::check('Str0ngPass!', $user->password))->toBeTrue();
    });

    it('ایمیل تکراری را رد می‌کند', function () {
        User::factory()->create(['email' => 'taken@example.test']);

        $this->postJson('/api/v1/auth/register', [
            'name' => 'کاربر',
            'email' => 'taken@example.test',
            'password' => 'Str0ngPass!',
            'password_confirmation' => 'Str0ngPass!',
            'accept_terms' => true,
        ])->assertStatus(422)->assertJsonValidationErrors('email');
    });

    it('تکرار رمز نادرست را رد می‌کند', function () {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'کاربر',
            'email' => 'x@example.test',
            'password' => 'Str0ngPass!',
            'password_confirmation' => 'Different!',
            'accept_terms' => true,
        ])->assertStatus(422)->assertJsonValidationErrors('password');
    });
});

describe('ورود', function () {
    it('با اطلاعات درست توکن می‌دهد', function () {
        User::factory()->create([
            'email' => 'user@example.test',
            'password' => Hash::make('secret123'),
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'user@example.test',
            'password' => 'secret123',
        ])->assertOk()->assertJsonStructure(['data' => ['token']]);
    });

    it('رمز اشتباه را رد می‌کند', function () {
        User::factory()->create([
            'email' => 'user@example.test',
            'password' => Hash::make('secret123'),
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'user@example.test',
            'password' => 'wrong',
        ])->assertStatus(422);
    });

    /*
     * ⚠️ حساب غیرفعال نباید بتواند وارد شود.
     *
     *    این همان دکمه‌ای است که مدیر در `/admin/customers` می‌زند؛
     *    اگر ورود آن را نادیده بگیرد، آن دکمه فقط یک نشان تزئینی است.
     */
    /*
     * ⚠️ کد وضعیت اینجا **۴۰۱** است نه ۴۲۲ — و این عمدی است.
     *
     *    رمز اشتباه یک خطای *اعتبارسنجی* است (۴۲۲) و باید زیر فیلد
     *    ایمیل بنشیند. حساب مسدود یک خطای *احراز هویت* است: داده
     *    درست است ولی این حساب اجازه‌ی ورود ندارد. تفکیکشان به فرانت
     *    اجازه می‌دهد پیام‌های متفاوتی نشان دهد.
     */
    it('حساب غیرفعال را با ۴۰۱ رد می‌کند', function () {
        User::factory()->create([
            'email' => 'blocked@example.test',
            'password' => Hash::make('secret123'),
            'is_active' => false,
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'blocked@example.test',
            'password' => 'secret123',
        ])->assertUnauthorized();
    });
});

describe('خروج', function () {
    /*
     * ⚠️ ابطال روی **دیتابیس** بررسی می‌شود، نه با درخواست دوم.
     *
     *    نسخه‌ی اول این تست پس از خروج، `/auth/me` را با همان توکن صدا
     *    می‌زد و انتظار ۴۰۱ داشت — ولی ۲۰۰ می‌گرفت و شبیه باگ امنیتی
     *    به نظر می‌رسید. با curl روی سرور واقعی بررسی شد: آنجا ۴۰۱
     *    می‌دهد. علت، آرتیفکت محیط تست است: گارد لاراول کاربر
     *    حل‌شده را بین درخواست‌های یک تست نگه می‌دارد.
     *
     *    شمردن ردیف توکن، همان چیزی را می‌سنجد بدون آن آرتیفکت.
     */
    it('توکن را از دیتابیس حذف می‌کند', function () {
        $user = User::factory()->create(['password' => Hash::make('secret123')]);

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'secret123',
        ])->json('data.token');

        expect($user->tokens()->count())->toBe(1);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/auth/logout')->assertOk();

        expect($user->fresh()->tokens()->count())->toBe(0);
    });

    it('خروج از همه دستگاه‌ها همه‌ی توکن‌ها را حذف می‌کند', function () {
        $user = User::factory()->create(['password' => Hash::make('secret123')]);

        /* سه ورود از سه دستگاه */
        foreach (range(1, 3) as $ignored) {
            $this->postJson('/api/v1/auth/login', [
                'email' => $user->email,
                'password' => 'secret123',
            ])->assertOk();
        }

        $token = $user->tokens()->first();
        expect($user->tokens()->count())->toBe(3);

        $this->withHeader('Authorization', 'Bearer '.$token->id.'|dummy')
            ->actingAs($user, 'sanctum')
            ->postJson('/api/v1/auth/logout-all')->assertOk();

        expect($user->fresh()->tokens()->count())->toBe(0);
    });

    it('مهمان نمی‌تواند خارج شود', function () {
        $this->postJson('/api/v1/auth/logout')->assertUnauthorized();
    });
});
