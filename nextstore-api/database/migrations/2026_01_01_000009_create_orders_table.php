<?php

/**
 * مایگریشن جداول سفارش، اقلام سفارش و پرداخت.
 *
 * ⚠️ اصل طراحی: سفارش یک «عکس لحظه‌ای» (Snapshot) است.
 *
 *    نام محصول، قیمت و آدرس گیرنده در خود سفارش کپی می‌شوند، نه
 *    اینکه فقط به جدول اصلی ارجاع داده شوند.
 *
 *    چرا؟ اگر ادمین فردا قیمت محصول را عوض کند یا کاربر آدرسش را
 *    ویرایش کند، فاکتور سفارش قدیمی نباید تغییر کند. فاکتور یک
 *    سند مالی است و باید دقیقاً همان چیزی بماند که مشتری دیده و
 *    پرداخت کرده است.
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** ساخت جداول orders، order_items و payments. */
    public function up(): void
    {
        /* ==================================================================
         * سفارش
         * ================================================================== */
        Schema::create('orders', function (Blueprint $table) {
            $table->id();

            /**
             * شماره سفارش قابل نمایش به مشتری.
             * جدا از id عددی است چون:
             *   - id ترتیبی تعداد کل سفارش‌ها را لو می‌دهد (اطلاعات تجاری)
             *   - شماره خواناتر برای پیگیری تلفنی مناسب‌تر است
             */
            $table->string('order_number', 20)->unique();

            /** کاربر سفارش‌دهنده — با حذف کاربر، سفارش برای سوابق مالی می‌ماند */
            $table->foreignId('user_id')->nullable()
                ->constrained()->nullOnDelete();

            /** وضعیت سفارش — مقادیر از App\Enums\OrderStatus */
            $table->string('status')->default('pending');

            /* --- عکس لحظه‌ای آدرس گیرنده --- */
            /*
             * آدرس به‌صورت JSON کپی می‌شود، نه ارجاع به جدول addresses.
             * اگر کاربر آدرسش را حذف یا ویرایش کند، فاکتور دست‌نخورده می‌ماند.
             */
            $table->json('shipping_address');

            /* --- مبالغ (همه به ریال، عدد صحیح) --- */
            /** جمع اقلام پیش از تخفیف و ارسال */
            $table->unsignedBigInteger('subtotal');

            /** مبلغ تخفیف کوپن */
            $table->unsignedBigInteger('discount')->default(0);

            /** هزینه ارسال */
            $table->unsignedBigInteger('shipping_cost')->default(0);

            /** مالیات */
            $table->unsignedBigInteger('tax')->default(0);

            /** مبلغ نهایی قابل پرداخت */
            $table->unsignedBigInteger('total');

            /* --- روش ارسال --- */
            $table->string('shipping_method')->default('standard');

            /** یادداشت مشتری هنگام ثبت سفارش */
            $table->text('customer_note')->nullable();

            /** یادداشت داخلی ادمین — به مشتری نمایش داده نمی‌شود */
            $table->text('admin_note')->nullable();

            /* --- زمان‌های کلیدی چرخه سفارش --- */
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();

            /** کد رهگیری مرسوله */
            $table->string('tracking_code')->nullable();

            $table->timestamps();

            /* کوئری پرتکرار: سفارش‌های یک کاربر، جدیدترین اول */
            $table->index(['user_id', 'created_at']);

            /* پنل ادمین: فیلتر بر اساس وضعیت */
            $table->index(['status', 'created_at']);
        });

        /* ==================================================================
         * اقلام سفارش
         * ================================================================== */
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')->constrained()->cascadeOnDelete();

            /*
             * ارجاع به محصول برای لینک دادن در پنل کاربری.
             * nullOnDelete: اگر محصول حذف شود، قلم سفارش باقی می‌ماند
             * (چون نام و قیمتش کپی شده) اما لینک از بین می‌رود.
             */
            $table->foreignId('product_id')->nullable()
                ->constrained()->nullOnDelete();

            /* --- عکس لحظه‌ای محصول --- */
            /** نام محصول به هر دو زبان در لحظه‌ی خرید */
            $table->json('product_name');

            /** کد کالا در لحظه‌ی خرید */
            $table->string('product_sku');

            /** تصویر محصول در لحظه‌ی خرید */
            $table->string('product_image')->nullable();

            /** قیمت واحد پرداخت‌شده */
            $table->unsignedBigInteger('unit_price');

            $table->unsignedInteger('quantity');

            /** جمع این قلم = unit_price × quantity */
            $table->unsignedBigInteger('line_total');

            $table->timestamps();

            $table->index('order_id');
        });

        /* ==================================================================
         * پرداخت
         * ================================================================== */
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')->constrained()->cascadeOnDelete();

            /** درگاه پرداخت: zarinpal، idpay، stripe، mock */
            $table->string('gateway')->default('mock');

            /** وضعیت — مقادیر از App\Enums\PaymentStatus */
            $table->string('status')->default('initiated');

            /** مبلغ تراکنش به ریال */
            $table->unsignedBigInteger('amount');

            /** شناسه تراکنش نزد درگاه */
            $table->string('reference_id')->nullable()->index();

            /** شماره پیگیری بانکی — به مشتری نمایش داده می‌شود */
            $table->string('tracking_number')->nullable();

            /** پاسخ خام درگاه — برای رفع اختلاف مالی نگه داشته می‌شود */
            $table->json('gateway_response')->nullable();

            /** پیام خطا در صورت شکست */
            $table->string('failure_reason')->nullable();

            $table->timestamp('paid_at')->nullable();

            $table->timestamps();

            $table->index(['order_id', 'status']);
        });
    }

    /** حذف جداول در صورت بازگردانی — به ترتیب معکوس وابستگی. */
    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
