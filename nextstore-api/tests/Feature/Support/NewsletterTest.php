<?php

/**
 * خبرنامه — از عضویت مهمان تا لغو عضویت با توکن.
 * ---------------------------------------------------------------------------
 * ⚠️ این فرم یک بار **ساختگی** بود: سمت فرانت یک تأخیر می‌گذاشت،
 *    «عضو شدید» می‌گفت و ایمیل را دور می‌ریخت. این فایل همان را
 *    میخکوب می‌کند — اگر روزی مسیر برداشته شود، اینجا می‌شکند نه در
 *    سکوت.
 */

use App\Models\NewsletterSubscription;
use App\Models\User;

describe('عضویت', function () {
    it('مهمان بدون حساب می‌تواند عضو شود', function () {
        $this->postJson('/api/v1/newsletter', ['email' => 'reader@example.test'])
            ->assertCreated();

        $subscription = NewsletterSubscription::sole();

        expect($subscription->email)->toBe('reader@example.test')
            ->and($subscription->user_id)->toBeNull()
            ->and($subscription->isActive())->toBeTrue()
            ->and($subscription->token)->toHaveLength(64);
    });

    it('ایمیل با حروف بزرگ و فاصله نرمال می‌شود', function () {
        $this->postJson('/api/v1/newsletter', ['email' => '  Reader@Example.TEST  '])
            ->assertCreated();

        expect(NewsletterSubscription::sole()->email)->toBe('reader@example.test');
    });

    it('کاربر واردشده به عضویتش وصل می‌شود', function () {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/v1/newsletter', ['email' => 'me@example.test'])
            ->assertCreated();

        expect(NewsletterSubscription::sole()->user_id)->toBe($user->id);
    });

    /*
     * ⚠️ مهم‌ترین بررسی این فایل.
     *
     *    اگر ثبت دوباره خطا می‌داد، هر کسی می‌توانست با امتحان‌کردن
     *    ایمیل‌ها بفهمد چه کسانی مشترک خبرنامه‌اند. پاسخ باید دقیقاً
     *    همان پاسخ عضویت تازه باشد.
     */
    it('ثبت دوباره‌ی همان ایمیل، همان پاسخ موفق را می‌دهد', function () {
        $first = $this->postJson('/api/v1/newsletter', ['email' => 'twice@example.test']);
        $second = $this->postJson('/api/v1/newsletter', ['email' => 'twice@example.test']);

        expect($second->status())->toBe($first->status())
            ->and($second->json('message'))->toBe($first->json('message'))
            ->and(NewsletterSubscription::query()->count())->toBe(1);
    });

    it('توکن با ثبت دوباره عوض نمی‌شود', function () {
        $this->postJson('/api/v1/newsletter', ['email' => 'stable@example.test']);
        $token = NewsletterSubscription::sole()->token;

        $this->postJson('/api/v1/newsletter', ['email' => 'stable@example.test']);

        expect(NewsletterSubscription::sole()->token)->toBe($token);
    });

    it('ایمیل نامعتبر رد می‌شود', function () {
        $this->postJson('/api/v1/newsletter', ['email' => 'not-an-email'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        expect(NewsletterSubscription::query()->count())->toBe(0);
    });

    it('ایمیل خالی رد می‌شود', function () {
        $this->postJson('/api/v1/newsletter', ['email' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    });
});

describe('لغو عضویت', function () {
    it('با توکن درست، عضویت لغو می‌شود', function () {
        $this->postJson('/api/v1/newsletter', ['email' => 'bye@example.test']);
        $token = NewsletterSubscription::sole()->token;

        $this->deleteJson("/api/v1/newsletter/{$token}")->assertOk();

        expect(NewsletterSubscription::sole()->isActive())->toBeFalse();
    });

    /*
     * ⚠️ ردیف باقی می‌ماند، حذف نمی‌شود.
     *
     *    لغو باید یک واقعیت ثبت‌شده باشد، نه نبودِ داده — وگرنه یک
     *    ثبت‌نام تصادفی بعدی، کسی را که نخواسته بود دوباره به فهرست
     *    برمی‌گرداند بی‌آنکه ردی بماند.
     */
    it('ردیف پاک نمی‌شود، فقط علامت می‌خورد', function () {
        $this->postJson('/api/v1/newsletter', ['email' => 'trace@example.test']);
        $token = NewsletterSubscription::sole()->token;

        $this->deleteJson("/api/v1/newsletter/{$token}");

        expect(NewsletterSubscription::query()->count())->toBe(1)
            ->and(NewsletterSubscription::sole()->unsubscribed_at)->not->toBeNull();
    });

    it('عضویت لغوشده با ثبت دوباره فعال می‌شود', function () {
        $this->postJson('/api/v1/newsletter', ['email' => 'back@example.test']);
        $token = NewsletterSubscription::sole()->token;
        $this->deleteJson("/api/v1/newsletter/{$token}");

        $this->postJson('/api/v1/newsletter', ['email' => 'back@example.test'])->assertCreated();

        expect(NewsletterSubscription::sole()->isActive())->toBeTrue();
    });

    /*
     * توکن ناشناخته هم موفق است — کسی که روی لینک لغو کلیک می‌کند
     * می‌خواهد بیرون برود؛ «توکن نامعتبر» فقط نگرانش می‌کند. و پاسخ
     * متفاوت، توکن‌های معتبر را قابل تشخیص می‌کرد.
     */
    it('توکن ناشناخته هم پاسخ موفق می‌گیرد', function () {
        $this->deleteJson('/api/v1/newsletter/'.str_repeat('a', 64))->assertOk();
    });
});

describe('فهرست فعال‌ها', function () {
    it('scopeActive فقط عضویت‌های لغونشده را می‌دهد', function () {
        $this->postJson('/api/v1/newsletter', ['email' => 'active@example.test']);
        $this->postJson('/api/v1/newsletter', ['email' => 'gone@example.test']);

        $token = NewsletterSubscription::query()->where('email', 'gone@example.test')->sole()->token;
        $this->deleteJson("/api/v1/newsletter/{$token}");

        $active = NewsletterSubscription::query()->active()->pluck('email')->all();

        expect($active)->toBe(['active@example.test']);
    });
});
