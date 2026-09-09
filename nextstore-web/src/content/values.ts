/**
 * مقادیر پویای صفحات محتوایی
 * ---------------------------------------------------------------------------
 * ⚠️ چرا یک ماژول جدا و نه تکرار در هر صفحه؟
 *
 *    سه صفحه (سؤالات متداول، شیوه‌های ارسال، مرجوعی) به همین مقادیر
 *    نیاز دارند. اگر هرکدام خودش تنظیمات را می‌گرفت و نگاشت را
 *    می‌ساخت، افزودن یک جانگهدارِ تازه یعنی سه‌بار ویرایش و یکی
 *    همیشه جا می‌ماند — دقیقاً همان اتفاقی که برای خودِ عدد ارسال
 *    افتاد و در پنج جا تکرار شده بود.
 *
 * ⚠️ فقط در Server Component استفاده می‌شود. اگر روزی از کلاینت صدا
 *    زده شود، `getSiteSettings` یک درخواست اضافه از مرورگر می‌زند
 *    برای داده‌ای که همان لحظه در سرور موجود بوده.
 */

import { getSiteSettings } from '@/lib/api/settings'
import { formatPrice, currencyLabel } from '@/lib/utils/format'
import type { Locale } from '@/i18n/routing'

/**
 * نگاشت جانگهدار → متن، برای `interpolate`.
 *
 * ⚠️ مبالغ همراه واحد پول ساخته می‌شوند، نه فقط عدد.
 *
 *    در فارسی «۵۰۰٬۰۰۰ تومان» و در انگلیسی «$8» — چون `formatPrice`
 *    در انگلیسی علامت دلار را داخل خودِ عدد می‌گذارد و
 *    `currencyLabel` رشته‌ی خالی می‌دهد. اگر واحد جدا پاس داده
 *    می‌شد، متن انگلیسی یک فاصله‌ی بی‌دلیل در انتها می‌گرفت.
 */
export async function contentValues(locale: string): Promise<Record<string, string>> {
  const settings = await getSiteSettings(locale)
  const typed = locale as Locale

  const money = (rials: number) => {
    const unit = currencyLabel(typed)
    return unit ? `${formatPrice(rials, typed)} ${unit}` : formatPrice(rials, typed)
  }

  return {
    freeShipping: money(settings.shipping.freeThreshold),
    standardShipping: money(settings.shipping.standard),
    expressShipping: money(settings.shipping.express),
  }
}
