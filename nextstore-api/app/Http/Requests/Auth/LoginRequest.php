<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

/**
 * اعتبارسنجی درخواست ورود.
 *
 * ⚠️ نکته امنیتی: اینجا فقط *شکل* ورودی بررسی می‌شود.
 *    بررسی درستی رمز عبور در AuthService انجام می‌شود، و پیام خطای
 *    آن عمداً مبهم است («ایمیل یا رمز عبور اشتباه است») تا مهاجم
 *    نفهمد کدام ایمیل در سیستم ثبت شده است (User Enumeration).
 */
class LoginRequest extends FormRequest
{
    /** ورود برای همه آزاد است. */
    public function authorize(): bool
    {
        return true;
    }

    /** قواعد اعتبارسنجی فیلدها. */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email:rfc'],
            'password' => ['required', 'string'],

            /**
             * «مرا به خاطر بسپار».
             * اگر true باشد توکن بدون انقضا صادر می‌شود، وگرنه
             * توکن پس از ۲۴ ساعت منقضی می‌شود.
             */
            'remember' => ['nullable', 'boolean'],
        ];
    }

    /** پیام‌های خطای محلی‌سازی‌شده. */
    public function messages(): array
    {
        $isFa = app()->getLocale() === 'fa';

        return [
            'email.required' => $isFa ? 'ایمیل الزامی است' : 'Email is required',
            'email.email' => $isFa ? 'قالب ایمیل معتبر نیست' : 'Invalid email format',
            'password.required' => $isFa ? 'رمز عبور الزامی است' : 'Password is required',
        ];
    }
}
