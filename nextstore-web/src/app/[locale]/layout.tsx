/**
 * لایوت ریشه‌ی برنامه (Root Layout)
 * ===========================================================================
 * این فایل بیرونی‌ترین پوسته‌ی هر صفحه است و تگ‌های <html> و <body> را می‌سازد.
 *
 * مسئولیت‌های کلیدی:
 *   ۱. تعیین زبان صفحه         → <html lang="fa">
 *   ۲. تعیین جهت نوشتار        → <html dir="rtl">   (خودکار بر اساس زبان)
 *   ۳. جلوگیری از پرش تم       → اسکریپت همگام قبل از رندر
 *   ۴. تزریق پیام‌های ترجمه     → NextIntlClientProvider
 *   ۵. متادیتای سئو            → عنوان، توضیحات، hreflang، Open Graph
 *
 * ⚠️ هدر و فوتر فروشگاه اینجا نیستند. آن‌ها به (shop)/layout.tsx
 *    منتقل شده‌اند تا پنل مدیریت نوار تبلیغاتی و خبرنامه‌ی فروشگاه
 *    را نمایش ندهد.
 *
 * ⚠️ نکته: چون این فایل داخل [locale] است، هر زبان لایوت خودش را می‌گیرد
 *    و dir و lang درست از همان ابتدای HTML تنظیم می‌شوند — نه با جاوااسکریپت
 *    بعد از بارگذاری. این برای جلوگیری از پرش چیدمان حیاتی است.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getTranslations, getMessages, setRequestLocale } from 'next-intl/server'
import { withoutAdminMessages } from '@/i18n/messages'
import { routing, getDirection, LOCALES } from '@/i18n/routing'
import { SITE_URL, ogImageUrl } from '@/lib/utils/site-url'
import { Providers } from '@/components/providers/Providers'
import './../globals.css'

/**
 * تولید مسیرهای ایستا برای همه‌ی زبان‌ها در زمان بیلد.
 * نتیجه: صفحات /fa و /en از پیش رندر می‌شوند → سرعت و سئوی بهتر.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

/**
 * ساخت متادیتای صفحه بر اساس زبان.
 * عنوان و توضیحات از فایل ترجمه خوانده می‌شوند تا در هر زبان درست باشند.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })

  const baseUrl = SITE_URL

  return {
    title: {
      /** عنوان صفحه اصلی */
      default: t('title'),
      /** الگوی عنوان بقیه صفحات: «نام صفحه | نکست‌استور» */
      template: `%s | ${t('siteName')}`,
    },
    description: t('description'),
    keywords: t('keywords'),

    /*
     * hreflang — به گوگل می‌گوید هر صفحه چه نسخه‌های زبانی دارد.
     * بدون این، گوگل نسخه‌ی فارسی و انگلیسی را «محتوای تکراری» می‌بیند.
     */
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: Object.fromEntries(
        LOCALES.map((l) => [l.intlLocale, `${baseUrl}/${l.code}`]),
      ),
    },

    /*
     * پیش‌نمایش هنگام اشتراک‌گذاری در شبکه‌های اجتماعی.
     *
     * ⚠️ تصویر اجباری است، نه تزئینی.
     *
     *    `card: 'summary_large_image'` به شبکه‌ها **وعده‌ی تصویر بزرگ**
     *    می‌دهد. پیش‌تر هیچ تصویری فرستاده نمی‌شد و نتیجه‌اش کارتی بود
     *    با یک مستطیل خاکستری خالی — بدتر از کارت ساده‌ی بدون تصویر.
     *    فقط صفحه‌ی محصول عکس داشت (اولین تصویر کالا).
     *
     * ⚠️ نشانی **مطلق** است. شبکه‌های اجتماعی صفحه را از سرور خودشان
     *    می‌گیرند و مسیر نسبی برایشان بی‌معناست.
     *
     *    تصویرها با `node scripts/build-og.mjs` ساخته می‌شوند و در
     *    مخزن‌اند — نه در زمان بیلد، تا CI به مرورگر نیاز نداشته باشد.
     */
    openGraph: {
      type: 'website',
      locale: locale === 'fa' ? 'fa_IR' : 'en_US',
      url: `${baseUrl}/${locale}`,
      siteName: t('siteName'),
      title: t('title'),
      description: t('description'),
      images: [{
        url: ogImageUrl(locale),
        width: 1200,
        height: 630,
        alt: t('siteName'),
      }],
    },

    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: [ogImageUrl(locale)],
    },

    /** آیکون تب مرورگر */
    icons: { icon: '/favicon.ico' },
  }
}

