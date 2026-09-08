<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * خروجی دسته‌بندی مقاله.
 */
class PostCategoryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $locale = app()->getLocale();

        return [
            'id' => $this->id,
            'name' => $this->translate('name', $locale),
            'description' => $this->translate('description', $locale),
            'slug' => $this->slug,

            /* فقط با withCount('publishedPosts') پر می‌شود */
            'postsCount' => $this->whenCounted('publishedPosts'),
        ];
    }
}
