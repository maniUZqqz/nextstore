<?php

/**
 * مایگریشن جدول‌های تیکت پشتیبانی.
 *
 * دو جدول:
 *   tickets          سرنخ گفتگو — موضوع، دپارتمان، اولویت، وضعیت
 *   ticket_messages  پیام‌های رد و بدل‌شده در آن گفتگو
 *
 * ⚠️ چرا دو جدول و نه یکی؟ یک تیکت چند پیام دارد و هر پیام
 *    فرستنده‌ی خودش را. ریختن همه در یک جدول یعنی تکرار موضوع و
 *    وضعیت در هر ردیف — و به‌هم‌ریختن وضعیت به محض اینکه دو ردیف
 *    واگرا شوند.
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** ساخت جدول‌های تیکت. */
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            /*
             * سفارش مرتبط — اختیاری.
             *
             * nullOnDelete و نه cascade: اگر سفارش حذف شود، تیکت باید
             * بماند. گفتگویی که پشتیبانی رویش وقت گذاشته نباید با
             * پاک شدن یک سفارش از بین برود.
             */
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();

            /**
             * شماره‌ی تیکت — چیزی که کاربر در تماس تلفنی می‌خواند.
             * جدا از شناسه‌ی عددی است تا تعداد کل تیکت‌ها لو نرود.
             */
            $table->string('ticket_number', 20)->unique();

            $table->string('subject');

            /* دپارتمان: fnical / orders / billing / other */
            $table->string('department', 20)->default('other');

            /* اولویت: low / normal / high */
            $table->string('priority', 10)->default('normal');

            /*
             * وضعیت گفتگو: open / answered / customer_reply / closed
             *
             * چهار حالت و نه دو تا، چون صف پشتیبانی باید بداند توپ
             * زمین کیست: «پاسخ داده شده» یعنی منتظر کاربریم و
             * «پاسخ مشتری» یعنی نوبت ماست.
             */
            $table->string('status', 20)->default('open');

            /**
             * زمان آخرین پیام.
             *
             * ذخیره می‌شود نه محاسبه: صف پشتیبانی بر اساس همین مرتب
             * می‌شود و JOIN زدن به پیام‌ها در هر بار نمایش فهرست،
             * کوئری را چند برابر می‌کند.
             */
            $table->timestamp('last_reply_at')->nullable();

            $table->timestamp('closed_at')->nullable();

            $table->timestamps();

            /** کوئری پرتکرار کاربر: تیکت‌های من، تازه‌ترین اول */
            $table->index(['user_id', 'last_reply_at']);

            /** صف پشتیبانی: تیکت‌های باز به ترتیب انتظار */
            $table->index(['status', 'last_reply_at']);
        });

        Schema::create('ticket_messages', function (Blueprint $table) {
            $table->id();

            $table->foreignId('ticket_id')->constrained()->cascadeOnDelete();

            /*
             * فرستنده.
             *
             * nullable است چون اگر روزی حساب کاربری حذف شود، پیام‌های
             * گفتگو باید بمانند — وگرنه تاریخچه‌ی پشتیبانی نصفه
             * می‌شود و پیام‌های پشتیبان بدون زمینه رها می‌مانند.
             */
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            /**
             * آیا فرستنده کارمند پشتیبانی بوده؟
             *
             * ⚠️ در همان لحظه ذخیره می‌شود، نه از روی نقشِ فعلیِ
             *    فرستنده. اگر بعداً نقش آن کاربر عوض شود، پیام‌های
             *    قدیمی‌اش نباید سمتشان در گفتگو جابه‌جا شود.
             */
            $table->boolean('is_staff')->default(false);

            $table->text('body');

            $table->timestamps();

            /** نمایش گفتگو: پیام‌های یک تیکت به ترتیب زمان */
            $table->index(['ticket_id', 'created_at']);
        });
    }

    /** حذف جدول‌ها در صورت بازگردانی — ابتدا وابسته، سپس اصلی. */
    public function down(): void
    {
        Schema::dropIfExists('ticket_messages');
        Schema::dropIfExists('tickets');
    }
};
