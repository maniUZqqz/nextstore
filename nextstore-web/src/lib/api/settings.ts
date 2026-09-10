/**
 * تنظیمات عمومی فروشگاه
 * ---------------------------------------------------------------------------
 * فوتر و نوار بالای هدر از این می‌خوانند. هر دو سرور-کامپوننت‌اند و در
 * هر درخواستی رندر می‌شوند، پس پاسخ کش می‌شود.
 *
 * ⚠️ اگر API در دسترس نباشد، **خطا پرتاب نمی‌شود**.
 *
 *    فوتر بخش تزئینی صفحه است؛ افتادن آن به‌خاطر یک قطعی موقت یعنی کل
 *    صفحه‌ی محصول خطا می‌دهد. به‌جایش مقدار تهی برمی‌گردد و کامپوننت
 *    با `?? fallback` خودش تصمیم می‌گیرد.
 */

import { api } from './client'
import type { ApiResponse } from '@/types/api'
import type { SiteSettings } from '@/types/settings'
import type { Locale } from '@/i18n/routing'
import { formatPrice, currencyLabel } from '@/lib/utils/format'

/** تنظیمات خالی — وقتی API در دسترس نیست. */
const EMPTY: SiteSettings = {
  siteName: null,
  siteDescription: null,
  contactPhone: null,
  contactEmail: null,
  contactAddress: null,
  supportHours: null,
  socialInstagram: null,
  socialTelegram: null,
  socialX: null,
  socialLinkedin: null,

  /*
   * ⚠️ مقادیر جایگزین با `config/shop.php` بک‌اند یکی‌اند.
   *
   *    این تنها جای کد فرانت است که عدد ارسال را تکرار می‌کند و
   *    فقط برای وقتی است که API در دسترس نباشد — بهتر از نشان‌دادن
   *    «۰ تومان» یا جای خالی وسط جمله.
   */
  shipping: { freeThreshold: 5_000_000, standard: 500_000, express: 1_200_000 },
}

/**
 * تنظیمات عمومی برای یک زبان.
 *
 * ⚠️ `revalidate` بلند است چون تنظیمات ماه‌ها عوض نمی‌شوند. پنل مدیریت
 *    پس از ذخیره، کش را با `/api/revalidate` باطل می‌کند — همان
 *    الگویی که برای کاتالوگ به کار رفته.
 */
export async function getSiteSettings(locale: string): Promise<SiteSettings> {
  try {
    const response = await api.get<ApiResponse<SiteSettings>>('/settings', {
      locale,
      revalidate: 3600,
      tags: ['settings'],
    })
    return { ...EMPTY, ...response.data }
  } catch {
    return EMPTY
  }
}

/**
 * پارامترهای متن «ارسال رایگان بالای …» — آماده برای next-intl.
 *
 * ⚠️ چرا تابع مشترک و نه ساختن دستی در هر صفحه؟
 *
 *    این شیء در سه جا لازم است: نوار بالای هدر، نوار خدمات صفحه‌ی
 *    اصلی، و تضمین‌های خرید در صفحه‌ی محصول. دو جای اول خودشان
 *    می‌ساختندش و صفحه‌ی محصول اصلاً نمی‌ساخت — یعنی همان کلید ترجمه
 *    را **بدون پارامتر** صدا می‌زد.
 *
 *    نتیجه‌اش سکوت نبود: next-intl خطای FORMATTING_ERROR می‌داد
 *    («متغیر amount داده نشد») و در صفحه‌ی هر محصول یک خطای کنسول
 *    می‌نشست. متن هم به‌جای عدد، خودِ «{amount}» را نشان می‌داد.
 *
 *    حالا هر جا این متن را می‌خواهد، همین را صدا می‌زند و جا انداختنِ
 *    پارامتر ممکن نیست.
 */
export function freeShippingValues(settings: SiteSettings, locale: Locale) {
  return {
    amount: formatPrice(settings.shipping.freeThreshold, locale),
    currency: currencyLabel(locale),
  }
}
