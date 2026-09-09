<?php

namespace App\Http\Controllers\Api\V1\Shop;

use App\Enums\BannerPlacement;
use App\Http\Controllers\Controller;
use App\Http\Resources\BannerResource;
use App\Models\Banner;
use Illuminate\Http\JsonResponse;

/**
 * بنرهای تبلیغاتی صفحه‌ی اصلی — عمومی.
 */
class BannerController extends Controller
{
    /**
     * GET /api/v1/banners
     *
     * ⚠️ خروجی بر اساس جایگاه **گروه‌بندی** می‌شود، نه یک فهرست تخت.
     *
     *    صفحه‌ی اصلی دو مصرف‌کننده‌ی متفاوت دارد (اسلایدر و شبکه‌ی
     *    میانی) و هر کدام باید مستقیم به سهم خودش برسد. با فهرست تخت،
     *    هر دو کامپوننت مجبور بودند خودشان فیلتر کنند — منطقی تکراری
     *    که با اضافه‌شدن جایگاه سوم در دو جا باید عوض می‌شد.
     */
    public function index(): JsonResponse
    {
        $banners = Banner::query()->visible()->ordered()->get();

        return response()->json([
            'data' => collect(BannerPlacement::cases())
                ->mapWithKeys(fn (BannerPlacement $placement) => [
                    $placement->value => BannerResource::collection(
                        $banners->where('placement', $placement),
                    ),
                ]),
        ]);
    }
}
