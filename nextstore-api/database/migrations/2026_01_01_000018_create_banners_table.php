<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * بنرهای تبلیغاتی صفحه‌ی اصلی.
 * ---------------------------------------------------------------------------
 * پیش از این، سه اسلاید هیرو و سه بنر میانی در خود کد نوشته شده بودند
 * و متنشان از فایل ترجمه می‌آمد. یعنی عوض کردن یک کمپین — کاری که در
 * فروشگاه واقعی هفتگی است — به ویرایش کد و دیپلوی دوباره نیاز داشت.
 *
 * ⚠️ نامک دسته‌ها هم در همان کد ثابت بود (`?category=home-appliances`).
 *    اگر مدیر آن دسته را حذف یا تغییر نام می‌داد، بنر به فهرست خالی
 *    می‌رفت: یک لینک مرده که هیچ خطایی نمی‌داد و هیچ‌کس متوجهش
 *    نمی‌شد.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('banners', function (Blueprint $table) {
            $table->id();

            /*
             * جایگاه: hero (اسلایدر بالای صفحه) یا promo (شبکه‌ی میانی).
             *
             * ⚠️ یک جدول برای هر دو، نه دو جدول.
             *
             *    ستون‌هایشان یکی است و رفتار مدیریتی‌شان هم — همان فرم،
             *    همان بازه‌ی زمانی، همان ترتیب. دو جدول یعنی دو کنترلر
             *    و دو صفحه‌ی پنل که کدشان کپی هم است.
             */
            $table->string('placement', 20)->default('hero');

            /* متن‌های چندزبانه: {"fa": "...", "en": "..."} */

            /*
             * برچسب کوچک بالای عنوان («فروش ویژه پاییز»).
             * فقط در اسلایدر هیرو دیده می‌شود.
             */
            $table->json('badge')->nullable();

            $table->json('title');
            $table->json('subtitle')->nullable();
            $table->json('cta_label')->nullable();

            /*
             * مقصد کلیک — مسیر داخلی مثل «/products?on_sale=1».
             *
             * ⚠️ رشته‌ی آزاد است و نه کلید خارجی به دسته‌ها، چون بنر
             *    ممکن است به فهرست فیلترشده، یک محصول، یا مقاله‌ی وبلاگ
             *    برود. اعتبارسنجی در سطح درخواست انجام می‌شود.
             */
            $table->string('href', 255);

            /*
             * رنگ‌بندی — یک **کلید** نه کلاس CSS.
             *
             * ⚠️ این تفاوت حیاتی است: Tailwind کلاس‌ها را با اسکن متنِ
             *    فایل‌های سورس پیدا می‌کند. اگر کلاس کامل
             *    («from-info/20») در دیتابیس ذخیره و در زمان اجرا ساخته
             *    شود، در بیلد تولیدی اصلاً وجود ندارد و بنر بی‌رنگ
             *    می‌شود — بی هیچ خطایی.
             *
             *    پس اینجا فقط «info» ذخیره می‌شود و فرانت آن را به
             *    نگاشتی از کلاس‌های ثابت می‌دهد.
             */
            $table->string('theme', 20)->default('primary');

            /*
             * آیکون — نام یکی از آیکون‌های lucide، از فهرست سفید فرانت.
             * فقط برای بنرهای promo معنا دارد.
             */
            $table->string('icon', 40)->nullable();

            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->boolean('is_active')->default(true);

            /*
             * بازه‌ی نمایش — هر دو اختیاری.
             *
             * ⚠️ همان چیزی که هاردکد بودن را غیرقابل تحمل می‌کرد:
             *    کمپین نوروز باید خودش سر تاریخ ظاهر و ناپدید شود، نه
             *    اینکه کسی نیمه‌شب دیپلوی کند.
             */
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();

            $table->timestamps();

            /* کوئری همیشه «فعال‌های این جایگاه، به ترتیب» است */
            $table->index(['placement', 'is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('banners');
    }
};
