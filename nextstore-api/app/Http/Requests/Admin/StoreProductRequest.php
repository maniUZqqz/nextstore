<?php

namespace App\Http\Requests\Admin;

use App\Enums\ProductStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * اعتبارسنجی ساخت و ویرایش محصول.
 *
 * ⚠️ فیلدهای چندزبانه به‌صورت آرایه می‌آیند:
 *        name[fa], name[en]
 *    و هر دو زبان الزامی‌اند — محصولی با نام فقط فارسی، در
 *    نسخه‌ی انگلیسی سایت به fallback می‌افتد و ظاهر ناقص می‌سازد.
 */
class StoreProductRequest extends FormRequest
{
    /** دسترسی با میدل‌ور EnsureIsAdmin تضمین شده است. */
    public function authorize(): bool
    {
        return true;
    }

    /** قواعد اعتبارسنجی فیلدها. */
    public function rules(): array
    {
        return [
            /* --- محتوای چندزبانه --- */
            'name' => ['required', 'array'],
            'name.fa' => ['required', 'string', 'min:3', 'max:200'],
            'name.en' => ['required', 'string', 'min:3', 'max:200'],

            'short_description' => ['nullable', 'array'],
            'short_description.fa' => ['nullable', 'string', 'max:500'],
            'short_description.en' => ['nullable', 'string', 'max:500'],

            'description' => ['nullable', 'array'],
            'description.fa' => ['nullable', 'string', 'max:5000'],
            'description.en' => ['nullable', 'string', 'max:5000'],

            /* --- رابطه‌ها --- */
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'brand_id' => ['nullable', 'integer', 'exists:brands,id'],

            /* --- شناسه --- */
            'sku' => [
                'nullable', 'string', 'max:50',
                /* کد کالا باید یکتا باشد، به‌جز خود همین محصول هنگام ویرایش */
                Rule::unique('products', 'sku')->ignore($this->route('product')),
            ],
            'barcode' => ['nullable', 'string', 'max:50'],

            /* --- قیمت (به ریال، عدد صحیح) --- */
            'price' => ['required', 'integer', 'min:1000'],
            'sale_price' => ['nullable', 'integer', 'min:0', 'lt:price'],
            'sale_ends_at' => ['nullable', 'date', 'after:now'],
            'cost_price' => ['nullable', 'integer', 'min:0'],

            /* --- موجودی --- */
            'stock' => ['required', 'integer', 'min:0', 'max:100000'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'allow_backorder' => ['nullable', 'boolean'],

            /* --- مشخصات فیزیکی --- */
            'weight' => ['nullable', 'integer', 'min:0'],

            /* --- وضعیت --- */
            'status' => ['required', Rule::enum(ProductStatus::class)],
            'is_featured' => ['nullable', 'boolean'],
        ];
    }

    /** پیام‌های خطای محلی‌سازی‌شده. */
    public function messages(): array
    {
        $isFa = app()->getLocale() === 'fa';

        return [
            'name.fa.required' => $isFa ? 'نام فارسی محصول الزامی است' : 'Persian name is required',
            'name.en.required' => $isFa ? 'نام انگلیسی محصول الزامی است' : 'English name is required',
            'price.required' => $isFa ? 'قیمت محصول الزامی است' : 'Price is required',
            'price.min' => $isFa ? 'قیمت باید حداقل ۱۰۰۰ ریال باشد' : 'Price must be at least 1000',
            'sale_price.lt' => $isFa ? 'قیمت تخفیف باید کمتر از قیمت اصلی باشد' : 'Sale price must be lower than the price',
            'sale_ends_at.after' => $isFa ? 'پایان تخفیف باید در آینده باشد' : 'Sale end must be in the future',
            'stock.required' => $isFa ? 'تعداد موجودی الزامی است' : 'Stock is required',
            'status.required' => $isFa ? 'وضعیت انتشار الزامی است' : 'Status is required',
        ];
    }
}
