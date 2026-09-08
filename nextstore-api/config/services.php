<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
     * فرانت‌اند نکست.
     *
     * پس از هر تغییر کاتالوگ، لاراول مسیر /api/revalidate را روی این
     * آدرس صدا می‌زند تا کش داده‌ی نکست هم باطل شود. بدون این کار،
     * ویرایش ادمین تا یک ساعت در فروشگاه دیده نمی‌شد.
     *
     * هر دو مقدار اختیاری‌اند: اگر تنظیم نشوند، قابلیت خاموش می‌ماند
     * و هیچ خطایی رخ نمی‌دهد.
     */
    'frontend' => [
        'url' => env('FRONTEND_URL'),
        'revalidate_secret' => env('REVALIDATE_SECRET'),
    ],

];
