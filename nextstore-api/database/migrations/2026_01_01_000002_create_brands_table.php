<?php

/**
 * مایگریشن جدول برندها (سازندگان محصول).
 *
 * هر محصول به یک برند تعلق دارد (اختیاری).
 * برند برای فیلتر کردن محصولات و صفحه اختصاصی برند استفاده می‌شود.
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** ساخت جدول برندها. */
    public function up(): void
    {
        Schema::create('brands', function (Blueprint $table) {
            $table->id();

            /** نام برند به هر دو زبان — {"fa": "سامسونگ", "en": "Samsung"} */
            $table->json('name');

            /** توضیح و معرفی برند */
            $table->json('description')->nullable();

            /** نامک انگلیسی برای URL */
            $table->string('slug')->unique();

            /** لوگوی برند */
            $table->string('logo')->nullable();

            /** وب‌سایت رسمی برند */
            $table->string('website')->nullable();

            /** کشور سازنده (کد دو حرفی ISO مثل KR، US) */
            $table->char('country_code', 2)->nullable();

            $table->boolean('is_active')->default(true);

            /** نمایش در اسلایدر برندهای صفحه اصلی */
            $table->boolean('is_featured')->default(false);

            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
        });
    }

    /** حذف جدول در صورت بازگردانی. */
    public function down(): void
    {
        Schema::dropIfExists('brands');
    }
};
