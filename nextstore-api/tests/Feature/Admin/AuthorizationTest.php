<?php

/**
 * کنترل دسترسی — مرزهای امنیتی پروژه.
 * ---------------------------------------------------------------------------
 * ⚠️ این فایل مهم‌ترین تست‌های پروژه را دارد.
 *
 *    یک اشتباه در این مرزها یعنی مشتری می‌تواند سفارش دیگران را
 *    بخواند، یا کاربر عادی به پنل مدیریت برسد. برخلاف باگ‌های
 *    محاسباتی، این‌ها هیچ علامت بیرونی ندارند تا وقتی کسی سوءاستفاده
 *    کند.
 */

use App\Enums\UserRole;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\Ticket;
use App\Models\User;

/** مسیرهای پنل که هیچ‌کدام نباید برای غیرمدیر باز باشند. */
dataset('adminRoutes', [
    'داشبورد' => '/api/v1/admin/dashboard',
    'سفارش‌ها' => '/api/v1/admin/orders',
    'محصولات' => '/api/v1/admin/products',
    'مشتریان' => '/api/v1/admin/customers',
    'کوپن‌ها' => '/api/v1/admin/coupons',
    'تنظیمات' => '/api/v1/admin/settings',
    'صف پشتیبانی' => '/api/v1/admin/tickets',
    'تعدیل نظرات' => '/api/v1/admin/reviews',
]);

describe('دسترسی به پنل مدیریت', function () {
    it('مهمان را رد می‌کند', function (string $route) {
        $this->getJson($route)->assertUnauthorized();
    })->with('adminRoutes');

    /*
     * ⚠️ ۴۰۳ و نه ۴۰۴: کاربر واردشده است و هویتش را می‌شناسیم؛ فقط
     *    اجازه ندارد. تفکیک این دو برای کلاینت مهم است — ۴۰۳ یعنی
     *    «با حساب دیگری امتحان کن»، ۴۰۴ یعنی «این آدرس وجود ندارد».
     */
    it('مشتری واردشده را با ۴۰۳ رد می‌کند', function (string $route) {
        actingAsCustomer();

        $this->getJson($route)->assertForbidden();
    })->with('adminRoutes');

    it('مدیر را می‌پذیرد', function (string $route) {
        actingAsAdmin();

        $this->getJson($route)->assertOk();
    })->with('adminRoutes');
});

describe('جداسازی داده‌ی مشتریان', function () {
    /*
     * ⚠️ IDOR کلاسیک: تغییر شماره در آدرس درخواست.
     *
     *    بدون شروع کوئری از `$user->orders()`، کاربر می‌توانست با
     *    حدس زدن شماره‌ی سفارش، آدرس، شماره تماس و اقلام خرید دیگران
     *    را ببیند.
     */
    it('سفارش کاربر دیگر ۴۰۴ می‌دهد', function () {
        $someoneElse = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $someoneElse->id]);

        actingAsCustomer();

        $this->getJson("/api/v1/orders/{$order->order_number}")->assertNotFound();
    });

    /*
     * ⚠️ ۴۰۴ و نه ۴۰۳ — عمدی.
     *
     *    ۴۰۳ تأیید می‌کند که آن شماره وجود دارد و همین یک بیت اطلاعات،
     *    شمارش سفارش‌های فروشگاه را ممکن می‌کند.
     */
    it('تیکت کاربر دیگر ۴۰۴ می‌دهد نه ۴۰۳', function () {
        $someoneElse = User::factory()->create();

        $ticket = Ticket::query()->create([
            'user_id' => $someoneElse->id,
            'ticket_number' => Ticket::generateNumber(),
            'subject' => 'گفتگوی خصوصی',
            'department' => 'other',
            'priority' => 'normal',
            'status' => 'open',
        ]);

        actingAsCustomer();

        $this->getJson("/api/v1/tickets/{$ticket->ticket_number}")->assertNotFound();
    });

    it('کاربر سفارش خودش را می‌بیند', function () {
        $user = actingAsCustomer();
        $order = Order::factory()->create(['user_id' => $user->id]);

        $this->getJson("/api/v1/orders/{$order->order_number}")
            ->assertOk()
            ->assertJsonPath('data.orderNumber', $order->order_number);
    });
});

