<?php

/**
 * مایگریشن جدول دسته‌بندی محصولات.
 *
 * ساختار درختی (Self-Referencing):
 *   هر دسته می‌تواند والد داشته باشد → دسته‌بندی چندسطحی
 *   مثال: الکترونیک > موبایل > گوشی هوشمند
 *
 * استراتژی چندزبانگی:
 *   نام و توضیحات در ستون JSON ذخیره می‌شوند:
 *       {"fa": "الکترونیک", "en": "Electronics"}
 *   چرا JSON و نه جدول ترجمه جداگانه؟
 *     - بدون JOIN اضافه → کوئری ساده‌تر و سریع‌تر
 *     - افزودن زبان سوم نیازی به مایگریشن ندارد
 *     - SQLite و MySQL هر دو از JSON پشتیبانی می‌کنند
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** ساخت جدول دسته‌بندی‌ها. */
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();

            /*
             * دسته والد. null یعنی این دسته در بالاترین سطح است.
             * cascadeOnDelete: با حذف والد، زیردسته‌ها هم حذف می‌شوند.
             */
            $table->foreignId('parent_id')
                ->nullable()
                ->constrained('categories')
                ->cascadeOnDelete();

            /** نام دسته به همه زبان‌ها — {"fa": "...", "en": "..."} */
            $table->json('name');

            /** توضیح کوتاه دسته به همه زبان‌ها (اختیاری) */
            $table->json('description')->nullable();

            /*
             * نامک یکتا برای URL. فقط انگلیسی است تا آدرس در هر دو
             * زبان یکسان بماند: /fa/categories/electronics و /en/categories/electronics
             * مزیت: تغییر زبان، آدرس صفحه را نمی‌شکند.
             */
            $table->string('slug')->unique();

            /** آیکون دسته (نام آیکون Lucide یا مسیر SVG) */
            $table->string('icon')->nullable();

            /** تصویر شاخص دسته */
            $table->string('image')->nullable();

            /** ترتیب نمایش — عدد کمتر یعنی بالاتر */
            $table->unsignedSmallInteger('sort_order')->default(0);

            /** آیا این دسته در فروشگاه نمایش داده شود؟ */
            $table->boolean('is_active')->default(true);

            /** نمایش در منوی اصلی سایت */
            $table->boolean('is_featured')->default(false);

            /* --- فیلدهای سئو --- */
            $table->json('meta_title')->nullable();
            $table->json('meta_description')->nullable();

            $table->timestamps();

            /*
             * ایندکس ترکیبی برای رایج‌ترین کوئری:
             * «دسته‌های فعالِ سطح فلان، مرتب‌شده بر اساس ترتیب»
             */
            $table->index(['parent_id', 'is_active', 'sort_order']);
        });
    }

    /** حذف جدول در صورت بازگردانی. */
    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
