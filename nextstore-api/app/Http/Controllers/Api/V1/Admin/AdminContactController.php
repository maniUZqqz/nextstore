<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContactMessageResource;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * صندوق پیام‌های «تماس با ما» — پنل مدیریت.
 * ---------------------------------------------------------------------------
 * ⚠️ بررسی نقش مدیر با میدل‌ور `admin` روی گروه مسیرها انجام می‌شود،
 *    نه اینجا.
 */
class AdminContactController extends Controller
{
    /**
     * صندوق پیام‌های تماس — با فیلتر و جست‌وجو.
     *
     * GET /api/v1/admin/contact-messages?status=unread
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = ContactMessage::query()->with('user');

        match ($request->query('status', 'unread')) {
            'read' => $query->where('is_read', true),
            'all' => null,
            default => $query->unread(),
        };

        if ($search = trim((string) $request->query('q', ''))) {
            $query->where(function ($sub) use ($search) {
                $sub->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%");
            });
        }

        /*
         * ⚠️ تازه‌ترین اول — برخلاف صف تعدیل نظرات که قدیمی‌ترین را
         *    اول می‌آورد.
         *
         *    آنجا هر قلم باید رسیدگی شود و انتظار طولانی بد است. اینجا
         *    صندوق ورودی است: پیام امروز مهم‌تر از پیام سه هفته پیشی
         *    است که کسی جوابش را نداده.
         */
        $messages = $query->latest()
            ->paginate(min((int) $request->query('per_page', 20), 100));

        return ContactMessageResource::collection($messages)
            ->additional(['counts' => $this->counts()]);
    }

    /**
     * متن کامل یک پیام — و علامت‌گذاری آن به‌عنوان خوانده‌شده.
     *
     * GET /api/v1/admin/contact-messages/{contactMessage}
     *
     * ⚠️ باز کردن پیام، آن را خوانده‌شده می‌کند.
     *
     *    این تنها جایی است که متن کامل دیده می‌شود، پس «دیدن» و
     *    «خواندن» واقعاً یکی‌اند. دکمه‌ی جدای «علامت‌گذاری خوانده‌شده»
     *    یک کلیک اضافه بود که هیچ‌کس نمی‌زد و شمارنده را برای همیشه
     *    قرمز نگه می‌داشت.
     */
    public function show(ContactMessage $contactMessage): JsonResponse
    {
        $contactMessage->markRead();

        return (new ContactMessageResource($contactMessage->load('user')))
            ->additional(['counts' => $this->counts()])
            ->response();
    }

    /**
     * DELETE /api/v1/admin/contact-messages/{contactMessage}
     *
     * حذف واقعی و بدون سطل بازیافت — هرزنامه ارزش نگه‌داشتن ندارد.
     */
    public function destroy(ContactMessage $contactMessage): JsonResponse
    {
        $contactMessage->delete();

        return response()->json([
            'message' => __('shop.contact_deleted'),
            'counts' => $this->counts(),
        ]);
    }

    /**
     * شمارش هر تب — همان اعدادی که روی نشان صندوق می‌نشینند.
     *
     * @return array{unread: int, read: int, all: int}
     */
    private function counts(): array
    {
        $total = ContactMessage::count();
        $unread = ContactMessage::unread()->count();

        return [
            'unread' => $unread,
            'read' => $total - $unread,
            'all' => $total,
        ];
    }
}
