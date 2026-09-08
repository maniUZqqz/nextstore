<?php

namespace App\Services\Payment\Gateways;

use App\Models\Payment;

/**
 * قرارداد درگاه پرداخت.
 * ---------------------------------------------------------------------------
 * چرا اینترفیس و نه یک کلاس مستقیم؟
 *   افزودن درگاه جدید (زرین‌پال، آیدی‌پی، Stripe) نباید هیچ کد
 *   موجودی را تغییر دهد — فقط یک کلاس جدید که این قرارداد را
 *   پیاده می‌کند. این همان اصل Open/Closed است.
 *
 * جریان استاندارد پرداخت:
 *   ۱. initiate()  → ساخت تراکنش و گرفتن آدرس درگاه
 *   ۲. کاربر به درگاه می‌رود و پرداخت می‌کند
 *   ۳. درگاه کاربر را به سایت برمی‌گرداند
 *   ۴. verify()    → تأیید نهایی نزد درگاه
 *
 * ⚠️ گام ۴ حیاتی است: هرگز نباید فقط به بازگشت کاربر اعتماد کرد.
 *    مهاجم می‌تواند مستقیم آدرس بازگشت را باز کند بدون اینکه
 *    پولی پرداخت کرده باشد.
 */
interface PaymentGatewayInterface
{
    /**
     * شروع فرآیند پرداخت.
     *
     * @param  Payment  $payment  تراکنش ساخته‌شده
     * @param  string  $callback  آدرس بازگشت پس از پرداخت
     * @return string آدرسی که کاربر باید به آن هدایت شود
     */
    public function initiate(Payment $payment, string $callback): string;

    /**
     * تأیید پرداخت نزد درگاه.
     *
     * @param  Payment  $payment  تراکنش
     * @param  array<string, mixed>  $payload  داده‌های بازگشتی از درگاه
     * @return bool آیا پرداخت واقعاً موفق بوده؟
     */
    public function verify(Payment $payment, array $payload): bool;

    /** نام یکتای درگاه — همان مقداری که در ستون gateway ذخیره می‌شود. */
    public function name(): string;
}
