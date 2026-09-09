<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\CouponType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCouponRequest;
use App\Http\Resources\AdminCouponResource;
use App\Models\Coupon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * کنترلر مدیریت کدهای تخفیف — پنل مدیریت.
 * ---------------------------------------------------------------------------
 * ⚠️ بررسی نقش مدیر با میدل‌ور `admin` روی گروه مسیرها انجام می‌شود،
 *    نه اینجا.
 */
class AdminCouponController extends Controller
{
    /**
     * GET /api/v1/admin/coupons?state=active&q=…
     * فهرست کوپن‌ها با فیلتر وضعیت و جستجو.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Coupon::query();

        match ($request->query('state')) {
            /*
             * ⚠️ «فعال» یعنی هم پرچمش روشن باشد و هم در بازه‌ی اعتبار —
             *    همان قاعده‌ی scopeUsable که CouponService هم استفاده
             *    می‌کند. اگر اینجا فقط `is_active` بررسی می‌شد، مدیر
             *    کوپن منقضی را در تب «فعال» می‌دید و فکر می‌کرد کار
             *    می‌کند.
             */
            'active' => $this->scopeActive($query),
            'scheduled' => $query->where('is_active', true)
                ->whereNotNull('starts_at')->where('starts_at', '>', now()),
            'expired' => $query->whereNotNull('expires_at')->where('expires_at', '<', now()),
            'exhausted' => $query->whereNotNull('usage_limit')
                ->whereColumn('used_count', '>=', 'usage_limit'),
            'disabled' => $query->where('is_active', false),
            default => null,
        };

        if ($term = trim((string) $request->query('q'))) {
            $query->where(function (Builder $q) use ($term) {
                $q->where('code', 'like', '%'.mb_strtoupper($term).'%')
                    ->orWhere('description', 'like', "%{$term}%");
            });
        }

        /*
         * تازه‌ترین اول.
         *
         * ⚠️ مرتب‌سازی دوم روی شناسه الزامی است: سیدر همه‌ی کوپن‌ها را
         *    در یک تراکنش می‌سازد و `created_at` یکسانی می‌گیرند. بدون
         *    شکستن تساوی، ترتیب بین دو درخواست عوض می‌شود و صفحه‌بندی
         *    ردیف‌ها را تکرار یا گم می‌کند.
         */
        $coupons = $query->latest()->orderByDesc('id')
            ->paginate(min((int) $request->query('per_page', 20), 100));

        return AdminCouponResource::collection($coupons)
            ->additional([
                'counts' => $this->counts(),
                /* گزینه‌های فرم از همان enum — تا فرانت فهرست موازی نسازد */
                'types' => collect(CouponType::cases())->map(fn (CouponType $t) => [
                    'value' => $t->value,
                    'label' => $t->label(app()->getLocale()),
                ])->all(),
            ]);
    }

    /**
     * POST /api/v1/admin/coupons
     * ساخت کد تخفیف تازه.
     */
    public function store(StoreCouponRequest $request): JsonResponse
    {
        $coupon = Coupon::query()->create($request->validated());

        return (new AdminCouponResource($coupon))
            ->additional(['message' => __('shop.coupon_created', ['code' => $coupon->code])])
            ->response()
            ->setStatusCode(201);
    }

    /**
     * GET /api/v1/admin/coupons/{coupon}
     * جزئیات یک کوپن — برای پرکردن فرم ویرایش.
     */
    public function show(Coupon $coupon): AdminCouponResource
    {
        return new AdminCouponResource($coupon);
    }

    /**
     * PUT /api/v1/admin/coupons/{coupon}
     * ویرایش کد تخفیف.
     */
    public function update(StoreCouponRequest $request, Coupon $coupon): JsonResponse
    {
        $coupon->update($request->validated());

        return (new AdminCouponResource($coupon->fresh()))
            ->additional(['message' => __('shop.coupon_updated')])
            ->response();
    }

    /**
     * DELETE /api/v1/admin/coupons/{coupon}
     * حذف کد تخفیف.
     */
    public function destroy(Coupon $coupon): JsonResponse
    {
        /*
         * ⚠️ کوپنی که مصرف شده حذف نمی‌شود.
         *
         *    رکوردهای مصرف با cascade پاک می‌شدند و سفارش‌های قدیمی
         *    ارجاعشان را از دست می‌دادند — یعنی گزارش «چقدر تخفیف
         *    دادیم» بی‌صدا کم‌گزارش می‌شد. کد کوپن در خود سفارش کپی
         *    شده و آن سند سالم می‌ماند، ولی آمار کمپین از بین می‌رفت.
         *
         *    راه درست برای بستن یک کمپین، غیرفعال کردن است نه حذف.
         */
        if ($coupon->used_count > 0) {
            return response()->json([
                'message' => __('shop.coupon_has_usage'),
                'error' => ['code' => 'COUPON_HAS_USAGE'],
            ], 422);
        }

        $coupon->delete();

        return response()->json(['message' => __('shop.coupon_deleted')]);
    }

    /**
     * PATCH /api/v1/admin/coupons/{coupon}/toggle
     * فعال یا غیرفعال کردن سریع از روی جدول.
     *
     * اندپوینت جداست تا تغییر وضعیت، کل فرم را به سرور نفرستد —
     * همان الگوی publish در مقالات.
     */
    public function toggle(Request $request, Coupon $coupon): JsonResponse
    {
        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $coupon->update(['is_active' => $validated['is_active']]);

        return (new AdminCouponResource($coupon->fresh()))
            ->additional([
                'message' => __($validated['is_active'] ? 'shop.coupon_enabled' : 'shop.coupon_disabled'),
            ])
            ->response();
    }

    /**
     * شمارش کوپن‌ها در هر وضعیت — برای نشان‌های عددی روی تب‌ها.
     *
     * @return array<string,int>
     */
    private function counts(): array
    {
        $base = fn () => Coupon::query();

        return [
            'all' => $base()->count(),
            'active' => $this->scopeActive($base())->count(),
            'scheduled' => $base()->where('is_active', true)
                ->whereNotNull('starts_at')->where('starts_at', '>', now())->count(),
            'expired' => $base()->whereNotNull('expires_at')->where('expires_at', '<', now())->count(),
            'exhausted' => $base()->whereNotNull('usage_limit')
                ->whereColumn('used_count', '>=', 'usage_limit')->count(),
            'disabled' => $base()->where('is_active', false)->count(),
        ];
    }

    /**
     * کوپن‌هایی که واقعاً همین حالا قابل استفاده‌اند.
     *
     * ⚠️ `scopeUsable` مدل عمداً ظرفیت را بررسی نمی‌کند (توضیحش آنجاست).
     *    اگر تب «فعال» فقط از آن استفاده می‌کرد، کوپنی که ظرفیتش پر
     *    شده در فهرست فعال‌ها دیده می‌شد در حالی که نشان کنارش
     *    «ظرفیت تکمیل» می‌گفت — و مدیر نمی‌فهمید کدام درست است.
     *
     *    اینجا هر دو شرط با هم اعمال می‌شوند تا تب و نشان یک چیز
     *    بگویند.
     */
    /**
     * @param  Builder<Coupon>  $query
     * @return Builder<Coupon>
     */
    private function scopeActive(Builder $query): Builder
    {
        return $query->usable()
            ->where(fn (Builder $q) => $q
                ->whereNull('usage_limit')
                ->orWhereColumn('used_count', '<', 'usage_limit'));
    }
}
