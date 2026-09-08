<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\AdminOrderDetailResource;
use App\Http\Resources\AdminOrderResource;
use App\Models\Order;
use App\Services\Order\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * کنترلر مدیریت سفارش‌ها در پنل ادمین.
 * ---------------------------------------------------------------------------
 * تفاوت با OrderController مشتری:
 *   - همه‌ی سفارش‌ها را می‌بیند، نه فقط سفارش‌های خودش
 *   - می‌تواند وضعیت را تغییر دهد (با رعایت قواعد انتقال)
 *   - می‌تواند کد رهگیری و یادداشت داخلی ثبت کند
 */
class AdminOrderController extends Controller
{
    public function __construct(
        private readonly OrderService $orderService,
    ) {}

    /**
     * GET /api/v1/admin/orders
     * فهرست همه سفارش‌ها با فیلتر و جستجو.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Order::query()->with(['items', 'user']);

        /* فیلتر وضعیت */
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        /* جستجو بر اساس شماره سفارش یا نام گیرنده */
        if ($term = trim((string) $request->query('q', ''))) {
            $query->where(function ($q) use ($term) {
                $q->where('order_number', 'like', "%{$term}%")
                    ->orWhereRaw("json_extract(shipping_address, '$.recipientName') LIKE ?", ["%{$term}%"]);
            });
        }

        $perPage = min(max((int) $request->query('per_page', 15), 1), 50);

        return AdminOrderResource::collection(
            $query->latest()->paginate($perPage)->withQueryString()
        );
    }

    /**
     * GET /api/v1/admin/orders/{order}
     * جزئیات یک سفارش.
     */
    public function show(string $orderNumber): AdminOrderDetailResource
    {
        $order = Order::where('order_number', $orderNumber)
            ->with(['items.product', 'payments', 'user'])
            ->firstOrFail();

        return new AdminOrderDetailResource($order);
    }

    /**
     * PATCH /api/v1/admin/orders/{order}/status
     * تغییر وضعیت سفارش.
     *
     * ⚠️ قواعد انتقال در OrderStatus تعریف شده‌اند، پس ادمین
     *    نمی‌تواند سفارش «تحویل‌شده» را به «در انتظار پرداخت»
     *    برگرداند یا سفارش لغوشده را «ارسال‌شده» کند.
     */
    public function updateStatus(Request $request, string $orderNumber): JsonResponse
    {
        $order = Order::where('order_number', $orderNumber)->firstOrFail();

        $validated = $request->validate([
            'status' => ['required', 'string'],
            'tracking_code' => ['nullable', 'string', 'max:50'],
            'admin_note' => ['nullable', 'string', 'max:1000'],
        ]);

        $target = OrderStatus::tryFrom($validated['status']);
        abort_unless($target, 422, __('shop.invalid_status'));

        /* کد رهگیری و یادداشت پیش از تغییر وضعیت ثبت می‌شوند */
        $extra = array_filter([
            'tracking_code' => $validated['tracking_code'] ?? null,
            'admin_note' => $validated['admin_note'] ?? null,
        ], fn ($v) => $v !== null);

        if ($extra) {
            $order->update($extra);
        }

        $order = $this->orderService->changeStatus($order, $target);

        return (new AdminOrderDetailResource($order->load(['items', 'payments', 'user'])))
            ->additional(['message' => __('shop.order_status_updated')])
            ->response();
    }

    /**
     * GET /api/v1/admin/orders/statuses
     * فهرست وضعیت‌های ممکن — برای پر کردن دراپ‌داون فیلتر.
     */
    public function statuses(): JsonResponse
    {
        $locale = app()->getLocale();

        return response()->json([
            'data' => collect(OrderStatus::cases())->map(fn (OrderStatus $s) => [
                'value' => $s->value,
                'label' => $s->label($locale),
                'color' => $s->color(),
                /* انتقال‌های مجاز — فرانت فقط همین‌ها را نشان می‌دهد */
                'allowedTransitions' => collect($s->allowedTransitions())
                    ->map(fn (OrderStatus $t) => $t->value)->all(),
            ])->all(),
        ]);
    }
}
