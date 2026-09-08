<?php

/**
 * فهرست و جستجوی محصولات.
 * ---------------------------------------------------------------------------
 * ⚠️ چیزی که این فایل مراقبش است: محصول پیش‌نویس یا آرشیوشده هرگز نباید
 *    در مسیر عمومی دیده شود. یک شرط جاافتاده در ProductQueryService یعنی
 *    محصولی که مدیر عمداً منتشر نکرده، در فروشگاه قابل خرید است.
 */

use App\Enums\ProductStatus;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;

describe('فهرست محصولات', function () {
    it('فقط محصولات منتشرشده را برمی‌گرداند', function () {
        Product::factory()->count(3)->create();
        Product::factory()->create(['status' => ProductStatus::Draft]);
        Product::factory()->create(['status' => ProductStatus::Archived]);

        $response = $this->getJson('/api/v1/products')->assertOk();

        expect($response->json('meta.total'))->toBe(3);
    });

    /*
     * ⚠️ محصولی با `published_at` در آینده هم نباید دیده شود.
     *
     *    وضعیت Active به‌تنهایی کافی نیست: مدیر می‌تواند محصولی را
     *    برای کمپین هفته‌ی آینده آماده کند و انتشار زمان‌بندی‌شده،
     *    نشت قیمت پیش از موعد را جلوگیری می‌کند.
     */
    it('محصول با انتشار زمان‌بندی‌شده را نشان نمی‌دهد', function () {
        Product::factory()->create(['published_at' => now()->addWeek()]);

        expect($this->getJson('/api/v1/products')->json('meta.total'))->toBe(0);
    });

    it('صفحه‌بندی می‌کند', function () {
        Product::factory()->count(15)->create();

        $response = $this->getJson('/api/v1/products?per_page=10')->assertOk();

        expect($response->json('data'))->toHaveCount(10)
            ->and($response->json('meta.total'))->toBe(15)
            ->and($response->json('meta.last_page'))->toBe(2);
    });
});

describe('فیلترها', function () {
    it('با دسته فیلتر می‌کند', function () {
        $wanted = Category::factory()->create();
        $other = Category::factory()->create();

        Product::factory()->count(2)->create(['category_id' => $wanted->id]);
        Product::factory()->create(['category_id' => $other->id]);

        $response = $this->getJson("/api/v1/products?category={$wanted->slug}")->assertOk();

        expect($response->json('meta.total'))->toBe(2);
    });

    it('با برند فیلتر می‌کند', function () {
        $wanted = Brand::factory()->create();
        Product::factory()->count(2)->create(['brand_id' => $wanted->id]);
        Product::factory()->create();

        expect($this->getJson("/api/v1/products?brand={$wanted->slug}")->json('meta.total'))
            ->toBe(2);
    });

    it('با بازه‌ی قیمت فیلتر می‌کند', function () {
        Product::factory()->create(['price' => 1_000_000]);
        Product::factory()->create(['price' => 5_000_000]);
        Product::factory()->create(['price' => 20_000_000]);

        $response = $this->getJson('/api/v1/products?min_price=2000000&max_price=10000000')
            ->assertOk();

        expect($response->json('meta.total'))->toBe(1);
    });

    it('فقط کالاهای موجود را فیلتر می‌کند', function () {
        Product::factory()->count(2)->create(['stock' => 5]);
        Product::factory()->outOfStock()->create();

        expect($this->getJson('/api/v1/products?in_stock=1')->json('meta.total'))->toBe(2);
    });

    it('فیلتر نامعتبر را نادیده می‌گیرد نه اینکه خطا بدهد', function () {
        Product::factory()->count(2)->create();

        /*
         * دسته‌ای که وجود ندارد یعنی «هیچ نتیجه‌ای»، نه خطای سرور.
         * آدرس‌های اشتراکی قدیمی ممکن است به دسته‌ی حذف‌شده اشاره کنند
         * و صفحه‌ی خطا برای کاربری که روی لینک کلیک کرده بی‌معناست.
         */
        $this->getJson('/api/v1/products?category=no-such-category')->assertOk();
        $this->getJson('/api/v1/products?min_price=not-a-number')->assertOk();
    });
});

