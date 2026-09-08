<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * تبدیل مدل Post به خروجی JSON برای *فرم ویرایش* پنل مدیریت.
 * ---------------------------------------------------------------------------
 * ⚠️ تفاوت کلیدی با نمای عمومی: فیلدهای چندزبانه **خام** برگردانده
 *    می‌شوند، یعنی {"fa": "...", "en": "..."} نه رشته‌ی زبان جاری.
 *
 *    دلیل: فرم ویرایش دو تب دارد و باید هر دو زبان را هم‌زمان نشان
 *    دهد. اگر مثل نمای عمومی فقط زبان جاری برگردد، ادمینی که سایت
 *    را فارسی باز کرده هرگز نمی‌تواند متن انگلیسی را ببیند یا
 *    ویرایش کند — و بدتر، ذخیره‌ی فرم مقدار انگلیسی را با فارسی
 *    بازنویسی می‌کند.
 */
class AdminPostDetailResource extends JsonResource
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

            /* --- محتوای خام چندزبانه (نه ترجمه‌شده) --- */
            'title' => $this->rawTranslations('title'),
            'excerpt' => $this->rawTranslations('excerpt'),
            'body' => $this->rawTranslations('body'),

            /* برچسب آماده برای عنوان صفحه — راحتی فرانت‌اند */
            'displayTitle' => $this->translate('title', $locale),

            'postCategoryId' => $this->post_category_id,
            'authorName' => $this->author_name,
            'coverImage' => $this->cover_image,

            /*
             * مسیر خام کاور، جدا از آدرس کامل.
             *
             * coverImage آدرس مطلق است (برای نمایش پیش‌نمایش) ولی فرم
             * هنگام ذخیره باید همان مسیر نسبی را پس بفرستد. بدون این
             * فیلد، فرانت باید آدرس را برش بزند — کاری که با تغییر
             * دامنه می‌شکند.
             */
            'coverImagePath' => $this->attributes['cover_image'] ?? null,

            'readingMinutes' => $this->reading_minutes,
            'viewsCount' => $this->views_count,
            'isFeatured' => (bool) $this->is_featured,

            'publishedAt' => $this->published_at?->toIso8601String(),
            'status' => match (true) {
                $this->published_at === null => 'draft',
                $this->published_at->isFuture() => 'scheduled',
                default => 'published',
            },

            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->translate('name', $locale),
                'slug' => $this->category->slug,
            ]),

            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }
}
