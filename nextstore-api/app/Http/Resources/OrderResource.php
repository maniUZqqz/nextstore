<?php

namespace App\Http\Resources;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * تبدیل مدل Order به خروجی JSON — نمای فهرست سفارش‌ها.
 *
 * سبک نگه داشته شده: اقلام سفارش فقط در نمای جزئیات می‌آیند،
 * وگرنه فهرست ۲۰ سفارشی حجم زیادی پیدا می‌کند.
 *
 * @mixin Order
 */
class OrderResource extends JsonResource
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
            'orderNumber' => $this->order_number,

            /* --- وضعیت --- */
            'status' => $this->status->value,
            'statusLabel' => $this->status->label($locale),
            /* رنگ معنایی — فرانت‌اند از آن کلاس رنگ می‌سازد */
            'statusColor' => $this->status->color(),
            /* شماره مرحله برای نوار پیشرفت (۰ تا ۵) */
            'statusStep' => $this->status->step(),
            'isCancellable' => $this->status->isCancellableByCustomer(),

            /* --- مبالغ --- */
            'subtotal' => $this->subtotal,
            'discount' => $this->discount,
            'shippingCost' => $this->shipping_cost,
            'tax' => $this->tax,
            'total' => $this->total,

            'itemsCount' => $this->whenLoaded('items', fn () => $this->total_quantity),

            /* --- زمان‌ها --- */
            'createdAt' => $this->created_at?->toIso8601String(),
            'paidAt' => $this->paid_at?->toIso8601String(),
            'shippedAt' => $this->shipped_at?->toIso8601String(),
            'deliveredAt' => $this->delivered_at?->toIso8601String(),

            'trackingCode' => $this->tracking_code,
        ];
    }
}
