<?php

/**
 * مایگریشن جدول دسته‌بندی مقالات مجله.
 *
 * ⚠️ چرا جدول جدا و نه استفاده از همان `categories` محصولات؟
 *
 *    وسوسه‌ی طبیعی این است که هر دو «دسته‌بندی»اند پس یک جدول کافی
 *    است. اما دو مفهوم کاملاً متفاوت‌اند:
 *
 *      - دسته‌ی محصول ساختار درختی چندسطحی دارد، در منوی مگا
 *        می‌آید و روی فیلتر محصولات اثر می‌گذارد.
 *      - دسته‌ی مقاله تخت است و فقط برای گروه‌بندی مطالب است.
 *
 *    یکی‌کردنشان یعنی هر کوئری محصول باید دسته‌های مقاله را کنار
 *    بگذارد و برعکس — با یک ستون `type` که همه‌جا فراموش می‌شود.
 *    دو جدول ساده، از یک جدول با شرط‌های پنهان بهتر است.
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('post_categories', function (Blueprint $table) {
            $table->id();

            /** نام دسته — {"fa": "راهنمای خرید", "en": "Buying Guides"} */
            $table->json('name');

            /** توضیح کوتاه برای سربرگ صفحه‌ی دسته (اختیاری) */
            $table->json('description')->nullable();

            /*
             * نامک فقط انگلیسی، تا آدرس در هر دو زبان یکسان بماند:
             *     /fa/blog/category/buying-guides
             *     /en/blog/category/buying-guides
             */
            $table->string('slug')->unique();

            /** ترتیب نمایش در فهرست دسته‌ها */
            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('post_categories');
    }
};
