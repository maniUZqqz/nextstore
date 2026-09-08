<?php

/**
 * مایگریشن جدول آدرس‌های کاربر.
 *
 * هر کاربر می‌تواند چند آدرس داشته باشد (خانه، محل کار، ...) و
 * هنگام تسویه یکی را انتخاب کند.
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** ساخت جدول آدرس‌ها. */
    public function up(): void
    {
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            /** برچسب دلخواه کاربر: «خانه»، «محل کار» */
            $table->string('label')->nullable();

            /* --- گیرنده --- */
            /*
             * نام گیرنده جدا از نام کاربر ذخیره می‌شود، چون ممکن است
             * کاربر برای شخص دیگری سفارش بدهد.
             */
            $table->string('recipient_name');
            $table->string('recipient_phone', 20);

            /* --- موقعیت جغرافیایی --- */
            $table->string('province');
            $table->string('city');
            $table->text('street');
            $table->string('postal_code', 20)->nullable();

            /** پلاک و واحد */
            $table->string('building_no', 20)->nullable();
            $table->string('unit', 20)->nullable();

            /** مختصات برای نقشه — در فاز بعدی استفاده می‌شود */
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            /** آدرس پیش‌فرض — هنگام تسویه از پیش انتخاب می‌شود */
            $table->boolean('is_default')->default(false);

            $table->timestamps();

            /** کوئری پرتکرار: آدرس‌های یک کاربر با پیش‌فرض در ابتدا */
            $table->index(['user_id', 'is_default']);
        });
    }

    /** حذف جدول در صورت بازگردانی. */
    public function down(): void
    {
        Schema::dropIfExists('addresses');
    }
};
