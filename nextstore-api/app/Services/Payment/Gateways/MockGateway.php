<?php

namespace App\Services\Payment\Gateways;

use App\Enums\PaymentStatus;
use App\Models\Payment;

/**
 * درگاه پرداخت شبیه‌سازی‌شده — برای دمو و تست.
 * ---------------------------------------------------------------------------
 * ⚠️ چرا این کلاس در یک نمونه‌کار ارزشمند است؟
 *    درگاه واقعی نیاز به قرارداد با بانک، دامنه‌ی تأییدشده و نماد
 *    اعتماد دارد — هیچ‌کدام برای یک پروژه‌ی نمونه ممکن نیست.
 *
 *    این کلاس همان *قرارداد* درگاه واقعی را پیاده می‌کند، پس:
 *      - جریان کامل پرداخت قابل دمو است
 *      - جایگزینی با زرین‌پال فقط یک کلاس جدید می‌خواهد
 *      - تست‌های خودکار بدون وابستگی به شبکه اجرا می‌شوند
 *
 * رفتار: کاربر به صفحه‌ی شبیه‌سازی درگاه در فرانت‌اند هدایت می‌شود
 * و آنجا می‌تواند «پرداخت موفق» یا «پرداخت ناموفق» را انتخاب کند —
 * پس هر دو مسیر قابل نمایش است.
 */
class MockGateway implements PaymentGatewayInterface
{
    /** نام یکتای درگاه. */
    public function name(): string
    {
        return 'mock';
    }

    /**
     * ساخت شناسه تراکنش و آدرس صفحه‌ی شبیه‌سازی درگاه.
     */
    public function initiate(Payment $payment, string $callback): string
    {
        /* شناسه‌ای شبیه آنچه درگاه واقعی برمی‌گرداند */
        $referenceId = 'MOCK-'.strtoupper(bin2hex(random_bytes(8)));

        $payment->update([
            'reference_id' => $referenceId,
            'status' => PaymentStatus::Pending,
        ]);

        /* کاربر به صفحه‌ی شبیه‌سازی درگاه در فرانت‌اند می‌رود */
        return $callback.'?'.http_build_query([
            'ref' => $referenceId,
            'amount' => $payment->amount,
            'order' => $payment->order->order_number,
        ]);
    }

    /**
     * تأیید پرداخت.
     *
     * در درگاه واقعی اینجا یک درخواست HTTP به بانک زده می‌شود.
     * در نسخه‌ی شبیه‌سازی، نتیجه از پارامتر ورودی خوانده می‌شود —
     * تا بتوان هر دو مسیر موفق و ناموفق را دمو کرد.
     *
     * @param  array<string, mixed>  $payload
     */
    public function verify(Payment $payment, array $payload): bool
    {
        /* شناسه تراکنش باید با آنچه صادر کرده‌ایم بخواند */
        if (($payload['ref'] ?? null) !== $payment->reference_id) {
            $payment->update([
                'status' => PaymentStatus::Failed,
                'failure_reason' => 'reference mismatch',
            ]);

            return false;
        }

        $succeeded = filter_var($payload['success'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if (! $succeeded) {
            $payment->update([
                'status' => PaymentStatus::Failed,
                'failure_reason' => 'cancelled by user',
                'gateway_response' => $payload,
            ]);

            return false;
        }

        $payment->update([
            'status' => PaymentStatus::Succeeded,
            /* شماره پیگیری بانکی که به مشتری نمایش داده می‌شود */
            'tracking_number' => (string) random_int(100_000_000, 999_999_999),
            'gateway_response' => $payload,
            'paid_at' => now(),
        ]);

        return true;
    }
}
