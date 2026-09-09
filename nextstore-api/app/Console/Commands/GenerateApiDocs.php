<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use ReflectionClass;
use ReflectionMethod;
use Throwable;

/**
 * ساخت مستندات API از روی خودِ مسیرها و توضیحات کد.
 * ---------------------------------------------------------------------------
 * ⚠️ چرا این و نه Scribe؟
 *
 *    Scribe ابزار خوبی است ولی برای این پروژه دو هزینه دارد: چند ده
 *    مگابایت وابستگی روی دیسکی که تنگ است، و مهم‌تر — توضیحاتش را از
 *    انوتیشن‌های مخصوص خودش می‌خواند (`@bodyParam`, `@response`). یعنی
 *    باید همان چیزی را که در docblock نوشته‌ایم دوباره و به شکل دیگری
 *    بنویسیم، و از آن لحظه دو متن داریم که از هم دور می‌افتند.
 *
 *    اینجا منبع، **خودِ کد** است: جدول مسیرها را لاراول می‌دهد و
 *    توضیح هر اندپوینت را از docblock همان متد کنترلر می‌خوانیم. هیچ
 *    چیزی دوباره نوشته نمی‌شود، پس هیچ چیزی هم کهنه نمی‌شود.
 *
 * ⚠️ خروجی Markdown است نه HTML: در گیت‌هاب مستقیم رندر می‌شود، در
 *    ویرایشگر خوانا می‌ماند، و diff آن در بازبینی کد معنا دارد.
 */
class GenerateApiDocs extends Command
{
    protected $signature = 'docs:api {--output=docs/API.md : مسیر فایل خروجی}';

    protected $description = 'ساخت مستندات API از روی مسیرها و توضیحات کنترلرها';

    /**
     * گروه‌بندی — بر اساس پیشوند مسیر.
     *
     * ⚠️ ترتیب اهمیت دارد: اولین تطبیق برنده است، پس مسیرهای خاص‌تر
     *    باید بالاتر باشند. «admin/» پیش از بقیه می‌آید چون
     *    «admin/products» هم با «products» تطبیق می‌کند.
     *
     * @var array<string, string>
     */
    private const GROUPS = [
        'auth/' => 'احراز هویت',
        'admin/' => 'پنل مدیریت',
        'cart' => 'سبد خرید',
        'orders' => 'سفارش‌ها',
        'payments' => 'پرداخت',
        'products' => 'محصولات',
        'categories' => 'دسته‌بندی‌ها',
        'brands' => 'برندها',
        'posts' => 'وبلاگ',
        'reviews' => 'نظرات',
        'tickets' => 'پشتیبانی',
        'notifications' => 'اعلان‌ها',
        'addresses' => 'آدرس‌ها',
        'profile' => 'پروفایل',
        'wishlist' => 'علاقه‌مندی',
    ];

    public function handle(): int
    {
        $routes = $this->collectRoutes();

        if ($routes === []) {
            $this->error('هیچ مسیر API پیدا نشد.');

            return self::FAILURE;
        }

        $path = base_path((string) $this->option('output'));
        File::ensureDirectoryExists(dirname($path));
        File::put($path, $this->render($routes));

        $this->info(sprintf('%d اندپوینت در %s نوشته شد.', count($routes), $path));

        return self::SUCCESS;
    }

    /**
     * جمع‌آوری مسیرهای API با توضیحاتشان.
     *
     * @return list<array<string, mixed>>
     */
    private function collectRoutes(): array
    {
        $collected = [];

        /*
         * ⚠️ `getRoutes()->getRoutes()` و نه فقط اولی.
         *
         *    `Route::getRoutes()` یک `RouteCollectionInterface` می‌دهد
         *    که قرارداد پیمایش را تضمین نمی‌کند؛ در زمان اجرا کار
         *    می‌کند ولی تحلیل ایستا درست می‌گوید که به آن نمی‌شود تکیه
         *    کرد. متد دوم آرایه‌ی صریح مسیرها را برمی‌گرداند.
         */
        foreach (Route::getRoutes()->getRoutes() as $route) {
            $uri = $route->uri();

            if (! str_starts_with($uri, 'api/')) {
                continue;
            }

            /*
             * ⚠️ HEAD کنار GET حذف می‌شود.
             *
             *    لاراول برای هر GET یک HEAD هم ثبت می‌کند. نشان‌دادنش
             *    در مستندات، هر ردیف را دو برابر می‌کند بی‌آنکه چیزی
             *    اضافه کند.
             */
            $methods = array_values(array_diff($route->methods(), ['HEAD', 'OPTIONS']));

            if ($methods === []) {
                continue;
            }

            $collected[] = [
                'method' => implode('|', $methods),
                'uri' => $uri,
                'name' => $route->getName(),
                'auth' => $this->requiresAuth($route->gatherMiddleware()),
                'admin' => in_array('admin', $route->gatherMiddleware(), true),
                'throttle' => $this->throttleName($route->gatherMiddleware()),
                'summary' => $this->summaryFor($route->getActionName()),
                'group' => $this->groupFor($uri),
            ];
        }

        usort($collected, fn ($a, $b) => [$a['group'], $a['uri']] <=> [$b['group'], $b['uri']]);

        return $collected;
    }

