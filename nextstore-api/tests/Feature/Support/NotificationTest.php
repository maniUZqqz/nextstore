<?php

/**
 * اعلان‌های درون‌برنامه‌ای — از رویداد تا صندوق کاربر.
 */

use App\Enums\NotificationType;
use App\Enums\OrderStatus;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\Ticket;
use App\Models\User;
use App\Services\Order\OrderService;
use App\Services\Review\ReviewService;
use App\Services\Support\TicketService;

describe('صندوق اعلان کاربر', function () {
    it('بدون ورود بسته است', function () {
        $this->getJson('/api/v1/notifications')->assertUnauthorized();
    });

    /*
     * ⚠️ مهم‌ترین بررسی امنیتی این فایل.
     *
     *    کوئری‌ها از `$user->notifications()` شروع می‌شوند نه از
     *    `Notification::query()`. یعنی کاربری که شناسه‌ی اعلان دیگری را
     *    حدس بزند، اصلاً ردیفی پیدا نمی‌کند.
     */
    it('اعلان کاربر دیگر را نه نشان می‌دهد و نه اجازه‌ی تغییرش را', function () {
        $mine = User::factory()->create();
        $other = User::factory()->create();

        $theirs = Notification::factory()->for($other)->create();

        $this->actingAs($mine, 'sanctum');

        expect($this->getJson('/api/v1/notifications')->json('data'))->toBeEmpty();

        $this->patchJson("/api/v1/notifications/{$theirs->id}/read")->assertNotFound();
        $this->deleteJson("/api/v1/notifications/{$theirs->id}")->assertNotFound();

        expect($theirs->fresh()->read_at)->toBeNull();
    });

    it('اعلان‌ها را تازه‌ترین اول می‌دهد', function () {
        $user = User::factory()->create();

        Notification::factory()->for($user)->create(['created_at' => now()->subDays(2)]);
        $newest = Notification::factory()->for($user)->create(['created_at' => now()]);

        $this->actingAs($user, 'sanctum');

        expect($this->getJson('/api/v1/notifications')->json('data.0.id'))->toBe($newest->id);
    });

    it('با status=unread فقط خوانده‌نشده‌ها را می‌دهد', function () {
        $user = User::factory()->create();

        Notification::factory()->for($user)->count(2)->create();
        Notification::factory()->for($user)->read()->create();

        $this->actingAs($user, 'sanctum');

        expect($this->getJson('/api/v1/notifications?status=unread')->json('data'))->toHaveCount(2)
            ->and($this->getJson('/api/v1/notifications')->json('data'))->toHaveCount(3);
    });

    /*
     * ⚠️ اندپوینت سبک جدا، چون نشان زنگوله در هر بارگذاری صفحه آن را
     *    می‌خواند. گرفتن کل فهرست برای یک عدد یعنی یک کوئری
     *    صفحه‌بندی‌شده در هر صفحه‌ی سایت.
     */
    it('شمار خوانده‌نشده‌ها را جداگانه می‌دهد', function () {
        $user = User::factory()->create();

        Notification::factory()->for($user)->count(3)->create();
        Notification::factory()->for($user)->read()->create();

        $this->actingAs($user, 'sanctum');

        expect($this->getJson('/api/v1/notifications/unread-count')->json('data.unread'))->toBe(3);
    });

    it('یک اعلان را خوانده‌شده می‌کند', function () {
        $user = User::factory()->create();
        $notification = Notification::factory()->for($user)->create();

        $this->actingAs($user, 'sanctum');

        $response = $this->patchJson("/api/v1/notifications/{$notification->id}/read")->assertOk();

        expect($response->json('data.isRead'))->toBeTrue()
            ->and($response->json('meta.unread'))->toBe(0)
            ->and($notification->fresh()->read_at)->not->toBeNull();
    });

    /*
     * ⚠️ زمان خواندن باید **اولین** بار باشد نه آخرین: تنها کاری که آن
     *    ستون می‌کند نشان‌دادن «چقدر طول کشید تا دیده شود» است.
     */
    it('خواندن دوباره زمان را جلو نمی‌برد', function () {
        $user = User::factory()->create();
        $notification = Notification::factory()->for($user)->read()->create();
        $original = $notification->read_at;

        $this->actingAs($user, 'sanctum');

        $this->travel(1)->hours();
        $this->patchJson("/api/v1/notifications/{$notification->id}/read")->assertOk();

        expect($notification->fresh()->read_at->timestamp)->toBe($original->timestamp);
    });

    it('همه را با یک درخواست خوانده‌شده می‌کند', function () {
        $user = User::factory()->create();
        Notification::factory()->for($user)->count(4)->create();

        $this->actingAs($user, 'sanctum');

        $response = $this->patchJson('/api/v1/notifications/read-all')->assertOk();

        expect($response->json('meta.marked'))->toBe(4)
            ->and($response->json('meta.unread'))->toBe(0)
            ->and($user->notifications()->unread()->count())->toBe(0);
    });

    it('اعلان را حذف می‌کند', function () {
        $user = User::factory()->create();
        $notification = Notification::factory()->for($user)->create();

        $this->actingAs($user, 'sanctum');

        $this->deleteJson("/api/v1/notifications/{$notification->id}")->assertOk();

        expect(Notification::count())->toBe(0);
    });
});

