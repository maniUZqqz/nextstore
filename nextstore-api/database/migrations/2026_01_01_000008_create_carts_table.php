<?php

/**
 * مایگریشن جدول سبد خرید و اقلام آن.
 *
 * چرا سبد در دیتابیس و نه فقط localStorage؟
 *   - کاربر با موبایل محصول اضافه می‌کند، با لپ‌تاپ ادامه می‌دهد
 *   - امکان ارسال ایمیل «سبد رهاشده» (Abandoned Cart)
 *   - امکان گزارش‌گیری برای مدیر
 *
 * سبد مهمان با session_id ذخیره می‌شود و هنگام ورود به حساب،
 * با سبد کاربر ادغام (merge) می‌شود.
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** ساخت جداول carts و cart_items. */
    public function up(): void
    {
        Schema::create('carts', function (Blueprint $table) {
            $table->id();

            /** کاربر مالک سبد — برای مهمان null است */
            $table->foreignId('user_id')->nullable()
                ->constrained()->cascadeOnDelete();

            /** شناسه نشست کاربر مهمان */
            $table->string('session_id')->nullable()->index();

            /** زمان انقضا — سبدهای منقضی با Command پاک می‌شوند */
            $table->timestamp('expires_at')->nullable()->index();

            $table->timestamps();

            /*
             * هر کاربر فقط یک سبد فعال دارد.
             * SQLite چند مقدار NULL را در ستون unique می‌پذیرد،
             * پس سبدهای مهمان (که user_id ندارند) با هم تداخل ندارند.
             */
            $table->unique('user_id');
        });

        Schema::create('cart_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('cart_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();

            $table->unsignedInteger('quantity')->default(1);

            /*
             * قیمت لحظه‌ی افزودن به سبد (Price Snapshot).
             * اگر قیمت محصول بعداً تغییر کند، می‌توانیم به کاربر
             * اطلاع دهیم «قیمت این کالا تغییر کرده است».
             */
            $table->unsignedBigInteger('price_at_add');

            $table->timestamps();

            /*
             * جلوگیری از ردیف تکراری.
             * افزودن دوباره‌ی یک محصول باید تعداد را زیاد کند،
             * نه اینکه ردیف جدید بسازد.
             */
            $table->unique(['cart_id', 'product_id']);
        });
    }

    /** حذف جداول در صورت بازگردانی. */
    public function down(): void
    {
        Schema::dropIfExists('cart_items');
        Schema::dropIfExists('carts');
    }
};
