<?php

namespace App\Services\Auth;

use App\Enums\UserRole;
use App\Models\User;
use App\Notifications\WelcomeNotification;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * سرویس احراز هویت — تمام منطق ثبت‌نام، ورود و خروج.
 * ---------------------------------------------------------------------------
 * چرا Service و نه Controller؟
 *   همین منطق باید از چند جا قابل فراخوانی باشد: کنترلر API، تست،
 *   و بعداً ورود با کد یکبارمصرف. قرار دادنش در کنترلر یعنی تکرار.
 */
class AuthService
{
    /** نام پیش‌فرض توکن — در فهرست «دستگاه‌های فعال» نمایش داده می‌شود. */
    private const TOKEN_NAME = 'auth-token';

    /** مدت اعتبار توکن معمولی (ساعت). */
    private const TOKEN_LIFETIME_HOURS = 24;

    /** مدت اعتبار توکن «مرا به خاطر بسپار» (روز). */
    private const REMEMBER_LIFETIME_DAYS = 30;

    /**
     * ثبت‌نام کاربر جدید و صدور توکن.
     *
     * @param  array{name: string, email: string, phone?: string|null, password: string}  $data
     * @return array{user: User, token: string}
     */
    public function register(array $data): array
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => strtolower(trim($data['email'])),
            'phone' => $data['phone'] ?? null,
            /* کست 'hashed' در مدل، رمز را خودکار هش می‌کند */
            'password' => $data['password'],
            /* کاربر جدید همیشه مشتری است — ارتقای نقش فقط از پنل ادمین */
            'role' => UserRole::Customer,
            'is_active' => true,
        ]);

        $user->recordLogin();

        /*
         * ⚠️ ایمیل خوش‌آمد در صف می‌رود و خطایش بلعیده می‌شود.
         *
         *    بدون این، ثبت‌نام تا جواب سرور SMTP معطل می‌ماند و اگر آن
         *    سرویس قطع باشد کاربر خطا می‌بیند — در حالی که حسابش ساخته
         *    شده و دفعه‌ی بعد «این ایمیل قبلاً ثبت شده» می‌گیرد و
         *    عملاً گیر می‌افتد.
         */
        try {
            $user->notify(new WelcomeNotification(app()->getLocale()));
        } catch (Throwable $e) {
            Log::warning('ارسال ایمیل خوش‌آمد ناموفق بود', [
                'user' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }

        return [
            'user' => $user,
            'token' => $this->issueToken($user, remember: false),
        ];
    }

    /**
     * ورود کاربر و صدور توکن.
     *
     * @param  array{email: string, password: string, remember?: bool}  $data
     * @return array{user: User, token: string}
     *
     * @throws ValidationException وقتی ایمیل یا رمز اشتباه است
     * @throws AuthenticationException وقتی حساب مسدود شده است
     */
    public function login(array $data): array
    {
        $user = User::where('email', strtolower(trim($data['email'])))->first();

        /*
         * ⚠️ نکته امنیتی مهم:
         *   بررسی وجود کاربر و درستی رمز در *یک شرط* انجام می‌شود و
         *   پیام خطا یکسان است.
         *
         *   اگر برای «کاربر یافت نشد» و «رمز اشتباه» پیام متفاوت بدهیم،
         *   مهاجم می‌تواند بفهمد کدام ایمیل‌ها در سیستم ثبت شده‌اند
         *   (حمله User Enumeration) و روی همان‌ها تمرکز کند.
         */
        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        /* حساب مسدودشده حتی با رمز درست نباید وارد شود */
        if (! $user->is_active) {
            throw new AuthenticationException(__('auth.account_disabled'));
        }

        $user->recordLogin();

        return [
            'user' => $user,
            'token' => $this->issueToken($user, remember: (bool) ($data['remember'] ?? false)),
        ];
    }

    /**
     * خروج از حساب — ابطال توکن فعلی.
     *
     * فقط توکن همین دستگاه باطل می‌شود، نه همه‌ی توکن‌ها.
     * اگر کاربر روی موبایل هم وارد باشد، آنجا وارد می‌ماند.
     */
    public function logout(User $user): void
    {
        $user->currentAccessToken()?->delete();
    }

    /**
     * خروج از تمام دستگاه‌ها.
     * برای وقتی که کاربر مشکوک است حسابش لو رفته.
     */
    public function logoutFromAllDevices(User $user): void
    {
        $user->tokens()->delete();
    }

    /**
     * صدور توکن دسترسی برای کاربر.
     *
     * دسترسی‌های توکن (abilities) بر اساس نقش تعیین می‌شود، تا حتی اگر
     * توکن یک مشتری لو برود، امکان دسترسی به پنل ادمین وجود نداشته باشد.
     *
     * @param  bool  $remember  توکن بلندمدت صادر شود؟
     */
    private function issueToken(User $user, bool $remember): string
    {
        $abilities = $user->role->canAccessAdmin()
            ? ['*']
            : ['shop:read', 'shop:write'];

        $expiresAt = $remember
            ? now()->addDays(self::REMEMBER_LIFETIME_DAYS)
            : now()->addHours(self::TOKEN_LIFETIME_HOURS);

        return $user
            ->createToken($this->deviceName(), $abilities, $expiresAt)
            ->plainTextToken;
    }

    /**
     * ساخت نامی خوانا برای دستگاه از روی User-Agent.
     *
     * ⚠️ چرا لازم شد؟ همه‌ی توکن‌ها نام ثابت «auth-token» می‌گرفتند.
     *    صفحه‌ی «دستگاه‌های واردشده» در پنل کاربری فهرستی نشان می‌داد
     *    که همه‌ی سطرهایش یک اسم داشتند — کاربر نمی‌توانست تشخیص
     *    دهد کدام گوشی خودش است و کدام دستگاه ناشناس. یعنی قابلیتی
     *    که برای امنیت ساخته شده بود، عملاً بی‌فایده بود.
     *
     * ⚠️ User-Agent قابل جعل است و برای تصمیم امنیتی به آن تکیه
     *    نمی‌کنیم؛ فقط برچسبی برای کمک به تشخیص خودِ کاربر است.
     *
     * تشخیص عمداً ساده و بدون کتابخانه است: هدف نام دقیق مرورگر
     * نیست، بلکه تفکیک «موبایل اندروید» از «کروم روی ویندوز» است.
     */
    private function deviceName(): string
    {
        $agent = (string) request()->userAgent();

        if ($agent === '') {
            return self::TOKEN_NAME;
        }

        $platform = match (true) {
            str_contains($agent, 'Android') => 'Android',
            (bool) preg_match('/iPhone|iPad|iPod/', $agent) => 'iOS',
            str_contains($agent, 'Windows') => 'Windows',
            str_contains($agent, 'Mac OS') => 'macOS',
            str_contains($agent, 'Linux') => 'Linux',
            default => null,
        };

        /*
         * ترتیب بررسی مرورگرها مهم است: رشته‌ی User-Agent مرورگرهای
         * مبتنی بر کرومیوم شامل «Chrome» و «Safari» هم هست، پس
         * خاص‌ترین‌ها باید اول بیایند وگرنه همه «Chrome» تشخیص
         * داده می‌شوند.
         */
        $browser = match (true) {
            str_contains($agent, 'Edg/') => 'Edge',
            str_contains($agent, 'OPR/') => 'Opera',
            str_contains($agent, 'Firefox') => 'Firefox',
            str_contains($agent, 'Chrome') => 'Chrome',
            str_contains($agent, 'Safari') => 'Safari',
            default => null,
        };

        $label = trim(implode(' · ', array_filter([$browser, $platform])));

        return $label !== '' ? $label : self::TOKEN_NAME;
    }
}
