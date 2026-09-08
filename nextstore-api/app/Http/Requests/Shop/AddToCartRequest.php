<?php

namespace App\Http\Requests\Shop;

use Illuminate\Foundation\Http\FormRequest;

/**
 * اعتبارسنجی درخواست «افزودن محصول به سبد خرید».
 *
 * ⚠️ این کلاس فقط *شکل* داده ورودی را بررسی می‌کند.
 *    بررسی موجودی انبار در CartService انجام می‌شود، چون آن
 *    یک قاعده‌ی تجاری است نه یک قاعده‌ی اعتبارسنجی ورودی.
 */
class AddToCartRequest extends FormRequest
{
    /** افزودن به سبد برای همه (حتی مهمان) آزاد است. */
    public function authorize(): bool
    {
        return true;
    }

    /** قواعد اعتبارسنجی فیلدها. */
    public function rules(): array
    {
        return [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            /* حداکثر ۱۰ عدد در هر بار — جلوگیری از سوءاستفاده */
            'quantity' => ['required', 'integer', 'min:1', 'max:10'],
        ];
    }

    /** پیام‌های خطای محلی‌سازی‌شده. */
    public function messages(): array
    {
        return [
            'product_id.required' => __('shop.product_required'),
            'product_id.exists' => __('shop.product_not_found'),
            'quantity.max' => __('shop.quantity_max', ['max' => 10]),
        ];
    }
}
