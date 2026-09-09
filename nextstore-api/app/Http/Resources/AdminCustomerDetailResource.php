<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;

/**
 * پروفایل کامل یک مشتری — پنل مدیریت.
 * ---------------------------------------------------------------------------
 * همان فیلدهای فهرست، به‌علاوه‌ی آدرس‌ها، سفارش‌های اخیر و شمارش
 * فعالیت‌ها. مدیر با یک درخواست همه‌چیز را می‌بیند.
 *
 * ⚠️ سفارش‌ها **محدود** برگردانده می‌شوند نه کامل: مشتری قدیمی
 *    می‌تواند صدها سفارش داشته باشد و فرستادن همه‌شان یک پاسخ چند
 *    مگابایتی می‌سازد برای صفحه‌ای که فقط ده‌تای آخر را نشان می‌دهد.
 *    فهرست کامل، جای خودش در `/admin/orders?customer=` است.
 *
 * @mixin User
 */
class AdminCustomerDetailResource extends AdminCustomerResource
{
    /**
     * ساخت آرایه خروجی.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'birthDate' => $this->birth_date?->toDateString(),

            /* --- شمارش فعالیت‌ها --- */
            'reviewsCount' => (int) ($this->reviews_count ?? 0),
            'ticketsCount' => (int) ($this->tickets_count ?? 0),
            'addressesCount' => (int) ($this->addresses_count ?? 0),
            'wishlistCount' => (int) ($this->wishlists_count ?? 0),

            /* --- آدرس‌ها --- */
            'addresses' => AddressResource::collection($this->whenLoaded('addresses')),

            /* --- سفارش‌های اخیر --- */
            'recentOrders' => AdminOrderResource::collection($this->whenLoaded('orders')),
        ]);
    }
}