/**
 * اسکریپتی که پیش از رندر شدن صفحه اجرا می‌شود تا تم درست اعمال شود.
 *
 * چرا لازم است؟
 *   اگر تم را با جاوااسکریپت بعد از بارگذاری اعمال کنیم، کاربر برای
 *   یک لحظه صفحه‌ی سفید می‌بیند و بعد ناگهان تاریک می‌شود (Flash of
 *   Wrong Theme). این اسکریپت همگام (blocking) اجرا می‌شود و پیش از
 *   نقاشی اولین پیکسل، کلاس درست را روی <html> می‌گذارد.
 */
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = stored === 'dark' || (!stored || stored === 'system') && systemDark;
    if (isDark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  /*
   * اعتبارسنجی زبان.
   * اگر کاربر دستی مسیر نامعتبری بزند (مثلاً /de/products) صفحه ۴۰۴ می‌گیرد
   * نه اینکه برنامه با خطا از کار بیفتد.
   */
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  /*
   * فعال‌سازی رندر ایستا برای این زبان.
   * بدون این خط، next-intl صفحه را داینامیک رندر می‌کند و از مزیت
   * پیش‌رندر شدن محروم می‌شویم.
   */
  setRequestLocale(locale)

  /** جهت نوشتار از روی زبان تعیین می‌شود: فارسی → rtl، انگلیسی → ltr */
  const dir = getDirection(locale)

  /*
   * پیام‌های ترجمه — بدون فضای‌نام پنل مدیریت.
   *
   * ⚠️ چرا صریح پاس داده می‌شود؟
   *    NextIntlClientProvider بدون prop، تمام پیام‌ها را در payload
   *    هر صفحه جاسازی می‌کند. متن‌های پنل مدیریت ۳.۴ کیلوبایت از
   *    ۱۹.۶ کیلوبایت کل را می‌گیرند و روی صفحه اصلی هیچ کاربردی
   *    ندارند. لایوت /admin دوباره پیام‌های کامل را تزریق می‌کند.
   */
  const messages = withoutAdminMessages(await getMessages({ locale }))

  return (
    <html
      lang={locale}
      dir={dir}
      /*
       * اعلام صریح اسکرول نرم به Next.js.
       *
       * globals.css روی <html> مقدار scroll-behavior: smooth دارد.
       * بدون این ویژگی، Next هشدار می‌دهد چون هنگام جابه‌جایی بین
       * صفحات، اسکرول نرم باعث می‌شود کاربر پرش دیداری ببیند.
       * با این اعلام، Next می‌داند رفتار عمدی است.
       */
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {/* اجرای اسکریپت تم پیش از رندر برای جلوگیری از پرش تم */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        {/*
          لینک «پرش به محتوا» — اولین چیزی که کاربر کیبورد با Tab می‌بیند.
          به او اجازه می‌دهد از منوی طولانی رد شود و مستقیم به محتوا برود.
        */}
        <a
          href="#main-content"
          className="sr-only-focusable absolute start-4 top-4 z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground"
        >
          {locale === 'fa' ? 'پرش به محتوای اصلی' : 'Skip to main content'}
        </a>

        {/*
          NextIntlClientProvider پیام‌های ترجمه را در اختیار
          Client Component ها می‌گذارد. Server Component ها مستقیم از
          getTranslations استفاده می‌کنند و نیازی به این پرووایدر ندارند.
        */}
        <NextIntlClientProvider messages={messages}>
          {/*
            این لایوت فقط پوسته‌ی مشترک همه‌ی مسیرها را می‌سازد:
            تگ html، تم، ترجمه‌ها و پرووایدرها.

            هدر و فوتر فروشگاه عمداً اینجا نیستند — آن‌ها در
            (shop)/layout.tsx قرار دارند تا پنل مدیریت پوسته‌ی
            مینیمال خودش را داشته باشد.
          */}
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
