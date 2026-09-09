<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/**
 * اعتبارسنجی بازنشانی رمز با توکن.
 */
class ResetPasswordRequest extends FormRequest
{
    /** توکن خودش نقش مجوز را دارد. */
    public function authorize(): bool
    {
        return true;
    }

    /** قواعد اعتبارسنجی فیلدها. */
    public function rules(): array
    {
        return [
            'token' => ['required', 'string'],
            'email' => ['required', 'string', 'email:rfc'],

            /*
             * ⚠️ همان سخت‌گیری ثبت‌نام، نه کمتر.
             *
             *    رمزی که از راه بازیابی گذاشته می‌شود دقیقاً همان
             *    اعتباری را می‌دهد که رمز اولیه. اگر اینجا قواعد
             *    ساده‌تر بود، بازیابی رمز به راه فرار از سیاست رمز
             *    تبدیل می‌شد.
             */
            'password' => [
                'required',
                'confirmed',
                Password::min(8)->letters()->numbers()->uncompromised(),
            ],
        ];
    }

    /** پیام‌های خطای محلی‌سازی‌شده. */
    public function messages(): array
    {
        return [
            'token.required' => __('auth.reset_token_missing'),
            'email.required' => __('auth.email_required'),
            'email.email' => __('auth.email_invalid'),
            'password.required' => __('auth.password_required'),
            'password.confirmed' => __('auth.password_mismatch'),
        ];
    }
}
