<?php

namespace App\Services\Report;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * سرویس آمار داشبورد پنل مدیریت.
 * ---------------------------------------------------------------------------
 * تمام کوئری‌های تجمیعی اینجا جمع شده‌اند تا:
 *   - کنترلر نازک بماند
 *   - بهینه‌سازی کوئری در یک نقطه انجام شود
 *   - همین آمار از Command یا گزارش زمان‌بندی‌شده هم قابل استفاده باشد
 *
 * ⚠️ نکته‌ی مهم درباره‌ی «فروش»:
 *    فقط سفارش‌های پرداخت‌شده در محاسبه‌ی درآمد می‌آیند. سفارش
 *    «در انتظار پرداخت» هنوز پولی نیاورده و شمردنش گزارش را
 *    غیرواقعی می‌کند.
 */
class DashboardService
{
    /**
     * آمار خلاصه — کارت‌های بالای داشبورد.
     *
     * @return array<string, mixed>
     */
    public function summary(): array
    {
        $today = now()->startOfDay();
        $monthStart = now()->startOfMonth();

        /* سفارش‌های پرداخت‌شده — مبنای همه‌ی محاسبات مالی */
        $paidOrders = Order::query()->whereNotNull('paid_at');

        return [
            /* --- درآمد --- */
            'revenueTotal' => (int) (clone $paidOrders)->sum('total'),
            'revenueToday' => (int) (clone $paidOrders)->where('paid_at', '>=', $today)->sum('total'),
            'revenueMonth' => (int) (clone $paidOrders)->where('paid_at', '>=', $monthStart)->sum('total'),

            /* --- سفارش --- */
            'ordersTotal' => Order::count(),
            'ordersToday' => Order::where('created_at', '>=', $today)->count(),
            /* سفارش‌هایی که منتظر اقدام ادمین‌اند */
            'ordersPending' => Order::whereIn('status', [
                OrderStatus::Paid,
                OrderStatus::Processing,
            ])->count(),
            'ordersAwaitingPayment' => Order::where('status', OrderStatus::Pending)->count(),

            /* --- مشتری --- */
            'customersTotal' => User::where('role', 'customer')->count(),
            'customersToday' => User::where('role', 'customer')
                ->where('created_at', '>=', $today)->count(),

            /* --- محصول --- */
            'productsTotal' => Product::count(),
            'productsOutOfStock' => Product::where('stock', 0)->count(),
            /*
             * محصولاتی که موجودی‌شان به آستانه رسیده.
             * whereColumn دو ستون را با هم مقایسه می‌کند — هر محصول
             * آستانه‌ی خودش را دارد.
             */
            'productsLowStock' => Product::where('stock', '>', 0)
                ->whereColumn('stock', '<=', 'low_stock_threshold')
                ->count(),
        ];
    }

    /**
     * نمودار فروش روزانه.
     *
     * @param  int  $days  تعداد روزهای گذشته
     * @return array<int, array{date: string, revenue: int, orders: int}>
     */
    public function salesChart(int $days = 14): array
    {
        $from = now()->subDays($days - 1)->startOfDay();

        /*
         * گروه‌بندی بر اساس تاریخ.
         * DATE() در SQLite و MySQL هر دو کار می‌کند.
         */
        $rows = Order::query()
            ->whereNotNull('paid_at')
            ->where('paid_at', '>=', $from)
            ->selectRaw('DATE(paid_at) as day, SUM(total) as revenue, COUNT(*) as orders')
            ->groupBy('day')
            ->pluck('revenue', 'day')
            ->all();

        $orderCounts = Order::query()
            ->whereNotNull('paid_at')
            ->where('paid_at', '>=', $from)
            ->selectRaw('DATE(paid_at) as day, COUNT(*) as c')
            ->groupBy('day')
            ->pluck('c', 'day')
            ->all();

        /*
         * پر کردن روزهای بدون فروش با صفر.
         *
         * ⚠️ بدون این، نمودار روزهای خالی را حذف می‌کند و شکل
         *    نمودار دروغ می‌گوید — دو نقطه‌ی کنار هم ممکن است
         *    یک هفته فاصله داشته باشند.
         */
        $series = [];
        for ($i = 0; $i < $days; $i++) {
            $date = now()->subDays($days - 1 - $i)->toDateString();

            $series[] = [
                'date' => $date,
                'revenue' => (int) ($rows[$date] ?? 0),
                'orders' => (int) ($orderCounts[$date] ?? 0),
            ];
        }

        return $series;
    }

    /**
     * پرفروش‌ترین محصولات بر اساس تعداد فروش واقعی.
     *
     * ⚠️ از ستون sales_count استفاده نمی‌کنیم چون آن شامل سفارش‌های
     *    لغوشده هم بوده و ممکن است دقیق نباشد. اینجا مستقیم از
     *    اقلام سفارش‌های پرداخت‌شده جمع می‌زنیم.
     *
     * @return array<int, array<string, mixed>>
     */
    public function topProducts(int $limit = 5): array
    {
        $locale = app()->getLocale();

        $rows = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereNotNull('orders.paid_at')
            ->groupBy('order_items.product_id', 'order_items.product_name')
            ->selectRaw('
                order_items.product_id,
                order_items.product_name,
                SUM(order_items.quantity) as sold,
                SUM(order_items.line_total) as revenue
            ')
            ->orderByDesc('sold')
            ->limit($limit)
            ->get();

        return $rows->map(function ($row) use ($locale) {
            /* نام چندزبانه در ستون JSON ذخیره شده و باید رمزگشایی شود */
            $names = json_decode($row->product_name, true) ?: [];

            return [
                'productId' => $row->product_id,
                'name' => $names[$locale] ?? reset($names) ?: '—',
                'sold' => (int) $row->sold,
                'revenue' => (int) $row->revenue,
            ];
        })->all();
    }

    /**
     * توزیع سفارش‌ها بر اساس وضعیت — برای نمودار دایره‌ای.
     *
     * @return array<int, array{status: string, label: string, count: int}>
     */
    public function ordersByStatus(): array
    {
        $locale = app()->getLocale();

        $counts = Order::query()
            ->selectRaw('status, COUNT(*) as c')
            ->groupBy('status')
            ->pluck('c', 'status')
            ->all();

        return collect(OrderStatus::cases())
            ->map(fn (OrderStatus $status) => [
                'status' => $status->value,
                'label' => $status->label($locale),
                'color' => $status->color(),
                'count' => (int) ($counts[$status->value] ?? 0),
            ])
            /* وضعیت‌های بدون سفارش در نمودار جایی ندارند */
            ->filter(fn (array $row) => $row['count'] > 0)
            ->values()
            ->all();
    }
}
