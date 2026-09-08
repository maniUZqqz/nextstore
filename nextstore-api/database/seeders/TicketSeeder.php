<?php

namespace Database\Seeders;

use App\Enums\TicketDepartment;
use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * سیدر تیکت‌های پشتیبانی.
 * ---------------------------------------------------------------------------
 * ⚠️ چرا این سیدر لازم شد؟
 *    صف پشتیبانی پنل مدیریت با دیتابیس تازه کاملاً خالی بود. برای
 *    نمونه‌کار این بدترین حالت است: بازدیدکننده روی «پشتیبانی» کلیک
 *    می‌کند و یک صفحه‌ی خالی می‌بیند، بدون اینکه بفهمد قابلیت وجود
 *    دارد یا نه. همان مشکلی که ReviewSeeder برای نظرات حل کرد.
 *
 * ⚠️ گفتگوها **در هر چهار وضعیت** ساخته می‌شوند تا هر تب پنل داده
 *    داشته باشد و تفاوت رنگ‌ها و صف کاری واقعاً دیده شود:
 *      open           → منتظر اولین پاسخ ما
 *      answered       → ما جواب داده‌ایم، توپ زمین مشتری
 *      customer_reply → مشتری دوباره نوشته، برگشته به صف
 *      closed         → بسته‌شده
 *
 * ⚠️ وضعیت مستقیم روی مدل نوشته می‌شود، نه از راه TicketService.
 *    سرویس هر پاسخ را «تازه» فرض می‌کند و `last_reply_at` را روی
 *    now() می‌گذارد؛ نتیجه این بود که همه‌ی تیکت‌های نمونه یک تاریخ
 *    داشتند و مرتب‌سازی صف بی‌معنا می‌شد.
 */
class TicketSeeder extends Seeder
{
    /**
     * گفتگوهای نمونه.
     *
     * هر ردیف: موضوع، دپارتمان، اولویت، وضعیت نهایی، و پیام‌ها به
     * ترتیب زمانی (`true` یعنی پیام از سمت پشتیبانی).
     *
     * @var list<array{subject:string,department:TicketDepartment,priority:TicketPriority,status:TicketStatus,days:int,messages:list<array{0:bool,1:string}>}>
     */
    private const CONVERSATIONS = [
        [
            'subject' => 'سفارشم سه روز است در وضعیت «در حال پردازش» مانده',
            'department' => TicketDepartment::Orders,
            'priority' => TicketPriority::High,
            'status' => TicketStatus::Open,
            'days' => 1,
            'messages' => [
                [false, "سلام،\nسه روز پیش سفارشم را ثبت کردم و مبلغ هم کسر شد، ولی وضعیت هنوز «در حال پردازش» است و کد رهگیری نگرفته‌ام. ممکن است بررسی کنید؟"],
            ],
        ],
        [
            'subject' => 'کد تخفیف هنگام پرداخت اعمال نمی‌شود',
            'department' => TicketDepartment::Billing,
            'priority' => TicketPriority::Normal,
            'status' => TicketStatus::CustomerReply,
            'days' => 2,
            'messages' => [
                [false, 'کد تخفیفی که برایم پیامک شده بود را وارد می‌کنم ولی پیام «کد نامعتبر» می‌گیرم. تاریخ انقضایش هم نگذشته.'],
                [true, "سلام، ممنون از تماستان.\nکدهای این کمپین فقط روی سبدهای بالای ۵۰۰ هزار تومان فعال می‌شوند. لطفاً مبلغ سبد خود را بررسی کنید."],
                [false, 'سبد من یک میلیون و دویست هزار تومان است، پس شرط را دارد. باز هم همان خطا را می‌دهد.'],
            ],
        ],
        [
            'subject' => 'تعویض سایز کفش خریداری‌شده',
            'department' => TicketDepartment::Orders,
            'priority' => TicketPriority::Normal,
            'status' => TicketStatus::Answered,
            'days' => 4,
            'messages' => [
                [false, 'کفشی که سفارش دادم یک سایز کوچک است. امکان تعویض با سایز بزرگ‌تر وجود دارد؟'],
                [true, "بله، تا هفت روز پس از تحویل امکان تعویض هست.\nکافی است از بخش «سفارش‌های من» درخواست مرجوعی ثبت کنید؛ پیک برای دریافت مراجعه می‌کند و سایز جدید هم‌زمان تحویل داده می‌شود."],
            ],
        ],
        [
            'subject' => 'صفحه‌ی پرداخت روی مرورگر موبایل باز نمی‌شود',
            'department' => TicketDepartment::Technical,
            'priority' => TicketPriority::High,
            'status' => TicketStatus::Answered,
            'days' => 6,
            'messages' => [
                [false, 'روی گوشی وقتی به مرحله‌ی پرداخت می‌رسم صفحه سفید می‌شود. روی لپ‌تاپ مشکلی نیست.'],
                [true, "این مشکل مربوط به نسخه‌ی قدیمی مرورگر بود و در به‌روزرسانی دیروز برطرف شد.\nلطفاً یک‌بار کش مرورگر را پاک کنید و دوباره امتحان بفرمایید."],
            ],
        ],
        [
            'subject' => 'درخواست فاکتور رسمی برای سفارش',
            'department' => TicketDepartment::Billing,
            'priority' => TicketPriority::Low,
            'status' => TicketStatus::Closed,
            'days' => 12,
            'messages' => [
                [false, 'برای امور مالی شرکت به فاکتور رسمی با مهر نیاز دارم. چطور می‌توانم دریافتش کنم؟'],
                [true, 'فاکتور رسمی به ایمیل ثبت‌شده در حسابتان ارسال شد. اگر به نسخه‌ی فیزیکی هم نیاز دارید، همراه مرسوله‌ی بعدی می‌فرستیم.'],
                [false, 'دریافت شد، ممنون از پیگیری شما.'],
            ],
        ],
        [
            'subject' => 'محصول موردنظرم کی دوباره موجود می‌شود؟',
            'department' => TicketDepartment::Other,
            'priority' => TicketPriority::Low,
            'status' => TicketStatus::Closed,
            'days' => 20,
            'messages' => [
                [false, 'هدفون مورد نظرم چند هفته است ناموجود شده. برنامه‌ای برای شارژ مجدد انبار هست؟'],
                [true, 'محموله‌ی بعدی تا دو هفته‌ی آینده می‌رسد. اگر روی صفحه‌ی محصول دکمه‌ی «اطلاع‌رسانی موجود شدن» را بزنید، به‌محض شارژ انبار برایتان پیامک می‌شود.'],
            ],
        ],
    ];

