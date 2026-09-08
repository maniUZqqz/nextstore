<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * تبدیل مدل Post به خروجی JSON برای *جدول* پنل مدیریت.
 * ---------------------------------------------------------------------------
 * نمای فهرست است، نه فرم ویرایش: فقط ستون‌هایی که در جدول دیده
 * می‌شوند. بدنه‌ی مقاله عمداً نیست — فرستادن ده بدنه‌ی HTML در یک
 * صفحه‌ی فهرست، پاسخ را بی‌دلیل ده‌ها کیلوبایت می‌کند.
 */
class AdminPostResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $locale = app()->getLocale();

        return [
            'id' => $this->id,
            'slug' => $this->slug,

            /* عنوان به زبان جاری — برای نمایش در ستون جدول */
            'title' => $this->translate('title', $locale),

            'coverImage' => $this->cover_image,
            'authorName' => $this->author_name,
            'readingMinutes' => $this->reading_minutes,
            'viewsCount' => $this->views_count,
            'isFeatured' => (bool) $this->is_featured,

            /*
             * وضعیت انتشار به‌صورت یک رشته.
             *
             * از ترکیب published_at ساخته می‌شود تا فرانت‌اند مجبور
             * نباشد همان منطق تاریخ را دوباره پیاده کند — و نسخه‌ی
             * دومی از منطق که می‌تواند با این یکی واگرا شود، وجود
             * نداشته باشد.
             */
            'status' => $this->publicationStatus(),
            'publishedAt' => $this->published_at?->toIso8601String(),

            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->translate('name', $locale),
                'slug' => $this->category->slug,
            ]),

            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }

    /**
     * وضعیت انتشار: منتشرشده، زمان‌بندی‌شده، یا پیش‌نویس.
     */
    private function publicationStatus(): string
    {
        if ($this->published_at === null) {
            return 'draft';
        }

        return $this->published_at->isFuture() ? 'scheduled' : 'published';
    }
}
