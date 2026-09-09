<?php

/**
 * ثبت سفارش — قلب مالی پروژه.
 * ---------------------------------------------------------------------------
 * این فایل دفاع‌هایی را می‌آزماید که اگر بشکنند، پول واقعی از دست
 * می‌رود یا مشتری چیزی می‌خرد که موجود نیست.
 */

use App\Enums\OrderStatus;
use App\Models\Address;
use App\Models\Cart;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;

/** ساخت سبدی با یک قلم و آدرس، برای کاربر داده‌شده. */
function cartWith(User $user, Product $product, int $quantity = 1): Cart
{
    $cart = Cart::query()->create(['user_id' => $user->id]);

    $cart->items()->create([
        'product_id' => $product->id,
        'quantity' => $quantity,
        'price_at_add' => $product->price,
    ]);

    return $cart;
}

describe('ثبت سفارش', function () {
    it('سفارش را با مبالغ درست می‌سازد', function () {
        $user = actingAsCustomer();
        $product = Product::factory()->create(['price' => 10_000_000, 'stock' => 5]);
        $address = Address::factory()->create(['user_id' => $user->id]);
        cartWith($user, $product, 2);

        $response = $this->postJson('/api/v1/orders', [
            'address_id' => $address->id,
            'shipping_method' => 'standard',
        ]);

        $response->assertCreated();

        $order = Order::query()->first();

        expect($order->subtotal)->toBe(20_000_000)
            ->and($order->discount)->toBe(0)
            ->and($order->total)->toBe($order->subtotal + $order->shipping_cost)
            ->and($order->status)->toBe(OrderStatus::Pending);
    });

    /*
     * ⚠️ مهم‌ترین تست این فایل.
     *
     *    قیمت هر قلم هنگام ثبت سفارش دوباره **از دیتابیس** خوانده
     *    می‌شود، نه از `price_at_add` سبد. بدون این، کاربر می‌توانست
     *    ردیف سبد را دستکاری کند و محصول ۹۰ میلیونی را ۱۰۰۰ تومان
     *    بخرد.
     */
    it('قیمت را از دیتابیس می‌خواند نه از سبد', function () {
        $user = actingAsCustomer();
        $product = Product::factory()->create(['price' => 10_000_000, 'stock' => 5]);
        $address = Address::factory()->create(['user_id' => $user->id]);

        $cart = cartWith($user, $product);

        /* شبیه‌سازی دستکاری: قیمت ذخیره‌شده در سبد را ناچیز می‌کنیم */
        $cart->items()->first()->update(['price_at_add' => 1_000]);

        $this->postJson('/api/v1/orders', [
            'address_id' => $address->id,
            'shipping_method' => 'standard',
        ])->assertCreated();

        expect(Order::query()->first()->subtotal)->toBe(10_000_000);
    });

    it('موجودی محصول را کم می‌کند', function () {
        $user = actingAsCustomer();
        $product = Product::factory()->create(['stock' => 10]);
        $address = Address::factory()->create(['user_id' => $user->id]);
        cartWith($user, $product, 3);

        $this->postJson('/api/v1/orders', [
            'address_id' => $address->id,
            'shipping_method' => 'standard',
        ])->assertCreated();

        expect($product->fresh()->stock)->toBe(7);
    });

    it('سفارش با موجودی ناکافی رد می‌شود', function () {
        $user = actingAsCustomer();
        $product = Product::factory()->create(['stock' => 1]);
        $address = Address::factory()->create(['user_id' => $user->id]);
        cartWith($user, $product, 5);

        $this->postJson('/api/v1/orders', [
            'address_id' => $address->id,
            'shipping_method' => 'standard',
        ])->assertStatus(422);

        /*
         * ⚠️ تراکنش باید کامل برگشت خورده باشد: نه سفارشی ساخته شده
         *    باشد و نه موجودی کم شده. اگر ثبت سفارش بدون تراکنش بود،
         *    قلم اول کم می‌شد و قلم دوم شکست می‌خورد — و انبار عددی
         *    نشان می‌داد که هیچ سفارشی پشتش نبود.
         */
        expect(Order::query()->count())->toBe(0)
            ->and($product->fresh()->stock)->toBe(1);
    });

    /*
     * ⚠️ آدرس کاربر دیگر نباید پذیرفته شود.
     *
     *    بدون این بررسی، کاربر با حدس زدن شناسه می‌توانست سفارشی به
     *    آدرس شخص دیگری ثبت کند — و آن شخص کالایی می‌گرفت که سفارش
     *    نداده بود.
     */
    it('آدرس کاربر دیگر را نمی‌پذیرد', function () {
        $user = actingAsCustomer();
        $product = Product::factory()->create();
        cartWith($user, $product);

        $someoneElse = Address::factory()->create();

        $this->postJson('/api/v1/orders', [
            'address_id' => $someoneElse->id,
            'shipping_method' => 'standard',
        ])->assertStatus(422);

        expect(Order::query()->count())->toBe(0);
    });

    it('سبد خالی سفارش نمی‌سازد', function () {
        $user = actingAsCustomer();
        $address = Address::factory()->create(['user_id' => $user->id]);
        Cart::query()->create(['user_id' => $user->id]);

        $this->postJson('/api/v1/orders', [
            'address_id' => $address->id,
            'shipping_method' => 'standard',
        ])->assertStatus(422);
    });

    it('مهمان نمی‌تواند سفارش ثبت کند', function () {
        $this->postJson('/api/v1/orders', [
            'address_id' => 1,
            'shipping_method' => 'standard',
        ])->assertUnauthorized();
    });

    it('سبد را پس از ثبت خالی می‌کند', function () {
        $user = actingAsCustomer();
        $product = Product::factory()->create(['stock' => 5]);
        $address = Address::factory()->create(['user_id' => $user->id]);
        $cart = cartWith($user, $product);

        $this->postJson('/api/v1/orders', [
            'address_id' => $address->id,
            'shipping_method' => 'standard',
        ])->assertCreated();

        expect($cart->fresh()->items()->count())->toBe(0);
    });
});

