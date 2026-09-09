<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

/**
 * اعتبارسنجی درخواست پیوند بازیابی رمز.
 */
class ForgotPasswordRequest extends FormRequest
{
    /** برای همه آزاد است؛ محافظ واقعی throttle روی مسیر است. */
    public function authorize(): bool
    {
        return true;
    }

    /** قواعد اعتبارسنجی فیلدها. */
    public function rules(): array
    {
        return [
            /*
             * ⚠️ `exists:users,email` عمداً **نیست**.
             *
             *    اگر بود، پاسخ ۴۲۲ برای ایمیل ناموجود و ۲۰۰ برای
             *    موجود می‌آمد — یعنی همین اندپوینت به ابزار شمارش
             *    کاربر تبدیل می‌شد. کنترلر همیشه یک پاسخ می‌دهد و
             *    تفاوت را پنهان می‌کند.
             */
            'email' => ['required', 'string', 'email:rfc', 'max:255'],
        ];
    }

    /** پیام‌های خطای محلی‌سازی‌شده. */
    public function messages(): array
    {
        return [
            'email.required' => __('auth.email_required'),
            'email.email' => __('auth.email_invalid'),
        ];
    }
}
