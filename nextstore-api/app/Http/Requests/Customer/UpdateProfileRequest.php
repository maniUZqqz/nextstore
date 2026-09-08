<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * اعتبارسنجی ویرایش پروفایل کاربر.
 *
 * ⚠️ نقش (role) و وضعیت فعال بودن عمداً اینجا نیستند.
 *    اگر بودند، کاربر می‌توانست با فرستادن role=admin در بدنه‌ی
 *    همین درخواست خودش را مدیر کند. تغییر نقش فقط از پنل مدیریت
 *    ممکن است.
 */
class UpdateProfileRequest extends FormRequest
{
    /** مسیر با auth:sanctum محافظت می‌شود. */
    public function authorize(): bool
    {
        return true;
    }

    /** قواعد اعتبارسنجی فیلدها. */
    public function rules(): array
    {
        $userId = $this->user()->id;

        return [
            'name' => ['required', 'string', 'min:3', 'max:120'],

            /*
             * ایمیل و موبایل باید یکتا بمانند، ولی رکورد خودِ کاربر
             * از بررسی کنار گذاشته می‌شود — وگرنه ذخیره‌ی فرم بدون
             * تغییر ایمیل، با خطای «این ایمیل قبلاً ثبت شده» رد می‌شود.
             */
            'email' => [
                'required',
                'email:rfc',
                'max:190',
                Rule::unique('users', 'email')->ignore($userId),
            ],

            'phone' => [
                'nullable',
                'string',
                /* موبایل ایران: ۱۱ رقم با پیش‌شماره ۰۹ */
                'regex:/^09\d{9}$/',
                Rule::unique('users', 'phone')->ignore($userId),
            ],

            'birth_date' => ['nullable', 'date', 'before:today'],
        ];
    }

    /** پیام‌های خطای محلی‌سازی‌شده. */
    public function messages(): array
    {
        return [
            'name.required' => __('shop.profile_name_required'),
            'name.min' => __('shop.profile_name_short'),
            'email.required' => __('shop.profile_email_required'),
            'email.email' => __('shop.profile_email_invalid'),
            'email.unique' => __('shop.profile_email_taken'),
            'phone.regex' => __('shop.profile_phone_invalid'),
            'phone.unique' => __('shop.profile_phone_taken'),
            'birth_date.before' => __('shop.profile_birth_future'),
        ];
    }
}
