<?php

/**
 * مایگریشن جدول تصاویر محصول (گالری).
 *
 * چرا جدول جدا و نه ستون JSON داخل products؟
 *   - هر تصویر متادیتای خودش را دارد (متن جایگزین، ترتیب، شاخص بودن)
 *   - امکان مرتب‌سازی و حذف تک‌تک بدون بازنویسی کل آرایه
 *   - امکان اتصال تصویر به یک تنوع خاص (مثلاً عکس گوشی مشکی)
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** ساخت جدول تصاویر محصول. */
    public function up(): void
    {
        Schema::create('product_images', function (Blueprint $table) {
            $table->id();

            $table->foreignId('product_id')
                ->constrained()
                ->cascadeOnDelete();

            /** مسیر فایل تصویر در استوریج */
            $table->string('path');

            /**
             * متن جایگزین تصویر (alt) به هر دو زبان.
             * برای دسترسی‌پذیری (صفحه‌خوان) و سئوی تصاویر الزامی است.
             */
            $table->json('alt')->nullable();

            /** تصویر شاخص — در کارت محصول و نتایج جستجو نمایش داده می‌شود */
            $table->boolean('is_primary')->default(false);

            /** ترتیب نمایش در گالری */
            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->timestamps();

            /** کوئری پرتکرار: تصاویر یک محصول به ترتیب */
            $table->index(['product_id', 'sort_order']);
        });
    }

    /** حذف جدول در صورت بازگردانی. */
    public function down(): void
    {
        Schema::dropIfExists('product_images');
    }
};
