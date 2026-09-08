<?php

/**
 * نظرات محصول — ثبت، تعدیل، رأی مفید، بازمحاسبه‌ی امتیاز.
 */

use App\Models\Product;
use App\Models\Review;
use App\Models\User;

describe('ثبت نظر', function () {
    it('نظر تازه را در حالت انتظار تأیید می‌سازد', function () {
        actingAsCustomer();
        $product = Product::factory()->create();

        $this->postJson("/api/v1/products/{$product->slug}/reviews", [
            'rating' => 5,
            'comment' => 'کیفیت ساخت واقعاً عالی بود و سریع رسید.',
        ])->assertCreated();

        $review = Review::query()->first();

        /*
         * ⚠️ نظر تازه نباید بلافاصله منتشر شود.
         *
         *    بدون صف تعدیل، صفحه‌ی محصول به تابلوی هرزنامه تبدیل
         *    می‌شود و پاک‌کردنش پس از انتشار همیشه دیر است.
         */
        expect($review->is_approved)->toBeFalse();
    });

    it('نظر تأییدنشده در فهرست عمومی دیده نمی‌شود', function () {
        $product = Product::factory()->create();
        actingAsCustomer();

        $this->postJson("/api/v1/products/{$product->slug}/reviews", [
            'rating' => 4,
            'comment' => 'محصول خوبی بود و ارزش خرید دارد.',
        ])->assertCreated();

        $response = $this->getJson("/api/v1/products/{$product->slug}/reviews")->assertOk();

        expect($response->json('data'))->toBeEmpty();
    });

    it('مهمان نمی‌تواند نظر بدهد', function () {
        $product = Product::factory()->create();

        $this->postJson("/api/v1/products/{$product->slug}/reviews", [
            'rating' => 5,
        ])->assertUnauthorized();
    });

    it('امتیاز خارج از بازه را رد می‌کند', function () {
        actingAsCustomer();
        $product = Product::factory()->create();

        $this->postJson("/api/v1/products/{$product->slug}/reviews", ['rating' => 6])
            ->assertStatus(422)->assertJsonValidationErrors('rating');

        $this->postJson("/api/v1/products/{$product->slug}/reviews", ['rating' => 0])
            ->assertStatus(422)->assertJsonValidationErrors('rating');
    });

    it('متن خیلی کوتاه را رد می‌کند', function () {
        actingAsCustomer();
        $product = Product::factory()->create();

        $this->postJson("/api/v1/products/{$product->slug}/reviews", [
            'rating' => 5,
            'comment' => 'خوب',
        ])->assertStatus(422)->assertJsonValidationErrors('comment');
    });

    /*
     * ⚠️ کلید یکتای (user_id, product_id) در دیتابیس.
     *
     *    بدون آن، یک کاربر می‌توانست ده نظر پنج‌ستاره بگذارد و میانگین
     *    امتیاز محصول را خودش بسازد.
     */
    it('نظر دوم همان کاربر روی همان محصول را رد می‌کند', function () {
        $user = actingAsCustomer();
        $product = Product::factory()->create();

        $this->postJson("/api/v1/products/{$product->slug}/reviews", [
            'rating' => 5,
            'comment' => 'اولین نظر من درباره‌ی این محصول است.',
        ])->assertCreated();

        /*
         * ⚠️ کد **۴۰۹** است نه ۴۲۲ — و درست هم همین است.
         *
         *    داده‌ی ارسالی هیچ ایرادی ندارد؛ وضعیت فعلی (نظر قبلیِ همین
         *    کاربر) با درخواست تعارض دارد. فرانت با ۴۰۹ می‌تواند به‌جای
         *    هایلایت فیلد، پیام «شما قبلاً نظر داده‌اید» نشان دهد.
         */
        $this->postJson("/api/v1/products/{$product->slug}/reviews", [
            'rating' => 1,
            'comment' => 'دومین نظر که نباید پذیرفته شود.',
        ])->assertStatus(409);

        expect(Review::query()->where('user_id', $user->id)->count())->toBe(1);
    });
});

