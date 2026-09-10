<?php

/**
 * تأیید ایمیل — از ارسال تا کلیک روی پیوند.
 * ---------------------------------------------------------------------------
 * ⚠️ چرا این جریان ساخته شد؟
 *
 *    صفحه‌ی پروفایل نشان «تأییدنشده» را نشان می‌داد و هیچ راهی برای
 *    تأیید وجود نداشت. این فایل همان بن‌بست را می‌بندد و باز شدنش را
 *    غیرممکن می‌کند.
 */

use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;

/**
 * پیوند امضاشده — **دقیقاً همان‌طور که اعلان می‌سازد**.
 *
 * ⚠️ این تابع عمداً از `absolute: false` استفاده می‌کند.
 *
 *    نسخه‌ی اول پیوند را *مطلق* می‌ساخت و همه‌ی تست‌ها سبز بودند، در
 *    حالی که جریان واقعی می‌شکست: اعلان پیوند نسبی می‌سازد و
 *    میان‌افزار در حالت پیش‌فرض نشانی مطلق را می‌سنجد، پس هر کاربر
 *    واقعی «امضای نامعتبر» می‌گرفت.
 *
 *    درسش این است: تست نباید ورودی را جور دیگری از کدِ واقعی بسازد.
 *    بررسی «پیوند خودِ اعلان کار می‌کند» پایین‌تر همین را می‌بندد.
 */
function verificationLink(User $user, ?string $email = null): string
{
    return URL::temporarySignedRoute(
        'api.auth.email.verify',
        now()->addMinutes(60),
        [
            'id' => $user->id,
            'hash' => sha1($email ?? $user->email),
        ],
        absolute: false,
    );
}

/** استخراج نشانی دکمه از ایمیل تأیید. */
function linkFromNotification(User $user): string
{
    $mail = (new VerifyEmailNotification('fa'))->toMail($user);

    /* نشانی دکمه به صفحه‌ی فرانت می‌رود و مسیر API در پارامتر `path` است */
    parse_str((string) parse_url($mail->actionUrl, PHP_URL_QUERY), $query);

    return $query['path'] ?? '';
}

describe('ارسال', function () {
    it('پس از ثبت‌نام فرستاده می‌شود', function () {
        Notification::fake();

        $this->postJson('/api/v1/auth/register', [
            'name' => 'کاربر تازه',
            'email' => 'fresh@example.test',
            'password' => 'Kh0rshid7Baran',
            'password_confirmation' => 'Kh0rshid7Baran',
            'accept_terms' => true,
        ])->assertCreated();

        Notification::assertSentTo(
            User::query()->where('email', 'fresh@example.test')->sole(),
            VerifyEmailNotification::class,
        );
    });

    it('کاربر واردشده می‌تواند دوباره درخواست بدهد', function () {
        Notification::fake();

        $user = User::factory()->unverified()->create();

        $this->actingAs($user)
            ->postJson('/api/v1/auth/email/resend')
            ->assertOk();

        Notification::assertSentTo($user, VerifyEmailNotification::class);
    });

    it('برای حساب تأییدشده ایمیلی نمی‌رود', function () {
        Notification::fake();

        $user = User::factory()->create(['email_verified_at' => now()]);

        $this->actingAs($user)
            ->postJson('/api/v1/auth/email/resend')
            ->assertOk();

        Notification::assertNothingSentTo($user);
    });

    it('مهمان نمی‌تواند درخواست بدهد', function () {
        $this->postJson('/api/v1/auth/email/resend')->assertUnauthorized();
    });

    /*
     * ⚠️ ارسال ایمیل نباید ثبت‌نام را بشکند.
     *
     *    اگر سرویس ایمیل قطع باشد، حساب باید ساخته شود و کاربر وارد
     *    شود؛ وگرنه خطا می‌بیند در حالی که حسابش هست و دفعه‌ی بعد
     *    «این ایمیل قبلاً ثبت شده» می‌گیرد.
     */
    it('شکست ارسال، ثبت‌نام را نمی‌شکند', function () {
        Notification::fake();
        Notification::shouldReceive('send')->andThrow(new RuntimeException('SMTP down'));

        $this->postJson('/api/v1/auth/register', [
            'name' => 'کاربر مقاوم',
            'email' => 'resilient@example.test',
            'password' => 'Kh0rshid7Baran',
            'password_confirmation' => 'Kh0rshid7Baran',
            'accept_terms' => true,
        ])->assertCreated();

        expect(User::query()->where('email', 'resilient@example.test')->exists())->toBeTrue();
    });
});

