<?php

namespace App\Http\Requests\Admin;

use App\Enums\BannerPlacement;
use App\Enums\BannerTheme;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * اعتبارسنجی ساخت و ویرایش بنر.
 */
class StoreBannerRequest extends FormRequest
{
    /** مسیر با میدل‌ور `admin` محافظت می‌شود. */
    public function authorize(): bool
    {
        return true;
    }

    /** قواعد اعتبارسنجی فیلدها. */
    public function rules(): array
    {
        return [
            'placement' => ['required', Rule::enum(BannerPlacement::class)],
            'theme' => ['required', Rule::enum(BannerTheme::class)],

            /*
             * عنوان فارسی اجباری است، انگلیسی نه.
             *
             * ⚠️ اجباری‌کردن هر دو زبان یعنی مدیری که فقط فارسی
             *    می‌نویسد نمی‌تواند بنری بسازد. تِرِیت `HasTranslations`
             *    خودش به زبان پیش‌فرض برمی‌گردد، پس کاربر انگلیسی
             *    متن فارسی می‌بیند — که از هیچ بهتر است.
             */
            'title' => ['required', 'array'],
            'title.fa' => ['required', 'string', 'max:120'],
            'title.en' => ['nullable', 'string', 'max:120'],

            'badge' => ['nullable', 'array'],
            'badge.fa' => ['nullable', 'string', 'max:40'],
            'badge.en' => ['nullable', 'string', 'max:40'],

            'subtitle' => ['nullable', 'array'],
            'subtitle.fa' => ['nullable', 'string', 'max:180'],
            'subtitle.en' => ['nullable', 'string', 'max:180'],

            'cta_label' => ['nullable', 'array'],
            'cta_label.fa' => ['nullable', 'string', 'max:40'],
            'cta_label.en' => ['nullable', 'string', 'max:40'],

            /*
             * مقصد — فقط مسیر داخلی.
             *
             * ⚠️ باید با «/» شروع شود و نه با «//» یا یک طرح.
             *
             *    بدون این شرط، مدیری (یا کسی که به حسابش رسیده) می‌توانست
             *    «https://evil.example» بگذارد و بنر صفحه‌ی اصلی، بازدیدکننده
             *    را به بیرون بفرستد. «//evil.example» هم همان کار را
             *    می‌کند بی‌آنکه شبیه نشانی کامل باشد — به همین دلیل
             *    جداگانه رد می‌شود.
             */
            'href' => ['required', 'string', 'max:255', 'regex:#^/(?!/)[^\s]*$#'],

            'icon' => ['nullable', 'string', 'max:40', 'regex:/^[a-z0-9-]+$/'],

            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999'],
            'is_active' => ['nullable', 'boolean'],

            'starts_at' => ['nullable', 'date'],
            /*
             * پایان باید بعد از شروع باشد.
             *
             * ⚠️ `after` و نه `after_or_equal`: بنری که در همان ثانیه
             *    شروع و تمام شود هرگز دیده نمی‌شود، و مدیر بی‌آنکه
             *    بفهمد چرا، منتظر بنری می‌ماند که هیچ‌وقت نمی‌آید.
             */
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
        ];
    }

    /** پیام‌های خطای محلی‌سازی‌شده. */
    public function messages(): array
    {
        return [
            'title.fa.required' => __('shop.banner_title_required'),
            'href.required' => __('shop.banner_href_required'),
            'href.regex' => __('shop.banner_href_internal'),
            'icon.regex' => __('shop.banner_icon_invalid'),
            'ends_at.after' => __('shop.banner_date_order'),
        ];
    }
}
