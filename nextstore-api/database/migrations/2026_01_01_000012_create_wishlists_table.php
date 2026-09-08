<?php

/**
 * مایگریشن جدول علاقه‌مندی‌ها (Wishlist).
 *
 * هر ردیف یعنی «کاربر X محصول Y را پسندیده است».
 * جدول عمداً بسیار سبک است — فقط دو کلید خارجی — چون تنها کارش
 * نگهداری یک رابطه‌ی چندبه‌چند بین کاربر و محصول است.
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** ساخت جدول علاقه‌مندی‌ها. */
    public function up(): void
    {
        Schema::create('wishlists', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            /*
             * حذف محصول، ردیف علاقه‌مندی را هم پاک می‌کند.
             * بدون cascade، کاربر در فهرست علاقه‌مندی‌اش ردیف‌هایی
             * می‌بیند که به هیچ محصولی اشاره نمی‌کنند و صفحه می‌شکند.
             */
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();

            $table->timestamps();

            /*
             * ⚠️ کلید یکتای ترکیبی — مهم‌ترین خط این مایگریشن.
             *
             * بدون آن، دوبار زدن روی قلب (یا دو تب باز هم‌زمان)
             * دو ردیف تکراری می‌سازد و محصول دوبار در فهرست
             * علاقه‌مندی ظاهر می‌شود. اینجا دیتابیس خودش جلوی
             * تکرار را می‌گیرد، نه منطق برنامه — پس هیچ مسیر
             * فراموش‌شده‌ای نمی‌تواند آن را دور بزند.
             */
            $table->unique(['user_id', 'product_id']);

            /** کوئری پرتکرار: علاقه‌مندی‌های یک کاربر، جدیدترین اول */
            $table->index(['user_id', 'created_at']);
        });
    }

    /** حذف جدول در صورت بازگردانی. */
    public function down(): void
    {
        Schema::dropIfExists('wishlists');
    }
};
