<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * تبدیل مدل Review به خروجی JSON.
 * ---------------------------------------------------------------------------
 * ⚠️ حریم خصوصی: ایمیل و شماره‌ی نویسنده هرگز بیرون نمی‌رود.
 *    نظر روی صفحه‌ی محصول برای همه قابل دیدن است، پس هر فیلدی که
 *    اینجا اضافه شود عملاً عمومی است.
 */
class ReviewResource extends JsonResource
{
    /**
     * ساخت آرایه خروجی.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'rating' => $this->rating,
            'title' => $this->title,
            'comment' => $this->comment,

            /* فهرست‌های خالی به آرایه تبدیل می‌شوند تا فرانت نیازی به بررسی null نداشته باشد */
            'pros' => $this->pros ?? [],
            'cons' => $this->cons ?? [],

            'isVerifiedPurchase' => $this->is_verified_purchase,
            'helpfulCount' => $this->helpful_count,

            /*
             * نویسنده — فقط نام.
             *
             * whenLoaded تضمین می‌کند فهرست ۲۰تایی نظرات، ۲۰ کوئری
             * اضافه برای کاربر نزند.
             */
            'author' => $this->whenLoaded('user', fn () => [
                'name' => $this->user->name,
                'avatar' => $this->user->avatar,
            ]),

            /*
             * آیا کاربرِ درخواست‌دهنده به این نظر رأی «مفید» داده؟
             *
             * فقط وقتی فرستاده می‌شود که رابطه از پیش بارگذاری شده
             * باشد — یعنی کاربر وارد شده است. برای مهمان کلید اصلاً
             * وجود ندارد و فرانت دکمه را در حالت خنثی نشان می‌دهد.
             */
            'hasVoted' => $this->when(
                $this->relationLoaded('votes'),
                fn () => $this->votes->isNotEmpty(),
            ),

            /*
             * وضعیت تعدیل — فقط برای نمایش در «نظرات من» و پنل مدیریت.
             * در فهرست عمومی همه‌ی نظرات تأییدشده‌اند، پس اطلاعات
             * اضافه‌ای لو نمی‌دهد.
             */
            'status' => $this->status(),
            'rejectionReason' => $this->rejection_reason,

            /* محصول — فقط در «نظرات من» بارگذاری می‌شود */
            'product' => $this->whenLoaded('product', fn () => [
                'id' => $this->product->id,
                'name' => $this->product->translate('name', app()->getLocale()),
                'slug' => $this->product->slug,
            ]),

            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
