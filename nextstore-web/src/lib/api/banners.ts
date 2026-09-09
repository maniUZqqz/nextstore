/**
 * بنرهای صفحه‌ی اصلی
 * ---------------------------------------------------------------------------
 * ⚠️ اگر API در دسترس نباشد، **خطا پرتاب نمی‌شود**.
 *
 *    بنر بخش تبلیغاتی صفحه است؛ افتادن آن به‌خاطر یک قطعی موقت یعنی کل
 *    صفحه‌ی اصلی خطا می‌دهد در حالی که محصولات، دسته‌ها و همه‌چیز
 *    دیگر سالم‌اند. به‌جایش فهرست تهی برمی‌گردد و کامپوننت خودش
 *    تصمیم می‌گیرد چیزی رندر نکند — همان الگویی که برای تنظیمات
 *    فوتر به کار رفت.
 */

import { api } from './client'
import type { BannerGroups } from '@/types/banner'

/** بدون بنر — وقتی API در دسترس نیست. */
const EMPTY: BannerGroups = { hero: [], promo: [] }

export async function getBanners(locale: string): Promise<BannerGroups> {
  try {
    const response = await api.get<{ data: BannerGroups }>('/banners', {
      locale,
      /*
       * کش نیم‌ساعته.
       *
       * ⚠️ کوتاه‌تر از تنظیمات (یک ساعت) و بلندتر از محصولات:
       *    کمپین تبلیغاتی هفته‌ها ثابت می‌ماند، ولی وقتی مدیر بنری را
       *    خاموش می‌کند نباید تا یک ساعت روی صفحه بماند. پنل پس از
       *    ذخیره، کش را با `/api/revalidate` باطل می‌کند.
       */
      revalidate: 1800,
      tags: ['banners', 'home'],
    })

    return { ...EMPTY, ...response.data }
  } catch {
    return EMPTY
  }
}
