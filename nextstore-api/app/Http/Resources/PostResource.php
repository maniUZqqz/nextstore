<?php

namespace App\Http\Resources;

use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * خروجی مقاله در نمای فهرست (کارت مقاله).
 *
 * متن کامل عمداً اینجا نیست: فهرست ۱۲ مقاله‌ای با متن کامل، صدها
 * کیلوبایت داده‌ی بی‌استفاده جابه‌جا می‌کند. متن فقط در نمای
 * جزئیات می‌آید.
 *
 * @mixin Post
 */
class PostResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $locale = app()->getLocale();

        return [
            'id' => $this->id,
            'title' => $this->translate('title', $locale),
            'excerpt' => $this->translate('excerpt', $locale),
            'slug' => $this->slug,
            'coverImage' => $this->cover_image,

            'readingMinutes' => $this->reading_minutes,
            'viewsCount' => $this->views_count,
            'isFeatured' => (bool) $this->is_featured,

            'authorName' => $this->author_name,
            'publishedAt' => $this->published_at?->toIso8601String(),

            /* دسته — فقط اگر رابطه بارگذاری شده باشد (جلوگیری از N+1) */
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->translate('name', $locale),
                'slug' => $this->category->slug,
            ]),
        ];
    }
}
