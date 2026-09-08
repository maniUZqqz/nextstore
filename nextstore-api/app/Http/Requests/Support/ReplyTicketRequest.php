<?php

namespace App\Http\Requests\Support;

use Illuminate\Foundation\Http\FormRequest;

/**
 * اعتبارسنجی پاسخ به تیکت.
 *
 * ⚠️ حداقل طول پیام اینجا کمتر از ثبت تیکت است (۲ در برابر ۲۰).
 *    پاسخ کوتاه مثل «ممنون» یا «بله» کاملاً معتبر است؛ آنچه در
 *    پیام *اول* بی‌فایده بود، در ادامه‌ی گفتگو طبیعی است.
 */
class ReplyTicketRequest extends FormRequest
{
    /** بررسی مالکیت در کنترلر انجام می‌شود. */
    public function authorize(): bool
    {
        return true;
    }

    /** قواعد اعتبارسنجی فیلدها. */
    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'min:2', 'max:5000'],
        ];
    }

    /** پیام‌های خطای محلی‌سازی‌شده. */
    public function messages(): array
    {
        return [
            'body.required' => __('shop.ticket_reply_required'),
        ];
    }
}
