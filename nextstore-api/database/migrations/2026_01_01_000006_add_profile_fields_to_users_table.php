<?php

/**
 * افزودن فیلدهای پروفایل به جدول کاربران.
 *
 * جدول users پیش‌فرض لاراول فقط name، email و password دارد.
 * یک فروشگاه به اطلاعات بیشتری نیاز دارد.
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** افزودن ستون‌های پروفایل. */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            /**
             * شماره موبایل.
             * در ایران شماره موبایل مهم‌تر از ایمیل است — پیامک تأیید
             * سفارش و کد یکبارمصرف با آن ارسال می‌شود.
             * unique و nullable: هر کاربر می‌تواند فقط با ایمیل ثبت‌نام کند.
             */
            $table->string('phone', 20)->nullable()->unique()->after('email');

            /** زمان تأیید شماره موبایل */
            $table->timestamp('phone_verified_at')->nullable()->after('phone');

            /**
             * نقش کاربر.
             * برای این پروژه یک ستون ساده کافی است. اگر نیاز به
             * دسترسی‌های ریزدانه پیدا شد، Spatie Permission اضافه می‌شود.
             */
            $table->string('role')->default('customer')->after('phone_verified_at');

            /** تصویر پروفایل */
            $table->string('avatar')->nullable()->after('role');

            /** تاریخ تولد — برای ارسال تخفیف تولد */
            $table->date('birth_date')->nullable()->after('avatar');

            /** آیا حساب فعال است؟ برای مسدود کردن کاربر متخلف */
            $table->boolean('is_active')->default(true)->after('birth_date');

            /** آخرین ورود — برای نمایش در پنل ادمین */
            $table->timestamp('last_login_at')->nullable()->after('is_active');

            /** فیلتر پرتکرار در پنل ادمین: کاربران فعال با نقش مشخص */
            $table->index(['role', 'is_active']);
        });
    }

    /** حذف ستون‌ها در صورت بازگردانی. */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role', 'is_active']);
            $table->dropColumn([
                'phone', 'phone_verified_at', 'role',
                'avatar', 'birth_date', 'is_active', 'last_login_at',
            ]);
        });
    }
};
