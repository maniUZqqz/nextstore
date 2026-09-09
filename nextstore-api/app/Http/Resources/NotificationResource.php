<?php

namespace App\Http\Resources;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * یک اعلان برای نمایش به کاربر.
 *
 * ⚠️ عنوان و متن **در همین لحظه** ساخته می‌شوند، نه از دیتابیس خوانده.
 *
 *    دیتابیس فقط نوع رویداد و پارامترها را دارد. یعنی کاربری که زبان
 *    سایت را عوض می‌کند، اعلان‌های دیروزش را هم به زبان تازه می‌بیند —
 *    و اصلاح یک غلط املایی روی اعلان‌های قدیمی هم اثر می‌گذارد.
 *
 * @mixin Notification
 */
class NotificationResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $locale = app()->getLocale();

        return [
            'id' => $this->id,
            'type' => $this->type->value,

            'title' => $this->title($locale),
            'body' => $this->body($locale),

            /*
             * آیکون و رنگ از بک‌اند می‌آیند، نه از نگاشت در فرانت.
             *
             * ⚠️ همان قاعده‌ای که برای وضعیت سفارش و تیکت به کار رفت:
             *    اگر فرانت نگاشت خودش را داشته باشد، افزودن یک نوع
             *    اعلان تازه یعنی دو جا باید عوض شود و یکی همیشه جا
             *    می‌ماند.
             */
            'icon' => $this->type->icon(),
            'color' => $this->type->color(),

            'link' => $this->link,

            'isRead' => $this->read_at !== null,
            'readAt' => $this->read_at?->toIso8601String(),
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
