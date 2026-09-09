<?php

namespace App\Http\Resources;

use App\Models\Banner;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * یک بنر برای نمایش در فروشگاه.
 *
 * ⚠️ متن‌ها **ترجمه‌شده** بیرون می‌روند نه خام.
 *
 *    فرانت نباید بداند ساختار JSON چندزبانه چه شکلی است؛ اگر روزی
 *    زبان سومی اضافه شود، هیچ کامپوننتی نباید عوض شود. فرم پنل
 *    مدیریت مقدار خام را از ریسورس *ادمین* می‌گیرد.
 *
 * @mixin Banner
 */
class BannerResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $locale = app()->getLocale();

        return [
            'id' => $this->id,
            'placement' => $this->placement->value,

            'badge' => $this->translate('badge', $locale) ?: null,
            'title' => $this->translate('title', $locale),
            'subtitle' => $this->translate('subtitle', $locale) ?: null,
            'ctaLabel' => $this->translate('cta_label', $locale) ?: null,

            'href' => $this->href,

            /*
             * ⚠️ کلید رنگ، نه کلاس CSS.
             *
             *    Tailwind کلاس‌ها را با اسکن سورس پیدا می‌کند؛ کلاسی که
             *    در زمان اجرا از دیتابیس ساخته شود در بیلد تولیدی وجود
             *    ندارد و بی‌صدا حذف می‌شود. فرانت این کلید را به نگاشتی
             *    از کلاس‌های ثابت می‌دهد.
             */
            'theme' => $this->theme->value,
            'icon' => $this->icon,
        ];
    }
}
