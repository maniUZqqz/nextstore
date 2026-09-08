<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * اعتبارسنجی ساخت و ویرایش برند در پنل مدیریت.
 */
class StoreBrandRequest extends FormRequest
{
    /** دسترسی با میدل‌ور admin روی گروه مسیرها بررسی می‌شود. */
    public function authorize(): bool
    {
        return true;
    }

    /** قواعد اعتبارسنجی فیلدها. */
    public function rules(): array
    {
        $brand = $this->route('brand');
        $brandId = is_object($brand) ? $brand->id : $brand;

        return [
            /* --- محتوای دوزبانه --- */
            'name' => ['required', 'array'],
            'name.fa' => ['required', 'string', 'min:2', 'max:120'],
            'name.en' => ['required', 'string', 'min:2', 'max:120'],

            'description' => ['nullable', 'array'],
            'description.fa' => ['nullable', 'string', 'max:1000'],
            'description.en' => ['nullable', 'string', 'max:1000'],

            'slug' => [
                'nullable',
                'string',
                'max:150',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('brands', 'slug')->ignore($brandId),
            ],

            'logo' => ['nullable', 'string', 'max:255'],

            /*
             * آدرس وب‌سایت.
             * فقط http و https پذیرفته می‌شوند — بدون این محدودیت،
             * یک آدرس javascript: در صفحه‌ی عمومی برند به بردار XSS
             * تبدیل می‌شود.
             */
            'website' => ['nullable', 'url:http,https', 'max:255'],

            /* کد کشور طبق ISO 3166-1 alpha-2، مثلاً IR یا US */
            'country_code' => ['nullable', 'string', 'size:2', 'regex:/^[A-Za-z]{2}$/'],

            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'is_active' => ['nullable', 'boolean'],
            'is_featured' => ['nullable', 'boolean'],
        ];
    }

    /** پیام‌های خطای محلی‌سازی‌شده. */
    public function messages(): array
    {
        $isFa = app()->getLocale() === 'fa';

        return [
            'name.fa.required' => $isFa ? 'نام فارسی برند الزامی است' : 'Persian name is required',
            'name.en.required' => $isFa ? 'نام انگلیسی برند الزامی است' : 'English name is required',
            'website.url' => $isFa
                ? 'آدرس وب‌سایت باید با http یا https شروع شود'
                : 'The website must start with http or https',
            'country_code.size' => $isFa
                ? 'کد کشور باید دو حرف باشد (مثلاً IR)'
                : 'The country code must be two letters (for example IR)',
            'slug.regex' => $isFa
                ? 'نامک فقط می‌تواند حروف کوچک انگلیسی، عدد و خط تیره داشته باشد'
                : 'The slug may contain lowercase letters, digits and hyphens only',
            'slug.unique' => $isFa ? 'این نامک قبلاً استفاده شده است' : 'This slug is already taken',
        ];
    }
}