describe('محافظ‌های پنل مدیریت', function () {
    /*
     * ⚠️ مدیر نباید بتواند حساب کارکنان را ببندد.
     *
     *    بدون این شرط، یک مدیر می‌توانست دسترسی مدیر دیگری — یا خودش —
     *    را قفل کند و راه بازگشتی نمی‌ماند.
     */
    it('حساب کارکنان را نمی‌شود غیرفعال کرد', function () {
        $admin = actingAsAdmin();

        $this->patchJson("/api/v1/admin/customers/{$admin->id}/status", ['is_active' => false])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'CUSTOMER_IS_STAFF');

        expect($admin->fresh()->is_active)->toBeTrue();
    });

    it('حساب مشتری را می‌شود غیرفعال کرد', function () {
        actingAsAdmin();
        $customer = User::factory()->create(['role' => UserRole::Customer]);

        $this->patchJson("/api/v1/admin/customers/{$customer->id}/status", ['is_active' => false])
            ->assertOk();

        expect($customer->fresh()->is_active)->toBeFalse();
    });

    /*
     * ⚠️ کوپن مصرف‌شده حذف نمی‌شود.
     *
     *    رکوردهای مصرف با cascade پاک می‌شدند و گزارش «چقدر تخفیف
     *    دادیم» بی‌صدا کم‌گزارش می‌شد.
     */
    it('کوپن مصرف‌شده حذف نمی‌شود', function () {
        actingAsAdmin();
        $coupon = Coupon::factory()->create();
        $coupon->forceFill(['used_count' => 3])->save();

        $this->deleteJson("/api/v1/admin/coupons/{$coupon->id}")
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'COUPON_HAS_USAGE');

        expect(Coupon::query()->find($coupon->id))->not->toBeNull();
    });

    it('کوپن بدون مصرف حذف می‌شود', function () {
        actingAsAdmin();
        $coupon = Coupon::factory()->create();

        $this->deleteJson("/api/v1/admin/coupons/{$coupon->id}")->assertOk();

        expect(Coupon::query()->find($coupon->id))->toBeNull();
    });
});

describe('نشت اطلاعات', function () {
    /*
     * ⚠️ هش رمز و توکن هرگز نباید از هیچ اندپوینتی بیرون بروند.
     *
     *    `$hidden` مدل این را می‌گیرد، ولی یک Resource تازه که به‌جای
     *    فیلدهای انتخابی کل مدل را برگرداند، آن را دور می‌زند.
     */
    it('پروفایل مشتری در پنل رمز را لو نمی‌دهد', function () {
        actingAsAdmin();
        $customer = User::factory()->create(['role' => UserRole::Customer]);

        $response = $this->getJson("/api/v1/admin/customers/{$customer->id}")->assertOk();

        $body = $response->getContent();

        expect($body)->not->toContain('$2y$')
            ->and($body)->not->toContain('remember_token')
            ->and($response->json('data.password'))->toBeNull();
    });

    it('نظر عمومی ایمیل نویسنده را لو نمی‌دهد', function () {
        $product = Product::factory()->create();
        $author = User::factory()->create(['email' => 'private@example.test']);

        Review::query()->create([
            'product_id' => $product->id,
            'user_id' => $author->id,
            'rating' => 5,
            'comment' => 'عالی بود',
            'is_approved' => true,
            'approved_at' => now(),
        ]);

        $response = $this->getJson("/api/v1/products/{$product->slug}/reviews")->assertOk();

        expect($response->getContent())->not->toContain('private@example.test');
    });
});
