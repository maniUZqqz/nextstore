<?php

namespace App\Http\Resources;

use App\Models\Order;
use Illuminate\Http\Request;

/**
 * خروجی سفارش برای فهرست پنل مدیریت.
 * ---------------------------------------------------------------------------
 * فهرست مشتری فقط سفارش‌های خودش را نشان می‌دهد، پس نیازی به نام
 * خریدار ندارد. اما ادمین همه‌ی سفارش‌ها را کنار هم می‌بیند و بدون
 * نام مشتری، فهرست فقط ستونی از شماره‌های بی‌معناست.
 *
 * ⚠️ نام گیرنده از *عکس لحظه‌ای* داخل سفارش خوانده می‌شود، نه از
 *    جدول کاربران. اگر کاربر بعداً نامش را عوض کند یا حسابش حذف
 *    شود، سند مالی نباید تغییر کند.
 *
 * @mixin Order
 */
class AdminOrderResource extends OrderResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $address = $this->shipping_address ?? [];

        return array_merge(parent::toArray($request), [
            'customer' => [
                /* نام گیرنده از عکس لحظه‌ای سفارش */
                'name' => $address['recipientName'] ?? null,
                'phone' => $address['recipientPhone'] ?? null,
                'city' => $address['city'] ?? null,

                /*
                 * ایمیل از رابطه‌ی user می‌آید و ممکن است null باشد:
                 * کاربر مهمان، یا حساب حذف‌شده. فرانت‌اند باید این
                 * حالت را بپذیرد.
                 */
                'email' => $this->whenLoaded('user', fn () => $this->user?->email),
                'userId' => $this->user_id,
            ],

            'shippingMethod' => $this->shipping_method,
            'adminNote' => $this->admin_note,
        ]);
    }
}
