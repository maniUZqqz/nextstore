<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

/**
 * تبدیل مدل User به ردیف فهرست مشتریان — پنل مدیریت.
 * ---------------------------------------------------------------------------
 * ⚠️ چرا Resource جدا و نه UserResource؟
 *
 *    UserResource قرارداد «کاربر» را توصیف می‌کند و همه‌جا — از پاسخ
 *    ورود تا نویسنده‌ی نظر — استفاده می‌شود. افزودن `totalSpent` و
 *    `ordersCount` به آن یعنی هر مصرف‌کننده‌ای این فیلدها را ببیند و
 *    هر جا که رابطه‌ها withCount نشده باشند، عدد صفرِ گمراه‌کننده
 *    بگیرد.
 *
 *    اینجا قرارداد متفاوتی است: «مشتری از دید مدیر». پس فیلدهای
 *    تجمیعی جای درستشان همین‌جاست.
 *
 * ⚠️ رمز عبور و توکن‌ها هرگز بیرون نمی‌روند — `$hidden` مدل آن‌ها را
 *    می‌گیرد و اینجا هم هیچ‌کدام صریحاً نوشته نشده‌اند.
 */
class AdminCustomerResource extends JsonResource
{
    /**
     * ساخت آرایه خروجی.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $locale = app()->getLocale();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar' => $this->avatar,

            'role' => $this->role->value,
            'roleLabel' => $this->role->label($locale),

            'isActive' => $this->is_active,
            'emailVerified' => $this->email_verified_at !== null,
            'phoneVerified' => $this->phone_verified_at !== null,

            /* --- آمار خرید --- */
            /*
             * ⚠️ این سه فیلد از `withCount` و `withSum` کوئری می‌آیند.
             *    اگر روزی کنترلر آن‌ها را اضافه نکند، `??` مقدار صفر
             *    می‌دهد و ستون خالی نمی‌ماند — ولی عدد صفر هم دروغ
             *    است، پس هر مسیر تازه‌ای باید همان تجمیع‌ها را بگذارد.
             */
            'ordersCount' => (int) ($this->orders_count ?? 0),

            /* مجموع خرید به ریال — فقط سفارش‌های پرداخت‌شده */
            'totalSpent' => (int) ($this->paid_orders_sum_total ?? 0),

            'lastOrderAt' => $this->last_order_at
                ? Carbon::parse($this->last_order_at)->toIso8601String()
                : null,

            'createdAt' => $this->created_at?->toIso8601String(),
            'lastLoginAt' => $this->last_login_at?->toIso8601String(),
        ];
    }
}
