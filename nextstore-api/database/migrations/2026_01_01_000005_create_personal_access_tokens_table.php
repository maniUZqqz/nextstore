<?php

/**
 * مایگریشن جدول توکن‌های دسترسی (Laravel Sanctum).
 *
 * چرا احراز هویت توکنی و نه سشن؟
 *   فرانت‌اند (localhost:3000) و بک‌اند (localhost:8001) دامنه‌های
 *   متفاوتی هستند. کوکی سشن بین دامنه‌ها دردسر دارد و نیاز به
 *   پیکربندی SameSite و دامنه مشترک است.
 *
 *   با توکن Bearer:
 *     - همان API بدون تغییر به اپ موبایل هم سرویس می‌دهد
 *     - مشکل CSRF وجود ندارد (توکن در هدر می‌رود نه کوکی)
 *     - مقیاس‌پذیری بهتر (بدون نیاز به ذخیره سشن سمت سرور)
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** ساخت جدول توکن‌ها. */
    public function up(): void
    {
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();

            /* رابطه چندریختی — می‌تواند به هر مدلی وصل شود، نه فقط User */
            $table->morphs('tokenable');

            /** نام توکن — برای نمایش «دستگاه‌های فعال» به کاربر */
            $table->string('name');

            /**
             * هش توکن.
             * ⚠️ خودِ توکن هرگز ذخیره نمی‌شود — فقط هش آن.
             * دلیل: اگر دیتابیس لو برود، مهاجم نمی‌تواند توکن‌ها را
             * بازسازی کند. دقیقاً همان منطق ذخیره رمز عبور.
             */
            $table->string('token', 64)->unique();

            /** دسترسی‌های این توکن — برای محدود کردن اختیارات */
            $table->text('abilities')->nullable();

            /** آخرین زمان استفاده — برای نمایش «آخرین فعالیت» */
            $table->timestamp('last_used_at')->nullable();

            /** زمان انقضا — توکن منقضی خودکار رد می‌شود */
            $table->timestamp('expires_at')->nullable()->index();

            $table->timestamps();
        });
    }

    /** حذف جدول در صورت بازگردانی. */
    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
    }
};
