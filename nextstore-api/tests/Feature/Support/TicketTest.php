<?php

/**
 * تیکت پشتیبانی — چرخه‌ی کامل گفتگو از دو سمت.
 */

use App\Enums\TicketStatus;
use App\Models\Order;
use App\Models\Ticket;
use App\Models\User;

/** ساخت یک تیکت باز برای کاربر داده‌شده. */
function openTicket(User $user, string $subject = 'موضوع آزمایشی گفتگو'): Ticket
{
    $ticket = Ticket::query()->create([
        'user_id' => $user->id,
        'ticket_number' => Ticket::generateNumber(),
        'subject' => $subject,
        'department' => 'other',
        'priority' => 'normal',
        'status' => TicketStatus::Open,
        'last_reply_at' => now(),
    ]);

    $ticket->messages()->create([
        'user_id' => $user->id,
        'is_staff' => false,
        'body' => 'متن اولیه‌ی گفتگو که به‌اندازه‌ی کافی بلند است.',
    ]);

    return $ticket;
}

describe('ثبت تیکت', function () {
    it('تیکت را با شماره‌ی یکتا می‌سازد', function () {
        actingAsCustomer();

        $response = $this->postJson('/api/v1/tickets', [
            'subject' => 'سفارشم هنوز ارسال نشده',
            'department' => 'orders',
            'priority' => 'high',
            'body' => 'سه روز از ثبت سفارش گذشته و وضعیت تغییری نکرده است.',
        ])->assertCreated();

        expect($response->json('data.ticketNumber'))->toStartWith('TK-')
            ->and($response->json('data.messagesCount'))->toBe(1);
    });

    /*
     * ⚠️ «کوتاه» دقیقاً ۵ نویسه است و قاعده `min:5` آن را **می‌پذیرد**.
     *    نسخه‌ی اول این تست همان را می‌فرستاد و ۲۰۱ می‌گرفت — شکستی که
     *    شبیه باگ اعتبارسنجی بود، در حالی که داده‌ی تست غلط بود.
     */
    it('موضوع کوتاه‌تر از حداقل را رد می‌کند', function () {
        actingAsCustomer();

        $this->postJson('/api/v1/tickets', [
            'subject' => 'کم',
            'department' => 'other',
            'priority' => 'normal',
            'body' => 'متنی که به‌اندازه‌ی کافی بلند است تا رد نشود.',
        ])->assertStatus(422)->assertJsonValidationErrors('subject');
    });

    /*
     * ⚠️ حداقل ۲۰ نویسه برای متن.
     *
     *    تیکتی با متن «کار نمی‌کنه» یک رفت‌وبرگشت اضافه به پشتیبانی
     *    تحمیل می‌کند تا بپرسد «چه چیزی؟».
     */
    it('متن خیلی کوتاه را رد می‌کند', function () {
        actingAsCustomer();

        $this->postJson('/api/v1/tickets', [
            'subject' => 'یک موضوع کافی',
            'department' => 'other',
            'priority' => 'normal',
            'body' => 'کار نمی‌کند',
        ])->assertStatus(422)->assertJsonValidationErrors('body');
    });

    /*
     * ⚠️ فقط سفارش‌های خود کاربر پذیرفته می‌شوند.
     *
     *    بدون این شرط، کاربر می‌توانست با حدس زدن شناسه تیکتی به سفارش
     *    دیگری بچسباند و از پاسخ پشتیبانی اطلاعات آن سفارش را بیرون بکشد.
     */
    it('سفارش شخص دیگر را نمی‌پذیرد', function () {
        $someoneElse = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $someoneElse->id]);

        actingAsCustomer();

        $this->postJson('/api/v1/tickets', [
            'subject' => 'درباره‌ی این سفارش',
            'department' => 'orders',
            'priority' => 'normal',
            'body' => 'متن کافی برای عبور از اعتبارسنجی حداقل طول.',
            'order_id' => $order->id,
        ])->assertStatus(422)->assertJsonValidationErrors('order_id');
    });

    it('مهمان نمی‌تواند تیکت بسازد', function () {
        $this->postJson('/api/v1/tickets', ['subject' => 'x'])->assertUnauthorized();
    });
});

