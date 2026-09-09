<?php

/**
 * بنرهای صفحه‌ی اصلی — از تقویم نمایش تا مدیریت در پنل.
 */

use App\Models\Banner;

/** یک بدنه‌ی معتبر که هر بررسی می‌تواند بخشی از آن را خراب کند. */
function bannerPayload(array $overrides = []): array
{
    return array_merge([
        'placement' => 'hero',
        'theme' => 'primary',
        'title' => ['fa' => 'تخفیف پاییزی', 'en' => 'Autumn sale'],
        'href' => '/products?on_sale=1',
    ], $overrides);
}

describe('اندپوینت عمومی', function () {
    it('بنرها را بر اساس جایگاه گروه‌بندی می‌کند', function () {
        Banner::factory()->count(2)->create(['placement' => 'hero']);
        Banner::factory()->create(['placement' => 'promo']);

        $response = $this->getJson('/api/v1/banners')->assertOk();

        expect($response->json('data.hero'))->toHaveCount(2)
            ->and($response->json('data.promo'))->toHaveCount(1);
    });

    it('برای مهمان بدون ورود در دسترس است', function () {
        Banner::factory()->create();

        $this->getJson('/api/v1/banners')->assertOk();
    });

    /*
     * ⚠️ هسته‌ی کاری که بنرهای پویا برایش ساخته شدند: کمپین باید خودش
     *    سر تاریخ ظاهر و ناپدید شود، نه اینکه کسی نیمه‌شب دیپلوی کند.
     */
    it('بنر خاموش را نشان نمی‌دهد', function () {
        Banner::factory()->create(['is_active' => false]);

        expect($this->getJson('/api/v1/banners')->json('data.hero'))->toBeEmpty();
    });

    it('بنری که هنوز شروع نشده را نشان نمی‌دهد', function () {
        Banner::factory()->create(['starts_at' => now()->addWeek()]);

        expect($this->getJson('/api/v1/banners')->json('data.hero'))->toBeEmpty();
    });

    it('بنری که تاریخش گذشته را نشان نمی‌دهد', function () {
        Banner::factory()->create(['ends_at' => now()->subDay()]);

        expect($this->getJson('/api/v1/banners')->json('data.hero'))->toBeEmpty();
    });

    /* تاریخ خالی یعنی «بی‌قید»، نه «هرگز» */
    it('بنر بدون تاریخ همیشه دیده می‌شود', function () {
        Banner::factory()->create(['starts_at' => null, 'ends_at' => null]);

        expect($this->getJson('/api/v1/banners')->json('data.hero'))->toHaveCount(1);
    });

    it('بنری که در بازه است را نشان می‌دهد', function () {
        Banner::factory()->create([
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDay(),
        ]);

        expect($this->getJson('/api/v1/banners')->json('data.hero'))->toHaveCount(1);
    });

    it('به ترتیب sort_order می‌دهد', function () {
        Banner::factory()->create(['sort_order' => 2, 'href' => '/c']);
        Banner::factory()->create(['sort_order' => 0, 'href' => '/a']);
        Banner::factory()->create(['sort_order' => 1, 'href' => '/b']);

        $hrefs = collect($this->getJson('/api/v1/banners')->json('data.hero'))
            ->pluck('href')->all();

        expect($hrefs)->toBe(['/a', '/b', '/c']);
    });

    it('متن را به زبان درخواستی می‌دهد', function () {
        Banner::factory()->create([
            'title' => ['fa' => 'سلام', 'en' => 'Hello'],
        ]);

        expect($this->getJson('/api/v1/banners', ['Accept-Language' => 'en'])
            ->json('data.hero.0.title'))->toBe('Hello');

        expect($this->getJson('/api/v1/banners', ['Accept-Language' => 'fa'])
            ->json('data.hero.0.title'))->toBe('سلام');
    });

    /*
     * ⚠️ متن‌های خالی باید null باشند نه رشته‌ی تهی.
     *
     *    ریسورس رشته‌ی خالی را «مقدار دارد» می‌بیند و کامپوننت یک
     *    برچسب خالی رندر می‌کرد که فقط فاصله می‌گرفت.
     */
    it('فیلد خالی را null می‌دهد نه رشته‌ی تهی', function () {
        Banner::factory()->create(['badge' => null, 'subtitle' => null]);

        $banner = $this->getJson('/api/v1/banners')->json('data.hero.0');

        expect($banner['badge'])->toBeNull()
            ->and($banner['subtitle'])->toBeNull();
    });
});

