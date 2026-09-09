<?php

namespace App\Http\Resources;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * تبدیل مدل Category به خروجی JSON برای پنل مدیریت.
 * ---------------------------------------------------------------------------
 * ⚠️ فیلدهای چندزبانه **خام** برگردانده می‌شوند، یعنی
 *    {"fa": "...", "en": "..."} نه رشته‌ی زبان جاری.
 *
 *    همان دلیل AdminPostDetailResource: فرم ویرایش دو تب دارد و
 *    اگر فقط زبان جاری بیاید، ذخیره‌ی فرم ترجمه‌ی زبان دیگر را
 *    پاک می‌کند.
 *
 * @mixin Category
 */
class AdminCategoryResource extends JsonResource
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

            /* --- محتوای خام چندزبانه --- */
            'name' => $this->rawTranslations('name'),
            'description' => $this->rawTranslations('description'),
            'metaTitle' => $this->rawTranslations('meta_title'),
            'metaDescription' => $this->rawTranslations('meta_description'),

            /* برچسب آماده برای جدول و عنوان صفحه */
            'displayName' => $this->translate('name', $locale),

            'parentId' => $this->parent_id,
            'icon' => $this->icon,
            'image' => $this->image,

            'sortOrder' => $this->sort_order,
            'isActive' => (bool) $this->is_active,
            'isFeatured' => (bool) $this->is_featured,

            /*
             * دو شمارنده‌ی متفاوت:
             *   productsCount        محصولات مستقیم این دسته
             *   childrenCount        تعداد زیردسته‌ها
             *
             * هر دو برای تصمیم حذف لازم‌اند — دسته‌ای که محصول یا
             * زیردسته دارد نباید بی‌هشدار حذف شود.
             */
            'productsCount' => $this->products_count ?? 0,
            'childrenCount' => $this->children_count ?? 0,

            /* زیردسته‌ها — فقط وقتی درخت خواسته شده باشد */
            'children' => AdminCategoryResource::collection($this->whenLoaded('children')),

            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }
}
