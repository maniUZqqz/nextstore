<?php

namespace App\Http\Requests\Shop;

use Illuminate\Foundation\Http\FormRequest;

/**
 * اعتبارسنجی عضویت در خبرنامه.
 *
 * ⚠️ برخلاف فرم تماس، اینجا `unique` روی ایمیل بررسی **نمی‌شود**.
 *
 *    اگر می‌شد، کسی که قبلاً عضو است خطای «این ایمیل قبلاً ثبت شده»
 *    می‌گرفت — که هم بی‌فایده است (کاری از دستش برنمی‌آید) و هم
 *    نشت اطلاعات است: هر کسی می‌توانست با امتحان‌کردن ایمیل‌ها
 *    بفهمد چه کسانی مشترک‌اند. کنترلر به‌جایش عضویت موجود را
 *    برمی‌گرداند و همان پاسخ موفق را می‌دهد.
 */
class SubscribeNewsletterRequest extends FormRequest
{
    /** مسیر عمومی است؛ محدودیت واقعی روی throttle است نه اینجا. */
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            /* `email:rfc` و نه `rfc,dns` — به همان دلیل فرم تماس */
            'email' => ['required', 'string', 'email:rfc', 'max:190'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'email.required' => __('shop.newsletter_email_required'),
            'email.email' => __('shop.newsletter_email_invalid'),
            'email.max' => __('shop.newsletter_email_invalid'),
        ];
    }
}