    /** @param  array<int, mixed>  $middleware */
    private function requiresAuth(array $middleware): bool
    {
        foreach ($middleware as $item) {
            if (is_string($item) && str_contains($item, 'sanctum')) {
                return true;
            }
        }

        return false;
    }

    /**
     * نام محدودکننده‌ی نرخ، اگر مسیر سقف اختصاصی داشته باشد.
     *
     * ⚠️ `throttle:api` عمومی است و روی همه‌ی مسیرها هست؛ نشان‌دادنش
     *    فقط نویز است. فقط سقف‌های اختصاصی گزارش می‌شوند.
     *
     * @param  array<int, mixed>  $middleware
     */
    private function throttleName(array $middleware): ?string
    {
        foreach ($middleware as $item) {
            if (is_string($item) && str_starts_with($item, 'throttle:') && $item !== 'throttle:api') {
                return Str::after($item, 'throttle:');
            }
        }

        return null;
    }

    /**
     * اولین جمله‌ی docblock متد کنترلر.
     *
     * ⚠️ خطوطی که با «GET /api/…» شروع می‌شوند رد می‌شوند: آن‌ها همان
     *    چیزی را می‌گویند که ستون مسیر می‌گوید.
     *
     * ⚠️ بلوک‌های «⚠️» هم رد می‌شوند. آن‌ها توضیح *برای توسعه‌دهنده‌ی
     *    این پروژه* هستند — چرایی یک تصمیم — نه توصیف رفتار اندپوینت
     *    برای مصرف‌کننده‌ی API.
     */
    private function summaryFor(string $action): string
    {
        if (! str_contains($action, '@')) {
            return '';
        }

        [$class, $method] = explode('@', $action, 2);

        try {
            /*
             * ⚠️ پرانتز دور `new` لازم است.
             *
             *    نحو `new X()->method()` از PHP 8.4 است و این پروژه
             *    روی 8.3 اجرا می‌شود. نتیجه‌اش خطای تجزیه بود و لاراول
             *    کلاس را بی‌صدا رد می‌کرد — فرمان با پیام «هیچ فرمانی در
             *    فضای‌نام docs نیست» جواب می‌داد، که شبیه غلط تایپی نام
             *    فرمان به نظر می‌رسد نه خطای نحوی در فایل.
             */
            $reflection = new ReflectionMethod((new ReflectionClass($class))->getName(), $method);
        } catch (Throwable) {
            return '';
        }

        $doc = $reflection->getDocComment();

        if ($doc === false) {
            return '';
        }

        /*
         * ⚠️ بلوک هشدار **تا انتها** رد می‌شود، نه فقط خط اولش.
         *
         *    نسخه‌ی اول فقط خطی را که با علامت هشدار شروع می‌شد نادیده
         *    می‌گرفت. نتیجه‌اش این بود که خط *دوم* همان بلوک — که وسط
         *    جمله است — به‌عنوان توضیح اندپوینت در مستندات می‌نشست:
         *    جمله‌ای بریده و بی‌معنا.
         *
         *    بلوک هشدار با یک خط خالی تمام می‌شود، پس تا رسیدن به آن
         *    همه‌ی خطوط رد می‌شوند.
         */
        $inWarning = false;

        /*
         * ⚠️ پرچم `u` روی الگو الزامی است.
         *
         *    بدون آن، `preg_split` بایت‌محور کار می‌کند و متن فارسی را
         *    **وسط حروف** می‌شکند: «ورود با ای◌» / «یل و ر◌» / «ز
         *    عبور». نتیجه در مستندات، جمله‌های نصفه‌ی ناخوانا بود که
         *    شبیه خرابی کدگذاری فایل به نظر می‌رسیدند، نه خطای الگو.
         */
        foreach (preg_split('/\R/u', $doc) ?: [] as $raw) {
            $line = trim(ltrim(trim($raw), '/*'));

            if ($line === '') {
                $inWarning = false;

                continue;
            }

            if (str_starts_with($line, '⚠')) {
                $inWarning = true;

                continue;
            }

            if ($inWarning || str_starts_with($line, '@')) {
                continue;
            }

            /* خط مسیر همان چیزی را می‌گوید که ستون مسیر می‌گوید */
            if (preg_match('#^(GET|POST|PUT|PATCH|DELETE)\s#', $line)) {
                continue;
            }

            /*
             * ⚠️ نقطه‌ی پایان با `str_ends_with` برداشته می‌شود، نه با
             *    `rtrim($line, '.')`.
             *
             *    `rtrim` بایت‌محور است و نویسه‌های چندبایتی UTF-8 را
             *    نمی‌شناسد: اگر آخرین بایتِ یک حرف فارسی با کد نقطه
             *    یکی باشد، همان بایت را می‌برد و حرف را نصفه می‌کند.
             *    خروجی «ورود با ای◌» می‌شد — متنی که در ویرایشگر هم
             *    درست دیده نمی‌شود.
             */
            return str_ends_with($line, '.') ? mb_substr($line, 0, -1) : $line;
        }

        return '';
    }

