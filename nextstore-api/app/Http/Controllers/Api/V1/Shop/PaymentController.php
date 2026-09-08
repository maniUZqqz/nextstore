<?php

namespace App\Http\Controllers\Api\V1\Shop;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderDetailResource;
use App\Services\Payment\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * کنترلر تأیید پرداخت.
 * ---------------------------------------------------------------------------
 * ⚠️ چرا این مسیر بدون احراز هویت است؟
 *    درگاه پرداخت واقعی کاربر را با یک درخواست ساده برمی‌گرداند و
 *    هدر Authorization ما را حمل نمی‌کند. تأیید باید با شناسه‌ی
 *    تراکنش انجام شود، نه با توکن کاربر.
 *
 *    امنیت از راه دیگری تأمین می‌شود:
 *      - شناسه تراکنش تصادفی و غیرقابل‌حدس است
 *      - تأیید نهایی نزد خود درگاه انجام می‌شود
 *      - تراکنش نهایی‌شده دوباره تأیید نمی‌شود
 */
class PaymentController extends Controller
{
    public function __construct(
        private readonly PaymentService $paymentService,
    ) {}

    /**
     * POST /api/v1/payments/verify
     * تأیید پرداخت پس از بازگشت کاربر از درگاه.
     */
    public function verify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ref' => ['required', 'string'],
            /* در درگاه واقعی این پارامتر از خود بانک می‌آید */
            'success' => ['nullable'],
        ]);

        $result = $this->paymentService->verify(
            referenceId: $validated['ref'],
            payload: $request->all(),
        );

        return response()->json([
            'data' => [
                'success' => $result['success'],
                'order' => new OrderDetailResource(
                    $result['order']->load(['items', 'payments'])
                ),
            ],
            'message' => $result['success']
                ? __('shop.payment_succeeded')
                : __('shop.payment_failed'),
        ]);
    }

    /**
     * GET /api/v1/payments/gateways
     * فهرست درگاه‌های فعال — برای نمایش در صفحه تسویه.
     */
    public function gateways(): JsonResponse
    {
        return response()->json([
            'data' => $this->paymentService->availableGateways(app()->getLocale()),
        ]);
    }
}
