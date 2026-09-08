<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Services\Auth\AuthService;
use App\Services\Cart\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * کنترلر احراز هویت — ثبت‌نام، ورود، خروج و اطلاعات کاربر جاری.
 * ---------------------------------------------------------------------------
 * کنترلر نازک: فقط ورودی را می‌گیرد، سرویس را صدا می‌زند و خروجی
 * را قالب‌بندی می‌کند. هیچ منطق تجاری‌ای اینجا نیست.
 */
class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService,
        private readonly CartService $cartService,
    ) {}

    /**
     * POST /api/v1/auth/register
     * ثبت‌نام کاربر جدید.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register($request->validated());

        /* سبد مهمان به حساب تازه‌ساخته‌شده منتقل می‌شود */
        $this->mergeGuestCart($request, $result['user']->id);

        return response()->json([
            'data' => [
                'user' => (new UserResource($result['user']))->asOwner(),
                'token' => $result['token'],
            ],
            'message' => __('auth.registered'),
        ], 201);
    }

    /**
     * POST /api/v1/auth/login
     * ورود با ایمیل و رمز عبور.
     *
     * ⚠️ این مسیر با میدل‌ور throttle:auth محدود شده (۵ تلاش در دقیقه)
     *    تا حمله حدس رمز عبور ممکن نباشد.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login($request->validated());

        /*
         * ادغام سبد مهمان با سبد کاربر.
         *
         * ⚠️ بدون این، کاربری که به‌عنوان مهمان چند محصول انتخاب کرده
         *    و بعد وارد حسابش شده، سبدش را خالی می‌بیند — یکی از
         *    آزاردهنده‌ترین باگ‌های فروشگاهی که مستقیم روی فروش اثر دارد.
         */
        $this->mergeGuestCart($request, $result['user']->id);

        return response()->json([
            'data' => [
                'user' => (new UserResource($result['user']))->asOwner(),
                'token' => $result['token'],
            ],
            'message' => __('auth.logged_in'),
        ]);
    }

    /**
     * POST /api/v1/auth/logout
     * خروج از حساب — ابطال توکن دستگاه فعلی.
     */
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json(['message' => __('auth.logged_out')]);
    }

    /**
     * POST /api/v1/auth/logout-all
     * خروج از تمام دستگاه‌ها.
     */
    public function logoutAll(Request $request): JsonResponse
    {
        $this->authService->logoutFromAllDevices($request->user());

        return response()->json(['message' => __('auth.logged_out_all')]);
    }

    /**
     * GET /api/v1/auth/me
     * اطلاعات کاربر واردشده.
     *
     * فرانت‌اند از این اندپوینت برای بررسی اعتبار توکن ذخیره‌شده
     * استفاده می‌کند: اگر ۴۰۱ برگردد یعنی توکن منقضی شده است.
     */
    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    /**
     * انتقال سبد مهمان به حساب کاربر.
     *
     * اگر هدر X-Session-Id ارسال نشده باشد، کاری انجام نمی‌شود.
     * خطای احتمالی ادغام نباید ورود کاربر را خراب کند، پس در
     * try/catch گرفته می‌شود.
     */
    private function mergeGuestCart(Request $request, int $userId): void
    {
        $sessionId = $request->header('X-Session-Id');

        if (! $sessionId) {
            return;
        }

        try {
            $this->cartService->merge($sessionId, $userId);
        } catch (\Throwable) {
            /* شکست ادغام نباید مانع ورود موفق کاربر شود */
        }
    }
}
