<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\Report\DashboardService;
use Illuminate\Http\JsonResponse;

/**
 * کنترلر داشبورد پنل مدیریت.
 *
 * تمام آمار در یک درخواست برگردانده می‌شود تا داشبورد با یک
 * رفت‌وبرگشت شبکه کامل شود، نه پنج تا.
 */
class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardService $dashboard,
    ) {}

    /**
     * GET /api/v1/admin/dashboard
     * آمار خلاصه، نمودار فروش، پرفروش‌ترین‌ها و آخرین سفارش‌ها.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => [
                'summary' => $this->dashboard->summary(),
                'salesChart' => $this->dashboard->salesChart(14),
                'topProducts' => $this->dashboard->topProducts(5),
                'ordersByStatus' => $this->dashboard->ordersByStatus(),

                /* آخرین سفارش‌ها — برای اقدام سریع ادمین */
                'recentOrders' => OrderResource::collection(
                    Order::query()->with('items')->latest()->limit(8)->get()
                ),
            ],
        ]);
    }
}