describe('متن اعلان', function () {
    /*
     * ⚠️ متن ذخیره نمی‌شود؛ از نوع و پارامترها ساخته می‌شود.
     *
     *    اگر جمله‌ی آماده در دیتابیس می‌نشست، کاربری که زبان سایت را
     *    عوض می‌کند اعلان‌های قدیمی‌اش را برای همیشه به زبان قبلی
     *    می‌دید.
     */
    it('همان اعلان را به هر دو زبان می‌دهد', function () {
        $user = User::factory()->create();

        Notification::factory()->for($user)->create([
            'type' => NotificationType::OrderStatus,
            'data' => ['orderNumber' => 'NS-1', 'statusLabel' => 'ارسال شد'],
        ]);

        $this->actingAs($user, 'sanctum');

        $fa = $this->getJson('/api/v1/notifications', ['Accept-Language' => 'fa'])->json('data.0');
        $en = $this->getJson('/api/v1/notifications', ['Accept-Language' => 'en'])->json('data.0');

        expect($fa['title'])->toBe('وضعیت سفارش')
            ->and($en['title'])->toBe('Order update')
            ->and($fa['body'])->toContain('NS-1')
            ->and($en['body'])->toContain('NS-1');
    });

    /* آیکون و رنگ از بک‌اند می‌آیند تا فرانت نگاشت دومی نسازد */
    it('آیکون و رنگ معنایی را همراه می‌فرستد', function () {
        $user = User::factory()->create();
        Notification::factory()->for($user)->create();

        $this->actingAs($user, 'sanctum');

        $row = $this->getJson('/api/v1/notifications')->json('data.0');

        expect($row['icon'])->toBe('package')
            ->and($row['color'])->toBe('info');
    });

    /* پارامتر غایب نباید استثنا بدهد — اعلان ناقص از صفحه‌ی خطا بهتر است */
    it('با پارامتر غایب هم متن می‌سازد', function () {
        $user = User::factory()->create();
        Notification::factory()->for($user)->create(['data' => []]);

        $this->actingAs($user, 'sanctum');

        expect($this->getJson('/api/v1/notifications')->json('data.0.body'))->toBeString();
    });
});

describe('رویدادهایی که اعلان می‌سازند', function () {
    it('تغییر وضعیت سفارش اعلان می‌سازد', function () {
        $order = Order::factory()->create(['status' => OrderStatus::Paid]);

        /* گذار مجاز است نه دلخواه: Paid → Processing، نه Paid → Shipped */
        app(OrderService::class)->changeStatus($order, OrderStatus::Processing);

        $notification = Notification::sole();
        expect($notification->user_id)->toBe($order->user_id)
            ->and($notification->type)->toBe(NotificationType::OrderStatus)
            ->and($notification->link)->toContain($order->order_number);
    });

    /*
     * ⚠️ فقط پاسخ کارکنان اعلان می‌سازد.
     *
     *    اگر پاسخ خود کاربر هم می‌ساخت، هر پیامی که می‌فرستاد یک اعلان
     *    برای خودش می‌آورد و نشان زنگوله برای همیشه قرمز می‌ماند.
     */
    it('پاسخ پشتیبانی اعلان می‌سازد ولی پاسخ خود کاربر نه', function () {
        $customer = User::factory()->create();
        $staff = User::factory()->create();

        $ticket = Ticket::query()->create([
            'user_id' => $customer->id,
            'ticket_number' => Ticket::generateNumber(),
            'subject' => 'موضوع آزمایشی',
            'department' => 'other',
            'priority' => 'normal',
            'status' => 'open',
            'last_reply_at' => now(),
        ]);

        $service = app(TicketService::class);

        $service->reply($ticket, $customer, 'پیام خود کاربر که به‌اندازه کافی بلند است.', false);
        expect(Notification::count())->toBe(0);

        $service->reply($ticket, $staff, 'پاسخ پشتیبانی که به‌اندازه کافی بلند است.', true);
        expect(Notification::count())->toBe(1)
            ->and(Notification::sole()->type)->toBe(NotificationType::TicketReply);
    });

    it('تأیید و رد نظر هرکدام اعلان خودشان را می‌سازند', function () {
        $product = Product::factory()->create();
        $user = User::factory()->create();

        $review = Review::query()->create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'rating' => 5,
            'comment' => 'محصول بسیار خوبی بود و کاملاً راضی هستم.',
            'is_approved' => false,
        ]);

        $service = app(ReviewService::class);

        $service->approve($review);
        expect(Notification::sole()->type)->toBe(NotificationType::ReviewApproved);

        Notification::query()->delete();

        $service->reject($review->fresh(), 'متن نامرتبط بود.');
        $rejected = Notification::sole();

        expect($rejected->type)->toBe(NotificationType::ReviewRejected)
            /* دلیل هم می‌رود: «ردشد» بدون دلیل، کاربر را به نوشتن همان نظر وامی‌دارد */
            ->and($rejected->data['reason'])->toBe('متن نامرتبط بود.');
    });

    /*
     * ⚠️ اعلان نباید عملیات اصلی را بشکند.
     *
     *    اگر ساخت اعلان استثنا بدهد، تغییر وضعیت سفارش باید همچنان
     *    موفق باشد — مدیر «خطا» می‌دید و دوباره تلاش می‌کرد، در حالی
     *    که سفارش همان بار اول عوض شده بود.
     */
    it('شکست ساخت اعلان، عملیات اصلی را نمی‌شکند', function () {
        $order = Order::factory()->create(['status' => OrderStatus::Paid]);

        /* جدول را حذف می‌کنیم تا هر درج اعلان استثنا بدهد */
        Schema::drop('notifications');

        $updated = app(OrderService::class)->changeStatus($order, OrderStatus::Processing);

        expect($updated->status)->toBe(OrderStatus::Processing);
    });
});
