<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

/**
 * خروجی مقاله در نمای جزئیات — همان فیلدهای فهرست، به‌علاوه متن کامل.
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
