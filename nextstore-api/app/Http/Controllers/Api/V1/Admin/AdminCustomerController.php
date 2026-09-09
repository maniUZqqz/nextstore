<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\AdminCustomerDetailResource;
use App\Http\Resources\AdminCustomerResource;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * کنترلر مدیریت مشتریان — پنل مدیریت.
 * ---------------------------------------------------------------------------
 * ⚠️ بررسی نقش مدیر با میدل‌ور `admin` روی گروه مسیرها انجام می‌شود،
 *    نه اینجا — تا اکشن جدیدی که فردا اضافه شود خودکار محافظت‌شده باشد.
 *
 * ⚠️ این کنترلر عمداً امکان **ویرایش پروفایل** مشتری را نمی‌دهد.
 *    نام، ایمیل و رمز، داده‌ی شخصی کاربرند و مدیر فقط باید بتواند
 *    حساب را فعال یا غیرفعال کند. هر فیلد قابل ویرایشِ دیگری، یک
 *    مسیر جعل هویت باز می‌کند.
 */
class AdminCustomerController extends Controller
{
    /**
     * مرتب‌سازی‌های مجاز → [ستون، جهت، آیا ستون تجمیعی است].
     *
     * ⚠️ پرچم سوم مهم است: ستون‌های تجمیعی (`withCount` و `withSum`)
     *    برای کاربری که هیچ سفارشی ندارد **NULL** برمی‌گردند، نه صفر.
     *    بدون COALESCE، آن کاربران در مرتب‌سازی صعودی جای نامنتظره‌ای
     *    می‌گیرند. اما همان COALESCE روی `created_at` بی‌معناست و
     *    مقایسه‌ی رشته‌ی تاریخ با عدد را تحمیل می‌کند.
     */
    private const SORTS = [
        'newest' => ['created_at', 'desc', false],
        'oldest' => ['created_at', 'asc', false],
        'orders' => ['orders_count', 'desc', true],
        'spent' => ['paid_orders_sum_total', 'desc', true],
        'name' => ['name', 'asc', false],
    ];

    /**
     * GET /api/v1/admin/customers
     * فهرست مشتریان با جستجو، فیلتر و مرتب‌سازی.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = $this->baseQuery();

        /* --- جستجو روی نام، ایمیل و موبایل --- */
        if ($term = trim((string) $request->query('q'))) {
            $query->where(function (Builder $q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                    ->orWhere('email', 'like', "%{$term}%")
                    ->orWhere('phone', 'like', "%{$term}%");
            });
        }

        /* --- فیلتر وضعیت حساب --- */
        match ($request->query('status')) {
            'active' => $query->where('is_active', true),
            'inactive' => $query->where('is_active', false),
            /*
             * «مشتری واقعی» یعنی حداقل یک سفارش پرداخت‌شده دارد.
             * تفکیک از ثبت‌نام‌کننده‌ی بی‌خرید، پرتکرارترین سؤال
             * مدیر است و بدون آن باید کل فهرست را چشمی مرور کند.
             */
            'buyers' => $query->whereHas('orders', fn (Builder $q) => $q->whereNotNull('paid_at')),
            default => null,
        };

        /* --- مرتب‌سازی --- */
        [$column, $direction, $isAggregate] = self::SORTS[$request->query('sort', 'newest')]
            ?? self::SORTS['newest'];

        if ($isAggregate) {
            $query->orderByRaw("COALESCE({$column}, 0) {$direction}");
        } else {
            $query->orderBy($column, $direction);
        }

        /*
         * ⚠️ مرتب‌سازی دوم روی شناسه، الزامی است.
         *
         *    سیدرها ده‌ها کاربر را در یک تراکنش می‌سازند، پس همه یک
         *    `created_at` دقیقاً یکسان دارند. بدون شکستن این تساوی،
         *    ترتیب ردیف‌ها به SQLite واگذار می‌شود و می‌تواند بین دو
         *    درخواست عوض شود — یعنی کاربری در صفحه‌ی دوم دو بار دیده
         *    شود و کاربر دیگری اصلاً دیده نشود.
         */
        $query->orderBy('users.id', 'desc');

        $customers = $query->paginate(min((int) $request->query('per_page', 20), 100));

