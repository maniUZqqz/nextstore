/**
 * صفحه‌ی شبیه‌سازی درگاه پرداخت
 * ---------------------------------------------------------------------------
 * ⚠️ این صفحه جای «صفحه‌ی بانک» را می‌گیرد.
 *
 *    در پروژه‌ی واقعی، کاربر پس از ثبت سفارش به سایت بانک هدایت
 *    می‌شود، رمز کارت را وارد می‌کند و بانک او را برمی‌گرداند.
 *
 *    چون نمونه‌کار نمی‌تواند درگاه واقعی داشته باشد (نیاز به قرارداد
 *    بانکی و نماد اعتماد)، این صفحه همان *قرارداد* را شبیه‌سازی
 *    می‌کند: کاربر می‌تواند پرداخت موفق یا ناموفق را انتخاب کند،
 *    پس هر دو مسیر قابل نمایش است.
 */

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Loader2 } from 'lucide-react'
import { MockGateway } from '@/components/checkout/MockGateway'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'gateway' })

  return {
    title: t('title'),
    robots: { index: false, follow: false },
  }
}

export default async function GatewayPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main id="main-content" className="mx-auto max-w-lg px-4 py-10 sm:py-16">
      {/*
        مرز Suspense الزامی است.

        MockGateway از useSearchParams استفاده می‌کند تا پارامترهای
        بازگشتی درگاه (ref، amount، order) را بخواند. این هوک در
        زمان پیش‌رندر مقداری ندارد، پس Next.js بدون Suspense خطای
        بیلد می‌دهد:
            "useSearchParams() should be wrapped in a suspense boundary"

        با این مرز، پوسته‌ی صفحه ایستا پیش‌رندر می‌شود و فقط همین
        بخش در مرورگر پر می‌شود.
      */}
      <Suspense
        fallback={
          <div className="flex flex-col items-center rounded-(--radius-lg) border border-border bg-card p-10 text-center">
            <Loader2 className="size-10 animate-spin text-primary" aria-hidden="true" />
          </div>
        }
      >
        <MockGateway />
      </Suspense>
    </main>
  )
}
