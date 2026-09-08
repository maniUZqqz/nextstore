<?php

namespace App\Http\Resources;

use App\Enums\PaymentStatus;
use App\Models\OrderItem;
use Illuminate\Http\Request;

/**
 * خروجی JSON صفحه‌ی جزئیات سفارش.
 *
 * از OrderResource ارث می‌برد و اقلام، آدرس و اطلاعات پرداخت را
 * اضافه می‌کند — چیزهایی که فقط در این صفحه لازم‌اند.
 */
class OrderDetailResource extends OrderResource
{
    /**
     * ساخت آرایه خروجی.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $locale = app()->getLocale();

        return array_merge(parent::toArray($request), [

            /* --- اقلام سفارش --- */
            'items' => $this->whenLoaded('items', fn () => $this->items->map(
                fn (OrderItem $item) => [
                    'id' => $item->id,
                    /* نام از عکس لحظه‌ای خرید خوانده می‌شود، نه از محصول فعلی */
                    'name' => $item->translate('product_name', $locale),
                    'sku' => $item->product_sku,
                    'image' => $item->product_image,
                    'unitPrice' => $item->unit_price,
                    'quantity' => $item->quantity,
                    'lineTotal' => $item->line_total,
                    /*
                     * نامک برای ساخت لینک به صفحه محصول.
                     *
                     * ⚠️ اینجا نمی‌توان از whenLoaded() استفاده کرد —
                     *    آن متدِ JsonResource است، نه Model. فراخوانی‌اش
                     *    روی OrderItem خطای «undefined method» می‌دهد.
                     *
                     *    از relationLoaded() استفاده می‌کنیم که متد مدل
                     *    است و مثل whenLoaded از کوئری اضافه (N+1)
                     *    جلوگیری می‌کند.
                     */
                    'productId' => $item->product_id,
                    'slug' => $item->relationLoaded('product')
                        ? $item->product?->slug
                        : null,
                ]
            )->values()),

            /* آدرس تحویل — عکس لحظه‌ای ثبت‌شده در سفارش */
            'shippingAddress' => $this->shipping_address,
            'shippingMethod' => $this->shipping_method,
            'customerNote' => $this->customer_note,

            /* --- وضعیت پرداخت --- */
            'payment' => $this->whenLoaded('payments', function () use ($locale) {
                /*
                 * انتخاب تراکنش مرجع.
                 *
                 * ⚠️ دو باگ که اینجا رفع شد:
                 *
                 *   ۱. مرتب‌سازی با created_at نامعین بود. وقتی کاربر
                 *      بلافاصله پس از پرداخت ناموفق دوباره تلاش می‌کند،
                 *      هر دو تراکنش در همان ثانیه ثبت می‌شوند و
                 *      sortByDesc('created_at') ترتیب تضمین‌شده ندارد.
                 *      نتیجه: سفارشِ پرداخت‌شده «ناموفق» نمایش داده می‌شد.
                 *      حالا با id مرتب می‌شود که همیشه صعودی و یکتاست.
                 *
                 *   ۲. حتی با ترتیب درست، «آخرین تلاش» پاسخ درستی نیست.
                 *      اگر پرداخت موفق شود، همان باید نمایش داده شود —
                 *      حتی اگر بعدش تلاش دیگری ثبت شده باشد.
                 */
                $payment = $this->payments->firstWhere('status', PaymentStatus::Succeeded)
                    ?? $this->payments->sortByDesc('id')->first();

                return $payment ? [
                    'gateway' => $payment->gateway,
                    'status' => $payment->status->value,
                    'statusLabel' => $payment->status->label($locale),
                    'trackingNumber' => $payment->tracking_number,
                    'paidAt' => $payment->paid_at?->toIso8601String(),
                ] : null;
            }),

            'cancelledAt' => $this->cancelled_at?->toIso8601String(),
        ]);
    }
}
