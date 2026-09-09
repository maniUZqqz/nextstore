<?php

namespace App\Http\Resources;

use App\Models\TicketMessage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * تبدیل یک پیام گفتگو به خروجی JSON.
 *
 * ⚠️ ایمیل فرستنده هرگز بیرون نمی‌رود. کاربر پیام‌های پشتیبان را
 *    می‌بیند و نباید ایمیل شخصی کارمند را ببیند.
 *
 * @mixin TicketMessage
 */
class TicketMessageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'body' => $this->body,

            /* تعیین‌کننده‌ی سمت پیام در گفتگو */
            'isStaff' => (bool) $this->is_staff,

            /*
             * نام فرستنده.
             * اگر حساب حذف شده باشد null است — پیام می‌ماند ولی
             * نامی برای نشان دادن نیست.
             */
            'authorName' => $this->whenLoaded('user', fn () => $this->user?->name),

            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
