<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\PlaceOrderRequest;
use App\Http\Resources\OrderDetailResource;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\Cart\CartService;
use App\Services\Order\OrderService;
use App\Services\Payment\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * کنترلر سفارش‌های مشتری.
 * ---------------------------------------------------------------------------
 * تمام مسیرها پشت auth:sanctum هستند و هر کوئری به کاربر جاری
 * محدود می‌شود تا کسی نتواند سفارش دیگران را ببیند.
 */
class OrderController extends Controller
{
    public function __construct(
        private readonly OrderService $orderService,
        private readonly CartService $cartService,
        private readonly PaymentService $paymentService,
    ) {}

    /**
     * GET /api/v1/orders
     * فهرست سفارش‌های کاربر.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $orders = $request->user()->orders()
            ->with('items')
            ->latest()
            ->paginate(10);

        return OrderResource::collection($orders);
    }

    /**
     * GET /api/v1/orders/{orderNumber}
     * جزئیات یک سفارش.
     */
    public function show(Request $request, string $orderNumber): OrderDetailResource
    {
        $order = $this->findOwned($request, $orderNumber);

        return new OrderDetailResource(
            $order->load(['items.product', 'payments'])
        );
    }

    /**
     * POST /api/v1/orders
     * ثبت سفارش از روی سبد خرید.
     *
     * ⚠️ مبلغ و قیمت‌ها از ورودی گرفته نمی‌شوند — OrderService
     *    آن‌ها را از دیتابیس می‌خواند تا دستکاری ممکن نباشد.
     */
    public function store(PlaceOrderRequest $request): JsonResponse
    {
        $user = $request->user();

        $cart = $this->cartService->getOrCreate($user->id, null);

        $order = $this->orderService->placeOrder(
            user: $user,
            cart: $cart,
            addressId: $request->integer('address_id'),
            shippingMethod: $request->string('shipping_method')->toString(),
            note: $request->input('note'),
        );

        return (new OrderDetailResource($order->load('items')))
            ->additional(['message' => __('shop.order_placed')])
            ->response()
            ->setStatusCode(201);
    }

    /**
     * POST /api/v1/orders/{orderNumber}/pay
     * شروع فرآیند پرداخت و گرفتن آدرس درگاه.
     */
    public function pay(Request $request, string $orderNumber): JsonResponse
    {
        $order = $this->findOwned($request, $orderNumber);

        $validated = $request->validate([
            'gateway' => ['required', 'string'],
            /* آدرس بازگشت باید داخلی باشد — جلوگیری از Open Redirect */
            'callback' => ['required', 'url'],
        ]);

        $result = $this->paymentService->initiate(
            order: $order,
            gateway: $validated['gateway'],
            callback: $validated['callback'],
        );

        return response()->json([
            'data' => [
                'redirectUrl' => $result['redirectUrl'],
                'referenceId' => $result['payment']->reference_id,
            ],
        ]);
    }

    /**
     * POST /api/v1/orders/{orderNumber}/cancel
     * لغو سفارش توسط مشتری.
     */
    public function cancel(Request $request, string $orderNumber): JsonResponse
    {
        $order = $this->findOwned($request, $orderNumber);

        /*
         * پس از ارسال، لغو ممکن نیست.
         * قاعده در Enum تعریف شده تا در پنل ادمین هم همان باشد.
         */
        abort_unless($order->isCancellableByCustomer(), 422, __('shop.order_not_cancellable'));

        $order = $this->orderService->changeStatus($order, OrderStatus::Cancelled);

        return (new OrderDetailResource($order->load('items')))
            ->additional(['message' => __('shop.order_cancelled')])
            ->response();
    }

    /**
     * یافتن سفارشی که *متعلق به کاربر جاری* باشد.
     * برای سفارش دیگران ۴۰۴ برمی‌گردد، نه ۴۰۳ — تا وجود سفارش لو نرود.
     */
    private function findOwned(Request $request, string $orderNumber): Order
    {
        return $request->user()->orders()
            ->where('order_number', $orderNumber)
            ->firstOrFail();
    }
}
