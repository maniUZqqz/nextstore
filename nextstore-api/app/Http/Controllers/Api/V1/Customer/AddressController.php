<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreAddressRequest;
use App\Http\Resources\AddressResource;
use App\Models\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * کنترلر مدیریت آدرس‌های کاربر.
 * ---------------------------------------------------------------------------
 * ⚠️ اصل امنیتی محوری این کنترلر:
 *    هر کوئری با `where('user_id', $request->user()->id)` محدود می‌شود.
 *
 *    بدون آن، کاربر می‌تواند با تغییر شناسه در آدرس درخواست
 *    (مثلاً /addresses/۵ به /addresses/۶) آدرس دیگران را ببیند،
 *    ویرایش یا حذف کند — یک آسیب‌پذیری IDOR کلاسیک.
 */
class AddressController extends Controller
{
    /**
     * GET /api/v1/addresses
     * فهرست آدرس‌های کاربر — پیش‌فرض در ابتدا.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $addresses = $request->user()->addresses()
            ->orderByDesc('is_default')
            ->orderByDesc('created_at')
            ->get();

        return AddressResource::collection($addresses);
    }

    /**
     * POST /api/v1/addresses
     * ثبت آدرس جدید.
     */
    public function store(StoreAddressRequest $request): JsonResponse
    {
        $user = $request->user();

        $address = $user->addresses()->create($request->validated());

        /*
         * اولین آدرس کاربر خودکار پیش‌فرض می‌شود.
         * بدون این، کاربر باید یک قدم اضافه بردارد تا بتواند
         * در تسویه آدرس داشته باشد.
         */
        if ($user->addresses()->count() === 1 || $request->boolean('is_default')) {
            $address->makeDefault();
        }

        return (new AddressResource($address->fresh()))
            ->additional(['message' => __('shop.address_created')])
            ->response()
            ->setStatusCode(201);
    }

    /**
     * PUT /api/v1/addresses/{address}
     * ویرایش آدرس.
     */
    public function update(StoreAddressRequest $request, int $address): JsonResponse
    {
        $model = $this->findOwned($request, $address);

        $model->update($request->validated());

        if ($request->boolean('is_default')) {
            $model->makeDefault();
        }

        return (new AddressResource($model->fresh()))
            ->additional(['message' => __('shop.address_updated')])
            ->response();
    }

    /**
     * DELETE /api/v1/addresses/{address}
     * حذف آدرس.
     */
    public function destroy(Request $request, int $address): JsonResponse
    {
        $model = $this->findOwned($request, $address);
        $wasDefault = $model->is_default;

        $model->delete();

        /*
         * اگر آدرس پیش‌فرض حذف شد، اولین آدرس باقی‌مانده جایگزین می‌شود.
         * وگرنه کاربر آدرس دارد ولی هیچ‌کدام پیش‌فرض نیست و صفحه‌ی
         * تسویه هیچ آدرسی از پیش انتخاب نمی‌کند.
         */
        if ($wasDefault) {
            $request->user()->addresses()->oldest()->first()?->makeDefault();
        }

        return response()->json(['message' => __('shop.address_deleted')]);
    }

    /**
     * PATCH /api/v1/addresses/{address}/default
     * تعیین آدرس پیش‌فرض.
     */
    public function setDefault(Request $request, int $address): JsonResponse
    {
        $model = $this->findOwned($request, $address);
        $model->makeDefault();

        return (new AddressResource($model->fresh()))
            ->additional(['message' => __('shop.address_default_set')])
            ->response();
    }

    /**
     * یافتن آدرسی که *متعلق به کاربر جاری* باشد.
     *
     * اگر آدرس وجود نداشته باشد یا مال کاربر دیگری باشد، ۴۰۴
     * برمی‌گردد — نه ۴۰۳. دلیل: ۴۰۳ تأیید می‌کند که آن شناسه
     * وجود دارد و اطلاعات لو می‌دهد.
     */
    private function findOwned(Request $request, int $addressId): Address
    {
        return $request->user()->addresses()->findOrFail($addressId);
    }
}
