/**
 * فوتر فروشگاه
 * ===========================================================================
 * ساختار سه‌بخشی:
 *   ۱. نوار نمادهای اعتماد (پرداخت امن، ضمانت اصالت، تحویل سریع، بازگشت آسان)
 *   ۲. شبکه ستون‌های لینک + فرم خبرنامه
 *   ۳. نوار پایانی با کپی‌رایت و شبکه‌های اجتماعی
 *
 * چرا فوتر برای فروشگاه مهم است؟
 *   نمادهای اعتماد و لینک‌های خدمات مشتریان، تردید خریدار را کم می‌کنند.
 *   فوتر خالی یا کوتاه، سایت را «ناتمام» و غیرقابل‌اعتماد نشان می‌دهد.
 */

import { getTranslations } from 'next-intl/server'
import { getSiteSettings } from '@/lib/api/settings'
import { ShieldCheck, BadgeCheck, Truck, RotateCcw } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { NewsletterForm } from './NewsletterForm'
import {
  InstagramIcon, TelegramIcon, XIcon, LinkedinIcon,
} from './SocialIcons'

export async function Footer({ locale }: { locale: string }) {
  /*
   * تنظیمات از دیتابیس می‌آیند نه از فایل ترجمه.
   *
   * ⚠️ نام فروشگاه، متن معرفی و لینک شبکه‌های اجتماعی پیش‌تر اینجا
   *    هاردکد بودند — عوض کردنشان یعنی ویرایش کد و دیپلوی دوباره.
   *    مقادیر جایگزین حفظ شده‌اند تا اگر API در دسترس نبود، فوتر
   *    خالی نماند.
   */
  const settings = await getSiteSettings(locale)

  const t = await getTranslations('footer')
  const tNav = await getTranslations('nav')

  /** نمادهای اعتماد بالای فوتر. */
  const trustBadges = [
    { key: 'securePayment', Icon: ShieldCheck },
    { key: 'authentic', Icon: BadgeCheck },
    { key: 'fastDelivery', Icon: Truck },
    { key: 'easyReturn', Icon: RotateCcw },
  ] as const

  /** ستون‌های لینک فوتر. */
  const linkColumns = [
    {
      title: t('quickLinks'),
      links: [
        { href: '/about', label: t('links.aboutUs') },
        { href: '/contact', label: t('links.contactUs') },
        /*
         * لینک مجله. پیش‌تر عمداً حذف شده بود چون صفحه‌اش وجود
         * نداشت و لینکِ ۴۰۴ در فوترِ همه‌ی صفحات، از نبودِ لینک
         * بدتر است. حالا که /blog ساخته شده، برگشت.
         */
        { href: '/blog', label: t('links.blog') },
        { href: '/careers', label: t('links.careers') },
      ],
    },
    {
      title: t('customerService'),
      links: [
        { href: '/faq', label: t('links.faq') },
        { href: '/shipping-info', label: t('links.shipping') },
        { href: '/returns', label: t('links.returns') },
        { href: '/account/orders', label: t('links.trackOrder') },
      ],
    },
    {
      title: t('categories'),
      links: [
        { href: '/products?category=digital', label: tNav('products') },
        { href: '/products?on_sale=1', label: tNav('amazingOffers') },
        { href: '/products?sort=popular', label: tNav('bestSellers') },
        { href: '/products?sort=newest', label: tNav('newest') },
      ],
    },
  ]

  /**
   * شبکه‌های اجتماعی — آیکون‌ها SVG درون‌خطی‌اند (Lucide برندها را حذف کرده).
   *
   * ⚠️ فقط شبکه‌هایی که مدیر آدرسشان را وارد کرده نشان داده می‌شوند.
   *    نسخه‌ی قبلی هر چهار آیکون را با `href="#"` نشان می‌داد — لینکی
   *    که هیچ‌جا نمی‌رفت و کاربر را گیج می‌کرد. آیکونِ نبود، بهتر از
   *    آیکونِ مرده است.
   */
  const socials = [
    { href: settings.socialInstagram, label: 'Instagram', Icon: InstagramIcon },
    { href: settings.socialTelegram, label: 'Telegram', Icon: TelegramIcon },
    { href: settings.socialX, label: 'X', Icon: XIcon },
    { href: settings.socialLinkedin, label: 'LinkedIn', Icon: LinkedinIcon },
  ].filter((item): item is { href: string; label: string; Icon: typeof InstagramIcon } =>
    Boolean(item.href),
  )

  return (
    <footer className="mt-12 border-t border-border bg-card">
      {/* ==========================================================
          ۱. نوار نمادهای اعتماد
          ========================================================== */}
      <div className="border-b border-border">
        <ul className="mx-auto grid max-w-(--container-content) grid-cols-2 gap-4 px-4 py-6 sm:px-6 lg:grid-cols-4 lg:px-8">
          {trustBadges.map(({ key, Icon }) => (
            <li key={key} className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="text-xs font-medium text-foreground sm:text-sm">
                {t(`trust.${key}`)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* ==========================================================
          ۲. ستون‌های لینک + خبرنامه
          موبایل: تک‌ستونه | تبلت: دو ستونه | دسکتاپ: پنج ستونه
          ========================================================== */}
      <div className="mx-auto max-w-(--container-content) px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* --- معرفی فروشگاه (دو ستون در دسکتاپ) --- */}
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-(--radius-md) bg-primary text-lg font-black text-primary-foreground">
                N
              </span>
              <span className="text-lg font-bold text-foreground">
                {settings.siteName ?? 'NextStore'}
              </span>
            </div>

            <p className="max-w-sm text-sm leading-7 text-muted-foreground">
              {settings.siteDescription ?? t('about.text')}
            </p>

            {/* شبکه‌های اجتماعی — بلوک کامل حذف می‌شود اگر هیچ‌کدام تنظیم نشده باشند */}
            {socials.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold text-foreground">{t('social')}</p>
              <ul className="flex items-center gap-2">
                {socials.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      /*
                        ⚠️ `noopener` الزامی است: بدون آن صفحه‌ی مقصد از
                           راه `window.opener` می‌تواند تب ما را به آدرس
                           دیگری هدایت کند (tabnabbing). `noreferrer`
                           هم آدرس صفحه‌ی ما را در هدر Referer نمی‌فرستد.
                      */
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="inline-flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            )}
          </div>

          {/* --- ستون‌های لینک --- */}
          {linkColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 className="mb-3 text-sm font-bold text-foreground">{column.title}</h3>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* --- فرم خبرنامه --- */}
        <div className="mt-10 rounded-(--radius-lg) border border-border bg-muted p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">
                {t('newsletter.title')}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('newsletter.desc')}
              </p>
            </div>

            <NewsletterForm className="w-full lg:w-auto lg:min-w-96" />
          </div>
        </div>
      </div>

      {/* ==========================================================
          ۳. نوار پایانی
          ========================================================== */}
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-(--container-content) flex-col items-center justify-between gap-3 px-4 py-5 text-center sm:px-6 lg:flex-row lg:px-8 lg:text-start">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {settings.siteName ?? 'NextStore'} — {t('copyright')}
          </p>

          <ul className="flex items-center gap-4">
            <li>
              <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground">
                {t('links.terms')}
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground">
                {t('links.privacy')}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/*
        فضای خالی پایین صفحه در موبایل.
        بدون این، نوار ناوبری پایین روی محتوای فوتر می‌افتد.
      */}
      <div className="h-16 md:hidden" aria-hidden="true" />
    </footer>
  )
}
