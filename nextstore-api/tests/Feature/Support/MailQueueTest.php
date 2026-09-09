<?php

/**
 * ایمیل‌های تراکنشی — که در صف بروند و عملیات اصلی را نشکنند.
 */

use App\Models\Address;
use App\Models\Cart;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Notifications\OrderPlacedNotification;
use App\Notifications\WelcomeNotification;
use App\Services\Order\OrderService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Notification;

describe('ایمیل خوش‌آمد', function () {
    it('پس از ثبت‌نام فرستاده می‌شود', function () {
        Notification::fake();

        $this->postJson('/api/v1/auth/register', [
            'name' => 'کاربر تازه',
            'email' => 'newcomer@example.test',
            'password' => 'Kh0rshid7Baran',
            'password_confirmation' => 'Kh0rshid7Baran',
            'accept_terms' => true,
        ])->assertCreated();

        Notification::assertSentTo(
            User::query()->where('email', 'newcomer@example.test')->sole(),
            WelcomeNotification::class,
        );
    });

    /*
     * ⚠️ مهم‌ترین بررسی این فایل.
     *
     *    بدون `ShouldQueue`، ارسال ایمیل داخل همان درخواستی انجام
     *    می‌شود که حساب را می‌سازد. اگر سرویس ایمیل کند یا قطع باشد،
     *    درخواست ثبت‌نام تایم‌اوت می‌شود در حالی که حساب ساخته شده —
     *    و کاربر دفعه‌ی بعد «این ایمیل قبلاً ثبت شده» می‌گیرد و عملاً
     *    گیر می‌افتد.
     */
    it('در صف می‌رود، نه در همان درخواست', function () {
        expect(new WelcomeNotification('fa'))->toBeInstanceOf(ShouldQueue::class);
    });

    it('زبان درخواست را رعایت می‌کند', function () {
        Notification::fake();

        $this->postJson(
            '/api/v1/auth/register',
            [
                'name' => 'English User',
                'email' => 'english@example.test',
                'password' => 'Kh0rshid7Baran',
                'password_confirmation' => 'Kh0rshid7Baran',
                'accept_terms' => true,
            ],
            ['Accept-Language' => 'en'],
        )->assertCreated();

        Notification::assertSentTo(
            User::query()->where('email', 'english@example.test')->sole(),
            function (WelcomeNotification $notification, array $channels, User $user) {
                return str_contains($notification->toMail($user)->subject ?? '', 'Welcome');
            },
        );
    });
});

describe('ایمیل تأیید سفارش', function () {
    /** یک سبد آماده‌ی خرید با یک قلم. */
    function readyToOrder(): array
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['stock' => 10, 'price' => 1_000_000]);

        $cart = Cart::query()->create(['user_id' => $user->id, 'session_id' => null]);
        $cart->items()->create([
            'product_id' => $product->id,
            'quantity' => 1,
            /* نام ستون `price_at_add` است: قیمت لحظه‌ی افزودن به سبد */
            'price_at_add' => $product->price,
        ]);

        $address = Address::factory()->for($user)->create();

        return [$user, $cart->fresh('items'), $address];
    }

    it('پس از ثبت سفارش فرستاده می‌شود', function () {
        Notification::fake();

        [$user, $cart, $address] = readyToOrder();

        $order = app(OrderService::class)->placeOrder($user, $cart, $address->id);

        Notification::assertSentTo($user, function (OrderPlacedNotification $notification) use ($order, $user) {
            return str_contains($notification->toMail($user)->subject ?? '', $order->order_number);
        });
    });

    it('در صف می‌رود، نه در همان درخواست', function () {
        $user = User::factory()->create();
        $order = Order::factory()->for($user)->create();

        expect(new OrderPlacedNotification($order, 'fa'))->toBeInstanceOf(ShouldQueue::class);
    });

    /*
     * ⚠️ نرسیدن ایمیل نباید خرید موفق را به خطا تبدیل کند.
     *
     *    ثبت سفارش قلب مالی پروژه است؛ یک عارضه‌ی جانبی نباید بشکندش.
     *    اینجا با یک کانال ناموجود، ارسال را به شکست می‌بریم و
     *    می‌سنجیم که سفارش همچنان ساخته می‌شود.
     */
    it('شکست ارسال ایمیل، سفارش را نمی‌شکند', function () {
        Notification::fake();
        Notification::shouldReceive('send')->andThrow(new RuntimeException('SMTP down'));

        [$user, $cart, $address] = readyToOrder();

        $order = app(OrderService::class)->placeOrder($user, $cart, $address->id);

        expect($order->order_number)->not->toBeEmpty()
            ->and($order->items)->toHaveCount(1);
    });
});