    private function groupFor(string $uri): string
    {
        $path = Str::after($uri, 'api/v1/');

        foreach (self::GROUPS as $prefix => $group) {
            if (str_starts_with($path, $prefix)) {
                return $group;
            }
        }

        return 'عمومی';
    }

    /**
     * ساخت متن Markdown.
     *
     * @param  list<array<string, mixed>>  $routes
     */
    private function render(array $routes): string
    {
        $grouped = collect($routes)->groupBy('group');

        $out = "# مستندات API\n\n";
        $out .= "> ⚠️ این فایل **دستی نوشته نمی‌شود**. با فرمان زیر از روی\n";
        $out .= "> خودِ مسیرها و توضیحات کنترلرها ساخته می‌شود:\n>\n";
        $out .= ">     php artisan docs:api\n>\n";
        $out .= "> پس اگر چیزی اینجا غلط است، جای اصلاحش docblock همان متد\n";
        $out .= "> کنترلر است، نه این فایل.\n\n";

        $out .= '**پایه:** `'.config('app.url')."/api/v1`\n\n";

        $out .= "## قراردادهای مشترک\n\n";
        $out .= "| موضوع | قرارداد |\n|---|---|\n";
        $out .= "| زبان | هدر `Accept-Language: fa` یا `en`. پیش‌فرض فارسی. |\n";
        $out .= "| احراز هویت | `Authorization: Bearer <token>` — توکن از `/auth/login` |\n";
        $out .= "| مبالغ | همه به **ریال** و عدد صحیح. تبدیل به تومان کار نمایش است. |\n";
        $out .= "| خطای اعتبارسنجی | کد ۴۲۲ با `errors` به تفکیک فیلد |\n";
        $out .= "| سبد مهمان | هدر `X-Session-Id` — بدون آن سبد به کاربر گره نمی‌خورد |\n\n";

        $out .= sprintf("در مجموع **%d اندپوینت** در %d گروه.\n\n", count($routes), $grouped->count());

        foreach ($grouped as $group => $items) {
            $out .= "## {$group}\n\n";
            $out .= "| متد | مسیر | توضیح | دسترسی |\n|---|---|---|---|\n";

            foreach ($items as $item) {
                $access = match (true) {
                    $item['admin'] => 'مدیر',
                    $item['auth'] => 'کاربر',
                    default => 'عمومی',
                };

                if ($item['throttle']) {
                    $access .= " · سقف `{$item['throttle']}`";
                }

                $uri = Str::after($item['uri'], 'api/v1');

                $out .= sprintf(
                    "| `%s` | `%s` | %s | %s |\n",
                    $item['method'],
                    $uri === '' ? '/' : $uri,
                    $item['summary'] ?: '—',
                    $access,
                );
            }

            $out .= "\n";
        }

        return $out;
    }
}
