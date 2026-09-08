<?php

/**
 * اعتبارسنجی کد تخفیف روی سبد.
 * ---------------------------------------------------------------------------
 * هر شاخه‌ی رد در `CouponService::validate` اینجا یک تست دارد. این
 * پیام‌ها تنها چیزی‌اند که کاربر می‌بیند و تفکیکشان مهم است: «مهلت
 * تمام شده» با «ظرفیت تکمیل» فرق دارد و کاربر بر اساس آن تصمیم
 * می‌گیرد کد دیگری امتحان کند یا نه.
 */

use App\Models\Cart;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;

/** سبدی با یک قلم به مبلغ مشخص. */
function cartWorth(User $user, int $rials): Cart
{
    $product = Product::factory()->create(['price' => $rials, 'stock' => 10]);

    $cart = Cart::query()->create(['user_id' => $user->id]);
    $cart->items()->create([
        'product_id' => $product->id,
        'quantity' => 1,
        'price_at_add' => $product->price,
    ]);

    return $cart;
}

describe('اعمال کد تخفیف', function () {
    it('کد معتبر را می‌پذیرد و تخفیف را حساب می‌کند', function () {
        $user = actingAsCustomer();
        cartWorth($user, 10_000_000);
        $coupon = Coupon::factory()->create(['value' => 20]);

        $response = $this->postJson('/api/v1/cart/coupon', ['code' => $coupon->code]);

        $response->assertOk()
            ->assertJsonPath('data.coupon.code', $coupon->code)
            ->assertJsonPath('data.coupon.discountAmount', 2_000_000)
            ->assertJsonPath('data.summary.discount', 2_000_000);
    });

    /*
     * ⚠️ کد باید بدون حساسیت به بزرگی و کوچکی حروف کار کند.
     *
     *    مدیر «Summer25» می‌سازد و کاربر «summer25» تایپ می‌کند؛ بدون
     *    نرمال‌سازی، هیچ‌کدام نمی‌فهمیدند چرا کد کار نمی‌کند.
     */
    it('حروف کوچک را هم می‌پذیرد', function () {
        $user = actingAsCustomer();
        cartWorth($user, 10_000_000);
        $coupon = Coupon::factory()->create(['code' => 'SUMMER25']);

        $this->postJson('/api/v1/cart/coupon', ['code' => 'summer25'])
            ->assertOk()
            ->assertJsonPath('data.coupon.code', 'SUMMER25');

        expect($coupon->fresh())->not->toBeNull();
    });

    it('کد ناموجود را رد می‌کند', function () {
        $user = actingAsCustomer();
        cartWorth($user, 10_000_000);

        $this->postJson('/api/v1/cart/coupon', ['code' => 'NOSUCHCODE'])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'COUPON_INVALID');
    });

    it('کد منقضی را رد می‌کند', function () {
        $user = actingAsCustomer();
        cartWorth($user, 10_000_000);
        $coupon = Coupon::factory()->expired()->create();

        $this->postJson('/api/v1/cart/coupon', ['code' => $coupon->code])
            ->assertStatus(422);
    });

    it('کد شروع‌نشده را رد می‌کند', function () {
        $user = actingAsCustomer();
        cartWorth($user, 10_000_000);
        $coupon = Coupon::factory()->scheduled()->create();

        $this->postJson('/api/v1/cart/coupon', ['code' => $coupon->code])
            ->assertStatus(422);
    });

    it('کد با ظرفیت تکمیل را رد می‌کند', function () {
        $user = actingAsCustomer();
        cartWorth($user, 10_000_000);
        $coupon = Coupon::factory()->exhausted()->create();

        $this->postJson('/api/v1/cart/coupon', ['code' => $coupon->code])
            ->assertStatus(422);
    });

    it('کد غیرفعال را رد می‌کند', function () {
        $user = actingAsCustomer();
        cartWorth($user, 10_000_000);
        $coupon = Coupon::factory()->create(['is_active' => false]);

        $this->postJson('/api/v1/cart/coupon', ['code' => $coupon->code])
            ->assertStatus(422);
    });

    it('سبد زیر حداقل مبلغ را رد می‌کند', function () {
        $user = actingAsCustomer();
        cartWorth($user, 1_000_000);
        $coupon = Coupon::factory()->create(['min_order_total' => 10_000_000]);

        $this->postJson('/api/v1/cart/coupon', ['code' => $coupon->code])
            ->assertStatus(422);
    });

    /*
     * ⚠️ سقف «هر کاربر یک بار» بر پایه‌ی رکورد مصرف است، نه شمارنده‌ی
     *    کلی. بدون جدول coupon_usages این قاعده اصلاً قابل پیاده‌سازی
     *    نبود.
     */
    it('کاربری که قبلاً استفاده کرده را رد می‌کند', function () {
        $user = actingAsCustomer();
        cartWorth($user, 10_000_000);
        $coupon = Coupon::factory()->create(['per_user_limit' => 1]);

        CouponUsage::query()->create([
            'coupon_id' => $coupon->id,
            'user_id' => $user->id,
            'order_id' => null,
            'discount_amount' => 100,
        ]);

        $this->postJson('/api/v1/cart/coupon', ['code' => $coupon->code])
            ->assertStatus(422);
    });

    it('کاربر دیگر همان کد را می‌تواند استفاده کند', function () {
        $other = User::factory()->create();
        $coupon = Coupon::factory()->create(['per_user_limit' => 1]);

        CouponUsage::query()->create([
            'coupon_id' => $coupon->id,
            'user_id' => $other->id,
            'order_id' => null,
            'discount_amount' => 100,
        ]);

        $user = actingAsCustomer();
        cartWorth($user, 10_000_000);

        $this->postJson('/api/v1/cart/coupon', ['code' => $coupon->code])
            ->assertOk();
    });
});

