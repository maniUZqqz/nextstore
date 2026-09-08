<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\UpdatePasswordRequest;
use App\Http\Requests\Customer\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * کنترلر پروفایل و امنیت حساب کاربر.
 * ---------------------------------------------------------------------------
 * سه گروه اکشن:
 *   پروفایل  — مشاهده و ویرایش اطلاعات شخصی
 *   رمز عبور — تغییر رمز با تأیید رمز فعلی
 *   نشست‌ها  — فهرست دستگاه‌های واردشده و خروج از آن‌ها
 *
 * ⚠️ همه‌ی اکشن‌ها روی `$request->user()` کار می‌کنند، نه روی شناسه‌ای
 *    که از بیرون بیاید. یعنی کاربر هرگز نمی‌تواند پروفایل دیگری را
 *    ببیند یا عوض کند، حتی با دستکاری بدنه‌ی درخواست.
 */
class ProfileController extends Controller
{
    /**
     * GET /api/v1/profile
     * اطلاعات کامل کاربر جاری.
     */
    public function show(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    /**
     * PUT /api/v1/profile
     * ویرایش اطلاعات شخصی.
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        /*
         * ⚠️ تغییر ایمیل، تأیید ایمیل را باطل می‌کند.
         *
         *    بدون این، کاربر می‌توانست با یک ایمیل واقعی ثبت‌نام و
         *    تأیید کند و بعد آن را به ایمیل کس دیگری عوض کند — و آن
         *    ایمیل بدون هیچ تأییدی «تأییدشده» باقی می‌ماند. همین
         *    برای موبایل هم صدق می‌کند.
         */
        if ($data['email'] !== $user->email) {
            $user->email_verified_at = null;
        }

        if (($data['phone'] ?? null) !== $user->phone) {
            $user->phone_verified_at = null;
        }

        $user->fill($data);
        $user->save();

        return (new UserResource($user->fresh()))
            ->additional(['message' => __('shop.profile_updated')])
            ->response();
    }

    /**
     * PUT /api/v1/profile/password
     * تغییر رمز عبور.
     */
    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        $user->password = Hash::make($request->validated()['password']);
        $user->save();

        /*
         * ⚠️ همه‌ی توکن‌های دیگر باطل می‌شوند، جز توکن جاری.
         *
         *    اگر کسی رمز را عوض می‌کند، احتمالاً نگران دسترسی
         *    ناخواسته است. نگه‌داشتن نشست‌های قدیمی یعنی مهاجمی که
         *    هنوز توکن دارد، بعد از تغییر رمز هم دسترسی‌اش برقرار
         *    می‌ماند — که کل هدف تغییر رمز را بی‌اثر می‌کند.
         *
         *    توکن جاری استثناست تا کاربر بلافاصله پس از تغییر رمز
         *    از حساب خودش پرت نشود.
         */
        $currentTokenId = $request->user()->currentAccessToken()?->id;

        $user->tokens()
            ->when($currentTokenId, fn ($query) => $query->where('id', '!=', $currentTokenId))
            ->delete();

        return response()->json(['message' => __('shop.password_updated')]);
    }

    /**
     * GET /api/v1/profile/sessions
     * فهرست دستگاه‌هایی که با آن‌ها وارد شده‌اید.
     */
    public function sessions(Request $request): JsonResponse
    {
        $currentTokenId = $request->user()->currentAccessToken()?->id;

        $sessions = $request->user()->tokens()
            ->latest('last_used_at')
            ->get()
            ->map(fn ($token) => [
                'id' => $token->id,
                'name' => $token->name,
                /* نشست جاری نباید دکمه‌ی «خروج» داشته باشد */
                'isCurrent' => $token->id === $currentTokenId,
                'createdAt' => $token->created_at?->toIso8601String(),
                'lastUsedAt' => $token->last_used_at?->toIso8601String(),
            ]);

        return response()->json(['data' => $sessions]);
    }

    /**
     * DELETE /api/v1/profile/sessions/{token}
     * خروج از یک دستگاه مشخص.
     */
    public function revokeSession(Request $request, int $token): JsonResponse
    {
        $currentTokenId = $request->user()->currentAccessToken()?->id;

        /*
         * بستن نشست جاری از این مسیر ممکن نیست.
         *
         * کاربری که دکمه‌ی «خروج» کنار دستگاه خودش را بزند، انتظار
         * ندارد همان لحظه از سایت پرت شود. برای خروج، دکمه‌ی
         * جداگانه‌ی «خروج از حساب» هست.
         */
        if ($token === $currentTokenId) {
            return response()->json([
                'message' => __('shop.session_cannot_revoke_current'),
                'error' => ['code' => 'CURRENT_SESSION'],
            ], 422);
        }

        /*
         * محدود کردن به توکن‌های خودِ کاربر — بدون آن، کاربر می‌توانست
         * با حدس زدن شناسه، نشست دیگران را ببندد.
         */
        $deleted = $request->user()->tokens()->where('id', $token)->delete();

        if ($deleted === 0) {
            return response()->json(['message' => __('shop.session_not_found')], 404);
        }

        return response()->json(['message' => __('shop.session_revoked')]);
    }
}