        return AdminCustomerResource::collection($customers)
            ->additional(['counts' => $this->counts()]);
    }

    /**
     * GET /api/v1/admin/customers/{customer}
     * پروفایل کامل یک مشتری.
     */
    public function show(User $customer): AdminCustomerDetailResource
    {
        $customer->loadCount(['orders', 'reviews', 'tickets', 'addresses', 'wishlists']);

        $customer->load([
            'addresses',
            /*
             * فقط ده سفارش آخر.
             * مشتری قدیمی می‌تواند صدها سفارش داشته باشد و فرستادن
             * همه‌شان یک پاسخ چند مگابایتی می‌سازد برای بخشی که
             * فقط چند ردیف نشان می‌دهد.
             */
            'orders' => fn ($q) => $q->latest()->limit(10),
        ]);

        /* تجمیع‌ها با یک کوئری جدا — قابل‌استفاده‌ی مجدد با فهرست */
        $aggregates = $this->baseQuery()->whereKey($customer->id)->first();

        $customer->setAttribute('orders_count', $aggregates?->orders_count ?? 0);
        $customer->setAttribute('paid_orders_sum_total', $aggregates?->paid_orders_sum_total ?? 0);
        $customer->setAttribute('last_order_at', $aggregates?->last_order_at);

        return new AdminCustomerDetailResource($customer);
    }

    /**
     * PATCH /api/v1/admin/customers/{customer}/status
     * فعال یا غیرفعال کردن حساب.
     */
    public function updateStatus(Request $request, User $customer): JsonResponse
    {
        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        /*
         * ⚠️ مدیر نمی‌تواند حساب مدیر دیگری (یا خودش) را از اینجا
         *    ببندد. بدون این شرط، یک مدیر می‌توانست کل دسترسی
         *    پنل را قفل کند — از جمله دسترسی خودش، بدون راه بازگشت.
         */
        if ($customer->role->canAccessAdmin()) {
            return response()->json([
                'message' => __('shop.customer_is_staff'),
                'error' => ['code' => 'CUSTOMER_IS_STAFF'],
            ], 422);
        }

        $customer->update(['is_active' => $validated['is_active']]);

        return response()->json([
            'message' => __($validated['is_active'] ? 'shop.customer_enabled' : 'shop.customer_disabled'),
            'data' => ['id' => $customer->id, 'isActive' => $customer->is_active],
        ]);
    }

    /**
     * کوئری پایه‌ی مشتریان به‌همراه تجمیع‌های خرید.
     *
     * ⚠️ فقط نقش مشتری. مدیران در فهرست مشتریان جایی ندارند: آمار
     *    خریدشان بی‌معناست و قاطی‌شدنشان با مشتریان، شمارش‌ها را
     *    غلط می‌کند.
     *
     * @return Builder<User>
     */
    private function baseQuery(): Builder
    {
        return User::query()
            ->where('role', UserRole::Customer)
            ->withCount('orders')
            /*
             * مجموع خرید فقط از سفارش‌های *پرداخت‌شده*.
             *
             * ⚠️ شمردن سفارش‌های در انتظار پرداخت، «مشتری برتر»ی
             *    می‌ساخت که هیچ‌وقت پولی نداده — سبد رها شده هم
             *    یک سفارش pending است.
             */
            ->withSum(
                ['orders as paid_orders_sum_total' => fn (Builder $q) => $q
                    ->whereNotNull('paid_at')
                    ->whereNotIn('status', [OrderStatus::Cancelled, OrderStatus::Refunded])],
                'total',
            )
            /* تاریخ آخرین سفارش — برای ستون «آخرین خرید» */
            ->addSelect([
                'last_order_at' => Order::query()
                    ->selectRaw('MAX(created_at)')
                    ->whereColumn('user_id', 'users.id'),
            ]);
    }

    /**
     * شمارش مشتریان در هر وضعیت — برای نشان‌های عددی روی تب‌ها.
     *
     * @return array<string,int>
     */
    private function counts(): array
    {
        $base = fn () => User::query()->where('role', UserRole::Customer);

        return [
            'all' => $base()->count(),
            'active' => $base()->where('is_active', true)->count(),
            'inactive' => $base()->where('is_active', false)->count(),
            'buyers' => $base()
                ->whereHas('orders', fn (Builder $q) => $q->whereNotNull('paid_at'))
                ->count(),
        ];
    }
}
