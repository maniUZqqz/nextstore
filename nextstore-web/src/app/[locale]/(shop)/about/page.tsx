/**
 * صفحه‌ی درباره ما
 * ===========================================================================
 * مسیر: /fa/about · /en/about
 *
 * ساختار: عنوان → کارت‌های آمار → مسیر ساخت (تایم‌لاین) → بخش‌های متنی
 *
 * ⚠️ آمارها عمداً درباره‌ی *پروژه* هستند نه درباره‌ی یک کسب‌وکار
 *    خیالی. «۵۰۰ هزار مشتری راضی» روی یک نمونه‌کار، ادعای دروغ است
 *    و اولین چیزی است که یک بازبین فنی رویش انگشت می‌گذارد.
 *    «۱۶۷ بررسی خودکار» قابل راستی‌آزمایی است.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { formatNumber } from '@/lib/utils/format'
import type { Locale } from '@/i18n/routing'
import { aboutContent } from '@/content/company'
import { pickLocale } from '@/content/types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const content = pickLocale(aboutContent, locale)

  return { title: content.title, description: content.subtitle }
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('about')
  const tNav = await getTranslations('nav')

  const content = pickLocale(aboutContent, locale)
  const Arrow = locale === 'fa' ? ArrowLeft : ArrowRight

  return (
    <main
      id="main-content"
      className="mx-auto max-w-(--container-content) px-4 py-4 sm:px-6 lg:px-8"
    >
      <Breadcrumb
        items={[{ label: tNav('home'), href: '/' }, { label: tNav('about') }]}
      />

      <header className="mt-3 max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          {content.title}
        </h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground sm:text-base">
          {content.subtitle}
        </p>
      </header>

      {/* ============ آمار پروژه ============ */}
      <section aria-labelledby="about-stats" className="mt-8">
        <h2 id="about-stats" className="sr-only">
          {t('atAGlance')}
        </h2>

        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {content.stats.map((stat) => (
            <li
              key={stat.label}
              className="rounded-(--radius-lg) border border-border bg-card p-4 text-center"
            >
              {/* tabular-nums تا ارقام هم‌عرض باشند و کارت‌ها نلرزند */}
              <p className="text-2xl font-black text-primary tabular-nums sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                {stat.label}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* ============ مسیر ساخت ============ */}
      <section aria-labelledby="about-journey" className="mt-10 max-w-3xl">
        <h2 id="about-journey" className="text-lg font-bold text-foreground">
          {t('journey')}
        </h2>

        {/*
          خط عمودی تایم‌لاین با border-s ساخته می‌شود نه border-l،
          تا در فارسی سمت راست و در انگلیسی سمت چپ بنشیند.
        */}
        <ol className="mt-4 border-s border-border ps-6">
          {content.timeline.map((step, index) => (
            <li key={step.title} className="relative pb-7 last:pb-0">
              {/*
                نقطه‌ی روی خط تایم‌لاین.

                ⚠️ موقعیتش با insetInlineStart منفی داده می‌شود، نه با
                   کلاس left/right. در RTL خط سمت راست است و در LTR
                   سمت چپ؛ ویژگی منطقی CSS هر دو را بدون شرط پوشش
                   می‌دهد. مقدار ۱.۹۰۵rem = ps-6 (۱.۵rem) + نصف قطر
                   نقطه + ضخامت خط، تا دقیقاً روی خط بنشیند.
              */}
              <span
                aria-hidden="true"
                className="absolute top-1.5 size-3 rounded-full border-2 border-background bg-primary"
                style={{ insetInlineStart: '-1.905rem' }}
              />

              <p className="text-sm font-semibold text-foreground">
                {/*
                  ⚠️ شماره باید با formatNumber محلی‌سازی شود.
                     نوشتن مستقیم {index + 1} رقم لاتین می‌دهد و در
                     صفحه‌ای که آمارش «۱۶۷» و «۳۲» است، «1 2 3 4»
                     بیرون می‌زند و ناهماهنگ دیده می‌شود.
                */}
                <span className="me-2 text-xs text-muted-foreground tabular-nums">
                  {formatNumber(index + 1, locale as Locale)}
                </span>
                {step.title}
              </p>
              <p className="mt-1.5 text-sm leading-7 text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
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

      {/* ============ راه ادامه ============ */}
      <div className="mt-10 flex max-w-3xl flex-col gap-3 sm:flex-row">
        <Link
          href="/products"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-(--radius-md) bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t('exploreStore')}
          <Arrow className="size-4" aria-hidden="true" />
        </Link>

        <Link
          href="/faq"
          className="inline-flex h-11 items-center justify-center rounded-(--radius-md) border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          {t('readFaq')}
        </Link>
      </div>
    </main>
  )
}
