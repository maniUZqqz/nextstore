<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * اعتبارسنجی ساخت و ویرایش مقاله در پنل مدیریت.
 *
 * همین یک کلاس هر دو حالت را پوشش می‌دهد؛ تفاوتشان فقط در قاعده‌ی
 * یکتایی نامک است که هنگام ویرایش باید خودِ مقاله را نادیده بگیرد.
 */
class StorePostRequest extends FormRequest
{
    /** دسترسی با میدل‌ور admin روی گروه مسیرها بررسی می‌شود. */
    public function authorize(): bool
    {
        return true;
    }

    /** قواعد اعتبارسنجی فیلدها. */
    public function rules(): array
    {
        /*
         * هنگام ویرایش، مقاله‌ی جاری از بررسی یکتایی نامک کنار
         * گذاشته می‌شود — وگرنه ذخیره‌ی فرم بدون تغییر نامک، با
         * خطای «این نامک قبلاً استفاده شده» رد می‌شود.
         */
        $post = $this->route('post');
        $postId = is_object($post) ? $post->id : $post;

        return [
            /* --- محتوای دوزبانه --- */
            'title' => ['required', 'array'],
            'title.fa' => ['required', 'string', 'min:3', 'max:200'],
            'title.en' => ['required', 'string', 'min:3', 'max:200'],

            'excerpt' => ['nullable', 'array'],
            'excerpt.fa' => ['nullable', 'string', 'max:500'],
            'excerpt.en' => ['nullable', 'string', 'max:500'],

            /*
             * بدنه HTML است و سقفش بالا. اعتبارسنجی محتوای HTML
             * اینجا انجام نمی‌شود — پاک‌سازی وظیفه‌ی لایه‌ی نمایش
             * است و در PostService انجام می‌شود.
             */
            'body' => ['required', 'array'],
            'body.fa' => ['required', 'string', 'min:20', 'max:60000'],
            'body.en' => ['required', 'string', 'min:20', 'max:60000'],

            /* --- شناسه‌ها --- */
            'post_category_id' => ['required', 'integer', 'exists:post_categories,id'],

            'slug' => [
                'nullable',
                'string',
                'max:200',
                /* فقط حروف کوچک لاتین، عدد و خط تیره — نامک باید در URL امن باشد */
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('posts', 'slug')->ignore($postId),
            ],

            'author_name' => ['nullable', 'string', 'max:120'],
            'cover_image' => ['nullable', 'string', 'max:255'],

            /* --- انتشار --- */
            'is_featured' => ['nullable', 'boolean'],

            /*
             * تهی بودن یعنی پیش‌نویس؛ تاریخ آینده یعنی زمان‌بندی‌شده.
             * هیچ‌کدام خطا نیست، پس فقط «تاریخ معتبر» بررسی می‌شود.
             */
            'published_at' => ['nullable', 'date'],
        ];
    }

    /** پیام‌های خطای محلی‌سازی‌شده. */
    public function messages(): array
    {
        $isFa = app()->getLocale() === 'fa';

        return [
            'title.fa.required' => $isFa ? 'عنوان فارسی الزامی است' : 'Persian title is required',
            'title.en.required' => $isFa ? 'عنوان انگلیسی الزامی است' : 'English title is required',
            'body.fa.required' => $isFa ? 'متن فارسی الزامی است' : 'Persian body is required',
            'body.en.required' => $isFa ? 'متن انگلیسی الزامی است' : 'English body is required',
            'body.fa.min' => $isFa ? 'متن فارسی خیلی کوتاه است' : 'Persian body is too short',
            'body.en.min' => $isFa ? 'متن انگلیسی خیلی کوتاه است' : 'English body is too short',
            'post_category_id.required' => $isFa ? 'انتخاب دسته الزامی است' : 'A category is required',
            'slug.regex' => $isFa
                ? 'نامک فقط می‌تواند حروف کوچک انگلیسی، عدد و خط تیره داشته باشد'
                : 'The slug may contain lowercase letters, digits and hyphens only',
            'slug.unique' => $isFa ? 'این نامک قبلاً استفاده شده است' : 'This slug is already taken',
        ];
    }
}
