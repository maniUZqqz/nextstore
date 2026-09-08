<?php

namespace App\Exceptions;

use App\Models\Product;
use Exception;

/**
 * استثنای «موجودی کافی نیست».
 *
 * چرا استثنای اختصاصی و نه یک Exception عمومی؟
 *   ۱. Handler می‌تواند آن را تشخیص دهد و کد خطای معنادار
 *      (INSUFFICIENT_STOCK) به فرانت‌اند بدهد
 *   ۲. فرانت‌اند می‌تواند پیام دقیق نشان دهد: «تنها ۳ عدد موجود است»
 *      به‌جای پیام مبهم «خطایی رخ داد»
 *   ۳. در تست‌ها می‌توان دقیقاً همین استثنا را انتظار داشت
 */
class InsufficientStockException extends Exception
{
    /**
     * @param  Product  $product  محصولی که موجودی‌اش کم است
     * @param  int  $requested  تعدادی که کاربر خواسته
     * @param  int  $available  تعدادی که واقعاً موجود است
     */
    public function __construct(
        public readonly Product $product,
        public readonly int $requested,
        public readonly int $available,
    ) {
        parent::__construct(
            __('shop.insufficient_stock', ['count' => $available])
        );
    }
}
