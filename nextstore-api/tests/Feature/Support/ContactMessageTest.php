<?php

/**
 * فرم «تماس با ما» — از ارسال مهمان تا صندوق مدیر.
 */

use App\Models\ContactMessage;
use App\Models\User;

/** یک بدنه‌ی معتبر که هر بررسی می‌تواند بخشی از آن را خراب کند. */
function contactPayload(array $overrides = []): array
{
    return array_merge([
        'name' => 'سارا محمدی',
        'email' => 'sara@example.test',
        'subject' => 'پرسش درباره‌ی زمان ارسال',
        'message' => 'سلام، سفارشی که دیروز ثبت کردم چند روز طول می‌کشد؟',
    ], $overrides);
}

describe('ارسال پیام', function () {
    it('مهمان بدون حساب می‌تواند پیام بفرستد', function () {
        $response = $this->postJson('/api/v1/contact', contactPayload());

        $response->assertCreated();

        $message = ContactMessage::sole();
        expect($message->name)->toBe('سارا محمدی')
            ->and($message->user_id)->toBeNull()
            ->and($message->is_read)->toBeFalse();
    });

    /*
     * ⚠️ نام و ایمیلِ *فرم* ذخیره می‌شوند، نه آن‌چه در حساب است.
     *
     *    کسی ممکن است از حساب خودش درباره‌ی سفارش شخص دیگری بپرسد و
     *    بخواهد جواب به ایمیل دیگری برود. اگر مقدار حساب جایگزین
     *    می‌شد، پاسخ به آدرس اشتباه می‌رفت.
     */
    it('برای کاربر واردشده حساب را ثبت می‌کند ولی نام و ایمیل فرم را نگه می‌دارد', function () {
        $user = User::factory()->create([
            'name' => 'نام حساب',
            'email' => 'account@example.test',
        ]);

        $this->actingAs($user, 'sanctum');

        $this->postJson('/api/v1/contact', contactPayload())->assertCreated();

        $message = ContactMessage::sole();
        expect($message->user_id)->toBe($user->id)
            ->and($message->name)->toBe('سارا محمدی')
            ->and($message->email)->toBe('sara@example.test');
    });

    it('فاصله‌ی اضافی را می‌برد و ایمیل را کوچک می‌کند', function () {
        $this->postJson('/api/v1/contact', contactPayload([
            'name' => '  سارا محمدی  ',
            'email' => '  SARA@Example.TEST ',
        ]))->assertCreated();

        $message = ContactMessage::sole();
        expect($message->name)->toBe('سارا محمدی')
            ->and($message->email)->toBe('sara@example.test');
    });

    it('نشانی IP را برای تشخیص هرزنامه نگه می‌دارد', function () {
        $this->postJson('/api/v1/contact', contactPayload())->assertCreated();

        expect(ContactMessage::sole()->ip)->not->toBeNull();
    });

    /*
     * ⚠️ پاسخ نباید شناسه برگرداند.
     *
     *    فرستنده هیچ راهی برای دیدن پیامش ندارد، پس شناسه فقط تعداد
     *    کل پیام‌ها را لو می‌دهد.
     */
    it('در پاسخ شناسه‌ای برنمی‌گرداند', function () {
        $response = $this->postJson('/api/v1/contact', contactPayload());

        $response->assertCreated()->assertJsonMissingPath('data.id');
        expect($response->json())->toHaveKey('message');
    });
});

