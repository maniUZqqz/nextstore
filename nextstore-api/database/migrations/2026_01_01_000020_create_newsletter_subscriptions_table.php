<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * عضویت‌های خبرنامه.
 * ---------------------------------------------------------------------------
 * ⚠️ ایمیل `unique` است، ولی لغو عضویت ردیف را حذف نمی‌کند.
 *
 *    اگر حذف می‌کرد، کسی که لغو کرده با یک بار ثبت دوباره‌ی تصادفی
 *    (مثلاً کلیک اشتباه) دوباره در فهرست می‌افتاد و هیچ ردی نمی‌ماند
 *    که قبلاً نخواسته بود. با `unsubscribed_at`، لغو یک واقعیت
 *    ثبت‌شده است نه نبودِ داده — و اگر روزی شکایتی شد، معلوم است چه
 *    وقت لغو شده.
 *
 * ⚠️ `token` برای لغو عضویت بدون ورود است.
 *
 *    گیرنده‌ی خبرنامه معمولاً حساب ندارد. لینک لغو در پای ایمیل باید
 *    با یک کلیک کار کند، و تنها چیزی که آن را امن نگه می‌دارد همین
 *    توکن تصادفی است — نه شناسه‌ی ردیف که قابل حدس است.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('newsletter_subscriptions', function (Blueprint $table) {
            $table->id();

            /*
             * کاربر — اختیاری، دقیقاً مثل `contact_messages`.
             *
             * بیشتر ثبت‌نام‌های خبرنامه از پای صفحه و بدون ورود انجام
             * می‌شود. اگر کاربر وارد بود نگه داشته می‌شود تا مدیر بداند
             * فهرست چقدر با مشتری‌های واقعی هم‌پوشانی دارد.
             */
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            $table->string('email', 190)->unique();

            /* توکن لغو عضویت — تصادفی، نه قابل حدس */
            $table->string('token', 64)->unique();

            $table->timestamp('unsubscribed_at')->nullable();

            /*
             * ⚠️ IP ذخیره می‌شود چون این فرم بی‌نیاز از ورود است.
             *
             *    بدون آن، اگر رباتی صدها ایمیل ثبت کند هیچ راهی برای
             *    تشخیص و پاک‌کردنشان نیست. همان دلیلی که در فرم تماس
             *    هم به آن رسیدیم.
             */
            $table->ipAddress('ip')->nullable();

            $table->timestamps();

            /* فهرست فعال‌ها پرتکرارترین کوئری است */
            $table->index('unsubscribed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('newsletter_subscriptions');
    }
};
