<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\BannerPlacement;
use App\Enums\BannerTheme;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBannerRequest;
use App\Http\Resources\AdminBannerResource;
use App\Models\Banner;
use App\Services\Catalog\CacheInvalidator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * مدیریت بنرهای صفحه‌ی اصلی — پنل مدیریت.
 * ---------------------------------------------------------------------------
 * ⚠️ بررسی نقش مدیر با میدل‌ور `admin` روی گروه مسیرها انجام می‌شود،
 *    نه اینجا.
 */
class AdminBannerController extends Controller
{
    public function __construct(
        private readonly CacheInvalidator $cache,
    ) {}

    /**
     * GET /api/v1/admin/banners?placement=hero
     *
     * ⚠️ بدون صفحه‌بندی — و این عمدی است.
     *
     *    بنرها چند قلم‌اند نه چند صد قلم؛ صفحه‌بندی روی فهرستی که
     *    همیشه در یک صفحه جا می‌شود فقط یک کنترل بی‌مصرف اضافه
     *    می‌کند. مهم‌تر: ترتیب بنرها در پنل قابل تغییر است و
     *    جابه‌جایی قلمی که در صفحه‌ی بعد است، کار نشدنی می‌شود.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Banner::query()->ordered();

        if ($placement = $request->query('placement')) {
            $query->where('placement', $placement);
        }

        return AdminBannerResource::collection($query->get())
            ->additional(['meta' => $this->meta()]);
    }

    /** GET /api/v1/admin/banners/{banner} */
    public function show(Banner $banner): JsonResponse
    {
        return (new AdminBannerResource($banner))->response();
    }

    /** POST /api/v1/admin/banners */
    public function store(StoreBannerRequest $request): JsonResponse
    {
        $banner = Banner::query()->create($this->payload($request));

        /*
         * ⚠️ کش صفحه‌ی اصلی سمت **نکست** است، نه لاراول.
         *
         *    بدون این فراخوانی، مدیر بنری می‌ساخت، در پنل می‌دیدش، و
         *    تا نیم ساعت روی صفحه‌ی اصلی خبری از آن نبود — بدون هیچ
         *    توضیحی. همان تله‌ای که یک بار برای کاتالوگ رخ داد.
         */
        $this->cache->flushBanners();

        return (new AdminBannerResource($banner))
            ->additional(['message' => __('shop.banner_created')])
            ->response()
            ->setStatusCode(201);
    }

    /** PUT /api/v1/admin/banners/{banner} */
    public function update(StoreBannerRequest $request, Banner $banner): JsonResponse
    {
        $banner->update($this->payload($request));

        $this->cache->flushBanners();

        return (new AdminBannerResource($banner->fresh()))
            ->additional(['message' => __('shop.banner_updated')])
            ->response();
    }

    /** DELETE /api/v1/admin/banners/{banner} */
    public function destroy(Banner $banner): JsonResponse
    {
        $banner->delete();

        $this->cache->flushBanners();

        return response()->json(['message' => __('shop.banner_deleted')]);
    }

    /**
     * PATCH /api/v1/admin/banners/{banner}/toggle
     *
     * روشن و خاموش کردن سریع — بدون باز کردن فرم.
     *
     * ⚠️ کاری که مدیر بیشتر از هر کار دیگری با بنر می‌کند همین است:
     *    کمپین تمام شد، خاموشش کن. مجبورکردنش به باز کردن فرم کامل
     *    برای یک تیک، همان اصطکاکی است که باعث می‌شود بنر منقضی روی
     *    صفحه بماند.
     */
    public function toggle(Banner $banner): JsonResponse
    {
        $banner->update(['is_active' => ! $banner->is_active]);

        $this->cache->flushBanners();

        return (new AdminBannerResource($banner->fresh()))
            ->additional(['message' => __('shop.banner_updated')])
            ->response();
    }

    /**
     * تبدیل ورودی اعتبارسنجی‌شده به مقادیر ستون‌ها.
     *
     * @return array<string, mixed>
     */
    private function payload(StoreBannerRequest $request): array
    {
        $data = $request->validated();

        /*
         * ⚠️ فیلدهای چندزبانه‌ی خالی به null تبدیل می‌شوند، نه
         *    `['fa' => '', 'en' => '']`.
         *
         *    فرم پنل همیشه هر دو کلید را می‌فرستد، حتی وقتی هر دو
         *    خالی‌اند. اگر همان‌طور ذخیره شود، `translate()` رشته‌ی
         *    خالی برمی‌گرداند و ریسورس آن را «مقدار دارد» می‌بیند —
         *    نتیجه‌اش برچسبی خالی روی بنر بود که فقط فاصله می‌گرفت.
         */
        foreach (['badge', 'subtitle', 'cta_label'] as $field) {
            $value = array_filter($data[$field] ?? [], fn ($text) => filled($text));
            $data[$field] = $value === [] ? null : $value;
        }

        $data['title'] = array_filter($data['title'], fn ($text) => filled($text));

        /*
         * ⚠️ پیش‌فرض‌ها **اینجا** گذاشته می‌شوند، نه فقط در دیتابیس.
         *
         *    ستون‌ها `default(true)` و `default(0)` دارند، ولی مقدار
         *    پیش‌فرضِ دیتابیس در *مدلِ در حافظه* نمی‌نشیند: بعد از
         *    `create()` مقدارشان null است و پاسخ همان null را
         *    برمی‌گرداند.
         *
         *    نتیجه‌ی واقعی‌اش این بود که مدیر بنری می‌ساخت، ردیف در
         *    دیتابیس فعال بود، ولی پنل بلافاصله نشان «خاموش» می‌داد و
         *    ترتیب را خالی. تنها راه دیدن حقیقت، رفرش صفحه بود.
         */
        $data['is_active'] = $data['is_active'] ?? true;
        $data['sort_order'] = $data['sort_order'] ?? 0;

        return $data;
    }

    /**
     * گزینه‌های فرم — جایگاه‌ها و رنگ‌ها با برچسب محلی.
     *
     * ⚠️ همراه *فهرست* فرستاده می‌شود نه در مسیر جدا: فرم بنر همیشه
     *    از دل همان صفحه باز می‌شود، و مسیر جداگانه یعنی یک درخواست
     *    اضافه برای داده‌ای که هرگز عوض نمی‌شود.
     *
     * @return array<string, mixed>
     */
    private function meta(): array
    {
        $locale = app()->getLocale();

        return [
            'placements' => collect(BannerPlacement::cases())
                ->map(fn (BannerPlacement $case) => [
                    'value' => $case->value,
                    'label' => $case->label($locale),
                ])->all(),

            'themes' => collect(BannerTheme::cases())
                ->map(fn (BannerTheme $case) => [
                    'value' => $case->value,
                    'label' => $case->label($locale),
                ])->all(),
        ];
    }
}
