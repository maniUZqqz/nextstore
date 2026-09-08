<?php

/**
 * مایگریشن جدول محصولات — جدول مرکزی فروشگاه.
 *
 * ⚠️ تصمیم مهم درباره‌ی قیمت:
 *   قیمت‌ها به‌صورت عدد صحیح (Integer) ذخیره می‌شوند، نه اعشاری (Float).
 *   واحد: کمترین واحد پول (ریال برای ایران، سِنت برای دلار).
 *
 *   دلیل: اعداد اعشاری در کامپیوتر دقیق نیستند.
 *   مثال کلاسیک:  0.1 + 0.2 === 0.30000000000000004
 *   در محاسبات مالی این خطا فاجعه است. با عدد صحیح، خطا صفر است.
 *
 *   تبدیل به تومان در لایه نمایش انجام می‌شود، نه در دیتابیس.
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** ساخت جدول محصولات. */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            /* --- رابطه‌ها --- */

            /** دسته‌بندی محصول — با حذف دسته، محصول بی‌دسته می‌شود نه حذف */
            $table->foreignId('category_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            /** برند سازنده */
            $table->foreignId('brand_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            /* --- محتوای چندزبانه --- */

            /** نام محصول — {"fa": "گوشی گلکسی", "en": "Galaxy Phone"} */
            $table->json('name');

            /** توضیح کوتاه — در کارت محصول نمایش داده می‌شود */
            $table->json('short_description')->nullable();

            /** توضیح کامل — در تب «توضیحات» صفحه محصول */
            $table->json('description')->nullable();

            /* --- شناسه‌ها --- */

            /** نامک انگلیسی برای URL — در هر دو زبان یکسان */
            $table->string('slug')->unique();

            /** کد کالا (Stock Keeping Unit) — شناسه انبارداری */
            $table->string('sku')->unique();

            /** بارکد جهانی محصول */
            $table->string('barcode')->nullable();

            /* --- قیمت‌گذاری (همه به کمترین واحد پول) --- */

            /** قیمت اصلی محصول */
            $table->unsignedBigInteger('price');

            /**
             * قیمت پس از تخفیف.
             * اگر null باشد یعنی محصول تخفیف ندارد.
             * قیمت نهایی = compare_price ?? price
             */
            $table->unsignedBigInteger('sale_price')->nullable();

            /** زمان شروع و پایان تخفیف — برای فروش ویژه زمان‌دار */
            $table->timestamp('sale_starts_at')->nullable();
            $table->timestamp('sale_ends_at')->nullable();

            /** قیمت تمام‌شده برای فروشنده — فقط ادمین می‌بیند، برای گزارش سود */
            $table->unsignedBigInteger('cost_price')->nullable();

            /* --- موجودی انبار --- */

            /** تعداد موجود در انبار */
            $table->unsignedInteger('stock')->default(0);

            /** آستانه هشدار موجودی کم — زیر این عدد به ادمین اطلاع داده می‌شود */
            $table->unsignedInteger('low_stock_threshold')->default(5);

            /**
             * اجازه سفارش با موجودی صفر (پیش‌فروش).
             * برای محصولاتی که هنوز نرسیده‌اند اما قابل سفارش‌اند.
             */
            $table->boolean('allow_backorder')->default(false);

            /* --- مشخصات فیزیکی (برای محاسبه هزینه ارسال) --- */

            /** وزن به گرم */
            $table->unsignedInteger('weight')->nullable();

            /** ابعاد به میلی‌متر — {"length": 150, "width": 75, "height": 8} */
            $table->json('dimensions')->nullable();

            /* --- وضعیت و نمایش --- */

            /** وضعیت انتشار — مقادیر از App\Enums\ProductStatus */
            $table->string('status')->default('draft');

            /** نمایش در بخش «محصولات منتخب» صفحه اصلی */
            $table->boolean('is_featured')->default(false);

            /**
             * آیا این محصول تنوع (رنگ/سایز) دارد؟
             * اگر true باشد، قیمت و موجودی از جدول product_variants خوانده می‌شود.
             */
            $table->boolean('has_variants')->default(false);

            /* --- آمار (برای مرتب‌سازی و نمایش) --- */

            /** تعداد بازدید صفحه محصول */
            $table->unsignedBigInteger('views_count')->default(0);

            /** تعداد کل فروش — برای مرتب‌سازی «پرفروش‌ترین» */
            $table->unsignedInteger('sales_count')->default(0);

            /**
             * میانگین امتیاز کاربران (۰ تا ۵).
             * این مقدار «غیرنرمال» است یعنی از جدول نظرات محاسبه و اینجا
             * ذخیره می‌شود. دلیل: محاسبه‌ی میانگین در هر بار نمایش لیست
             * محصولات بسیار کند است.
             * به‌روزرسانی در ReviewObserver انجام می‌شود.
             */
            $table->decimal('rating_avg', 3, 2)->default(0);

            /** تعداد نظرات تأییدشده */
            $table->unsignedInteger('reviews_count')->default(0);

            /* --- سئو --- */
            $table->json('meta_title')->nullable();
            $table->json('meta_description')->nullable();

            /** زمان انتشار — برای مرتب‌سازی «جدیدترین» */
            $table->timestamp('published_at')->nullable();

            $table->timestamps();

            /** حذف نرم — محصول حذف‌شده از سوابق سفارش پاک نمی‌شود */
            $table->softDeletes();

            /* ----------------------------------------------------------------
             * ایندکس‌ها
             * هر ایندکس بر اساس یک کوئری واقعی و پرتکرار طراحی شده است.
             * ایندکس اضافه = کندی در نوشتن. پس فقط آنچه لازم است.
             * -------------------------------------------------------------- */

            /** لیست محصولات یک دسته: WHERE category_id=? AND status='active' */
            $table->index(['category_id', 'status']);

            /** لیست محصولات یک برند */
            $table->index(['brand_id', 'status']);

            /** صفحه اصلی: محصولات منتخب فعال */
            $table->index(['status', 'is_featured']);

            /** مرتب‌سازی «جدیدترین» */
            $table->index(['status', 'published_at']);

            /** مرتب‌سازی «ارزان‌ترین/گران‌ترین» و فیلتر بازه قیمت */
            $table->index(['status', 'price']);

            /** مرتب‌سازی «پرفروش‌ترین» */
            $table->index(['status', 'sales_count']);
        });
    }

    /** حذف جدول در صورت بازگردانی. */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
