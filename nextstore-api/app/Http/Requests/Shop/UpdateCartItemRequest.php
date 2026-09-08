<?php

namespace App\Http\Requests\Shop;

use Illuminate\Foundation\Http\FormRequest;

/**
 * اعتبارسنجی درخواست «تغییر تعداد یک قلم در سبد».
 *
 * تعداد صفر مجاز است و به معنای حذف آن قلم است — این کار
 * فرانت‌اند را ساده می‌کند: با یک اندپوینت هم کم کردن و هم حذف.
 */
class UpdateCartItemRequest extends FormRequest
{
    /** بررسی مالکیت سبد در سرویس انجام می‌شود. */
    public function authorize(): bool
    {
        return true;
    }

    /** قواعد اعتبارسنجی فیلدها. */
    public function rules(): array
    {
        return [
            'quantity' => ['required', 'integer', 'min:0', 'max:10'],
        ];
    }

    /** پیام‌های خطای محلی‌سازی‌شده. */
    public function messages(): array
    {
        return [
            'quantity.max' => __('shop.quantity_max', ['max' => 10]),
        ];
    }
}