describe('اعتبارسنجی', function () {
    it('نام و ایمیل و موضوع و متن را اجباری می‌داند', function () {
        $this->postJson('/api/v1/contact', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'subject', 'message']);
    });

    it('ایمیل بی‌شکل را رد می‌کند', function () {
        $this->postJson('/api/v1/contact', contactPayload(['email' => 'not-an-email']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');
    });

    it('متن کوتاه‌تر از ۱۰ نویسه را رد می‌کند', function () {
        $this->postJson('/api/v1/contact', contactPayload(['message' => 'کوتاه']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('message');
    });

    /*
     * ⚠️ پیام خلاصه‌ی لاراول («… (and 3 more errors)») نباید بیرون بیاید.
     *
     *    آن پسوند در کد فریم‌ورک hard-code است و ترجمه نمی‌شود؛ در
     *    رابط فارسی وسط جمله ظاهر می‌شد. هندلر `bootstrap/app.php`
     *    جایش پیام محلی‌شده می‌گذارد — و این بررسی جلوی برگشتنش را
     *    می‌گیرد.
     */
    it('پیام خطای چندگانه هیچ متن انگلیسی fallback ندارد', function () {
        $response = $this->postJson('/api/v1/contact', [])->assertStatus(422);

        expect($response->json('message'))->not->toContain('more error')
            ->and($response->json('error.code'))->toBe('VALIDATION_FAILED');
    });

    /* یک خطا پیام خودش را می‌گیرد، نه جمله‌ی کلی */
    it('وقتی فقط یک فیلد ایراد دارد پیام همان فیلد را می‌دهد', function () {
        $response = $this->postJson('/api/v1/contact', contactPayload(['email' => 'bad']))
            ->assertStatus(422);

        expect($response->json('message'))
            ->toBe($response->json('errors.email.0'));
    });
});

describe('صندوق مدیر', function () {
    it('برای کاربر عادی بسته است', function () {
        ContactMessage::factory()->create();

        actingAsCustomer();

        $this->getJson('/api/v1/admin/contact-messages')->assertForbidden();
    });

    it('پیش‌فرض فقط خوانده‌نشده‌ها را می‌دهد', function () {
        ContactMessage::factory()->count(2)->create();
        ContactMessage::factory()->read()->create();

        actingAsAdmin();

        $response = $this->getJson('/api/v1/admin/contact-messages')->assertOk();

        expect($response->json('data'))->toHaveCount(2)
            ->and($response->json('counts'))->toBe(['unread' => 2, 'read' => 1, 'all' => 3]);
    });

    it('با status=all همه را می‌دهد', function () {
        ContactMessage::factory()->count(2)->create();
        ContactMessage::factory()->read()->create();

        actingAsAdmin();

        expect($this->getJson('/api/v1/admin/contact-messages?status=all')->json('data'))
            ->toHaveCount(3);
    });

    it('در نام و ایمیل و موضوع جست‌وجو می‌کند', function () {
        ContactMessage::factory()->create(['subject' => 'مشکل در پرداخت آنلاین']);
        ContactMessage::factory()->create(['subject' => 'پرسش درباره‌ی گارانتی']);

        actingAsAdmin();

        $response = $this->getJson('/api/v1/admin/contact-messages?status=all&q=گارانتی');

        expect($response->json('data'))->toHaveCount(1)
            ->and($response->json('data.0.subject'))->toContain('گارانتی');
    });

    /*
     * ⚠️ IP فقط در نمای جزئیات فرستاده می‌شود.
     *
     *    در فهرست به کار نمی‌آید و بی‌دلیل داده‌ی شخصی را در هر پاسخ
     *    پخش می‌کند.
     */
    it('نشانی IP را در فهرست نمی‌فرستد ولی در جزئیات می‌فرستد', function () {
        $message = ContactMessage::factory()->create(['ip' => '203.0.113.9']);

        actingAsAdmin();

        $list = $this->getJson('/api/v1/admin/contact-messages?status=all');
        expect($list->json('data.0.ip'))->toBeNull();

        $detail = $this->getJson("/api/v1/admin/contact-messages/{$message->id}");
        expect($detail->json('data.ip'))->toBe('203.0.113.9');
    });

    it('باز کردن پیام آن را خوانده‌شده می‌کند و شمارنده را جابه‌جا می‌کند', function () {
        $message = ContactMessage::factory()->create();

        actingAsAdmin();

        $response = $this->getJson("/api/v1/admin/contact-messages/{$message->id}")->assertOk();

        expect($response->json('data.isRead'))->toBeTrue()
            ->and($response->json('counts'))->toBe(['unread' => 0, 'read' => 1, 'all' => 1])
            ->and($message->fresh()->read_at)->not->toBeNull();
    });

    /*
     * ⚠️ باز کردن دوباره نباید `read_at` را جلو ببرد.
     *
     *    تنها کاری که آن ستون می‌کند نشان‌دادن «چقدر طول کشید تا کسی
     *    ببیندش» است؛ به‌روزرسانی در هر بازدید همان را از بین می‌برد.
     */
    it('باز کردن دوباره زمان خواندن را عوض نمی‌کند', function () {
        $message = ContactMessage::factory()->read()->create();
        $original = $message->read_at;

        actingAsAdmin();

        $this->travel(1)->hours();
        $this->getJson("/api/v1/admin/contact-messages/{$message->id}")->assertOk();

        expect($message->fresh()->read_at->timestamp)->toBe($original->timestamp);
    });

    it('پیام را حذف می‌کند', function () {
        $message = ContactMessage::factory()->create();

        actingAsAdmin();

        $this->deleteJson("/api/v1/admin/contact-messages/{$message->id}")->assertOk();

        expect(ContactMessage::count())->toBe(0);
    });
});
