/**
 * صفحه‌ی تماس با ما
 * ===========================================================================
 * مسیر: /fa/contact · /en/contact
 *
 * چیدمان: فرم در ستون اصلی، راه‌های ارتباطی در ستون کناری.
 *
 * ⚠️ راه‌های ارتباطی *کنار* فرم است، نه زیر آن. کسی که ترجیح می‌دهد
 *    تلفن بزند نباید مجبور باشد از کل فرم رد شود تا شماره را ببیند.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Phone, Mail, MapPin, Clock } from 'lucide-react'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { ContactForm } from '@/components/common/ContactForm'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'contact' })

  return { title: t('title'), description: t('subtitle') }
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('contact')
  const tNav = await getTranslations('nav')
  const tTopbar = await getTranslations('topbar')

  /**
   * راه‌های ارتباطی.
   *
   * شماره تلفن از فضای‌نام topbar خوانده می‌شود تا با نواری که بالای
   * همه‌ی صفحات است یکی بماند؛ دو شماره‌ی متفاوت روی یک سایت، اعتماد
   * را از بین می‌برد.
   */
  const channels = [
    { key: 'phone', Icon: Phone, label: t('phone'), value: tTopbar('phone'), ltr: true },
    { key: 'email', Icon: Mail, label: t('email'), value: 'support@nextstore.dev', ltr: true },
    { key: 'address', Icon: MapPin, label: t('address'), value: t('addressValue') },
    { key: 'hours', Icon: Clock, label: t('hours'), value: t('hoursValue') },
  ]

  return (
    <main
      id="main-content"
      className="mx-auto max-w-(--container-content) px-4 py-4 sm:px-6 lg:px-8"
    >
      <Breadcrumb items={[{ label: tNav('home'), href: '/' }, { label: t('title') }]} />

      <header className="mt-3">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{t('title')}</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground sm:text-base">
          {t('subtitle')}
        </p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        {/* ============ فرم ============ */}
        <section className="rounded-(--radius-lg) border border-border bg-card p-5">
          <ContactForm />
        </section>

        {/* ============ راه‌های ارتباطی ============ */}
        <aside className="rounded-(--radius-lg) border border-border bg-card p-5">
          <h2 className="text-sm font-bold text-foreground">{t('channels')}</h2>

          <ul className="mt-4 flex flex-col gap-4">
            {channels.map(({ key, Icon, label, value, ltr }) => (
              <li key={key} className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Icon className="size-4" aria-hidden="true" />
                </span>

                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  {/*
                    dir="ltr" روی شماره و ایمیل: در متن راست‌به‌چپ،
                    رشته‌های لاتین و عددی بدون آن به‌هم می‌ریزند و
                    مثلاً «۰۲۱-۱۲۳۴» وارونه دیده می‌شود.
                  */}
                  <p
                    dir={ltr ? 'ltr' : undefined}
                    className={`mt-0.5 text-sm leading-6 text-foreground ${ltr ? 'text-start' : ''}`}
                  >
                    {value}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  )
}
