<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * تبدیل مدل Brand به خروجی JSON برای پنل مدیریت.
 *
 * ⚠️ مثل دسته‌بندی، فیلدهای چندزبانه خام برگردانده می‌شوند تا فرم
 *    دوزبانه بتواند هر دو زبان را هم‌زمان نشان دهد و ذخیره کند.
 */
class AdminBrandResource extends JsonResource
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

            'name' => $this->rawTranslations('name'),
            'description' => $this->rawTranslations('description'),

            'displayName' => $this->translate('name', $locale),

            /*
             * لوگو آدرس مطلق است (اکسسور مدل آن را می‌سازد) ولی فرم
             * باید مسیر نسبی را پس بفرستد — وگرنه با تغییر دامنه
             * می‌شکند.
             */
            'logo' => $this->logo,
            'logoPath' => $this->attributes['logo'] ?? null,

            'website' => $this->website,
            'countryCode' => $this->country_code,

            'sortOrder' => $this->sort_order,
            'isActive' => (bool) $this->is_active,
            'isFeatured' => (bool) $this->is_featured,

            'productsCount' => $this->products_count ?? 0,

            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }
}
