<?php

namespace App\Http\Resources;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;

/**
 * تبدیل مدل Category به خروجی JSON.
 *
 * قابلیت بازگشتی: اگر رابطه‌ی childrenRecursive بارگذاری شده باشد،
 * زیردسته‌ها هم با همین Resource تبدیل می‌شوند و نتیجه یک درخت کامل
 * JSON است که فرانت‌اند می‌تواند مستقیماً منوی چندسطحی بسازد.
 */
class CategoryResource extends JsonResource
{
    /**
     * ساخت آرایه خروجی.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $locale = app()->getLocale();

        /*
         * زیردسته‌ها ممکن است با هر یک از دو نام رابطه بارگذاری شده باشند:
         *   childrenRecursive → درخت کامل (صفحه منو)
         *   children          → فقط یک سطح (صفحه دسته)
         * هر کدام موجود بود استفاده می‌شود.
         */
        $children = $this->resolveChildren();

        return [
            'id' => $this->id,
            'name' => $this->translate('name', $locale),
            'description' => $this->translate('description', $locale),
            'slug' => $this->slug,
            'icon' => $this->icon,
            'image' => $this->image,
            'isFeatured' => $this->is_featured,

            /* شناسه والد — برای بازسازی درخت در فرانت‌اند */
            'parentId' => $this->parent_id,

            /**
             * تعداد محصولات مستقیم این دسته.
             * برای دسته‌های والد معمولاً صفر است، چون محصولات در
             * زیردسته‌ها ثبت می‌شوند.
             */
            'directProductsCount' => $this->whenCounted('products'),

            /**
             * تعداد کل محصولات این دسته و تمام زیردسته‌هایش.
             *
             * ⚠️ این عددی است که باید در رابط کاربری نمایش داده شود.
             *    اگر «کالای دیجیتال (۰)» نشان دهیم در حالی که ۱۴ محصول
             *    در زیردسته‌هایش هست، کاربر فکر می‌کند دسته خالی است.
             */
            'productsCount' => $this->totalProductsCount($children),

            /*
             * زیردسته‌ها — بازگشتی.
             *
             * ⚠️ باگ ظریفی که اینجا رفع شد:
             *    قبلاً فقط `CategoryResource::collection($children)`
             *    برگردانده می‌شد. در پاسخ مستقیم HTTP مشکلی نداشت،
             *    اما کنترلر خروجی را در کش می‌گذارد و آن مقدار یک
             *    *شیء* AnonymousResourceCollection بود، نه آرایه.
             *
             *    نتیجه پس از خواندن از کش:
             *        "children": {"__PHP_Incomplete_Class_Name": "..."}
             *
             *    یعنی زیردسته‌ها در مگامنوی دسکتاپ و منوی موبایل
             *    کاملاً ناپدید می‌شدند — بدون هیچ خطایی در لاگ.
             *
             *    با فراخوانی صریح toArray()، کل درخت به آرایه‌ی ساده
             *    تبدیل و برای کش امن می‌شود.
             */
            'children' => $children !== null
                ? CategoryResource::collection($children)->toArray($request)
                : [],
        ];
    }

    /**
     * زیردسته‌های بارگذاری‌شده را برمی‌گرداند، صرف‌نظر از اینکه با
     * کدام نام رابطه لود شده‌اند.
     *
     * @return Collection<int, Category>|null
     */
    private function resolveChildren(): ?Collection
    {
        if ($this->relationLoaded('childrenRecursive')) {
            return $this->childrenRecursive;
        }

        if ($this->relationLoaded('children')) {
            return $this->children;
        }

        return null;
    }

    /**
     * مجموع محصولات این دسته و کل زیردرختش را محاسبه می‌کند.
     *
     * محاسبه روی داده‌ی از پیش بارگذاری‌شده انجام می‌شود، پس
     * هیچ کوئری اضافه‌ای به دیتابیس زده نمی‌شود.
     *
     * @param  Collection<int, Category>|null  $children
     */
    private function totalProductsCount(?Collection $children): int
    {
        /* تعداد محصولات مستقیم خود این دسته */
        $own = (int) ($this->products_count ?? 0);

        if ($children === null) {
            return $own;
        }

        /* جمع بازگشتی تعداد محصولات همه‌ی زیردسته‌ها */
        foreach ($children as $child) {
            $grandChildren = $child->relationLoaded('childrenRecursive')
                ? $child->childrenRecursive
                : ($child->relationLoaded('children') ? $child->children : null);

            $own += (new self($child))->totalProductsCount($grandChildren);
        }

        return $own;
    }
}