describe('برداشتن کد تخفیف', function () {
    it('کوپن و تخفیف را از سبد پاک می‌کند', function () {
        $user = actingAsCustomer();
        $cart = cartWorth($user, 10_000_000);
        $coupon = Coupon::factory()->create();
        $cart->update(['coupon_id' => $coupon->id]);

        $this->deleteJson('/api/v1/cart/coupon')
            ->assertOk()
            ->assertJsonPath('data.coupon', null)
            ->assertJsonPath('data.summary.discount', 0);

        expect($cart->fresh()->coupon_id)->toBeNull();
    });
});

describe('نمایش سبد با کوپن', function () {
    /*
     * ⚠️ نمایش سبد نباید به‌خاطر کوپنِ باطل‌شده خطا بدهد.
     *
     *    اگر کوپن بین اعمال و بازدید بعدی از اعتبار بیفتد، فقط ناپدید
     *    می‌شود. پیام صریح را کاربر هنگام ثبت سفارش می‌گیرد، جایی که
     *    واقعاً اهمیت دارد.
     */
    it('کوپن باطل‌شده را بی‌صدا نادیده می‌گیرد', function () {
        $user = actingAsCustomer();
        $cart = cartWorth($user, 10_000_000);
        $coupon = Coupon::factory()->expired()->create();
        $cart->update(['coupon_id' => $coupon->id]);

        $this->getJson('/api/v1/cart')
            ->assertOk()
            ->assertJsonPath('data.coupon', null)
            ->assertJsonPath('data.summary.discount', 0);
    });

    it('مجموع کل را با تخفیف حساب می‌کند', function () {
        $user = actingAsCustomer();
        $cart = cartWorth($user, 10_000_000);
        $coupon = Coupon::factory()->fixed(1_000_000)->create();
        $cart->update(['coupon_id' => $coupon->id]);

        $response = $this->getJson('/api/v1/cart')->assertOk();

        $summary = $response->json('data.summary');

        expect($summary['total'])
            ->toBe($summary['subtotal'] - $summary['discount'] + $summary['shipping']);
    });
});

describe('پاکسازی رکورد مصرف', function () {
    /*
     * ⚠️ حذف سفارش نباید رکورد مصرف را از بین ببرد (`nullOnDelete`).
     *
     *    اگر cascade بود، کاربر می‌توانست کوپن «یک‌بارمصرف» را دوباره
     *    خرج کند: کافی بود سفارشش لغو و حذف شود.
     */
    it('حذف سفارش، رکورد مصرف را نگه می‌دارد', function () {
        $user = User::factory()->create();
        $coupon = Coupon::factory()->create();

        $order = Order::factory()->create(['user_id' => $user->id]);

        $usage = CouponUsage::query()->create([
            'coupon_id' => $coupon->id,
            'user_id' => $user->id,
            'order_id' => $order->id,
            'discount_amount' => 500,
        ]);

        $order->delete();

        expect($usage->fresh())->not->toBeNull()
            ->and($usage->fresh()->order_id)->toBeNull();
    });
});
