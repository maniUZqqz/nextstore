<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/**
 * اعتبارسنجی تغییر رمز عبور.
 *
 * ⚠️ رمز فعلی الزامی است، حتی با اینکه کاربر از قبل وارد شده.
 *
 *    دلیل: اگر کسی پشت سیستمِ بازِ کاربر بنشیند یا توکنی دزدیده
 *    شده باشد، بدون این بررسی می‌تواند رمز را عوض کند و صاحب
 *    اصلی را برای همیشه بیرون بگذارد. پرسیدن رمز فعلی، پنجره‌ی
 *    آن حمله را می‌بندد.
 */
class UpdatePasswordRequest extends FormRequest
{
    /** مسیر با auth:sanctum محافظت می‌شود. */
    public function authorize(): bool
    {
        return true;
    }

    /** قواعد اعتبارسنجی فیلدها. */
    public function rules(): array
    {
        return [
            /*
             * قاعده‌ی current_password خودش رمز را با هش ذخیره‌شده
             * مقایسه می‌کند — نیازی به بررسی دستی در کنترلر نیست.
             */
            'current_password' => ['required', 'string', 'current_password'],

            'password' => [
                'required',
                'confirmed',
                /*
                 * ⚠️ دقیقاً همان قاعده‌ی RegisterRequest.
                 *
                 *    نسخه‌ی اول uncompromised() را نداشت. نتیجه‌ی آن
                 *    ناسازگاری عجیبی بود: کاربر نمی‌توانست با یک رمز
                 *    لو‌رفته *ثبت‌نام* کند، ولی می‌توانست بعداً رمزش
                 *    را به همان تغییر دهد — یعنی قاعده‌ی ثبت‌نام را
                 *    با دو کلیک دور بزند.
                 *
                 *    اگر روزی این قاعده عوض شد، باید در هر دو جا
                 *    عوض شود.
                 */
                Password::min(8)
                    ->letters()   // حداقل یک حرف
                    ->numbers()   // حداقل یک عدد
                    ->uncompromised(),
                /* رمز جدید نباید همان رمز فعلی باشد */
                'different:current_password',
            ],
        ];
    }

    /** پیام‌های خطای محلی‌سازی‌شده. */
    public function messages(): array
    {
        return [
            'current_password.required' => __('shop.password_current_required'),
            'current_password.current_password' => __('shop.password_current_wrong'),
            'password.required' => __('shop.password_new_required'),
            'password.confirmed' => __('shop.password_mismatch'),
            'password.different' => __('shop.password_same_as_current'),
        ];
    }
}
