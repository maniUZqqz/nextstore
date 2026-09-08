<?php

namespace App\Services\Payment;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Services\Order\OrderService;
use App\Services\Payment\Gateways\MockGateway;
use App\Services\Payment\Gateways\PaymentGatewayInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * سرویس مدیریت پرداخت.
 * ---------------------------------------------------------------------------
 * وظیفه: انتخاب درگاه مناسب و هماهنگی بین تراکنش پرداخت و وضعیت سفارش.
 *
 * ⚠️ نکته امنیتی محوری:
 *    وضعیت سفارش **فقط** پس از تأیید موفق درگاه به «پرداخت‌شده»
 *    تغییر می‌کند — نه وقتی کاربر به سایت برمی‌گردد.
 *
 *    اگر به بازگشت کاربر اعتماد کنیم، هر کسی می‌تواند آدرس بازگشت
 *    را مستقیم در مرورگر باز کند و سفارش را رایگان «پرداخت‌شده» کند.
 */
class PaymentService
{
    public function __construct(
        private readonly OrderService $orderService,
    ) {}

    /**
     * درگاه‌های در دسترس.
     *
     * افزودن زرین‌پال فقط یک ردیف اینجا و یک کلاس جدید می‌خواهد —
     * هیچ کد دیگری تغییر نمی‌کند.
     *
     * @return array<string, class-string<PaymentGatewayInterface>>
     */
    private const GATEWAYS = [
        'mock' => MockGateway::class,
        // 'zarinpal' => ZarinpalGateway::class,
        // 'stripe'   => StripeGateway::class,
    ];

    /**
     * شروع پرداخت یک سفارش.
     *
     * @param  Order  $order  سفارش
     * @param  string  $gateway  نام درگاه
     * @param  string  $callback  آدرس بازگشت
     * @return array{payment: Payment, redirectUrl: string}
     *
     * @throws ValidationException وقتی سفارش قابل پرداخت نیست
     */
    public function initiate(Order $order, string $gateway, string $callback): array
    {
        /* فقط سفارش در انتظار پرداخت قابل پرداخت است */
        if ($order->status !== OrderStatus::Pending) {
            throw ValidationException::withMessages([
                'order' => [__('shop.order_not_payable')],
            ]);
        }

        $driver = $this->resolveGateway($gateway);

        $payment = Payment::create([
            'order_id' => $order->id,
            'gateway' => $driver->name(),
            'status' => PaymentStatus::Initiated,
            /* مبلغ از سفارش خوانده می‌شود، نه از ورودی کاربر */
            'amount' => $order->total,
        ]);

        $redirectUrl = $driver->initiate($payment, $callback);

        return [
            'payment' => $payment->fresh(),
            'redirectUrl' => $redirectUrl,
        ];
    }

    /**
     * تأیید پرداخت پس از بازگشت کاربر از درگاه.
     *
     * @param  array<string, mixed>  $payload  داده‌های بازگشتی
     * @return array{success: bool, order: Order, payment: Payment}
     */
    public function verify(string $referenceId, array $payload): array
    {
        $payment = Payment::where('reference_id', $referenceId)
            ->with('order')
            ->firstOrFail();

        /*
         * جلوگیری از تأیید دوباره.
         *
         * ⚠️ بدون این، رفرش کردن صفحه‌ی بازگشت باعث می‌شد تأیید
         *    دوباره اجرا شود. در درگاه واقعی این می‌تواند به
         *    دو بار ثبت پرداخت یا خطای «تراکنش تکراری» منجر شود.
         */
        if ($payment->status->isFinal()) {
            return [
                'success' => $payment->isSuccessful(),
                'order' => $payment->order,
                'payment' => $payment,
            ];
        }

        $driver = $this->resolveGateway($payment->gateway);

        return DB::transaction(function () use ($driver, $payment, $payload) {
            $succeeded = $driver->verify($payment, $payload);

            $order = $payment->order;

            /*
             * وضعیت سفارش فقط پس از تأیید موفق درگاه تغییر می‌کند.
             * این تنها نقطه‌ای است که سفارش «پرداخت‌شده» می‌شود.
             */
            if ($succeeded && $order->status === OrderStatus::Pending) {
                $order = $this->orderService->changeStatus($order, OrderStatus::Paid);
            }

            return [
                'success' => $succeeded,
                'order' => $order->fresh('items'),
                'payment' => $payment->fresh(),
            ];
        });
    }

    /**
     * ساخت نمونه‌ی درگاه از روی نام.
     *
     * @throws ValidationException وقتی درگاه پشتیبانی نمی‌شود
     */
    private function resolveGateway(string $name): PaymentGatewayInterface
    {
        $class = self::GATEWAYS[$name] ?? null;

        if (! $class) {
            throw ValidationException::withMessages([
                'gateway' => [__('shop.gateway_not_supported')],
            ]);
        }

        return app($class);
    }

    /**
     * فهرست درگاه‌های فعال — برای نمایش در صفحه تسویه.
     *
     * @return array<int, array{id: string, name: string}>
     */
    public function availableGateways(string $locale = 'fa'): array
    {
        return [
            [
                'id' => 'mock',
                'name' => $locale === 'fa'
                    ? 'درگاه پرداخت آزمایشی'
                    : 'Sandbox payment gateway',
            ],
        ];
    }
}
