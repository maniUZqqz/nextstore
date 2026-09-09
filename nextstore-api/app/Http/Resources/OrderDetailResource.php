<?php

namespace App\Http\Resources;

use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;

/**
 * خروجی JSON صفحه‌ی جزئیات سفارش.
 *
 * از OrderResource ارث می‌برد و اقلام، آدرس و اطلاعات پرداخت را
 * اضافه می‌کند — چیزهایی که فقط در این صفحه لازم‌اند.
 *
 * @mixin Order
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
            /*
             * ⚠️ نگاشت اقلام در متد جداگانه است، نه بسته‌ی درون‌خطی.
             *
             *    نسخه‌ی اول یک closure تودرتو بود و تحلیل ایستا نمی‌توانست
             *    نوع بازگشتی‌اش را با خودش تطبیق دهد؛ پیام خطا دو نوعِ
             *    ظاهراً یکسان را مقابل هم می‌گذاشت چون بخش متفاوتشان در
             *    خلاصه‌سازی حذف می‌شد — خطایی که نه خوانا بود و نه
             *    قابل پیگیری.
             *
             *    متد نام‌دار یک قرارداد صریح دارد و هم برای ابزار و هم
             *    برای خواننده روشن‌تر است.
             */
            'items' => $this->whenLoaded('items', fn () => $this->mapItems($locale)),

            /* آدرس تحویل — عکس لحظه‌ای ثبت‌شده در سفارش */
            'shippingAddress' => $this->shipping_address,
            /*
             * ⚠️ کلید و برچسب هر دو می‌روند.
             *
             *    پیش‌تر فقط رشته‌ی خام («standard») فرستاده می‌شد و
             *    صفحه‌ی سفارش و فاکتور همان را به مشتری فارسی‌زبان نشان
             *    می‌دادند. برچسب از اینجا می‌آید تا فرانت نگاشت دومی
             *    نسازد — همان قاعده‌ی وضعیت سفارش و تیکت.
             */
            'shippingMethod' => $this->shipping_method->value,
            'shippingMethodLabel' => $this->shipping_method->label($locale),
            'shippingMethodDescription' => $this->shipping_method->description($locale),
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

    /**
     * اقلام سفارش به شکل خروجی API.
     *
     * ⚠️ نام و نامک محصول از **عکس لحظه‌ای خرید** خوانده می‌شوند نه از
     *    محصول فعلی: اگر فروشنده بعداً نام یا قیمت را عوض کند، فاکتور
     *    قدیمی نباید تغییر کند.
     *
     * @return list<array<string, mixed>>
     */
    private function mapItems(string $locale): array
    {
        return $this->items->map(fn (OrderItem $item) => [
            'id' => $item->id,
            'name' => $item->translate('product_name', $locale),
            'sku' => $item->product_sku,
            'image' => $item->product_image,
            'unitPrice' => $item->unit_price,
            'quantity' => $item->quantity,
            'lineTotal' => $item->line_total,
            'productId' => $item->product_id,

            /*
             * نامک برای ساخت لینک به صفحه محصول.
             *
             * ⚠️ اینجا نمی‌توان از whenLoaded() استفاده کرد — آن متدِ
             *    JsonResource است، نه Model. فراخوانی‌اش روی OrderItem
             *    خطای «undefined method» می‌دهد.
             *
             *    از relationLoaded() استفاده می‌کنیم که متد مدل است و
             *    مثل whenLoaded از کوئری اضافه (N+1) جلوگیری می‌کند.
             */
            'slug' => $item->relationLoaded('product')
                ? $item->product?->slug
                : null,
        ])->values()->all();
    }
}
