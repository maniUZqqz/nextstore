/**
 * پیکربندی درخواست i18n برای سمت سرور
 * ---------------------------------------------------------------------------
 * این فایل را next-intl هنگام رندر هر درخواست صدا می‌زند تا بفهمد:
 *   ۱. زبان این درخواست چیست؟
 *   ۲. فایل ترجمه‌ی مربوطه کدام است؟
 *   ۳. تاریخ، عدد و ارز با چه قالبی نمایش داده شوند؟
 *
 * خروجی این فایل در اختیار همه‌ی Server Component ها و از طریق
 * NextIntlClientProvider در اختیار Client Component ها قرار می‌گیرد.
 */

import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing, getLocaleConfig } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  /*
   * زبان درخواست‌شده از middleware می‌آید (از روی مسیر URL).
   * اما ممکن است کاربر دستی مسیر نامعتبری بزند (مثلاً /de/products)،
   * پس حتماً اعتبارسنجی می‌کنیم و در غیر این صورت به زبان پیش‌فرض برمی‌گردیم.
   */
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  const config = getLocaleConfig(locale)

  return {
    locale,

    /*
     * بارگذاری تنبل (lazy) فایل ترجمه — فقط فایل زبان جاری در باندل می‌آید،
     * نه هر دو زبان. این یعنی حجم کمتر برای کاربر.
     */
    messages: (await import(`../../messages/${locale}.json`)).default,

    /** منطقه زمانی ثابت تا خروجی سرور و کلاینت یکسان باشد (جلوگیری از Hydration Error) */
    timeZone: locale === 'fa' ? 'Asia/Tehran' : 'UTC',

    /** زمان مرجع برای فرمت‌های نسبی مثل «۳ روز پیش» */
    now: new Date(),

    /**
     * قالب‌های پیش‌فرض قابل استفاده در همه‌ی ترجمه‌ها.
     * مثال در فایل ترجمه:  "ثبت‌شده در {date, date, short}"
     */
    formats: {
      dateTime: {
        /** ۱۴۰۳/۰۶/۱۵ */
        short: { year: 'numeric', month: '2-digit', day: '2-digit' },
        /** ۱۵ شهریور ۱۴۰۳ */
        long: { year: 'numeric', month: 'long', day: 'numeric' },
        /** ۱۵ شهریور ۱۴۰۳، ساعت ۱۴:۳۰ */
        full: {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        },
      },
      number: {
        /** قیمت با واحد پول زبان جاری */
        currency: {
          style: 'currency',
          currency: config.currency,
          maximumFractionDigits: 0,
        },
        /** درصد تخفیف */
        percent: { style: 'percent', maximumFractionDigits: 0 },
      },
    },

    /**
     * مدیریت کلید ترجمه‌ی گم‌شده.
     * در محیط توسعه با خطای واضح در کنسول هشدار می‌دهیم تا فوراً دیده شود؛
     * در محیط تولید سکوت می‌کنیم تا صفحه‌ی کاربر خراب نشود.
     */
    onError(error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[i18n]', error.message)
      }
    },

    /**
     * وقتی کلیدی پیدا نشد، به‌جای خطا خودِ کلید نمایش داده می‌شود.
     * این باعث می‌شود در توسعه سریع بفهمی کدام کلید جا مانده است.
     */
    getMessageFallback({ key, namespace }) {
      return [namespace, key].filter(Boolean).join('.')
    },
  }
})