    /** ساخت گفتگوهای نمونه. */
    public function run(): void
    {
        /*
         * ⚠️ اگر تیکتی وجود دارد، سیدر کاری نمی‌کند.
         *    `migrate:fresh --seed` جدول را خالی می‌بیند و پر می‌کند،
         *    ولی `db:seed` روی دیتابیس موجود نباید گفتگوهای واقعی را
         *    با نسخه‌های تکراری قاطی کند.
         */
        if (Ticket::query()->exists()) {
            $this->command?->info('  تیکت‌ها از قبل وجود دارند — رد شد.');

            return;
        }

        $customer = User::query()->where('role', UserRole::Customer)->first();
        $staff = User::query()->whereIn('role', [UserRole::Admin, UserRole::Manager])->first();

        if (! $customer || ! $staff) {
            $this->command?->warn('  کاربر مشتری یا مدیر پیدا نشد — سیدر تیکت رد شد.');

            return;
        }

        /* سفارش کاربر — برای اینکه یکی از تیکت‌ها به سفارش واقعی بچسبد */
        $order = Order::query()->where('user_id', $customer->id)->first();

        foreach (self::CONVERSATIONS as $index => $data) {
            $this->createConversation($customer, $staff, $data, $index === 0 ? $order : null);
        }

        $this->command?->info('  '.count(self::CONVERSATIONS).' تیکت نمونه ساخته شد.');
    }

    /**
     * ساخت یک گفتگو با تاریخ‌های واقع‌نما.
     *
     * @param  array{subject:string,department:TicketDepartment,priority:TicketPriority,status:TicketStatus,days:int,messages:list<array{0:bool,1:string}>}  $data
     */
    private function createConversation(
        User $customer,
        User $staff,
        array $data,
        ?Order $order,
    ): void {
        $openedAt = now()->subDays($data['days']);

        $ticket = Ticket::query()->create([
            'user_id' => $customer->id,
            'order_id' => $order?->id,
            'ticket_number' => Ticket::generateNumber(),
            'subject' => $data['subject'],
            'department' => $data['department'],
            'priority' => $data['priority'],
            'status' => $data['status'],
            'created_at' => $openedAt,
            'updated_at' => $openedAt,
        ]);

        $lastAt = $openedAt;

        foreach ($data['messages'] as $position => [$isStaff, $body]) {
            /*
             * هر پیام چند ساعت پس از پیام قبلی.
             *
             * فاصله‌ی صفر یعنی همه‌ی پیام‌ها یک زمان دارند و ترتیبشان
             * در گفتگو به شانسِ مرتب‌سازی دیتابیس واگذار می‌شود.
             */
            $lastAt = $lastAt->copy()->addHours(3 + $position * 5);

            $ticket->messages()->create([
                'user_id' => $isStaff ? $staff->id : $customer->id,
                'is_staff' => $isStaff,
                'body' => $body,
                'created_at' => $lastAt,
                'updated_at' => $lastAt,
            ]);
        }

        $ticket->update([
            'last_reply_at' => $lastAt,
            'closed_at' => $data['status'] === TicketStatus::Closed ? $lastAt : null,
            'updated_at' => $lastAt,
        ]);
    }
}
