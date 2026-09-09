<?php

namespace App\Services\Support;

use App\Enums\TicketStatus;
use App\Models\Ticket;
use App\Models\TicketMessage;
use App\Models\User;
use App\Services\Notification\NotificationService;
use Illuminate\Support\Facades\DB;

/**
 * سرویس تیکت پشتیبانی.
 * ---------------------------------------------------------------------------
 * چرا سرویس و نه منطق در کنترلر؟
 *   هر پیام تازه سه اثر دارد: ساخت ردیف پیام، تغییر وضعیت گفتگو، و
 *   به‌روزرسانی زمان آخرین پاسخ. اگر این‌ها در کنترلر باشند، مسیر
 *   بعدی که پیام می‌سازد (پاسخ مدیر، ایمپورت، سیدر) یکی‌شان را
 *   فراموش می‌کند و صف پشتیبانی بی‌صدا از واقعیت جدا می‌شود.
 */
class TicketService
{
    public function __construct(
        private readonly NotificationService $notifications,
    ) {}

    /**
     * ثبت تیکت تازه به‌همراه اولین پیام.
     *
     * @param  array{subject:string,department:string,priority:string,body:string,order_id?:int|null}  $data
     */
    public function create(User $user, array $data): Ticket
    {
        return DB::transaction(function () use ($user, $data) {
            $ticket = Ticket::create([
                'user_id' => $user->id,
                'order_id' => $data['order_id'] ?? null,
                'ticket_number' => Ticket::generateNumber(),

                'subject' => $data['subject'],
                'department' => $data['department'],
                'priority' => $data['priority'],

                /* تیکت تازه همیشه در صف رسیدگی می‌نشیند */
                'status' => TicketStatus::Open,
                'last_reply_at' => now(),
            ]);

            $ticket->messages()->create([
                'user_id' => $user->id,
                'is_staff' => false,
                'body' => $data['body'],
            ]);

            return $ticket;
        });
    }

    /**
     * افزودن پیام به گفتگو.
     *
     * ⚠️ وضعیت بر اساس *فرستنده* عوض می‌شود، نه مقدار ثابت:
     *      پاسخ پشتیبان → answered        (توپ زمین کاربر)
     *      پاسخ کاربر   → customer_reply  (توپ زمین ما)
     *
     *    بدون این، تیکتی که پشتیبان جواب داده در صفِ «نیاز به
     *    رسیدگی» می‌ماند و تیم بارها سراغش می‌رود.
     *
     * @param  bool  $isStaff  آیا فرستنده کارمند پشتیبانی است؟
     */
    public function reply(Ticket $ticket, User $sender, string $body, bool $isStaff): TicketMessage
    {
        $message = DB::transaction(function () use ($ticket, $sender, $body, $isStaff) {
            $message = $ticket->messages()->create([
                'user_id' => $sender->id,
                /*
                 * نقش در همان لحظه ذخیره می‌شود.
                 * اگر بعداً نقش این کاربر عوض شود، پیام‌های قدیمی‌اش
                 * نباید سمتشان در گفتگو جابه‌جا شود.
                 */
                'is_staff' => $isStaff,
                'body' => $body,
            ]);

            $ticket->update([
                'status' => $isStaff ? TicketStatus::Answered : TicketStatus::CustomerReply,
                'last_reply_at' => now(),
                /* پاسخ تازه، تیکت بسته را دوباره باز می‌کند */
                'closed_at' => null,
            ]);

            return $message;
        });

        /*
         * ⚠️ فقط پاسخ **کارکنان** اعلان می‌سازد.
         *
         *    اگر پاسخ خود کاربر هم اعلان می‌ساخت، هر پیامی که می‌فرستاد
         *    یک اعلان برای خودش می‌آورد — بی‌معنا، و نشان زنگوله را
         *    برای همیشه قرمز نگه می‌داشت.
         *
         * ⚠️ بیرون از تراکنش: اعلانی که به پیامی اشاره کند که ذخیره
         *    نشده، از نبودِ اعلان بدتر است.
         */
        if ($isStaff) {
            $this->notifications->ticketReplied($ticket->loadMissing('user'));
        }

        return $message;
    }

    /** بستن گفتگو. */
    public function close(Ticket $ticket): Ticket
    {
        $ticket->update([
            'status' => TicketStatus::Closed,
            'closed_at' => now(),
        ]);

        return $ticket->fresh();
    }

    /**
     * بازگشایی گفتگو.
     *
     * وضعیت به «پاسخ مشتری» برمی‌گردد نه «باز»: تیکتی که یک بار
     * بسته شده و دوباره باز می‌شود، تاریخچه دارد و باید در صف
     * رسیدگی بنشیند.
     */
    public function reopen(Ticket $ticket): Ticket
    {
        $ticket->update([
            'status' => TicketStatus::CustomerReply,
            'closed_at' => null,
            'last_reply_at' => now(),
        ]);

        return $ticket->fresh();
    }

    /**
     * شمارش تیکت‌ها در هر وضعیت — برای نشان‌های عددی صف پشتیبانی.
     *
     * @return array<string,int>
     */
    public function statusCounts(): array
    {
        /*
         * یک کوئری گروهی به‌جای چهار کوئری شمارش جدا.
         * روی چند صد تیکت تفاوتی ندارد ولی الگویی است که با رشد
         * داده نمی‌شکند.
         */
        $rows = Ticket::query()
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $counts = ['all' => 0, 'needs_attention' => 0];

        foreach (TicketStatus::cases() as $status) {
            $total = (int) ($rows[$status->value] ?? 0);

            $counts[$status->value] = $total;
            $counts['all'] += $total;

            if ($status->needsStaffAttention()) {
                $counts['needs_attention'] += $total;
            }
        }

        return $counts;
    }
}
