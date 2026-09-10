<?php

namespace App\Http\Controllers\Api\V1\Shop;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shop\SubscribeNewsletterRequest;
use App\Models\NewsletterSubscription;
use Illuminate\Http\JsonResponse;

/**
 * عضویت و لغو عضویت خبرنامه.
 * ---------------------------------------------------------------------------
 * ⚠️ مسیر عمومی است — فرم در پای همه‌ی صفحه‌هاست و ورود نمی‌خواهد.
 *    محافظ در برابر سیل ثبت‌نام، `throttle:contact` روی مسیر است؛
 *    همان سقفی که فرم تماس دارد، چون هر دو یک جنس سوءاستفاده را
 *    جذب می‌کنند.
 */
class NewsletterController extends Controller
{
    /**
     * ثبت عضویت — یا فعال‌کردن دوباره‌ی عضویتی که لغو شده بود.
     *
     * ⚠️ پاسخ برای «تازه ثبت شد» و «از قبل عضو بود» **یکسان** است.
     *
     *    اگر فرق می‌کرد، هر کسی می‌توانست با امتحان‌کردن ایمیل‌ها
     *    بفهمد چه کسانی مشترک خبرنامه‌اند. همان قاعده‌ای که در
     *    بازیابی رمز رعایت شده: پاسخ نباید بگوید ایمیل در سامانه
     *    هست یا نه.
     */
    public function subscribe(SubscribeNewsletterRequest $request): JsonResponse
    {
        $email = $request->string('email')->trim()->lower()->value();

        $subscription = NewsletterSubscription::query()->firstOrNew(['email' => $email]);

        /*
         * ⚠️ توکن فقط یک بار ساخته می‌شود.
         *
         *    اگر هر بار عوض می‌شد، لینک لغو عضویتِ ایمیل‌های قدیمی
         *    که هنوز در صندوق کاربر است، بی‌اثر می‌شد — و کاربری که
         *    می‌خواهد بیرون برود، نمی‌توانست.
         */
        if (! $subscription->exists) {
            $subscription->token = NewsletterSubscription::freshToken();
            $subscription->ip = $request->ip();
        }

        /* عضویت لغوشده با ثبت دوباره فعال می‌شود */
        $subscription->unsubscribed_at = null;
        $subscription->user_id = $request->user()?->id ?? $subscription->user_id;
        $subscription->save();

        return response()->json([
            'message' => __('shop.newsletter_subscribed'),
        ], 201);
    }

    /**
     * لغو عضویت با توکن.
     *
     * ⚠️ توکن ناشناخته هم پاسخ موفق می‌گیرد.
     *
     *    کسی که روی لینک لغو کلیک می‌کند، می‌خواهد بیرون برود؛ دیدن
     *    «توکن نامعتبر» فقط نگرانش می‌کند. و پاسخ متفاوت، توکن‌های
     *    معتبر را قابل تشخیص می‌کرد.
     */
    public function unsubscribe(string $token): JsonResponse
    {
        NewsletterSubscription::query()
            ->where('token', $token)
            ->whereNull('unsubscribed_at')
            ->update(['unsubscribed_at' => now()]);

        return response()->json([
            'message' => __('shop.newsletter_unsubscribed'),
        ]);
    }
}
