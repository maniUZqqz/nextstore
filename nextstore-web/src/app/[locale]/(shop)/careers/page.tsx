/**
 * صفحه‌ی فرصت‌های شغلی
 * ===========================================================================
 * مسیر: /fa/careers · /en/careers
 *
 * ⚠️ کادر «این موقعیت‌ها واقعی نیستند» بالای فهرست است، نه پایین آن.
 *    کسی که رزومه‌اش را برای یک موقعیت خیالی می‌فرستد و بعد جوابی
 *    نمی‌گیرد، تجربه‌ی بدی از این نمونه‌کار می‌برد. صداقت باید پیش
 *    از صرف وقت کاربر بیاید.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Briefcase, MapPin, Clock, Info } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { careersContent } from '@/content/company'
import { pickLocale } from '@/content/types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const content = pickLocale(careersContent, locale)

  return { title: content.title, description: content.subtitle }
}

export default async function CareersPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('careers')
  const tNav = await getTranslations('nav')
  const tFooter = await getTranslations('footer')

  const content = pickLocale(careersContent, locale)

  return (
    <main
      id="main-content"
      className="mx-auto max-w-(--container-content) px-4 py-4 sm:px-6 lg:px-8"
    >
      <Breadcrumb
        items={[{ label: tNav('home'), href: '/' }, { label: tFooter('links.careers') }]}
      />

      <header className="mt-3 max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          {content.title}
        </h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground sm:text-base">
          {content.subtitle}
        </p>
      </header>

      {/* اعلام صریح — پیش از فهرست، نه بعد از آن */}
      <p className="mt-5 flex max-w-3xl items-start gap-2.5 rounded-(--radius-md) border border-info/30 bg-info/10 px-3.5 py-3 text-xs leading-6 text-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
        {content.disclaimer}
      </p>

      {/* ============ موقعیت‌های باز ============ */}
      <section aria-labelledby="openings" className="mt-8 max-w-3xl">
        <h2 id="openings" className="text-lg font-bold text-foreground">
          {t('openings')}
        </h2>

        <ul className="mt-4 flex flex-col gap-3">
          {content.openings.map((job) => (
            <li
              key={job.title}
              className="flex flex-col gap-3 rounded-(--radius-lg) border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{job.title}</p>

                <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="size-3.5" aria-hidden="true" />
                    {job.team}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5" aria-hidden="true" />
                    {job.location}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-3.5" aria-hidden="true" />
                    {job.type}
                  </span>
                </p>
              </div>

              {/*
                دکمه به صفحه‌ی تماس می‌رود، نه به فرم رزومه‌ی ساختگی.
                لینک به جایی که واقعاً کار می‌کند، بهتر از فرمی است که
                هیچ‌جا نمی‌فرستد.
              */}
              <Link
                href="/contact"
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-(--radius-md) border border-border px-5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
              >
                {t('apply')}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ============ بخش‌های متنی ============ */}
      <div className="mt-10 flex max-w-3xl flex-col gap-8">
        {content.sections.map((section, index) => (
          <section key={section.heading ?? index}>
            {section.heading && (
              <h2 className="text-lg font-bold text-foreground">{section.heading}</h2>
            )}

            {section.paragraphs?.map((paragraph, paragraphIndex) => (
              <p
                key={paragraphIndex}
                className="mt-3 text-sm leading-8 text-muted-foreground"
              >
                {paragraph}
              </p>
            ))}

            {section.bullets && (
              <ul className="mt-3 space-y-2">
                {section.bullets.map((bullet, bulletIndex) => (
                  <li
                    key={bulletIndex}
                    className="flex gap-2.5 text-sm leading-7 text-muted-foreground"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary/60"
                    />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </main>
  )
}
