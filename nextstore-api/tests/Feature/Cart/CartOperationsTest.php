<?php

/**
 * عملیات سبد خرید — افزودن، تغییر تعداد، حذف، ادغام.
 */

use App\Models\Cart;
use App\Models\Product;
use App\Models\User;

describe('افزودن به سبد', function () {
    it('محصول را اضافه می‌کند', function () {
        actingAsCustomer();
        $product = Product::factory()->create(['stock' => 10]);

        /*
         * ⚠️ کد وضعیت **۲۰۱** است نه ۲۰۰ — قلم تازه‌ای در سبد ساخته
         *    می‌شود. ۲۰۰ در نگاه اول طبیعی به نظر می‌رسد ولی قرارداد
         *    REST اینجا Created است.
         */
        $this->postJson('/api/v1/cart/items', [
            'product_id' => $product->id,
            'quantity' => 2,
        ])->assertCreated()->assertJsonPath('data.itemsCount', 2);
    });

    /*
     * ⚠️ افزودن دوباره‌ی همان محصول باید تعداد را جمع کند، نه ردیف دوم
     *    بسازد. دو ردیف از یک محصول یعنی کاربر در صفحه‌ی سبد یک کالا
     *    را دو بار می‌بیند و نمی‌فهمد چرا.
     */
    it('محصول تکراری را جمع می‌کند نه ردیف تازه', function () {
        actingAsCustomer();
        $product = Product::factory()->create(['stock' => 10]);

        $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 2]);
        $response = $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 3]);

        $response->assertCreated()->assertJsonPath('data.itemsCount', 5);
        expect($response->json('data.items'))->toHaveCount(1);
    });

    it('بیش از موجودی را رد می‌کند', function () {
        actingAsCustomer();
        $product = Product::factory()->withStock(2)->create();

        $this->postJson('/api/v1/cart/items', [
            'product_id' => $product->id,
            'quantity' => 5,
        ])->assertStatus(422);
    });

    it('محصول ناموجود را رد می‌کند', function () {
        actingAsCustomer();
        $product = Product::factory()->outOfStock()->create();

        $this->postJson('/api/v1/cart/items', [
            'product_id' => $product->id,
            'quantity' => 1,
        ])->assertStatus(422);
    });

    it('شناسه‌ی محصول ناموجود را رد می‌کند', function () {
        actingAsCustomer();

        $this->postJson('/api/v1/cart/items', [
            'product_id' => 999999,
            'quantity' => 1,
        ])->assertStatus(422);
    });

    /*
     * ⚠️ مهمان هم باید بتواند سبد داشته باشد — با هدر X-Session-Id.
     *    اجبار به ورود پیش از افزودن به سبد، نرخ رهاکردن را بالا می‌برد.
     */
    it('مهمان با شناسه‌ی نشست سبد دارد', function () {
        $product = Product::factory()->create(['stock' => 5]);

        $this->withHeader('X-Session-Id', 'guest-session-abc')
            ->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 1])
            ->assertCreated()
            ->assertJsonPath('data.itemsCount', 1);
    });
});

describe('تغییر تعداد', function () {
    it('تعداد را به‌روز می‌کند', function () {
        actingAsCustomer();
        $product = Product::factory()->create(['stock' => 10]);

        $add = $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 1]);
        $itemId = $add->json('data.items.0.id');

        $this->patchJson("/api/v1/cart/items/{$itemId}", ['quantity' => 4])
            ->assertOk()
            ->assertJsonPath('data.itemsCount', 4);
    });

    /*
     * ⚠️ تعداد صفر یعنی حذف، نه خطای اعتبارسنجی.
     *    دکمه‌ی «منها» در صفحه‌ی سبد وقتی به یک می‌رسد باید قلم را
     *    بردارد؛ خطا دادن یعنی کاربر گیر می‌کند.
     */
    it('تعداد صفر قلم را حذف می‌کند', function () {
        actingAsCustomer();
        $product = Product::factory()->create(['stock' => 10]);

        $add = $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 2]);
        $itemId = $add->json('data.items.0.id');

        $response = $this->patchJson("/api/v1/cart/items/{$itemId}", ['quantity' => 0])->assertOk();

        expect($response->json('data.items'))->toBeEmpty();
    });

    /*
     * ⚠️ قلمِ سبد شخص دیگر نباید قابل تغییر باشد.
     *
     *    شناسه‌ی قلم یک عدد صعودی است و حدس‌زدنش ساده؛ بدون بررسی
     *    مالکیت، هر کسی می‌توانست سبد دیگران را دستکاری کند.
     */
    it('قلم سبد شخص دیگر قابل تغییر نیست', function () {
        $other = User::factory()->create();
        $otherCart = Cart::query()->create(['user_id' => $other->id]);
        $product = Product::factory()->create(['stock' => 10]);
        $item = $otherCart->items()->create([
            'product_id' => $product->id,
            'quantity' => 1,
            'price_at_add' => $product->price,
        ]);

        actingAsCustomer();

        $this->patchJson("/api/v1/cart/items/{$item->id}", ['quantity' => 9])
            ->assertNotFound();

        expect($item->fresh()->quantity)->toBe(1);
    });
});

describe('حذف و خالی کردن', function () {
    it('یک قلم را حذف می‌کند', function () {
        actingAsCustomer();
        $product = Product::factory()->create(['stock' => 10]);

        $add = $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 1]);
        $itemId = $add->json('data.items.0.id');

        $response = $this->deleteJson("/api/v1/cart/items/{$itemId}")->assertOk();

        expect($response->json('data.items'))->toBeEmpty();
    });

    it('کل سبد را خالی می‌کند', function () {
        actingAsCustomer();

        foreach (Product::factory()->count(3)->create(['stock' => 10]) as $product) {
            $this->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 1]);
        }

        $response = $this->deleteJson('/api/v1/cart')->assertOk();

        expect($response->json('data.items'))->toBeEmpty()
            ->and($response->json('data.summary.subtotal'))->toBe(0);
    });
});

describe('ادغام سبد مهمان', function () {
    /*
     * ⚠️ سناریوی واقعی: کاربر مهمان چیزی به سبد اضافه می‌کند، بعد وارد
     *    می‌شود. اگر ادغام نشود، سبدش جلوی چشمش ناپدید می‌شود — و آن
     *    خرید معمولاً برنمی‌گردد.
     */
    it('سبد مهمان پس از ورود حفظ می‌شود', function () {
        $product = Product::factory()->create(['stock' => 10]);
        $sessionId = 'guest-merge-test';

        $this->withHeader('X-Session-Id', $sessionId)
            ->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 2])
            ->assertCreated();

        $user = User::factory()->create(['password' => bcrypt('secret123')]);

        $this->withHeader('X-Session-Id', $sessionId)
            ->postJson('/api/v1/auth/login', [
                'email' => $user->email,
                'password' => 'secret123',
            ])->assertOk();

        $cart = Cart::query()->where('user_id', $user->id)->first();

        expect($cart)->not->toBeNull()
            ->and($cart->items()->sum('quantity'))->toBe(2);
    });
});
