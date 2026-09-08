<?php

namespace App\Http\Requests\Shop;

use Illuminate\Foundation\Http\FormRequest;

/**
 * اعتبارسنجی درخواست «ثبت نظر برای محصول».
 *
 * ⚠️ این کلاس فقط *شکل* داده ورودی را بررسی می‌کند.
 *    قاعده‌ی «هر کاربر یک نظر برای هر محصول» در ReviewService
 *    بررسی می‌شود، چون یک قاعده‌ی تجاری است نه شکلی — و ضمانت
 *    نهایی‌اش کلید یکتای دیتابیس است.
 */
class StoreReviewRequest extends FormRequest
{
    /** ثبت نظر نیازمند ورود است؛ خود مسیر با auth:sanctum محافظت می‌شود. */
    public function authorize(): bool
    {
        return true;
    }

    /** قواعد اعتبارسنجی فیلدها. */
    public function rules(): array
    {
        return [
            'rating' => ['required', 'integer', 'min:1', 'max:5'],

            'title' => ['nullable', 'string', 'max:120'],

            /*
             * حداقل ۱۰ کاراکتر برای متن.
             * نظر «خوب بود» چیزی به خریدار بعدی اضافه نمی‌کند و
             * فقط صف تعدیل را شلوغ می‌کند. متن کلاً اختیاری است،
             * ولی اگر نوشته شود باید معنادار باشد.
             */
            'comment' => ['nullable', 'string', 'min:10', 'max:2000'],

            /*
             * حداکثر ۵ مورد، هرکدام کوتاه — تا فهرست به متن بلند تبدیل نشود.
             *
             * ⚠️ چرا تک‌تک عناصر nullable هستند؟
             *    فرم ثبت نظر چند فیلد خالی «نقطه‌ی مثبت» نشان می‌دهد و
             *    کاربر معمولاً دو تا را پر می‌کند. میدل‌ور پیش‌فرض
             *    لاراول (TrimStrings + ConvertEmptyStringsToNull) آن
             *    فیلدهای خالی را به null تبدیل می‌کند و قاعده‌ی خشکِ
             *    string با پیام بی‌معنای «فیلد pros.2 باید رشته باشد»
             *    کل ثبت را رد می‌کرد.
             *
             *    حالا مقدار تهی پذیرفته و در ReviewService حذف می‌شود.
             */
            'pros' => ['nullable', 'array', 'max:5'],
            'pros.*' => ['nullable', 'string', 'max:80'],
            'cons' => ['nullable', 'array', 'max:5'],
            'cons.*' => ['nullable', 'string', 'max:80'],
        ];
    }

    /** پیام‌های خطای محلی‌سازی‌شده. */
    public function messages(): array
    {
        return [
            'rating.required' => __('shop.review_rating_required'),
            'rating.min' => __('shop.review_rating_range'),
            'rating.max' => __('shop.review_rating_range'),
            'comment.min' => __('shop.review_comment_short', ['min' => 10]),
        ];
    }
}
