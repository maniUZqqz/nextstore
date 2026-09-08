<?php

namespace App\Http\Requests\Support;

use App\Enums\TicketDepartment;
use App\Enums\TicketPriority;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * اعتبارسنجی ثبت تیکت تازه.
 */
class StoreTicketRequest extends FormRequest
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
            'subject' => ['required', 'string', 'min:5', 'max:150'],

            /*
             * متن با حداقل ۲۰ نویسه.
             * تیکتی با متن «کار نمی‌کنه» یک رفت‌وبرگشت اضافه به
             * پشتیبانی تحمیل می‌کند تا بپرسد «چه چیزی؟».
             */
            'body' => ['required', 'string', 'min:20', 'max:5000'],

            'department' => ['required', Rule::enum(TicketDepartment::class)],
            'priority' => ['required', Rule::enum(TicketPriority::class)],

            /*
             * سفارش مرتبط.
             *
             * ⚠️ فقط سفارش‌های خودِ کاربر پذیرفته می‌شوند. بدون این
             *    شرط، کاربر می‌توانست با حدس زدن شناسه، تیکتی به
             *    سفارش دیگری بچسباند و از پاسخ پشتیبانی اطلاعات آن
             *    سفارش را بیرون بکشد.
             */
            'order_id' => [
                'nullable',
                'integer',
                Rule::exists('orders', 'id')->where('user_id', $this->user()->id),
            ],
        ];
    }

    /** پیام‌های خطای محلی‌سازی‌شده. */
    public function messages(): array
    {
        return [
            'subject.required' => __('shop.ticket_subject_required'),
            'subject.min' => __('shop.ticket_subject_short'),
            'body.required' => __('shop.ticket_body_required'),
            'body.min' => __('shop.ticket_body_short', ['min' => 20]),
            'department.required' => __('shop.ticket_department_required'),
            'department.Illuminate\Validation\Rules\Enum' => __('shop.ticket_department_invalid'),
            'priority.required' => __('shop.ticket_priority_required'),
            'priority.Illuminate\Validation\Rules\Enum' => __('shop.ticket_priority_invalid'),
            'order_id.exists' => __('shop.ticket_order_invalid'),
        ];
    }
}
