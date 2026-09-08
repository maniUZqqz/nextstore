<?php

/**
 * مایگریشن جدول مقالات مجله.
 *
 * ⚠️ سه تصمیم که ارزش توضیح دارند:
 *
 *   ۱. `published_at` به‌جای یک بولین `is_published`.
 *      با بولین فقط می‌دانی منتشر شده یا نه؛ با تاریخ هم وضعیت را
 *      داری، هم امکان انتشار زمان‌بندی‌شده (تاریخ آینده = هنوز
 *      منتشر نشده) و هم ترتیب واقعی مقالات را.
 *
 *   ۲. `reading_minutes` ذخیره می‌شود، نه در لحظه محاسبه.
 *      محاسبه‌ی زمان مطالعه یعنی شمردن کلمات متن کامل. در فهرست
 *      ۱۲ مقاله‌ای، این یعنی خواندن ۱۲ متن بلند از دیتابیس فقط
 *      برای نشان دادن «۵ دقیقه». ستون از پیش محاسبه‌شده این
 *      هزینه را حذف می‌کند.
 *
 *   ۳. `views_count` روی خود جدول، نه جدول جداگانه‌ی بازدید.
 *      برای یک مجله‌ی فروشگاه، تحلیل دقیق بازدید لازم نیست و یک
 *      شمارنده کافی است. جدول جداگانه فقط پیچیدگی اضافه می‌کرد.
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();

            /*
             * دسته‌ی مقاله.
             * nullOnDelete: با حذف دسته، مقاله می‌ماند و بدون دسته
             * می‌شود. cascade اینجا غلط بود — حذف یک دسته نباید
             * محتوای نوشته‌شده را نابود کند.
             */
            $table->foreignId('post_category_id')
                ->nullable()
                ->constrained('post_categories')
                ->nullOnDelete();

            /*
             * نویسنده.
             * nullOnDelete چون مقاله باید پس از حذف حساب نویسنده
             * هم بماند؛ نام نویسنده جداگانه ذخیره می‌شود.
             */
            $table->foreignId('user_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            /*
             * نام نمایشی نویسنده — عکس لحظه‌ای، نه ارجاع.
             * همان منطق سفارش: اگر حساب نویسنده حذف شود یا نامش
             * عوض شود، امضای پای مقاله نباید تغییر کند.
             */
            $table->string('author_name')->nullable();

            /* --- محتوای چندزبانه --- */
            $table->json('title');

            /** خلاصه — در کارت فهرست و متادیتای سئو استفاده می‌شود */
            $table->json('excerpt')->nullable();

            /** متن کامل مقاله */
            $table->json('body');

            /* --- آدرس و تصویر --- */
            $table->string('slug')->unique();
            $table->string('cover_image')->nullable();

            /* --- متادیتا --- */
            /** زمان تقریبی مطالعه به دقیقه */
            $table->unsignedTinyInteger('reading_minutes')->default(1);

            $table->unsignedInteger('views_count')->default(0);

            /** مقاله‌ی شاخص — بالای صفحه‌ی مجله بزرگ‌تر نمایش داده می‌شود */
            $table->boolean('is_featured')->default(false);

            /*
             * زمان انتشار.
             * null یا تاریخ آینده = هنوز منتشر نشده.
             */
            $table->timestamp('published_at')->nullable();

            $table->timestamps();

            /*
             * کوئری پرتکرار: مقالات منتشرشده، جدیدترین اول.
             * بدون ایندکس، هر بازدید از صفحه‌ی مجله کل جدول را اسکن
             * می‌کند.
             */
            $table->index(['published_at', 'id']);
            $table->index('post_category_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
