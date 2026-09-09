<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * پیام‌های فرم «تماس با ما».
 * ---------------------------------------------------------------------------
 * ⚠️ چرا جدا از `tickets` و نه یک ستون در آن؟
 *
 *    `tickets.user_id` اجباری است و باید بماند: کل جریان تیکت — از
 *    «سفارش‌های من» تا اعلان پاسخ — روی مالکیت کاربر سوار است. مهمانی
 *    که فقط می‌خواهد یک سؤال بپرسد کاربر نیست و اجبار به ثبت‌نام،
 *    همان تماسی را از بین می‌برد که صفحه برای آن ساخته شده.
 *
 *    پیام تماس هم ماهیتاً گفتگو نیست؛ یک قلم صندوق ورودی است. مدیر
 *    می‌خواندش و بیرون از سامانه جواب می‌دهد. مدل‌کردنش به‌شکل تیکت،
 *    وضعیت‌هایی مثل «پاسخ مشتری» را به آن می‌چسباند که هرگز رخ
 *    نمی‌دهند.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_messages', function (Blueprint $table) {
            $table->id();

            /*
             * کاربر — اختیاری.
             *
             * اگر فرستنده وارد شده باشد نگه داشته می‌شود تا مدیر بداند
             * با چه کسی طرف است؛ ولی نام و ایمیل *همیشه* جداگانه ذخیره
             * می‌شوند. کاربر ممکن است بعداً ایمیلش را عوض کند یا حساب
             * حذف شود، و پیامی که نشود به آن جواب داد بی‌فایده است.
             */
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            $table->string('name', 120);
            $table->string('email', 190);
            $table->string('subject', 190);
            $table->text('message');

            /*
             * وضعیت خواندن.
             *
             * ⚠️ دو ستون و نه یکی: `is_read` برای فیلتر و شمارش نشان
             *    صندوق (روی بولین ایندکس می‌خورد، روی timestamp نه) و
             *    `read_at` برای اینکه معلوم باشد چقدر طول کشیده تا
             *    کسی پیام را ببیند.
             */
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();

            /*
             * نشانی IP فرستنده.
             *
             * ⚠️ برای هرزنامه است نه برای ردیابی: وقتی صدها پیام تبلیغاتی
             *    از یک نشانی می‌آید، بدون این ستون هیچ راهی برای جدا
             *    کردنشان از پیام‌های واقعی نیست.
             *
             *    ۴۵ نویسه چون IPv6 در بدترین حالت (نگاشت IPv4) همین‌قدر
             *    می‌شود.
             */
            $table->string('ip', 45)->nullable();

            $table->timestamps();

            /* صندوق ورودی همیشه «خوانده‌نشده‌ها، تازه‌ترین اول» است */
            $table->index(['is_read', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_messages');
    }
};
