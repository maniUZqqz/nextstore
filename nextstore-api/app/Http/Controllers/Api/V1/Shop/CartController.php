<?php

namespace App\Http\Controllers\Api\V1\Shop;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shop\AddToCartRequest;
use App\Http\Requests\Shop\UpdateCartItemRequest;
use App\Http\Resources\CartResource;
use App\Services\Cart\CartService;
use App\Services\Cart\CouponService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * کنترلر سبد خرید.
 * ---------------------------------------------------------------------------
 * برای هم مهمان و هم کاربر واردشده کار می‌کند:
 *   کاربر واردشده → سبد با user_id
 *   مهمان         → سبد با هدر X-Session-Id
 *
 * کنترلر نازک: فقط شناسه‌ها را استخراج و سرویس را صدا می‌زند.
 */
class CartController extends Controller
{
    public function __construct(
        private readonly CartService $cartService,
        private readonly CouponService $coupons,
    ) {}

    /**
     * GET /api/v1/cart
     * نمایش سبد فعلی.
     *
     * ⚠️ چرا کد وضعیت صریحاً ۲۰۰ تنظیم شده؟
     *    لاراول وقتی مدلِ داخل Resource تازه ساخته شده باشد
     *    (wasRecentlyCreated) خودکار کد ۲۰۱ Created برمی‌گرداند.
     *
     *    چون این متد برای کاربر بدون سبد، سبد جدید می‌سازد، اولین
     *    GET پاسخ ۲۰۱ می‌گرفت — که از نظر معنایی غلط است و کلاینت‌هایی
     *    که وضعیت را بررسی می‌کنند (یا کش HTTP) را گمراه می‌کند.
     */
    public function show(Request $request): JsonResponse
    {
        return (new CartResource($this->resolveCart($request)))
            ->response()
            ->setStatusCode(200);
    }

    /**
     * POST /api/v1/cart/items
     * افزودن محصول به سبد.
     */
    public function store(AddToCartRequest $request): JsonResponse
    {
        $cart = $this->cartService->add(
            cart: $this->resolveCart($request),
            productId: $request->integer('product_id'),
            quantity: $request->integer('quantity'),
        );

        return (new CartResource($cart))
            ->additional(['message' => __('shop.cart_added')])
            ->response()
            ->setStatusCode(201);
    }

    /**
     * PATCH /api/v1/cart/items/{item}
     * تغییر تعداد یک قلم. تعداد صفر یعنی حذف.
     */
    public function update(UpdateCartItemRequest $request, int $item): JsonResponse
    {
        $cart = $this->cartService->updateQuantity(
            cart: $this->resolveCart($request),
            itemId: $item,
            quantity: $request->integer('quantity'),
        );

        return (new CartResource($cart))
            ->additional(['message' => __('shop.cart_updated')])
            ->response();
    }

    /**
     * DELETE /api/v1/cart/items/{item}
     * حذف یک قلم از سبد.
     */
    public function destroy(Request $request, int $item): JsonResponse
    {
        $cart = $this->cartService->removeItem($this->resolveCart($request), $item);

        return (new CartResource($cart))
            ->additional(['message' => __('shop.cart_removed')])
            ->response();
    }

    /**
     * DELETE /api/v1/cart
     * خالی کردن کامل سبد.
     */
    public function clear(Request $request): JsonResponse
    {
        $cart = $this->cartService->clear($this->resolveCart($request));

        return (new CartResource($cart))
            ->additional(['message' => __('shop.cart_cleared')])
            ->response();
    }

    /**
     * POST /api/v1/cart/coupon
     * اعمال کد تخفیف روی سبد.
     *
     * ⚠️ کد وضعیت خطا **۴۲۲** است نه ۴۰۴.
     *
     *    کد نامعتبر یک «منبع یافت نشد» نیست؛ ورودی فرمی است که از
     *    اعتبارسنجی رد نشده. ۴۰۴ باعث می‌شد کلاینت به صفحه‌ی «یافت
     *    نشد» برود، در حالی که کاربر فقط باید کد دیگری امتحان کند.
     */
    public function applyCoupon(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:40'],
        ]);

        $cart = $this->resolveCart($request);

        $result = $this->coupons->applyToCart(
            cart: $cart,
            code: $validated['code'],
            subtotal: $cart->subtotal,
            user: $request->user('sanctum'),
        );

        if ($result['error'] !== null) {
            return response()->json([
                'message' => $result['error'],
                'error' => ['code' => 'COUPON_INVALID'],
                'errors' => ['code' => [$result['error']]],
            ], 422);
        }

        return (new CartResource($result['cart']))
            ->additional(['message' => __('shop.coupon_applied')])
            ->response();
    }

    /**
     * DELETE /api/v1/cart/coupon
     * برداشتن کد تخفیف از سبد.
     */
    public function removeCoupon(Request $request): JsonResponse
    {
        $cart = $this->coupons->removeFromCart($this->resolveCart($request));

        return (new CartResource($cart))
            ->additional(['message' => __('shop.coupon_removed')])
            ->response();
    }

    /**
     * سبد مناسب این درخواست را پیدا یا می‌سازد.
     *
     * کاربر واردشده سبد خودش را می‌گیرد؛ مهمان بر اساس هدر X-Session-Id.
     * این منطق در همه‌ی اکشن‌ها تکرار می‌شد، پس اینجا جمع شده است.
     *
     * ⚠️ چرا user('sanctum') و نه user()؟
     *    این مسیرها عمداً پشت میدل‌ور auth:sanctum نیستند تا مهمان هم
     *    بتواند سبد داشته باشد. اما بدون آن میدل‌ور، متد user() بدون
     *    آرگومان از گارد پیش‌فرض (web/session) می‌خواند و همیشه null
     *    برمی‌گرداند — حتی وقتی توکن Bearer معتبر ارسال شده باشد.
     *
     *    نتیجه‌ی آن باگ: کاربر واردشده سبد خودش را نمی‌دید و به‌جای آن
     *    یک سبد مهمان می‌گرفت.
     *
     *    با تعیین صریح گارد «sanctum»، توکن خوانده و کاربر شناسایی
     *    می‌شود، و اگر توکنی نبود null برمی‌گردد (رفتار دلخواه ما).
     */
    private function resolveCart(Request $request)
    {
        return $this->cartService->getOrCreate(
            userId: $request->user('sanctum')?->id,
            sessionId: $request->header('X-Session-Id'),
        );
    }
}
