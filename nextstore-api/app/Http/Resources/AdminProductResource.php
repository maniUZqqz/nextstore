<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

/**
 * خروجی محصول برای فهرست پنل مدیریت.
 * ---------------------------------------------------------------------------
 * ⚠️ چرا یک Resource جداگانه و نه افزودن فیلد به ProductResource؟
 *
 *    فهرست عمومی فروشگاه نباید وضعیت انتشار، آستانه هشدار موجودی یا
 *    قیمت تمام‌شده را ببیند. اگر این فیلدها را با شرط `when()` داخل
 *    ProductResource می‌گذاشتیم، هر بار که کسی شرط را اشتباه بنویسد
 *    داده‌ی محرمانه بیرون می‌رفت. با کلاس جدا، مسیر عمومی از نظر
 *    ساختاری امکان نشت ندارد.
 *
 * از ProductResource ارث می‌برد تا همه‌ی فیلدهای مشترک (قیمت، تصویر،
 * دسته، برند) یک بار نوشته شوند.
 */
class AdminProductResource extends ProductResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $locale = app()->getLocale();

        return array_merge(parent::toArray($request), [
            /* --- وضعیت انتشار --- */
            'status' => $this->status->value,
            'statusLabel' => $this->status->label($locale),

            /* --- انبارداری --- */
            'lowStockThreshold' => $this->low_stock_threshold,
            'allowBackorder' => (bool) $this->allow_backorder,

            /*
             * قیمت تمام‌شده و حاشیه سود.
             * فقط ادمین می‌بیند؛ مدل آن را در $hidden دارد پس باید
             * صریح خوانده شود.
             */
            'costPrice' => $this->cost_price,
            'marginPercent' => $this->marginPercent(),

            /* --- تاریخ‌ها --- */
            'createdAt' => $this->created_at?->toIso8601String(),
            'publishedAt' => $this->published_at?->toIso8601String(),
        ]);
    }

    /**
     * درصد حاشیه سود نسبت به قیمت فروش نهایی.
     *
     * اگر قیمت تمام‌شده ثبت نشده باشد null برمی‌گردد — نمایش «۰٪»
     * گمراه‌کننده است چون با «سود صفر» اشتباه گرفته می‌شود.
     */
    private function marginPercent(): ?int
    {
        $cost = (int) $this->cost_price;
        $sell = (int) $this->final_price;

        if ($cost <= 0 || $sell <= 0) {
            return null;
        }

        return (int) round((($sell - $cost) / $sell) * 100);
    }
}
