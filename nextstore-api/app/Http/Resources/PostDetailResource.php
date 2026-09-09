<?php

namespace App\Http\Resources;

use App\Models\Post;
use Illuminate\Http\Request;

/**
 * خروجی مقاله در نمای جزئیات — همان فیلدهای فهرست، به‌علاوه متن کامل.
 *
 * @mixin Post
 */
class PostDetailResource extends PostResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $locale = app()->getLocale();

        return array_merge(parent::toArray($request), [
            'body' => $this->translate('body', $locale),
        ]);
    }
}