describe('جستجو', function () {
    /*
     * ⚠️ جستجوی بین‌زبانی — یکی از قابلیت‌های شاخص پروژه.
     *
     *    نام محصول در ستون JSON ذخیره می‌شود و PHP کاراکترهای فارسی را
     *    escape می‌کند، پس `LIKE '%گوشی%'` هرگز تطابق پیدا نمی‌کرد.
     *    راه‌حل `json_extract` بود؛ این تست مراقب است که برنگردد.
     */
    it('نام فارسی را پیدا می‌کند', function () {
        Product::factory()->create([
            'name' => ['fa' => 'گوشی هوشمند سامسونگ', 'en' => 'Samsung Smartphone'],
        ]);
        Product::factory()->create(['name' => ['fa' => 'لپ‌تاپ', 'en' => 'Laptop']]);

        $response = $this->getJson('/api/v1/products?q=گوشی')->assertOk();

        expect($response->json('meta.total'))->toBe(1);
    });

    it('نام انگلیسی همان محصول را هم پیدا می‌کند', function () {
        Product::factory()->create([
            'name' => ['fa' => 'گوشی هوشمند سامسونگ', 'en' => 'Samsung Smartphone'],
        ]);

        expect($this->getJson('/api/v1/products?q=Samsung')->json('meta.total'))->toBe(1);
    });

    it('برای عبارت بی‌نتیجه فهرست خالی می‌دهد نه خطا', function () {
        Product::factory()->count(3)->create();

        $response = $this->getJson('/api/v1/products?q=zzzznothing')->assertOk();

        expect($response->json('data'))->toBeEmpty();
    });
});

describe('مرتب‌سازی', function () {
    it('بر اساس قیمت صعودی مرتب می‌کند', function () {
        Product::factory()->create(['price' => 5_000_000]);
        Product::factory()->create(['price' => 1_000_000]);
        Product::factory()->create(['price' => 3_000_000]);

        $prices = collect($this->getJson('/api/v1/products?sort=price_asc')->json('data'))
            ->pluck('finalPrice')->all();

        expect($prices)->toBe([1_000_000, 3_000_000, 5_000_000]);
    });

    it('مرتب‌سازی ناشناخته را به پیش‌فرض برمی‌گرداند', function () {
        Product::factory()->count(3)->create();

        /* ورودی دلخواه نباید کوئری را بشکند — احتمال تزریق SQL */
        $this->getJson('/api/v1/products?sort=price_asc;DROP TABLE products')->assertOk();

        expect(Product::query()->count())->toBe(3);
    });
});

describe('جزئیات محصول', function () {
    it('محصول منتشرشده را با نامک برمی‌گرداند', function () {
        $product = Product::factory()->create();

        $this->getJson("/api/v1/products/{$product->slug}")
            ->assertOk()
            ->assertJsonPath('data.slug', $product->slug);
    });

    it('محصول پیش‌نویس ۴۰۴ می‌دهد', function () {
        $product = Product::factory()->create(['status' => ProductStatus::Draft]);

        $this->getJson("/api/v1/products/{$product->slug}")->assertNotFound();
    });

    it('نامک ناموجود ۴۰۴ می‌دهد', function () {
        $this->getJson('/api/v1/products/no-such-product')->assertNotFound();
    });

    it('محصولات مرتبط را برمی‌گرداند', function () {
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);
        Product::factory()->count(3)->create(['category_id' => $category->id]);

        $response = $this->getJson("/api/v1/products/{$product->slug}/related")->assertOk();

        /* خودِ محصول نباید در فهرست مرتبط‌ها باشد */
        $ids = collect($response->json('data'))->pluck('id');

        expect($ids)->not->toContain($product->id);
    });
});
