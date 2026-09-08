<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/**
 * اعتبارسنجی درخواست ثبت‌نام.
 *
 * قواعد امنیتی رعایت‌شده:
 *   - رمز عبور حداقل ۸ کاراکتر با حروف و عدد
 *   - بررسی رمز در برابر پایگاه‌داده رمزهای لو رفته
 *   - ایمیل باید یکتا باشد
 *   - شماره موبایل با الگوی ایران اعتبارسنجی می‌شود
 */
class RegisterRequest extends FormRequest
{
    /** ثبت‌نام برای همه آزاد است. */
    public function authorize(): bool
    {
        return true;
    }

    /** قواعد اعتبارسنجی فیلدها. */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:3', 'max:100'],

            'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email'],

            /*
             * شماره موبایل ایران: با ۰۹ شروع می‌شود و ۱۱ رقم است.
             * اختیاری است تا کاربر بتواند فقط با ایمیل ثبت‌نام کند.
             */
            'phone' => ['nullable', 'string', 'regex:/^09\d{9}$/', 'unique:users,phone'],

            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->letters()   // حداقل یک حرف
                    ->numbers()   // حداقل یک عدد
                    /*
                     * بررسی در برابر پایگاه‌داده رمزهای لو رفته (Have I Been Pwned).
                     * اگر رمز کاربر در نشت‌های قبلی بوده، پذیرفته نمی‌شود.
                     * درخواست به‌صورت k-anonymity ارسال می‌شود، پس خود رمز
                     * هرگز به سرویس بیرونی نمی‌رود.
                     */
                    ->uncompromised(),
            ],

            /** پذیرش قوانین — الزامی */
            'accept_terms' => ['accepted'],
        ];
    }

    /** پیام‌های خطای محلی‌سازی‌شده. */
    public function messages(): array
    {
        $isFa = app()->getLocale() === 'fa';

        return [
            'name.required' => $isFa ? 'نام و نام خانوادگی الزامی است' : 'Name is required',
            'name.min' => $isFa ? 'نام باید حداقل ۳ حرف باشد' : 'Name must be at least 3 characters',
            'email.required' => $isFa ? 'ایمیل الزامی است' : 'Email is required',
            'email.email' => $isFa ? 'قالب ایمیل معتبر نیست' : 'Invalid email format',
            'email.unique' => $isFa ? 'این ایمیل قبلاً ثبت شده است' : 'This email is already registered',
            'phone.regex' => $isFa ? 'شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد' : 'Phone must start with 09 and be 11 digits',
            'phone.unique' => $isFa ? 'این شماره قبلاً ثبت شده است' : 'This phone is already registered',
            'password.required' => $isFa ? 'رمز عبور الزامی است' : 'Password is required',
            'password.confirmed' => $isFa ? 'تکرار رمز عبور مطابقت ندارد' : 'Password confirmation does not match',
            'password.uncompromised' => $isFa
                ? 'این رمز عبور در نشت‌های اطلاعاتی دیده شده، رمز دیگری انتخاب کنید'
                : 'This password has appeared in a data breach, please choose another',
            'accept_terms.accepted' => $isFa ? 'پذیرش قوانین الزامی است' : 'You must accept the terms',
        ];
    }
}
