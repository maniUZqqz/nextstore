<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * تبدیل مدل Brand به خروجی JSON.
 */
class BrandResource extends JsonResource
{
    /**
     * ساخت آرایه خروجی.
     *
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
            'logo' => $this->logo,
            'website' => $this->website,
            'countryCode' => $this->country_code,
            'isFeatured' => $this->is_featured,

            /* تعداد محصولات این برند — فقط با withCount('products') */
            'productsCount' => $this->whenCounted('products'),
        ];
    }
}
