<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

/**
 * اعتبارسنجی ثبت سفارش.
 *
 * ⚠️ توجه: مبلغ سفارش عمداً از ورودی گرفته نمی‌شود.
 *    قیمت‌ها در OrderService از دیتابیس خوانده می‌شوند تا کاربر
 *    نتواند با دستکاری درخواست، مبلغ را تغییر دهد.
 */
class PlaceOrderRequest extends FormRequest
{
    /** فقط کاربر واردشده — با میدل‌ور auth:sanctum تضمین شده. */
    public function authorize(): bool
    {
        return true;
    }

    /** قواعد اعتبارسنجی فیلدها. */
    public function rules(): array
    {
        return [
            'address_id' => ['required', 'integer', 'exists:addresses,id'],
            'shipping_method' => ['required', 'string', 'in:standard,express'],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }

    /** پیام‌های خطای محلی‌سازی‌شده. */
    public function messages(): array
    {
        $isFa = app()->getLocale() === 'fa';

        return [
            'address_id.required' => $isFa ? 'انتخاب آدرس تحویل الزامی است' : 'Delivery address is required',
            'address_id.exists' => $isFa ? 'آدرس انتخابی یافت نشد' : 'Selected address not found',
            'shipping_method.in' => $isFa ? 'روش ارسال نامعتبر است' : 'Invalid shipping method',
        ];
    }
}