describe('ثبت سفارش با کد تخفیف', function () {
    it('تخفیف را روی سفارش اعمال می‌کند', function () {
        $user = actingAsCustomer();
        $product = Product::factory()->create(['price' => 10_000_000, 'stock' => 5]);
        $address = Address::factory()->create(['user_id' => $user->id]);
        $coupon = Coupon::factory()->create(['value' => 20]);

        $cart = cartWith($user, $product);
        $cart->update(['coupon_id' => $coupon->id]);

        $this->postJson('/api/v1/orders', [
            'address_id' => $address->id,
            'shipping_method' => 'standard',
        ])->assertCreated();

        $order = Order::query()->first();

        expect($order->discount)->toBe(2_000_000)
            ->and($order->coupon_code)->toBe($coupon->code)
            ->and($order->total)->toBe($order->subtotal - $order->discount + $order->shipping_cost);
    });

    it('مصرف کوپن را ثبت می‌کند', function () {
        $user = actingAsCustomer();
        $product = Product::factory()->create(['stock' => 5]);
        $address = Address::factory()->create(['user_id' => $user->id]);
        $coupon = Coupon::factory()->create();

        $cart = cartWith($user, $product);
        $cart->update(['coupon_id' => $coupon->id]);

        $this->postJson('/api/v1/orders', [
            'address_id' => $address->id,
            'shipping_method' => 'standard',
        ])->assertCreated();

        expect($coupon->fresh()->used_count)->toBe(1)
            ->and($coupon->usages()->count())->toBe(1);
    });

    /*
     * ⚠️ کوپنِ بین‌راه‌باطل‌شده نباید ثبت سفارش را بشکند.
     *
     *    بین اعمال روی سبد و پرداخت می‌تواند ساعت‌ها فاصله باشد.
     *    انداختن استثنا یعنی کاربری که سه مرحله‌ی تسویه را طی کرده،
     *    در آخرین گام همه‌چیز را از دست بدهد — آن هم به‌خاطر چیزی که
     *    تقصیر او نیست.
     */
    it('کوپن منقضی سفارش را نمی‌شکند، فقط تخفیف نمی‌دهد', function () {
        $user = actingAsCustomer();
        $product = Product::factory()->create(['price' => 10_000_000, 'stock' => 5]);
        $address = Address::factory()->create(['user_id' => $user->id]);
        $coupon = Coupon::factory()->expired()->create();

        $cart = cartWith($user, $product);
        $cart->update(['coupon_id' => $coupon->id]);

        $this->postJson('/api/v1/orders', [
            'address_id' => $address->id,
            'shipping_method' => 'standard',
        ])->assertCreated();

        $order = Order::query()->first();

        expect($order->discount)->toBe(0)
            ->and($order->coupon_code)->toBeNull()
            ->and($coupon->fresh()->used_count)->toBe(0);
    });

    /*
     * ⚠️ کوپن باید از سبد هم برداشته شود، نه فقط اقلام.
     *
     *    وگرنه خرید بعدی بی‌آنکه کاربر کد را دوباره بزند تخفیف
     *    می‌گرفت — تا وقتی سقف «هر کاربر یک بار» جلویش را بگیرد، با
     *    پیام خطایی که کاربر هیچ توضیحی برایش نداشت.
     */
    it('کوپن را پس از خرید از سبد برمی‌دارد', function () {
        $user = actingAsCustomer();
        $product = Product::factory()->create(['stock' => 5]);
        $address = Address::factory()->create(['user_id' => $user->id]);
        $coupon = Coupon::factory()->create();

        $cart = cartWith($user, $product);
        $cart->update(['coupon_id' => $coupon->id]);

        $this->postJson('/api/v1/orders', [
            'address_id' => $address->id,
            'shipping_method' => 'standard',
        ])->assertCreated();

        expect($cart->fresh()->coupon_id)->toBeNull();
    });
});

