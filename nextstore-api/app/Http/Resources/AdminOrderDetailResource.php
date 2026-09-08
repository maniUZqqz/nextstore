<?php

namespace App\Http\Resources;

use App\Enums\OrderStatus;
use Illuminate\Http\Request;

/**
 * خروجی جزئیات سفارش برای پنل مدیریت.
 * ---------------------------------------------------------------------------
 * افزون بر همه‌ی چیزی که مشتری می‌بیند، سه چیز اضافه دارد:
 *
 *   ۱. مشخصات حساب مشتری (ایمیل، شناسه) — برای پیگیری
 *   ۲. یادداشت داخلی ادمین — مشتری هرگز آن را نمی‌بیند
 *   ۳. فهرست انتقال‌های مجاز از وضعیت فعلی
 *
 * ⚠️ مورد ۳ مهم‌ترین است: فرم تغییر وضعیت فقط همین گزینه‌ها را نشان
 *    می‌دهد. اگر فرانت‌اند خودش قواعد انتقال را تکرار می‌کرد، با
 *    اولین تغییر در OrderStatus دو طرف از هم جدا می‌شدند و ادمین
 *    گزینه‌ای می‌دید که سرور ردش می‌کند.
 */
class AdminOrderDetailResource extends OrderDetailResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $locale = app()->getLocale();

        return array_merge(parent::toArray($request), [
            'customer' => [
                'userId' => $this->user_id,
                'name' => $this->whenLoaded('user', fn () => $this->user?->name),
                'email' => $this->whenLoaded('user', fn () => $this->user?->email),
                'phone' => $this->whenLoaded('user', fn () => $this->user?->phone),
            ],

            /* یادداشت داخلی — فقط در این Resource */
            'adminNote' => $this->admin_note,

            /*
             * انتقال‌های مجاز از وضعیت فعلی، همراه برچسب و رنگ.
             * فرانت‌اند مستقیم آن را به دراپ‌داون می‌دهد.
             */
            'allowedTransitions' => collect($this->status->allowedTransitions())
                ->map(fn (OrderStatus $s) => [
                    'value' => $s->value,
                    'label' => $s->label($locale),
                    'color' => $s->color(),
                ])->values()->all(),
        ]);
    }
}
