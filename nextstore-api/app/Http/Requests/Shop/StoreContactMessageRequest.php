<?php

namespace App\Http\Requests\Shop;

use Illuminate\Foundation\Http\FormRequest;

/**
 * اعتبارسنجی پیام فرم «تماس با ما».
 *
 * ⚠️ این تنها فرم عمومی پروژه است که مهمان هم می‌تواند پرش کند، پس
 *    نام و ایمیل اینجا **اجباری**اند — برخلاف تیکت که فرستنده‌اش از
 *    روی نشست معلوم است. پیامی که نشود جوابش را داد، فقط جا می‌گیرد.
 */
class StoreContactMessageRequest extends FormRequest
{
    /** مسیر عمومی است؛ محدودیت واقعی روی throttle است نه اینجا. */
    public function authorize(): bool
    {
        return true;
    }

    /** قواعد اعتبارسنجی فیلدها. */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:3', 'max:120'],

            /*
             * ⚠️ `email:rfc` و نه `email:rfc,dns`.
             *
             *    بررسی DNS برای هر ارسال یک درخواست شبکه‌ی مسدودکننده
             *    است و در محیط بدون اینترنت (یا با DNS کند) فرم را
             *    بی‌دلیل رد می‌کند. ارزش این سخت‌گیری، به هزینه‌ی
             *    از دست دادن پیام‌های واقعی نمی‌ارزد.
             */
            'email' => ['required', 'string', 'email:rfc', 'max:190'],

            'subject' => ['required', 'string', 'min:3', 'max:190'],

            /*
             * حداقل ۱۰ نویسه — سخت‌گیرانه‌تر از این نه.
             *
             * تیکت حداقل ۲۰ می‌خواهد چون گفتگوی پشتیبانی است. اینجا
             * ممکن است کسی فقط بپرسد «موجود می‌شود؟» و ردکردنش یعنی
             * از دست دادن یک مشتری.
             */
            'message' => ['required', 'string', 'min:10', 'max:5000'],
        ];
    }

    /** پیام‌های خطای محلی‌سازی‌شده. */
    public function messages(): array
    {
        return [
            'name.required' => __('shop.contact_name_required'),
            'name.min' => __('shop.contact_name_short'),
            'email.required' => __('shop.contact_email_required'),
            'email.email' => __('shop.contact_email_invalid'),
            'subject.required' => __('shop.contact_subject_required'),
            'subject.min' => __('shop.contact_subject_short'),
            'message.required' => __('shop.contact_message_required'),
            'message.min' => __('shop.contact_message_short', ['min' => 10]),
        ];
    }
}
