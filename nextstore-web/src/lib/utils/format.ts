/**
 * توابع فرمت‌بندی قیمت، عدد و تاریخ
 * ---------------------------------------------------------------------------
 * ⚠️ قرارداد مهم پروژه:
 *    قیمت‌ها در بک‌اند به **ریال** و به‌صورت عدد صحیح ذخیره می‌شوند.
 *    نمایش به کاربر ایرانی به **تومان** است (ریال تقسیم بر ۱۰).
 *    تبدیل فقط در همین لایه انجام می‌شود، نه در محاسبات.
 */

import type { Locale } from '@/i18n/routing'

/** ضریب تبدیل ریال به تومان. */
const RIAL_TO_TOMAN = 10

/**
 * تبدیل عدد به رشته‌ی محلی‌سازی‌شده.
 *
 * در فارسی ارقام فارسی (۱۲۳) و در انگلیسی ارقام لاتین (123) برمی‌گردد.
 *
 * ⚠️ اصلاح جداکننده‌ی هزارگان:
 *    لوکال fa-IR از کاراکتر «٬» (U+066C ARABIC THOUSANDS SEPARATOR)
 *    استفاده می‌کند. این کاراکتر در فونت وزیرمتن به‌صورت یک آپاستروفِ
 *    بالا رندر می‌شود و قیمت را این‌گونه نشان می‌دهد:
 *
 *        ۸’۰۱۰’۰۰۰      ← ناخوانا و شبیه خطای فونت
 *
 *    راه‌حل: جایگزینی با ویرگول لاتین که در همه‌ی فونت‌ها یکسان و
 *    خوانا رندر می‌شود و در سایت‌های فارسی هم رایج است:
 *
 *        ۸,۰۱۰,۰۰۰      ← خوانا
 *
 * @param value  عدد ورودی
 * @param locale زبان جاری
 */
export function formatNumber(value: number, locale: Locale): string {
  const formatted = new Intl.NumberFormat(
    locale === 'fa' ? 'fa-IR' : 'en-US',
  ).format(value)

  /* U+066C را با ویرگول معمولی جایگزین می‌کنیم */
  return locale === 'fa' ? formatted.replace(/٬/g, ',') : formatted
}

/**
 * فرمت‌بندی قیمت برای نمایش، بدون واحد پول.
 *
 * فارسی : ۸۹٬۰۰۰٬۰۰۰ ریال → «۸٬۹۰۰٬۰۰۰» (تومان)
 * انگلیسی: همان مبلغ به دلار تقریبی نمایش داده می‌شود
 *
 * @param rials  مبلغ به ریال (همان چیزی که از API می‌آید)
 * @param locale زبان جاری
 */
export function formatPrice(rials: number, locale: Locale): string {
  if (locale === 'fa') {
    /* ریال → تومان */
    return formatNumber(Math.round(rials / RIAL_TO_TOMAN), 'fa')
  }

  /*
   * برای نسخه انگلیسی، مبلغ را به دلار تقریبی تبدیل می‌کنیم.
   * در پروژه واقعی این نرخ باید از سرویس نرخ ارز بیاید،
   * نه یک عدد ثابت در کد.
   */
  const usd = rials / 600_000
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(usd)
}

/**
 * واحد پول متناسب با زبان.
 * در انگلیسی خالی برمی‌گردد چون علامت $ در خود قیمت آمده است.
 */
export function currencyLabel(locale: Locale): string {
  return locale === 'fa' ? 'تومان' : ''
}

/**
 * فرمت‌بندی درصد تخفیف.
 * فارسی: ٪۲۵  |  انگلیسی: 25%
 */
export function formatDiscount(percent: number, locale: Locale): string {
  return locale === 'fa'
    ? `٪${formatNumber(percent, 'fa')}`
    : `${percent}%`
}

/**
 * فرمت‌بندی تاریخ متناسب با زبان.
 * فارسی → تقویم شمسی | انگلیسی → تقویم میلادی
 *
 * @param iso    رشته تاریخ به فرمت ISO 8601
 * @param locale زبان جاری
 */
export function formatDate(iso: string, locale: Locale): string {
  const date = new Date(iso)

  return new Intl.DateTimeFormat(
    locale === 'fa' ? 'fa-IR' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' },
  ).format(date)
}

/**
 * فرمت‌بندی تاریخ **به‌همراه ساعت**.
 * فارسی → تقویم شمسی | انگلیسی → تقویم میلادی
 *
 * برای جاهایی که ترتیب رویدادها در یک روز اهمیت دارد — مثل گفتگوی
 * تیکت، که چند پیام می‌توانند در یک روز رد و بدل شوند و تاریخ تنها
 * آن‌ها را از هم تفکیک نمی‌کند.
 *
 * ⚠️ `hour12: false` صریح داده شده. `fa-IR` پیش‌فرض ۲۴ساعته است ولی
 *    `en-US` ۱۲ساعته با AM/PM؛ بدون این، دو زبان دو قالب متفاوت
 *    نشان می‌دادند و ترتیب پیام‌ها در نسخه‌ی انگلیسی سخت‌تر خوانده
 *    می‌شد.
 *
 * @param iso    رشته تاریخ به فرمت ISO 8601
 * @param locale زبان جاری
 */
export function formatDateTime(iso: string, locale: Locale): string {
  const date = new Date(iso)

  return new Intl.DateTimeFormat(
    locale === 'fa' ? 'fa-IR' : 'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
  ).format(date)
}

/**
 * محاسبه‌ی زمان باقی‌مانده تا یک تاریخ.
 * برای تایمر شمارش معکوس فروش ویژه استفاده می‌شود.
 *
 * @returns  اجزای زمان باقی‌مانده؛ اگر گذشته باشد همه صفر
 */
export function timeRemaining(iso: string): {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
} {
  const diff = new Date(iso).getTime() - Date.now()

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
  }

  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isExpired: false,
  }
}