describe('گفتگو', function () {
    it('پاسخ مشتری وضعیت را به پاسخ مشتری می‌برد', function () {
        $user = actingAsCustomer();
        $ticket = openTicket($user);

        $this->postJson("/api/v1/tickets/{$ticket->ticket_number}/reply", [
            'body' => 'یک نکته‌ی دیگر هم هست.',
        ])->assertOk();

        expect($ticket->fresh()->status)->toBe(TicketStatus::CustomerReply)
            ->and($ticket->fresh()->messages()->count())->toBe(2);
    });

    /*
     * ⚠️ پاسخ پشتیبانی تیکت را از صف کاری بیرون می‌برد.
     *
     *    بدون این تغییر وضعیت، پشتیبان تیکتی را که همین الان جواب داده
     *    دوباره در صف «نیازمند رسیدگی» می‌دید.
     */
    it('پاسخ پشتیبانی وضعیت را به پاسخ داده شده می‌برد', function () {
        $customer = User::factory()->create();
        $ticket = openTicket($customer);

        actingAsAdmin();

        $this->postJson("/api/v1/admin/tickets/{$ticket->ticket_number}/reply", [
            'body' => 'بررسی کردیم و تا فردا ارسال می‌شود.',
        ])->assertOk();

        expect($ticket->fresh()->status)->toBe(TicketStatus::Answered);
    });

    it('پیام پشتیبانی با پرچم isStaff ذخیره می‌شود', function () {
        $customer = User::factory()->create();
        $ticket = openTicket($customer);

        actingAsAdmin();

        $this->postJson("/api/v1/admin/tickets/{$ticket->ticket_number}/reply", [
            'body' => 'پاسخ تیم پشتیبانی.',
        ])->assertOk();

        expect($ticket->fresh()->messages()->where('is_staff', true)->count())->toBe(1);
    });
});

describe('بستن و بازگشایی', function () {
    it('تیکت بسته پاسخ نمی‌پذیرد', function () {
        $user = actingAsCustomer();
        $ticket = openTicket($user);

        $this->patchJson("/api/v1/tickets/{$ticket->ticket_number}/close")->assertOk();

        /*
         * ⚠️ ۴۰۹ و نه ۴۲۲: داده مشکلی ندارد، وضعیت گفتگو با درخواست
         *    تعارض دارد. فرانت با این تفکیک، به‌جای هایلایت فیلد،
         *    دکمه‌ی «بازگشایی» نشان می‌دهد.
         */
        $this->postJson("/api/v1/tickets/{$ticket->ticket_number}/reply", [
            'body' => 'پاسخی که نباید پذیرفته شود.',
        ])->assertStatus(409)->assertJsonPath('error.code', 'TICKET_CLOSED');
    });

    it('بازگشایی دوباره پاسخ را ممکن می‌کند', function () {
        $user = actingAsCustomer();
        $ticket = openTicket($user);

        $this->patchJson("/api/v1/tickets/{$ticket->ticket_number}/close")->assertOk();
        $this->patchJson("/api/v1/tickets/{$ticket->ticket_number}/reopen")->assertOk();

        $this->postJson("/api/v1/tickets/{$ticket->ticket_number}/reply", [
            'body' => 'حالا باید پذیرفته شود.',
        ])->assertOk();
    });
});

describe('صف پشتیبانی', function () {
    it('پیش‌فرض فقط تیکت‌های نیازمند رسیدگی را نشان می‌دهد', function () {
        $customer = User::factory()->create();

        $open = openTicket($customer, 'گفتگوی باز و منتظر پاسخ');
        $closed = openTicket($customer, 'گفتگوی بسته‌شده');
        $closed->update(['status' => TicketStatus::Closed, 'closed_at' => now()]);

        actingAsAdmin();

        $response = $this->getJson('/api/v1/admin/tickets')->assertOk();

        $numbers = collect($response->json('data'))->pluck('ticketNumber');

        expect($numbers)->toContain($open->ticket_number)
            ->and($numbers)->not->toContain($closed->ticket_number);
    });

    it('صف، ایمیل مشتری را به پشتیبان نشان می‌دهد', function () {
        $customer = User::factory()->create(['email' => 'buyer@example.test']);
        openTicket($customer);

        actingAsAdmin();

        $response = $this->getJson('/api/v1/admin/tickets')->assertOk();

        expect($response->json('data.0.customer.email'))->toBe('buyer@example.test');
    });

    /*
     * ⚠️ در «تیکت‌های من» ایمیل نباید بیاید.
     *
     *    کاربر خودش را می‌شناسد و فرستادنش نشت بی‌دلیل است — اگر روزی
     *    این Resource جای دیگری استفاده شود، آن نشت با خودش می‌رود.
     */
    it('تیکت‌های من ایمیل مشتری را نمی‌فرستد', function () {
        $user = actingAsCustomer();
        openTicket($user);

        $response = $this->getJson('/api/v1/tickets')->assertOk();

        expect($response->json('data.0'))->not->toHaveKey('customer');
    });
});