describe('روش ارسال', function () {
    /*
     * ⚠️ باگی که این بخش نگه می‌دارد.
     *
     *    `shipping_method` یک رشته‌ی خام بود و ریسورس همان را بیرون
     *    می‌داد. نتیجه‌اش این بود که صفحه‌ی سفارش و فاکتور، عبارت
     *    «standard» را عیناً به مشتری فارسی‌زبان نشان می‌دادند — بدون
     *    هیچ خطایی، فقط زشت و در فاکتور غیرحرفه‌ای.
     */
    it('برچسب محلی‌شده را همراه کلید می‌فرستد', function () {
        $user = User::factory()->create();
        $order = Order::factory()->for($user)->create(['shipping_method' => 'standard']);

        $this->actingAs($user, 'sanctum');

        $fa = $this->getJson("/api/v1/orders/{$order->order_number}", ['Accept-Language' => 'fa']);
        $en = $this->getJson("/api/v1/orders/{$order->order_number}", ['Accept-Language' => 'en']);

        expect($fa->json('data.shippingMethod'))->toBe('standard')
            ->and($fa->json('data.shippingMethodLabel'))->toBe('ارسال عادی')
            ->and($en->json('data.shippingMethodLabel'))->toBe('Standard shipping');
    });

    it('برای ارسال سریع هم برچسب می‌دهد', function () {
        $user = User::factory()->create();
        $order = Order::factory()->for($user)->create(['shipping_method' => 'express']);

        $this->actingAs($user, 'sanctum');

        $response = $this->getJson("/api/v1/orders/{$order->order_number}", ['Accept-Language' => 'fa']);

        expect($response->json('data.shippingMethodLabel'))->toBe('ارسال سریع')
            ->and($response->json('data.shippingMethodDescription'))->toContain('روز کاری');
    });
});