describe('پیوند تأیید', function () {
    it('با پیوند درست، ایمیل تأیید می‌شود', function () {
        $user = User::factory()->unverified()->create();

        $this->getJson(verificationLink($user))->assertOk();

        expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
    });

    /*
     * ⚠️ مهم‌ترین بررسی این فایل.
     *
     *    بدون امضا، هر کسی با حدس‌زدن شناسه می‌توانست ایمیل دیگران را
     *    «تأیید» کند.
     */
    it('پیوند بدون امضا رد می‌شود', function () {
        $user = User::factory()->unverified()->create();

        $this->getJson("/api/v1/auth/email/verify/{$user->id}/".sha1($user->email))
            ->assertForbidden();

        expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
    });

    it('پیوند دست‌کاری‌شده رد می‌شود', function () {
        $user = User::factory()->unverified()->create();

        $this->getJson(verificationLink($user).'&extra=1')->assertForbidden();

        expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
    });

    /*
     * ⚠️ هَش ایمیل جدا از امضا بررسی می‌شود.
     *
     *    امضا فقط می‌گوید پارامترها دست‌نخورده‌اند. اگر کاربر بعد از
     *    درخواست ایمیلش را عوض کند، پیوند قدیمی نباید ایمیل تازه را
     *    تأیید کند.
     */
    it('پیوند پس از تغییر ایمیل بی‌اثر می‌شود', function () {
        $user = User::factory()->unverified()->create(['email' => 'old@example.test']);
        $link = verificationLink($user, 'old@example.test');

        $user->update(['email' => 'new@example.test']);

        $this->getJson($link)->assertForbidden();

        expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
    });

    it('پیوند منقضی رد می‌شود', function () {
        $user = User::factory()->unverified()->create();
        $link = verificationLink($user);

        $this->travel(61)->minutes();

        $this->getJson($link)->assertForbidden();

        expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
    });

    it('کلیک دوباره روی همان پیوند مشکلی نمی‌سازد', function () {
        $user = User::factory()->unverified()->create();
        $link = verificationLink($user);

        $this->getJson($link)->assertOk();
        $this->getJson($link)->assertOk();

        expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
    });

    /*
     * ⚠️ این بررسی، تست‌های بالا را از خیال‌بافی نجات می‌دهد.
     *
     *    بقیه پیوند را خودشان می‌سازند؛ این یکی همان رشته‌ای را
     *    می‌گیرد که در ایمیل کاربر می‌نشیند. اگر روزی شکل امضا یا
     *    ساختار نشانی عوض شود، اینجا می‌شکند حتی اگر بقیه سبز بمانند.
     */
    it('پیوندی که در ایمیل می‌رود واقعاً کار می‌کند', function () {
        config()->set('services.frontend.url', 'http://127.0.0.1:3100');

        $user = User::factory()->unverified()->create();

        $path = linkFromNotification($user);

        expect($path)->not->toBe('');

        $this->getJson($path)->assertOk();

        expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
    });

    it('شناسه‌ی ناموجود پاسخ ۴۰۳ می‌گیرد، نه ۵۰۰', function () {
        $link = URL::temporarySignedRoute(
            'api.auth.email.verify',
            now()->addMinutes(60),
            ['id' => 999999, 'hash' => sha1('ghost@example.test')],
        );

        $this->getJson($link)->assertForbidden();
    });
});
