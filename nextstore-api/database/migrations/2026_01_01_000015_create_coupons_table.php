<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * جدول کدهای تخفیف و مصرفشان.
 * ---------------------------------------------------------------------------
 * ⚠️ چرا جدول جداگانه‌ی `coupon_usages` و نه فقط یک شمارنده روی خود کوپن؟
 *
 *    شمارنده می‌گوید «۴۷ بار استفاده شده» ولی نمی‌گوید *چه کسی* استفاده
 *    کرده. محدودیت «هر کاربر یک بار» — که رایج‌ترین قاعده‌ی کمپین است —
 *    بدون این جدول اصلاً قابل پیاده‌سازی نیست. ضمناً کلید یکتای
 *    (coupon_id, order_id) تضمین می‌کند دو درخواست هم‌زمان نتوانند یک
 *    سفارش را دو بار ثبت کنند.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();

            /*
             * کد یکتا و **همیشه بزرگ‌حرف** ذخیره می‌شود.
             * کاربر ممکن است «summer25» تایپ کند؛ نرمال‌سازی در مدل
             * انجام می‌شود تا جستجو نیازی به LOWER() نداشته باشد و
             * ایندکس یکتا واقعاً کار کند.
             */
            $table->string('code', 40)->unique();

            /* توضیح داخلی برای مدیر — به مشتری نشان داده نمی‌شود */
            $table->string('description')->nullable();

            /*
             * نوع تخفیف:
             *   percent → درصدی از جمع سبد
             *   fixed   → مبلغ ثابت به ریال
             */
            $table->string('type', 10)->default('percent');

            /*
             * مقدار تخفیف.
             *
             * ⚠️ معنایش به `type` وابسته است: برای percent عددی بین ۱ تا
             *    ۱۰۰، برای fixed مبلغ به ریال. یک ستون برای دو معنا
             *    انتخاب آگاهانه است — دو ستون nullable یعنی هر کوئری
             *    باید هر دو را بررسی کند و حالت «هر دو پر» هم ممکن شود.
             */
            $table->unsignedBigInteger('value');

            /*
             * سقف تخفیف برای نوع درصدی — به ریال.
             *
             * ⚠️ بدون این، «۲۰٪ تخفیف» روی سبد ۵۰۰ میلیونی، ۱۰۰ میلیون
             *    تخفیف می‌داد. تقریباً هر کمپین درصدی در دنیای واقعی
             *    سقف دارد.
             */
            $table->unsignedBigInteger('max_discount')->nullable();

            /* حداقل مبلغ سبد برای فعال شدن کوپن — به ریال */
            $table->unsignedBigInteger('min_order_total')->default(0);

            /*
             * محدودیت‌های مصرف.
             *   usage_limit      → سقف کل مصرف؛ تهی یعنی نامحدود
             *   per_user_limit   → سقف مصرف هر کاربر
             */
            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('per_user_limit')->default(1);

            /*
             * شمارنده‌ی مصرف.
             *
             * ⚠️ داده‌ی تکراری نسبت به coupon_usages است و عمداً نگه
             *    داشته می‌شود: بررسی سقف در هر اعتبارسنجی سبد اجرا
             *    می‌شود و COUNT روی جدول مصرف، در هر بار دیدن سبد یک
             *    کوئری تجمیعی تحمیل می‌کرد.
             */
            $table->unsignedInteger('used_count')->default(0);

            /* بازه‌ی اعتبار — هر دو اختیاری */
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            /* فهرست پنل: کوپن‌های فعال و در بازه، مرتب بر تاریخ انقضا */
            $table->index(['is_active', 'expires_at']);
        });

        Schema::create('coupon_usages', function (Blueprint $table) {
            $table->id();

            $table->foreignId('coupon_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            /*
             * سفارشی که کوپن رویش اعمال شد.
             *
             * ⚠️ nullOnDelete و نه cascade: اگر سفارشی حذف شود، رکورد
             *    مصرف باید بماند. حذف آن یعنی کاربر می‌تواند کوپن
             *    «یک‌بارمصرف» را دوباره خرج کند.
             */
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();

            /* مبلغ تخفیف واقعی — عکس لحظه‌ای، چون قاعده‌ی کوپن ممکن است بعداً عوض شود */
            $table->unsignedBigInteger('discount_amount');

            $table->timestamps();

            /*
             * ⚠️ یکتایی روی (coupon_id, order_id) دو بار ثبت‌شدن یک
             *    سفارش را در سطح دیتابیس غیرممکن می‌کند — نه فقط در
             *    منطق برنامه. دو درخواست هم‌زمان ثبت سفارش، یکی‌شان
             *    خطای یکتایی می‌گیرد.
             */
            $table->unique(['coupon_id', 'order_id']);

            /* بررسی سقف هر کاربر */
            $table->index(['coupon_id', 'user_id']);
        });

        /* --- اتصال کوپن به سبد و سفارش --- */

        Schema::table('carts', function (Blueprint $table) {
            /*
             * ⚠️ nullOnDelete: اگر مدیر کوپنی را حذف کند، سبدهایی که
             *    آن را اعمال کرده‌اند نباید از بین بروند — فقط تخفیفشان
             *    برداشته می‌شود.
             */
            $table->foreignId('coupon_id')->nullable()->after('session_id')
                ->constrained()->nullOnDelete();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('coupon_id')->nullable()->after('user_id')
                ->constrained()->nullOnDelete();

            /*
             * کد کوپن در خود سفارش کپی می‌شود.
             *
             * ⚠️ همان اصل «عکس لحظه‌ای» که برای نام محصول و آدرس اعمال
             *    شد: اگر کوپن فردا حذف یا کدش عوض شود، فاکتور قدیمی
             *    نباید تغییر کند. فاکتور یک سند مالی است.
             */
            $table->string('coupon_code', 40)->nullable()->after('coupon_id');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['coupon_id']);
            $table->dropColumn(['coupon_id', 'coupon_code']);
        });

        Schema::table('carts', function (Blueprint $table) {
            $table->dropForeign(['coupon_id']);
            $table->dropColumn('coupon_id');
        });

        Schema::dropIfExists('coupon_usages');
        Schema::dropIfExists('coupons');
    }
};
