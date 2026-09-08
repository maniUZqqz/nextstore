<?php

namespace App\Http\Requests\Admin;

use App\Enums\CouponType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * اعتبارسنجی ساخت و ویرایش کد تخفیف.
 * ---------------------------------------------------------------------------
 * ⚠️ همین Request برای هر دو اکشن استفاده می‌شود. تفاوت فقط در قاعده‌ی
 *    یکتایی کد است که با `ignore` روی رکورد در حال ویرایش تنظیم می‌شود —
 *    بدون آن، ذخیره‌ی فرم ویرایش بدون تغییرِ کد، خطای «این کد قبلاً
 *    ثبت شده» می‌داد.
 */
class StoreCouponRequest extends FormRequest
{
    /** مسیر با میدل‌ور admin محافظت می‌شود. */
    public function authorize(): bool
    {
        return true;
    }

    /** قواعد اعتبارسنجی فیلدها. */
    public function rules(): array
    {
        /* در ویرایش، رکورد جاری از قاعده‌ی یکتایی مستثنا می‌شود */
        $couponId = $this->route('coupon')?->id;

        return [
            /*
             * ⚠️ فقط حروف لاتین، عدد، خط تیره و زیرخط.
             *
             *    کد فارسی از نظر فنی کار می‌کند ولی کاربر باید بتواند
             *    آن را از پیامک یا بنر رونویسی کند؛ صفحه‌کلید انگلیسی
             *    پیش‌فرض بیشتر کاربران است و کد فارسی یعنی تعویض زبان
             *    وسط تایپ. ضمناً یکتایی حروف بزرگ/کوچک با
             *    نرمال‌سازی مدل تضمین می‌شود.
             */
            'code' => [
                'required', 'string', 'max:40', 'regex:/^[A-Za-z0-9_-]+$/',
                Rule::unique('coupons', 'code')->ignore($couponId),
            ],

            'description' => ['nullable', 'string', 'max:255'],

            'type' => ['required', Rule::enum(CouponType::class)],

            /*
             * سقف مقدار به نوع وابسته است و در withValidator بررسی
             * می‌شود — اینجا فقط «عدد مثبت» تضمین می‌شود.
             */
            'value' => ['required', 'integer', 'min:1'],

            'max_discount' => ['nullable', 'integer', 'min:0'],
            'min_order_total' => ['nullable', 'integer', 'min:0'],

            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'per_user_limit' => ['required', 'integer', 'min:1', 'max:100'],

            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after:starts_at'],

            'is_active' => ['required', 'boolean'],
        ];
    }

    /** قواعدی که به ترکیب چند فیلد وابسته‌اند. */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $type = $this->input('type');
            $value = (int) $this->input('value');

            /*
             * ⚠️ درصد بیشتر از ۱۰۰ یعنی تخفیف بیشتر از کل سبد.
             *
             *    CouponType::discountFor آن را به جمع سبد محدود می‌کند،
             *    پس سیستم نمی‌شکند — ولی مدیری که «۱۲۰٪» می‌سازد فکر
             *    می‌کند کار می‌کند و بعد نمی‌فهمد چرا تخفیف با انتظارش
             *    نمی‌خواند. جلوگیری در لحظه‌ی ساخت روشن‌تر است.
             */
            if ($type === CouponType::Percent->value && $value > 100) {
                $validator->errors()->add('value', __('shop.coupon_percent_range'));
            }

            /*
             * سقف تخفیف فقط برای نوع درصدی معنا دارد.
             * روی نوع «مبلغ ثابت» یک فیلد بی‌اثر است که مدیر را
             * به این باور می‌رساند که چیزی را محدود کرده.
             */
            if ($type === CouponType::Fixed->value && $this->filled('max_discount')) {
                $validator->errors()->add('max_discount', __('shop.coupon_max_only_percent'));
            }
        });
    }

    /** پیام‌های خطای محلی‌سازی‌شده. */
    public function messages(): array
    {
        return [
            'code.required' => __('shop.coupon_code_required'),
            'code.regex' => __('shop.coupon_code_format'),
            'code.unique' => __('shop.coupon_code_taken'),
            'type.required' => __('shop.coupon_type_required'),
            'value.required' => __('shop.coupon_value_required'),
            'value.min' => __('shop.coupon_value_min'),
            'expires_at.after' => __('shop.coupon_expiry_order'),
            'per_user_limit.required' => __('shop.coupon_per_user_required'),
        ];
    }
}
