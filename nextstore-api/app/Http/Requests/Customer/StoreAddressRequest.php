<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

/**
 * اعتبارسنجی ثبت و ویرایش آدرس.
 */
class StoreAddressRequest extends FormRequest
{
    /** مالکیت آدرس در کنترلر بررسی می‌شود. */
    public function authorize(): bool
    {
        return true;
    }

    /** قواعد اعتبارسنجی فیلدها. */
    public function rules(): array
    {
        return [
            'label' => ['nullable', 'string', 'max:50'],

            'recipient_name' => ['required', 'string', 'min:3', 'max:100'],
            /* شماره موبایل ایران: با ۰۹ شروع و ۱۱ رقم */
            'recipient_phone' => ['required', 'string', 'regex:/^09\d{9}$/'],

            'province' => ['required', 'string', 'max:50'],
            'city' => ['required', 'string', 'max:50'],
            'street' => ['required', 'string', 'min:10', 'max:500'],

            /* کد پستی ایران دقیقاً ۱۰ رقم است */
            'postal_code' => ['nullable', 'string', 'regex:/^\d{10}$/'],

            'building_no' => ['nullable', 'string', 'max:20'],
            'unit' => ['nullable', 'string', 'max:20'],

            'is_default' => ['nullable', 'boolean'],
        ];
    }

    /** پیام‌های خطای محلی‌سازی‌شده. */
    public function messages(): array
    {
        $isFa = app()->getLocale() === 'fa';

        return [
            'recipient_name.required' => $isFa ? 'نام گیرنده الزامی است' : 'Recipient name is required',
            'recipient_name.min' => $isFa ? 'نام گیرنده باید حداقل ۳ حرف باشد' : 'Recipient name must be at least 3 characters',
            'recipient_phone.required' => $isFa ? 'شماره تماس گیرنده الزامی است' : 'Recipient phone is required',
            'recipient_phone.regex' => $isFa ? 'شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد' : 'Phone must start with 09 and be 11 digits',
            'province.required' => $isFa ? 'انتخاب استان الزامی است' : 'Province is required',
            'city.required' => $isFa ? 'انتخاب شهر الزامی است' : 'City is required',
            'street.required' => $isFa ? 'نشانی پستی الزامی است' : 'Street address is required',
            'street.min' => $isFa ? 'نشانی باید کامل‌تر نوشته شود' : 'Address is too short',
            'postal_code.regex' => $isFa ? 'کد پستی باید دقیقاً ۱۰ رقم باشد' : 'Postal code must be exactly 10 digits',
        ];
    }
}