describe('تعدیل نظر', function () {
    it('تأیید مدیر نظر را منتشر می‌کند', function () {
        $product = Product::factory()->create();
        $author = User::factory()->create();

        $review = Review::query()->create([
            'product_id' => $product->id,
            'user_id' => $author->id,
            'rating' => 5,
            'comment' => 'نظری که منتظر تأیید است.',
            'is_approved' => false,
        ]);

        actingAsAdmin();

        $this->patchJson("/api/v1/admin/reviews/{$review->id}/approve")->assertOk();

        expect($review->fresh()->is_approved)->toBeTrue();

        /* حالا باید در فهرست عمومی دیده شود */
        $response = $this->getJson("/api/v1/products/{$product->slug}/reviews")->assertOk();
        expect($response->json('data'))->toHaveCount(1);
    });

    it('رد بدون دلیل پذیرفته نمی‌شود', function () {
        $review = Review::query()->create([
            'product_id' => Product::factory()->create()->id,
            'user_id' => User::factory()->create()->id,
            'rating' => 1,
            'is_approved' => false,
        ]);

        actingAsAdmin();

        $this->patchJson("/api/v1/admin/reviews/{$review->id}/reject", [])
            ->assertStatus(422)->assertJsonValidationErrors('reason');
    });

    /*
     * ⚠️ دلیل رد الزامی است چون کاربر در «نظرات من» فقط همین متن را
     *    می‌بیند؛ رد بی‌دلیل یعنی او نمی‌داند چه چیزی را اصلاح کند.
     */
    it('رد با دلیل، دلیل را ذخیره می‌کند', function () {
        $review = Review::query()->create([
            'product_id' => Product::factory()->create()->id,
            'user_id' => User::factory()->create()->id,
            'rating' => 1,
            'is_approved' => false,
        ]);

        actingAsAdmin();

        $this->patchJson("/api/v1/admin/reviews/{$review->id}/reject", [
            'reason' => 'متن نظر به این محصول مربوط نیست.',
        ])->assertOk();

        expect($review->fresh()->rejection_reason)->toBe('متن نظر به این محصول مربوط نیست.');
    });
});

describe('بازمحاسبه‌ی امتیاز محصول', function () {
    /*
     * ⚠️ میانگین امتیاز باید از نظرات **تأییدشده** ساخته شود.
     *
     *    اگر نظرات در انتظار هم شمرده شوند، هر کسی می‌تواند با ثبت یک
     *    نظر یک‌ستاره، امتیاز نمایش‌داده‌شده را فوراً پایین بیاورد —
     *    پیش از آنکه مدیر اصلاً آن را دیده باشد.
     */
    it('فقط نظرات تأییدشده در میانگین شمرده می‌شوند', function () {
        $product = Product::factory()->create();

        $reviews = collect([5, 3])->map(fn (int $rating) => Review::query()->create([
            'product_id' => $product->id,
            'user_id' => User::factory()->create()->id,
            'rating' => $rating,
            'is_approved' => false,
        ]));

        actingAsAdmin();

        /* فقط اولی تأیید می‌شود */
        $this->patchJson("/api/v1/admin/reviews/{$reviews[0]->id}/approve")->assertOk();

        expect(round($product->fresh()->rating_avg, 1))->toBe(5.0)
            ->and($product->fresh()->reviews_count)->toBe(1);
    });

    it('حذف نظر امتیاز را دوباره حساب می‌کند', function () {
        $product = Product::factory()->create();

        $review = Review::query()->create([
            'product_id' => $product->id,
            'user_id' => User::factory()->create()->id,
            'rating' => 5,
            'is_approved' => true,
            'approved_at' => now(),
        ]);

        actingAsAdmin();
        $this->deleteJson("/api/v1/admin/reviews/{$review->id}")->assertOk();

        expect($product->fresh()->reviews_count)->toBe(0);
    });
});

describe('رأی مفید', function () {
    it('رأی را ثبت و با کلیک دوم برمی‌دارد', function () {
        $product = Product::factory()->create();

        $review = Review::query()->create([
            'product_id' => $product->id,
            'user_id' => User::factory()->create()->id,
            'rating' => 5,
            'is_approved' => true,
            'approved_at' => now(),
        ]);

        actingAsCustomer();

        $this->postJson("/api/v1/reviews/{$review->id}/helpful")->assertOk();
        expect($review->fresh()->helpful_count)->toBe(1);

        /* کلیک دوم رأی را برمی‌دارد — دکمه‌ی تغییرحالت است نه شمارنده */
        $this->postJson("/api/v1/reviews/{$review->id}/helpful")->assertOk();
        expect($review->fresh()->helpful_count)->toBe(0);
    });

    it('مهمان نمی‌تواند رأی بدهد', function () {
        $review = Review::query()->create([
            'product_id' => Product::factory()->create()->id,
            'user_id' => User::factory()->create()->id,
            'rating' => 5,
            'is_approved' => true,
            'approved_at' => now(),
        ]);

        $this->postJson("/api/v1/reviews/{$review->id}/helpful")->assertUnauthorized();
    });
});
