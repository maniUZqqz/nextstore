<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * اعتبارسنجی ساخت و ویرایش دسته‌بندی در پنل مدیریت.
 *
 * همین یک کلاس هر دو حالت را پوشش می‌دهد؛ تفاوتشان در قاعده‌ی
 * یکتایی نامک است که هنگام ویرایش باید خودِ دسته را نادیده بگیرد.
 */
class StoreCategoryRequest extends FormRequest
{
    /** دسترسی با میدل‌ور admin روی گروه مسیرها بررسی می‌شود. */
    public function authorize(): bool
    {
        return true;
    }

    /** قواعد اعتبارسنجی فیلدها. */
    public function rules(): array
    {
        $category = $this->route('category');
        $categoryId = is_object($category) ? $category->id : $category;

        return [
            /* --- محتوای دوزبانه --- */
            'name' => ['required', 'array'],
            'name.fa' => ['required', 'string', 'min:2', 'max:120'],
            'name.en' => ['required', 'string', 'min:2', 'max:120'],

            'description' => ['nullable', 'array'],
            'description.fa' => ['nullable', 'string', 'max:1000'],
            'description.en' => ['nullable', 'string', 'max:1000'],

            'meta_title' => ['nullable', 'array'],
            'meta_title.fa' => ['nullable', 'string', 'max:160'],
            'meta_title.en' => ['nullable', 'string', 'max:160'],

            'meta_description' => ['nullable', 'array'],
            'meta_description.fa' => ['nullable', 'string', 'max:320'],
            'meta_description.en' => ['nullable', 'string', 'max:320'],

            /*
             * دسته‌ی والد.
             *
             * ⚠️ بررسی «والد خودش نباشد» اینجا انجام می‌شود، ولی
             *    تشخیص حلقه‌ی عمیق‌تر (الف والدِ ب و ب والدِ الف) در
             *    کنترلر است — چون به پیمایش زنجیره نیاز دارد و
             *    قواعد اعتبارسنجی جای مناسبی برایش نیست.
             */
            'parent_id' => [
                'nullable',
                'integer',
                Rule::exists('categories', 'id'),
                Rule::notIn([$categoryId]),
            ],

            'slug' => [
                'nullable',
                'string',
                'max:150',
                /* فقط حروف کوچک لاتین، عدد و خط تیره — نامک باید در URL امن باشد */
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('categories', 'slug')->ignore($categoryId),
            ],

            'icon' => ['nullable', 'string', 'max:60'],
            'image' => ['nullable', 'string', 'max:255'],

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
            'name.fa.required' => $isFa ? 'نام فارسی دسته الزامی است' : 'Persian name is required',
            'name.en.required' => $isFa ? 'نام انگلیسی دسته الزامی است' : 'English name is required',
            'parent_id.not_in' => $isFa
                ? 'یک دسته نمی‌تواند والد خودش باشد'
                : 'A category cannot be its own parent',
            'parent_id.exists' => $isFa ? 'دسته والد یافت نشد' : 'The parent category was not found',
            'slug.regex' => $isFa
                ? 'نامک فقط می‌تواند حروف کوچک انگلیسی، عدد و خط تیره داشته باشد'
                : 'The slug may contain lowercase letters, digits and hyphens only',
            'slug.unique' => $isFa ? 'این نامک قبلاً استفاده شده است' : 'This slug is already taken',
        ];
    }
}
