<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * اعلان‌های کاربر.
 * ---------------------------------------------------------------------------
 * ⚠️ همه‌ی کوئری‌ها از `$request->user()->notifications()` شروع می‌شوند،
 *    نه از `Notification::query()`.
 *
 *    این تنها محافظ در برابر IDOR است: کاربری که شناسه‌ی اعلان دیگری
 *    را حدس بزند، اصلاً ردیفی پیدا نمی‌کند — نه اینکه پیدا کند و بعد
 *    بررسی مالکیت شکست بخورد. همان الگویی که برای تیکت و سفارش هم به
 *    کار رفت.
 */
class NotificationController extends Controller
{
    /**
     * GET /api/v1/notifications?status=unread
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = $request->user()->notifications();

        if ($request->query('status') === 'unread') {
            $query->unread();
        }

        $notifications = $query->latest()
            ->paginate(min((int) $request->query('per_page', 20), 50));

        return NotificationResource::collection($notifications)
            ->additional(['meta' => ['unread' => $this->unread($request)]]);
    }

    /**
     * GET /api/v1/notifications/unread-count
     *
     * ⚠️ اندپوینت جدا و سبک، چون نشان زنگوله در **هر بارگذاری صفحه**
     *    آن را می‌خواند. گرفتن کل فهرست فقط برای یک عدد، در هر صفحه‌ی
     *    سایت یک کوئری صفحه‌بندی‌شده و یک پاسخ چندکیلوبایتی می‌ساخت.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json([
            'data' => ['unread' => $request->user()->notifications()->unread()->count()],
        ]);
    }

    /**
     * PATCH /api/v1/notifications/{notification}/read
     */
    public function markRead(Request $request, int $notification): JsonResponse
    {
        $found = $request->user()->notifications()->findOrFail($notification);
        $found->markRead();

        return (new NotificationResource($found))
            ->additional(['meta' => ['unread' => $this->unread($request)]])
            ->response();
    }

    /**
     * PATCH /api/v1/notifications/read-all
     *
     * ⚠️ یک کوئری، نه حلقه روی مدل‌ها.
     *
     *    کاربری که صد اعلان خوانده‌نشده دارد، با حلقه صد کوئری
     *    به‌روزرسانی می‌گرفت. اینجا هیچ رویداد مدلی هم لازم نیست.
     */
    public function markAllRead(Request $request): JsonResponse
    {
        $count = $request->user()->notifications()->unread()->update(['read_at' => now()]);

        return response()->json([
            'message' => __('shop.notifications_all_read'),
            'meta' => ['unread' => 0, 'marked' => $count],
        ]);
    }

    /**
     * DELETE /api/v1/notifications/{notification}
     */
    public function destroy(Request $request, int $notification): JsonResponse
    {
        $request->user()->notifications()->findOrFail($notification)->delete();

        return response()->json([
            'message' => __('shop.notification_deleted'),
            'meta' => ['unread' => $this->unread($request)],
        ]);
    }

    /** شمار خوانده‌نشده‌ها — برای همراه‌کردن با هر پاسخ. */
    private function unread(Request $request): int
    {
        return $request->user()->notifications()->unread()->count();
    }
}
