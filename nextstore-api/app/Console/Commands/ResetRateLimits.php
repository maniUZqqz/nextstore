<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\RateLimiter;

/**
 * صفر کردن شمارنده‌های محدودیت نرخ — فقط برای محیط محلی و تست.
 * ---------------------------------------------------------------------------
 * ⚠️ چرا این فرمان لازم شد؟
 *
 *    سقف فرم تماس «۲۰ در ساعت روی هر IP» است و یک اجرای کامل سوئیت
 *    e2e حدود شش پیام می‌فرستد. اجرای سوم در همان ساعت ۴۲۹ می‌گیرد نه
 *    ۴۲۲، و رابط هم درست رفتار می‌کند: به‌جای خطای زیر فیلد، پیام
 *    «کمی صبر کنید» نشان می‌دهد. نتیجه سه شکستِ اعتبارسنجی است بدون
 *    اینکه هیچ باگی وجود داشته باشد — و اجرای همان سوئیت یک ساعت بعد
 *    سبز می‌شود، که آدم را دنبال باگِ ناموجود می‌فرستد.
 *
 * ⚠️ این فرمان هیچ سقفی را کم نمی‌کند.
 *
 *    راه ساده‌تر این بود که سقف تماس را در محیط محلی بالا ببریم، ولی
 *    آن‌وقت مسیری که تست می‌شود با مسیری که در تولید اجرا می‌شود فرق
 *    می‌کرد و بررسی «سقف پیام مخصوص خودش را دارد» عملاً بی‌معنا
 *    می‌شد. اینجا فقط شمارنده صفر می‌شود، مثل پاک‌کردن داده‌ی بازمانده.
 *
 * ⚠️ کلیدها از خودِ تعریف محدودکننده خوانده می‌شوند، نه دستی.
 *
 *    نسخه‌ی اول کلیدها را تایپ کرده بود («contact:127.0.0.1») و هیچ
 *    کاری نمی‌کرد: لاراول به هر کلید پسوند «attempts:N:decay:S»
 *    اضافه می‌کند و بعد کل رشته را با نام محدودکننده md5 می‌گیرد. یک
 *    فرمانِ بی‌صدا و بی‌اثر، بدترین حالت ممکن بود. حالا همان بست‌های
 *    ثبت‌شده اجرا می‌شوند و کلید واقعی از آن‌ها درمی‌آید — اگر روزی
 *    سقفی عوض شود، این فرمان خودش همراه می‌شود.
 *
 * ⚠️ در تولید اجرا نمی‌شود — وگرنه هرکس به کنسول دسترسی داشت
 *    می‌توانست محافظ حدس رمز را با یک فرمان بی‌اثر کند.
 */
class ResetRateLimits extends Command
{
    /** محدودکننده‌هایی که در اجرای تست‌ها پر می‌شوند. */
    private const LIMITERS = ['api', 'auth', 'password-forgot', 'password-reset', 'contact', 'search'];

    protected $signature = 'e2e:reset-limits
                            {--ip=127.0.0.1 : نشانی IP که سطل‌هایش پاک می‌شود}
                            {--email=* : ایمیل‌هایی که سقف‌های ایمیل‌محور برایشان صفر شود}';

    protected $description = 'صفر کردن شمارنده‌های محدودیت نرخ برای اجرای تست‌های سرتاسری';

    public function handle(): int
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->error('این فرمان فقط در محیط local یا testing اجرا می‌شود.');

            return self::FAILURE;
        }

        $ip = (string) $this->option('ip');

        /*
         * حساب‌های دمو به‌علاوه‌ی هر ایمیلی که فراخوان داده. سقف ورود و
         * سقف بازیابی رمز روی ترکیب ایمیل و IP بسته می‌شوند، پس بدون
         * ایمیل درست، پاک‌کردن IP تنهایی کافی نیست.
         */
        $emails = array_merge(
            ['admin@demo.dev', 'manager@demo.dev', 'user@demo.dev', 'e2e-profile@example.test'],
            (array) $this->option('email'),
        );

        $cleared = 0;

        foreach ($emails as $email) {
            foreach (self::LIMITERS as $limiter) {
                $cleared += $this->clearLimiter($limiter, $ip, (string) $email);
            }
        }

        $this->info("{$cleared} سطل محدودیت نرخ برای {$ip} پاک شد.");

        return self::SUCCESS;
    }

    /** اجرای بستِ ثبت‌شده و پاک‌کردن سطلی که میان‌افزار واقعاً استفاده می‌کند. */
    private function clearLimiter(string $limiter, string $ip, string $email): int
    {
        $resolver = RateLimiter::limiter($limiter);

        if ($resolver === null) {
            return 0;
        }

        $request = Request::create('/', 'POST', ['email' => $email]);
        $request->server->set('REMOTE_ADDR', $ip);

        $cleared = 0;

        foreach (Arr::wrap($resolver($request)) as $limit) {
            /*
             * سقف بی‌کلید (`Limit::none()` یا کلید تهی) سطلی ندارد که
             * پاک شود؛ رد کردنش از شمارش دروغین جلوگیری می‌کند.
             */
            if (! isset($limit->key) || $limit->key === '') {
                continue;
            }

            /* همان فرمولی که ThrottleRequests به‌کار می‌برد */
            RateLimiter::clear(md5($limiter.$limit->key));
            $cleared++;
        }

        return $cleared;
    }
}