describe('مدیریت بنر', function () {
    it('برای کاربر عادی بسته است', function () {
        actingAsCustomer();

        $this->getJson('/api/v1/admin/banners')->assertForbidden();
        $this->postJson('/api/v1/admin/banners', bannerPayload())->assertForbidden();
    });

    it('بنر تازه می‌سازد', function () {
        actingAsAdmin();

        $this->postJson('/api/v1/admin/banners', bannerPayload())
            ->assertCreated()
            ->assertJsonPath('data.state', 'live');

        expect(Banner::count())->toBe(1);
    });

    /*
     * ⚠️ مهم‌ترین بررسی امنیتی این فایل.
     *
     *    بنر صفحه‌ی اصلی پربازدیدترین لینک سایت است. اگر مقصد بیرونی
     *    پذیرفته شود، کسی که به حساب مدیر رسیده می‌تواند همه‌ی
     *    بازدیدکننده‌ها را جای دیگری بفرستد.
     *
     *    «//evil.example» جداگانه بررسی می‌شود چون شبیه نشانی کامل
     *    نیست ولی مرورگر آن را نشانی بیرونی می‌فهمد.
     */
    it('مقصد بیرونی را رد می‌کند', function () {
        actingAsAdmin();

        foreach (['https://evil.example', '//evil.example', 'javascript:alert(1)', 'products'] as $href) {
            $this->postJson('/api/v1/admin/banners', bannerPayload(['href' => $href]))
                ->assertStatus(422)
                ->assertJsonValidationErrors('href');
        }

        expect(Banner::count())->toBe(0);
    });

    it('عنوان فارسی را اجباری می‌داند ولی انگلیسی را نه', function () {
        actingAsAdmin();

        $this->postJson('/api/v1/admin/banners', bannerPayload(['title' => ['fa' => '', 'en' => 'X']]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('title.fa');

        $this->postJson('/api/v1/admin/banners', bannerPayload(['title' => ['fa' => 'سلام', 'en' => '']]))
            ->assertCreated();
    });

    it('تاریخ پایان پیش از شروع را رد می‌کند', function () {
        actingAsAdmin();

        $this->postJson('/api/v1/admin/banners', bannerPayload([
            'starts_at' => now()->addWeek()->toIso8601String(),
            'ends_at' => now()->addDay()->toIso8601String(),
        ]))->assertStatus(422)->assertJsonValidationErrors('ends_at');
    });

    it('نام آیکون بی‌شکل را رد می‌کند', function () {
        actingAsAdmin();

        $this->postJson('/api/v1/admin/banners', bannerPayload(['icon' => 'Washing Machine!']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('icon');
    });

    /*
     * ⚠️ فیلد چندزبانه‌ی کاملاً خالی باید null ذخیره شود.
     *
     *    فرم پنل همیشه هر دو کلید را می‌فرستد حتی وقتی خالی‌اند؛ اگر
     *    همان‌طور ذخیره شود، `['fa' => '', 'en' => '']` در دیتابیس
     *    می‌نشیند و بنر یک برچسب خالی می‌گیرد.
     */
    it('فیلد چندزبانه‌ی خالی را null ذخیره می‌کند', function () {
        actingAsAdmin();

        $this->postJson('/api/v1/admin/banners', bannerPayload([
            'badge' => ['fa' => '', 'en' => ''],
            'subtitle' => ['fa' => '', 'en' => '  '],
        ]))->assertCreated();

        $banner = Banner::sole();
        expect($banner->badge)->toBeNull()
            ->and($banner->subtitle)->toBeNull();
    });

    it('ویرایش، ترجمه‌ی هر دو زبان را نگه می‌دارد', function () {
        $banner = Banner::factory()->create();

        actingAsAdmin();

        $this->putJson("/api/v1/admin/banners/{$banner->id}", bannerPayload([
            'title' => ['fa' => 'تازه', 'en' => 'Fresh'],
        ]))->assertOk();

        expect($banner->fresh()->title)->toBe(['fa' => 'تازه', 'en' => 'Fresh']);
    });

    it('با toggle روشن و خاموش می‌شود', function () {
        $banner = Banner::factory()->create(['is_active' => true]);

        actingAsAdmin();

        $this->patchJson("/api/v1/admin/banners/{$banner->id}/toggle")
            ->assertOk()
            ->assertJsonPath('data.state', 'disabled');

        $this->patchJson("/api/v1/admin/banners/{$banner->id}/toggle")
            ->assertOk()
            ->assertJsonPath('data.state', 'live');
    });

    it('بنر را حذف می‌کند', function () {
        $banner = Banner::factory()->create();

        actingAsAdmin();

        $this->deleteJson("/api/v1/admin/banners/{$banner->id}")->assertOk();

        expect(Banner::count())->toBe(0);
    });

    /*
     * ⚠️ وضعیت محاسبه‌شده باید بگوید *چرا* بنر دیده نمی‌شود.
     *
     *    بدون آن، مدیر بنری با تیک «فعال» می‌دید که در سایت نبود و
     *    هیچ راهی نداشت بفهمد تاریخش گذشته یا هنوز نرسیده.
     */
    it('چهار وضعیت را درست گزارش می‌کند', function () {
        $cases = [
            'live' => ['is_active' => true],
            'disabled' => ['is_active' => false],
            'scheduled' => ['is_active' => true, 'starts_at' => now()->addWeek()],
            'expired' => ['is_active' => true, 'ends_at' => now()->subDay()],
        ];

        foreach ($cases as $expected => $attributes) {
            expect(Banner::factory()->make($attributes)->state())->toBe($expected);
        }
    });

    it('گزینه‌های فرم را همراه فهرست می‌دهد', function () {
        actingAsAdmin();

        $response = $this->getJson('/api/v1/admin/banners')->assertOk();

        expect($response->json('meta.placements'))->toHaveCount(2)
            ->and($response->json('meta.themes'))->toHaveCount(5);
    });

    it('با placement فیلتر می‌کند', function () {
        Banner::factory()->count(2)->create(['placement' => 'hero']);
        Banner::factory()->create(['placement' => 'promo']);

        actingAsAdmin();

        expect($this->getJson('/api/v1/admin/banners?placement=promo')->json('data'))
            ->toHaveCount(1);
    });

    /* فرم پنل مقدار خام دوزبانه می‌خواهد، نه متن ترجمه‌شده */
    it('در پنل ترجمه‌ها را خام می‌دهد', function () {
        Banner::factory()->create(['title' => ['fa' => 'سلام', 'en' => 'Hello']]);

        actingAsAdmin();

        expect($this->getJson('/api/v1/admin/banners')->json('data.0.title'))
            ->toBe(['fa' => 'سلام', 'en' => 'Hello']);
    });
});
