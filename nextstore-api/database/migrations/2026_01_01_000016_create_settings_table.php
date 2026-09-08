<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * جدول تنظیمات فروشگاه.
 * ---------------------------------------------------------------------------
 * ⚠️ چرا جدول کلید/مقدار و نه یک جدول تک‌ردیفه با ستون برای هر تنظیم؟
 *
 *    ستون‌محور برای خواندن راحت‌تر است ولی هر تنظیم تازه یک مایگریشن
 *    می‌خواهد. تنظیمات دقیقاً همان چیزی‌اند که مدام یکی به آن‌ها اضافه
 *    می‌شود — «شماره‌ی واتساپ هم بگذاریم»، «کد رهگیری گوگل آنالیتیکس».
 *
 *    مقدار به‌صورت JSON ذخیره می‌شود تا هم رشته‌ی ساده جا بگیرد و هم
 *    مقدار دوزبانه (`{"fa":"...","en":"..."}`) — همان الگویی که برای
 *    نام محصول و دسته به کار رفته.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();

            /* کلید ماشین‌خوان — مثل `site_name` یا `contact_phone` */
            $table->string('key', 60)->unique();

            /*
             * مقدار.
             *
             * ⚠️ nullable است چون «تنظیم‌نشده» با «رشته‌ی خالی» فرق دارد:
             *    اولی یعنی از پیش‌فرض استفاده کن، دومی یعنی مدیر عمداً
             *    خالی گذاشته و نباید چیزی نشان داده شود.
             */
            $table->json('value')->nullable();

            /*
             * گروه — برای دسته‌بندی در پنل.
             * general | contact | social
             */
            $table->string('group', 20)->default('general');

            /*
             * آیا این تنظیم دوزبانه است؟
             *
             * بدون این پرچم، لایه‌ی خواندن نمی‌داند مقدار `{"fa":…}` را
             * باید ترجمه کند یا یک شیء JSON واقعی است.
             */
            $table->boolean('is_translatable')->default(false);

            $table->timestamps();

            $table->index('group');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
