/**
 * صفحه‌ی پرسش‌های متداول
 * ===========================================================================
 * مسیر: /fa/faq · /en/faq
 *
 * ساختار: عنوان → جستجو و آکاردئون (کلاینتی) → کارت «هنوز جواب نگرفتید؟»
 *
 * ⚠️ فقط آکاردئون کلاینتی است، نه کل صفحه. عنوان، بردکرامب و کارت
 *    پایانی روی سرور رندر می‌شوند، پس متن پرسش‌ها در HTML اولیه
 *    هست و موتور جستجو آن را می‌بیند — حتی اگر جاوااسکریپت اجرا
 *    نشود.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { LifeBuoy } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { FaqAccordion } from '@/components/common/FaqAccordion'
import { faqContent } from '@/content/faq'
import { pickLocale } from '@/content/types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const content = pickLocale(faqContent, locale)

  return { title: content.title, description: content.subtitle }
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('faq')
  const tNav = await getTranslations('nav')

  const content = pickLocale(faqContent, locale)

  return (
    <main
      id="main-content"
      className="mx-auto max-w-(--container-content) px-4 py-4 sm:px-6 lg:px-8"
    >
      <Breadcrumb
        items={[{ label: tNav('home'), href: '/' }, { label: content.title }]}
      />

      <header className="mt-3 max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          {content.title}
        </h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground sm:text-base">
          {content.subtitle}
        </p>
      </header>

      <div className="max-w-3xl">
        <FaqAccordion categories={content.categories} />

        {/*
          راه خروج برای کسی که جوابش را پیدا نکرد.
          صفحه‌ی پرسش‌های متداول بدون این کارت، برای آن کاربر بن‌بست
          است — همان مشکلی که در حالت «نتیجه‌ای یافت نشد» جستجو هم
          برطرف شد.
        */}
        <aside className="mt-8 flex flex-col items-start gap-3 rounded-(--radius-lg) border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <LifeBuoy className="size-5" aria-hidden="true" />
            </span>
            <p className="text-sm font-medium text-foreground">
              {t('stillNeedHelp')}
            </p>
          </div>

          <Link
            href="/contact"
            className="inline-flex h-10 shrink-0 items-center rounded-(--radius-md) bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {t('contactUs')}
          </Link>
        </aside>
      </div>
    </main>
  )
}
