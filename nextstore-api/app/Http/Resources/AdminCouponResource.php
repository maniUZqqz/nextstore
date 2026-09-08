<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * تبدیل مدل Coupon به خروجی JSON — پنل مدیریت.
 * ---------------------------------------------------------------------------
 * ⚠️ این Resource فقط در پنل استفاده می‌شود و هیچ مسیر عمومی‌ای آن را
 *    برنمی‌گرداند. دلیلش ساده است: فهرست کوپن‌ها یعنی فهرست کدهای
 *    تخفیف فعال. اگر جایی در فروشگاه لو برود، هر کاربری می‌تواند
 *    کدهایی را که برای کمپین خاصی ساخته شده‌اند استفاده کند.
 */
class AdminCouponResource extends JsonResource
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
            'code' => $this->code,
            'description' => $this->description,

            /* الگوی سه‌تایی enum — مقدار خام برای منطق، برچسب برای نمایش */
            'type' => $this->type->value,
            'typeLabel' => $this->type->label($locale),

            'value' => $this->value,
            'maxDiscount' => $this->max_discount,
            'minOrderTotal' => $this->min_order_total,

            'usageLimit' => $this->usage_limit,
            'perUserLimit' => $this->per_user_limit,
            'usedCount' => $this->used_count,

            /*
             * ظرفیت باقی‌مانده — تهی یعنی نامحدود.
             *
             * محاسبه اینجا انجام می‌شود و نه در فرانت: قاعده‌ی
             * «تهی یعنی نامحدود» یک بار نوشته می‌شود، نه در هر
             * جایی که این عدد نمایش داده می‌شود.
             */
            'remainingUses' => $this->usage_limit === null
                ? null
                : max($this->usage_limit - $this->used_count, 0),

            'startsAt' => $this->starts_at?->toIso8601String(),
            'expiresAt' => $this->expires_at?->toIso8601String(),
            'isActive' => $this->is_active,

            /*
             * وضعیت محاسبه‌شده — همان قاعده‌ای که CouponService برای
             * پذیرش یا رد کوپن به کار می‌برد.
             *
             * ⚠️ فرانت نباید این را از روی تاریخ‌ها بازسازی کند: هر
             *    بازسازی یعنی نسخه‌ی دومی از قاعده که با تغییر بک‌اند
             *    بی‌صدا از آن دور می‌شود.
             */
            'state' => $this->resolveState(),

            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }

    /**
     * وضعیت خلاصه‌ی کوپن برای نشان روی جدول.
     *
     * ترتیب بررسی مهم است: کوپن غیرفعالِ منقضی، «غیرفعال» گزارش
     * می‌شود چون آن تصمیم مدیر است و بر انقضا اولویت دارد.
     */
    private function resolveState(): string
    {
        return match (true) {
            ! $this->is_active => 'disabled',
            $this->hasNotStarted() => 'scheduled',
            $this->isExpired() => 'expired',
            ! $this->hasCapacity() => 'exhausted',
            default => 'active',
        };
    }
}
