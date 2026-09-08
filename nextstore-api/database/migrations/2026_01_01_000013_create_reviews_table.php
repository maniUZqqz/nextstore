<?php

/**
 * مایگریشن جدول نظرات محصولات.
 *
 * هر ردیف یک نظر است: امتیاز ستاره‌ای به‌همراه متن اختیاری.
 * نظر تا تأیید مدیر منتشر نمی‌شود و در میانگین امتیاز محصول
 * هم به حساب نمی‌آید.
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** ساخت جدول نظرات. */
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();

            /*
             * سفارشی که این نظر به آن مربوط است.
             *
             * nullOnDelete و نه cascade: اگر سفارش روزی حذف شود،
             * نظر باید بماند. حذف نظرِ منتشرشده به‌خاطر پاک شدن یک
             * سفارش، یعنی از دست دادن محتوایی که مشتریان دیگر
             * به آن تکیه کرده‌اند.
             */
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();

            /** امتیاز ۱ تا ۵ — اعتبارسنجی در FormRequest هم انجام می‌شود */
            $table->unsignedTinyInteger('rating');

            $table->string('title')->nullable();
            $table->text('comment')->nullable();

            /** نقاط مثبت و منفی به‌صورت فهرست رشته */
            $table->json('pros')->nullable();
            $table->json('cons')->nullable();

            /*
             * وضعیت انتشار.
             *
             * ⚠️ پیش‌فرض false است، نه true. نظرِ تأییدنشده نباید
             *    دیده شود و نباید در میانگین امتیاز اثر بگذارد —
             *    وگرنه هر کسی می‌تواند امتیاز یک محصول را با چند
             *    نظر جعلی خراب کند، حتی اگر متنش هرگز منتشر نشود.
             */
            $table->boolean('is_approved')->default(false);

            /** دلیل رد شدن — به کاربر نشان داده می‌شود */
            $table->string('rejection_reason')->nullable();

            /*
             * خرید تأییدشده.
             *
             * در زمان ثبت نظر یک بار محاسبه و ذخیره می‌شود، نه اینکه
             * هر بار از روی سفارش‌ها دوباره حساب شود. دلیل: نمایش
             * فهرست نظرات نباید برای هر ردیف یک کوئری سفارش بزند.
             */
            $table->boolean('is_verified_purchase')->default(false);

            /** تعداد کاربرانی که این نظر را مفید دانسته‌اند */
            $table->unsignedInteger('helpful_count')->default(0);

            $table->timestamps();

            /*
             * ⚠️ هر کاربر برای هر محصول فقط یک نظر.
             *
             * بدون این، یک نفر می‌تواند با ثبت ده نظر پنج‌ستاره
             * میانگین امتیاز را دستکاری کند. مثل جدول علاقه‌مندی،
             * این قانون در سطح دیتابیس اعمال می‌شود تا هیچ مسیر
             * کدی نتواند دورش بزند.
             */
            $table->unique(['user_id', 'product_id']);

            /** کوئری اصلی صفحه محصول: نظرات تأییدشده، جدیدترین اول */
            $table->index(['product_id', 'is_approved', 'created_at']);

            /** صف تعدیل در پنل مدیریت */
            $table->index(['is_approved', 'created_at']);
        });

        /*
         * رأی «مفید بود».
         *
         * چرا جدول جدا و نه فقط شمارنده؟ اگر تنها یک عدد داشته باشیم،
         * هر کاربر می‌تواند بی‌نهایت بار روی «مفید بود» بزند و عدد را
         * بالا ببرد. این جدول با کلید یکتا هر کاربر را به یک رأی
         * محدود می‌کند؛ شمارنده‌ی روی reviews صرفاً کش همین جدول است
         * تا فهرست نظرات نیازی به شمردن در هر درخواست نداشته باشد.
         */
        Schema::create('review_votes', function (Blueprint $table) {
            $table->id();

            $table->foreignId('review_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->timestamps();

            $table->unique(['review_id', 'user_id']);
        });
    }

    /** حذف جدول‌ها در صورت بازگردانی — ابتدا وابسته، سپس اصلی. */
    public function down(): void
    {
        Schema::dropIfExists('review_votes');
        Schema::dropIfExists('reviews');
    }
};
