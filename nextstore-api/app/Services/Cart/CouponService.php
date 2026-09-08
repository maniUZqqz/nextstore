<?php

namespace App\Services\Cart;

use App\Models\Cart;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * اعتبارسنجی و اعمال کدهای تخفیف.
 * ---------------------------------------------------------------------------
 * ⚠️ کوپن در **دو لحظه** بررسی می‌شود و این تکرار عمدی است:
 *
 *      ۱. هنگام اعمال روی سبد — تا کاربر بازخورد فوری بگیرد
 *      ۲. هنگام ثبت سفارش    — چون بین این دو می‌تواند ساعت‌ها فاصله
 *                               بیفتد و کوپن منقضی شود، سقفش پر شود،
 *                               یا مدیر غیرفعالش کند
 *
 *    حذف بررسی دوم یعنی کاربری که سبدش را دیروز آماده کرده، امروز با
 *    کوپن منقضی خرید می‌کند.
 *
 * ⚠️ رکورد مصرف فقط در لحظه‌ی ثبت سفارش ساخته می‌شود، نه هنگام اعمال.
 *    وگرنه هر کس با زدن کد و رها کردن سبد، یک ظرفیت را می‌سوزاند.
 */
class CouponService
{
    /**
     * یافتن کوپن معتبر برای این کاربر و این جمع سبد.
     *
     * @param  string  $code  کدی که کاربر وارد کرده
     * @param  int  $subtotal  جمع سبد به ریال
     * @param  User|null  $user  مهمان هم می‌تواند کوپن بزند
     * @return array{coupon: Coupon|null, error: string|null, discount: int}
     */
    public function validate(string $code, int $subtotal, ?User $user): array
    {
        $normalized = mb_strtoupper(trim($code));

        $coupon = Coupon::query()->where('code', $normalized)->first();

        /*
         * ⚠️ «وجود ندارد» و «غیرفعال است» یک پیام می‌گیرند.
         *
         *    تفکیکشان به مهاجم می‌گوید کدام کدها واقعی‌اند و حدس‌زدن
         *    کدهای کمپین را ممکن می‌کند — همان اصلی که در ورود، «ایمیل
         *    یافت نشد» را از «رمز اشتباه» تفکیک نمی‌کند.
         */
        if (! $coupon || ! $coupon->is_active) {
            return $this->fail('shop.coupon_invalid');
        }

        if ($coupon->hasNotStarted()) {
            return $this->fail('shop.coupon_not_started');
        }

        if ($coupon->isExpired()) {
            return $this->fail('shop.coupon_expired');
        }

        if (! $coupon->hasCapacity()) {
            return $this->fail('shop.coupon_exhausted');
        }

        if (! $coupon->meetsMinimum($subtotal)) {
            return $this->fail('shop.coupon_min_total', [
                'amount' => number_format(intdiv($coupon->min_order_total, 10)),
            ]);
        }

        /*
         * سقف مصرف هر کاربر — فقط برای کاربر واردشده.
         *
         * ⚠️ مهمان قابل شناسایی نیست، پس این قاعده رویش اعمال نمی‌شود.
         *    ولی چون رکورد مصرف در لحظه‌ی *ثبت سفارش* ساخته می‌شود و
         *    ثبت سفارش نیازمند ورود است، مهمان در عمل نمی‌تواند از این
         *    راه سوءاستفاده کند.
         */
        if ($user && $coupon->per_user_limit > 0) {
            $used = CouponUsage::query()
                ->where('coupon_id', $coupon->id)
                ->where('user_id', $user->id)
                ->count();

            if ($used >= $coupon->per_user_limit) {
                return $this->fail('shop.coupon_already_used');
            }
        }

        return [
            'coupon' => $coupon,
            'error' => null,
            'discount' => $coupon->discountFor($subtotal),
        ];
    }

    /**
     * اعمال کوپن روی سبد.
     *
     * @return array{cart: Cart, error: string|null, discount: int}
     */
    public function applyToCart(Cart $cart, string $code, int $subtotal, ?User $user): array
    {
        $result = $this->validate($code, $subtotal, $user);

        if ($result['error'] !== null) {
            return ['cart' => $cart, 'error' => $result['error'], 'discount' => 0];
        }

        $cart->update(['coupon_id' => $result['coupon']->id]);

        return [
            'cart' => $cart->fresh(),
            'error' => null,
            'discount' => $result['discount'],
        ];
    }

    /** برداشتن کوپن از سبد. */
    public function removeFromCart(Cart $cart): Cart
    {
        $cart->update(['coupon_id' => null]);

        return $cart->fresh();
    }

    /**
     * کوپن سبد، **در صورتی که هنوز معتبر باشد**.
     *
     * ⚠️ خروجی null هم یعنی «کوپنی نیست» و هم «کوپن دیگر معتبر نیست».
     *    نمایش سبد نباید به خاطر کوپن منقضی خطا بدهد؛ فقط تخفیف را
     *    نشان نمی‌دهد. پیام صریح هنگام ثبت سفارش داده می‌شود.
     */
    public function activeCouponFor(Cart $cart, int $subtotal, ?User $user): ?array
    {
        if (! $cart->coupon_id) {
            return null;
        }

        $coupon = $cart->coupon;

        if (! $coupon) {
            return null;
        }

        $result = $this->validate($coupon->code, $subtotal, $user);

        if ($result['error'] !== null) {
            return null;
        }

        return [
            'code' => $coupon->code,
            'discountAmount' => $result['discount'],
        ];
    }

    /**
     * ثبت مصرف کوپن پس از ساخته‌شدن سفارش.
     *
     * ⚠️ باید **داخل همان تراکنش ثبت سفارش** صدا زده شود. بیرون از آن،
     *    اگر ثبت سفارش شکست بخورد یک مصرف ثبت‌شده باقی می‌ماند و
     *    ظرفیت کوپن بی‌دلیل می‌سوزد.
     */
    public function recordUsage(Coupon $coupon, User $user, Order $order, int $discount): void
    {
        CouponUsage::query()->create([
            'coupon_id' => $coupon->id,
            'user_id' => $user->id,
            'order_id' => $order->id,
            'discount_amount' => $discount,
        ]);

        /*
         * افزایش اتمیک شمارنده با increment و نه `$coupon->used_count + 1`.
         *
         * ⚠️ خواندن و نوشتن جدا، در دو ثبت سفارش هم‌زمان یک مصرف را گم
         *    می‌کند: هر دو مقدار ۵ را می‌خوانند و هر دو ۶ می‌نویسند.
         *    increment در خود دیتابیس انجام می‌شود.
         */
        DB::table('coupons')->where('id', $coupon->id)->increment('used_count');
    }

    /**
     * ساخت خروجی خطا.
     *
     * @return array{coupon: null, error: string, discount: int}
     */
    private function fail(string $key, array $replace = []): array
    {
        return ['coupon' => null, 'error' => __($key, $replace), 'discount' => 0];
    }
}
