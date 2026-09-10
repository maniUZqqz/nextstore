<?php

/**
 * سقف‌های نرخ — که هر کدام سطل خودش را داشته باشد.
 * ---------------------------------------------------------------------------
 * چه چیزی اینجا محافظت می‌شود؟
 *
 *   چند محدودکننده‌ی این پروژه دو سقف هم‌زمان دارند: فرم تماس «۳ در
 *   دقیقه» و «۲۰ در ساعت»، بازیابی رمز «۲ در دقیقه» و «۱۰ در ساعت».
 *   منطق‌شان به این وابسته است که هر سقف شمارنده‌ی جدا داشته باشد.
 *
 *   اگر دو سقف روی یک سطل بیفتند، لاراول هر درخواست را دوبار می‌شمارد
 *   و عمر سطل همان عمر کوتاه‌ترین سقف می‌ماند — یعنی سقف ساعتی نوشته
 *   می‌شود، در توضیح کد هم می‌آید، ولی هرگز اجرا نمی‌شود. رباتی که ۶۰
 *   ثانیه صبر کند شبانه صدها پیام می‌فرستد، دقیقاً همان کاری که سقف
 *   ساعتی قرار بود جلویش را بگیرد.
 *
 * ⚠️ الان درست است، ولی **تصادفی** درست است.
 *
 *    لاراول به هر کلید پسوند «attempts:N:decay:S» اضافه می‌کند، پس دو
 *    سقف با اعداد متفاوت خودبه‌خود جدا می‌شوند حتی وقتی کد ما به هر
 *    دو یک کلید داده. یعنی این ایمنی از تصمیم ما نمی‌آید، از جزئیات
 *    پیاده‌سازی فریم‌ورک می‌آید — و جزئیات پیاده‌سازی عوض می‌شود.
 *
 *    این فایل همان فرض را میخکوب می‌کند تا اگر روزی عوض شد، اینجا
 *    بشکند نه در تولید.
 */

use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\RateLimiter;

/**
 * همان کلید کشی که میان‌افزار ThrottleRequests برای یک محدودکننده‌ی
 * نام‌دار می‌سازد.
 *
 * @return array<int, string>
 */
function bucketKeys(string $limiter, Request $request): array
{
    $resolver = RateLimiter::limiter($limiter);

    expect($resolver)->not->toBeNull("محدودکننده‌ی «{$limiter}» ثبت نشده است");

    return collect(Arr::wrap($resolver($request)))
        ->map(fn ($limit) => md5($limiter.$limit->key))
        ->all();
}

/** درخواستی با IP و ایمیل مشخص، تا بست‌های محدودکننده چیزی برای کلید داشته باشند. */
function limiterRequest(): Request
{
    $request = Request::create('/', 'POST', ['email' => 'someone@example.test']);
    $request->server->set('REMOTE_ADDR', '203.0.113.9');

    return $request;
}

describe('کلیدهای سطل', function () {
    /*
     * روی **همه‌ی** محدودکننده‌ها، نه فقط آن‌ها که امروز دو سقف دارند:
     * سقف تازه معمولاً با کپی‌کردن سقف قبلی نوشته می‌شود و کلیدش هم
     * با همان کپی می‌آید.
     */
    it('هیچ محدودکننده‌ای دو سقف با سطل مشترک ندارد', function () {
        $request = limiterRequest();

        foreach (['api', 'auth', 'password-forgot', 'password-reset', 'contact', 'search'] as $limiter) {
            $keys = bucketKeys($limiter, $request);

            expect(array_unique($keys))->toHaveCount(
                count($keys),
                "محدودکننده‌ی «{$limiter}» دو سقف با کلید یکسان دارد",
            );
        }
    });

    it('فرم تماس دقیقاً دو سقف دارد', function () {
        expect(bucketKeys('contact', limiterRequest()))->toHaveCount(2);
    });
});

describe('فرم تماس', function () {
    /*
     * سنجش رفتار، نه فقط تفاوت کلید: سطل دقیقه‌ای دستی پاک می‌شود
     * (انگار یک دقیقه گذشته) و شمارنده‌ی ساعتی باید سرِ جایش بماند.
     */
    it('سقف ساعتی با گذشتن دقیقه صفر نمی‌شود', function () {
        [$minuteKey, $hourKey] = bucketKeys('contact', limiterRequest());

        RateLimiter::hit($minuteKey, 60);
        RateLimiter::hit($hourKey, 3600);

        RateLimiter::clear($minuteKey);

        expect(RateLimiter::attempts($minuteKey))->toBe(0)
            ->and(RateLimiter::attempts($hourKey))->toBe(1);
    });
});
