<?php

namespace App\Http\Resources;

use App\Models\Banner;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * یک بنر برای فرم پنل مدیریت.
 *
 * ⚠️ برخلاف `BannerResource`، متن‌ها **خام و چندزبانه** بیرون می‌روند.
 *
 *    فرم دوزبانه باید هر دو زبان را هم‌زمان نشان دهد و ویرایش کند؛
 *    مقدار ترجمه‌شده برای این کار بی‌فایده است. `rawTranslations`
 *    تضمین می‌کند کلید هر دو زبان وجود دارد — بدون آن، input انگلیسی
 *    مقدار undefined می‌گرفت و ری‌اکت آن را «کنترل‌نشده» می‌ساخت.
 *
 * @mixin Banner
 */
class AdminBannerResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'placement' => $this->placement->value,
            'theme' => $this->theme->value,

            'badge' => $this->rawTranslations('badge'),
            'title' => $this->rawTranslations('title'),
            'subtitle' => $this->rawTranslations('subtitle'),
            'ctaLabel' => $this->rawTranslations('cta_label'),

            'href' => $this->href,
            'icon' => $this->icon,

            'sortOrder' => $this->sort_order,
            'isActive' => $this->is_active,

            'startsAt' => $this->starts_at?->toIso8601String(),
            'endsAt' => $this->ends_at?->toIso8601String(),

            /*
             * وضعیت محاسبه‌شده: live / scheduled / expired / disabled
             *
             * ⚠️ بدون این، مدیر بنری را می‌دید که تیک «فعال» دارد ولی
             *    در سایت نیست، و هیچ راهی نداشت بفهمد تاریخش گذشته یا
             *    هنوز نرسیده.
             */
            'state' => $this->state(),

            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
