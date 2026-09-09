<?php

namespace App\Http\Controllers\Api\V1\Shop;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shop\StoreContactMessageRequest;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;

/**
 * دریافت پیام از فرم «تماس با ما».
 * ---------------------------------------------------------------------------
 * ⚠️ مسیر عمومی است — مهمان هم می‌تواند بفرستد. محافظ در برابر سیل
 *    پیام، `throttle:contact` روی مسیر است نه چیزی در این کلاس.
 */
class ContactController extends Controller
{
    /**
     * ثبت یک پیام تازه.
     *
     * ⚠️ پاسخ عمداً هیچ شناسه یا شماره‌ای برنمی‌گرداند.
     *
     *    فرستنده راهی برای دیدن پیام ندارد (نه حسابی لازم است و نه
     *    صفحه‌ای برایش هست)، پس شناسه فقط اطلاعاتی است که تعداد کل
     *    پیام‌ها را لو می‌دهد. اگر روزی پیگیری اضافه شد، آن وقت یک
     *    شماره‌ی جدا مثل تیکت‌ها ساخته می‌شود.
     */
    public function store(StoreContactMessageRequest $request): JsonResponse
    {
        ContactMessage::create([
            /*
             * ⚠️ نام و ایمیل از *فرم* گرفته می‌شوند حتی وقتی کاربر وارد
             *    شده. کسی ممکن است از حساب خودش پیامی درباره‌ی سفارش
             *    همسرش بفرستد و بخواهد جواب به ایمیل دیگری برود.
             *    user_id فقط برای این است که مدیر بداند طرف مشتری است.
             */
            'user_id' => $request->user()?->id,
            'name' => $request->string('name')->trim()->value(),
            'email' => $request->string('email')->trim()->lower()->value(),
            'subject' => $request->string('subject')->trim()->value(),
            'message' => $request->string('message')->trim()->value(),
            'ip' => $request->ip(),
        ]);

        return response()->json([
            'message' => __('shop.contact_sent'),
        ], 201);
    }
}
