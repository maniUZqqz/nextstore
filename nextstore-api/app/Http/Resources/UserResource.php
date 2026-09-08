<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * تبدیل مدل User به خروجی JSON.
 *
 * ⚠️ نکات امنیتی رعایت‌شده:
 *   - رمز عبور و remember_token در $hidden مدل هستند و اصلاً نمی‌آیند
 *   - ایمیل و موبایل فقط برای خودِ کاربر یا مدیر برگردانده می‌شوند
 *   - نقش فقط به‌صورت رشته می‌آید، نه با جزئیات دسترسی‌ها
 *
 * ⚠️ باگی که اینجا رفع شد:
 *    تشخیص «خودِ کاربر» با $request->user() انجام می‌شد. اما در پاسخ
 *    ثبت‌نام و ورود، هنوز توکنی روی درخواست نیست و $request->user()
 *    مقدار null دارد — پس ایمیل کاربر در پاسخ ورودِ خودش حذف می‌شد!
 *
 *    راه‌حل: پرچم صریح asOwner() که در جریان احراز هویت فعال می‌شود.
 */
class UserResource extends JsonResource
{
    /**
     * آیا این خروجی برای خودِ صاحب حساب است؟
     * وقتی true باشد، فیلدهای خصوصی (ایمیل، موبایل) هم برگردانده می‌شوند.
     */
    private bool $asOwner = false;

    /**
     * علامت‌گذاری خروجی به‌عنوان «متعلق به خود کاربر».
     *
     * در کنترلر احراز هویت استفاده می‌شود:
     *     (new UserResource($user))->asOwner()
     */
    public function asOwner(): static
    {
        $this->asOwner = true;

        return $this;
    }

    /**
     * ساخت آرایه خروجی.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $locale = app()->getLocale();
        $viewer = $request->user();

        /*
         * فیلدهای خصوصی در سه حالت نمایش داده می‌شوند:
         *   ۱. پرچم asOwner صریحاً فعال شده (جریان ثبت‌نام و ورود)
         *   ۲. بیننده خودِ همین کاربر است (اندپوینت /me)
         *   ۳. بیننده مدیر است (پنل ادمین)
         */
        $showPrivate = $this->asOwner
            || $viewer?->id === $this->id
            || $viewer?->isAdmin();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'avatar' => $this->avatar,

            /* --- نقش --- */
            'role' => $this->role->value,
            'roleLabel' => $this->role->label($locale),
            'isAdmin' => $this->role->canAccessAdmin(),

            /* --- اطلاعات تماس: فقط برای خود کاربر یا مدیر --- */
            'email' => $this->when($showPrivate, $this->email),
            'phone' => $this->when($showPrivate, $this->phone),

            /* --- وضعیت تأیید --- */
            'emailVerified' => $this->email_verified_at !== null,
            'phoneVerified' => $this->phone_verified_at !== null,

            'birthDate' => $this->birth_date?->toDateString(),
            'isActive' => $this->is_active,

            'createdAt' => $this->created_at?->toIso8601String(),
            'lastLoginAt' => $this->when($showPrivate, $this->last_login_at?->toIso8601String()),
        ];
    }
}
