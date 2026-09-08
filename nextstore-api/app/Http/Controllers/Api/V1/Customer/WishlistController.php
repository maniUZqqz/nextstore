<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * کنترلر علاقه‌مندی‌های کاربر.
 * ---------------------------------------------------------------------------
 * سه رفتار اصلی:
 *   ۱. خواندن فهرست (با خود محصول‌ها، نه فقط شناسه)
 *   ۲. افزودن و حذف تکی
 *   ۳. همگام‌سازی فهرست مهمان پس از ورود
 *
 * ⚠️ اصل امنیتی: همه‌ی کوئری‌ها از روی `$request->user()` شروع می‌شوند،
 *    نه از روی مدل Wishlist. یعنی حتی اگر کاربر شناسه‌ی دیگری بفرستد،
 *    هرگز به داده‌ی کاربر دیگری نمی‌رسد.
 */
class WishlistController extends Controller
{
    /**
     * GET /api/v1/wishlist
     * فهرست محصولات پسندیده‌شده — جدیدترین اول.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $products = $request->user()
            ->wishlistProducts()
            /*
             * بارگذاری همزمان روابط لازم برای کارت محصول.
             * بدون این، صفحه‌ای با ۲۰ محصول ۶۰ کوئری اضافه می‌زند (N+1).
             */
            ->with(['images', 'category', 'brand'])
            /*
             * ستون pivot را نام‌دار می‌آوریم چون هم products و هم
             * wishlists ستون created_at دارند و بدون این، ترتیب روی
             * تاریخ ساخت *محصول* اعمال می‌شود نه تاریخ پسندیدن.
             */
            ->orderByDesc('wishlists.created_at')
            ->get();

        return ProductResource::collection($products);
    }

    /**
     * POST /api/v1/wishlist
     * افزودن یک محصول به علاقه‌مندی‌ها.
     *
     * پاسخ ۲۰۰ است نه ۲۰۱، چون عملیات خودتوان (idempotent) است:
     * افزودن محصولی که از قبل هست، خطا نیست و همان وضعیت را می‌دهد.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'productId' => ['required', 'integer', Rule::exists('products', 'id')],
        ], [], ['productId' => __('shop.product')]);

        /*
         * syncWithoutDetaching به‌جای attach:
         *   attach روی محصول تکراری خطای «کلید یکتا نقض شد» می‌دهد
         *   (چون در مایگریشن unique گذاشته‌ایم). این متد ردیف موجود را
         *   دست‌نخورده می‌گذارد و بقیه فهرست را هم پاک نمی‌کند.
         */
        $request->user()->wishlistProducts()
            ->syncWithoutDetaching([$validated['productId']]);

        return response()->json([
            'message' => __('shop.wishlist_added'),
            'data' => ['count' => $request->user()->wishlists()->count()],
        ]);
    }

    /**
     * DELETE /api/v1/wishlist/{product}
     * حذف یک محصول از علاقه‌مندی‌ها.
     *
     * پارامتر مسیر «شناسه‌ی محصول» است، نه شناسه‌ی ردیف علاقه‌مندی.
     * دلیل: فرانت‌اند در کارت محصول فقط شناسه‌ی محصول را در اختیار
     * دارد و مجبور نیست اول فهرست را بگیرد تا شناسه‌ی ردیف را پیدا کند.
     */
    public function destroy(Request $request, int $product): JsonResponse
    {
        $request->user()->wishlistProducts()->detach($product);

        return response()->json([
            'message' => __('shop.wishlist_removed'),
            'data' => ['count' => $request->user()->wishlists()->count()],
        ]);
    }

    /**
     * POST /api/v1/wishlist/sync
     * ادغام فهرست مهمان با فهرست سرور پس از ورود.
     *
     * چرا لازم است؟
     *   کاربر مهمان چند محصول را می‌پسندد (ذخیره در localStorage)، بعد
     *   وارد حساب می‌شود. بدون این مسیر، آن انتخاب‌ها از بین می‌رفتند.
     *
     * ⚠️ ادغام است نه جایگزینی — فهرست قبلیِ روی سرور پاک نمی‌شود.
     *    اگر sync معمولی می‌زدیم، کاربری که از دستگاه دوم وارد شود
     *    با فهرست خالیِ آن دستگاه، همه‌ی علاقه‌مندی‌های قبلی‌اش را
     *    از دست می‌داد.
     */
    public function sync(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'productIds' => ['present', 'array', 'max:200'],
            'productIds.*' => ['integer'],
        ]);

        /*
         * شناسه‌های نامعتبر (محصول حذف‌شده) را کنار می‌گذاریم؛
         * وگرنه attach با خطای کلید خارجی کل درخواست را می‌شکند و
         * کاربر بدون هیچ پیام روشنی خطای ۵۰۰ می‌گیرد.
         */
        $validIds = Product::whereIn('id', $validated['productIds'])->pluck('id');

        $request->user()->wishlistProducts()->syncWithoutDetaching($validIds);

        return $this->index($request);
    }
}
