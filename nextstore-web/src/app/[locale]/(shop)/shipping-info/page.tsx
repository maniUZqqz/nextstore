/**
 * صفحه‌ی «shipping-info»
 * ===========================================================================
 * مسیر: /fa/shipping-info · /en/shipping-info
 *
 * ⚠️ متن این صفحه از `src/content` می‌آید، نه از `messages/*.json`.
 *    دلیلش در src/content/README.md توضیح داده شده: next-intl تمام
 *    پیام‌ها را در payload هر صفحه جاسازی می‌کند، پس متن بلند صفحات
 *    محتوایی روی صفحه‌ی اصلی و سبد خرید هم فرستاده می‌شد.
 *
 *    چون این یک Server Component است، ماژول محتوا اصلاً به مرورگر
 *    نمی‌رود — نه در payload، نه در باندل.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { ContentPageShell } from '@/components/common/ContentPageShell'
import { shippingContent } from '@/content/support'
import { pickLocale, interpolate } from '@/content/types'
import { contentValues } from '@/content/values'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const content = pickLocale(shippingContent, locale)

  return { title: content.title, description: content.subtitle }
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('footer')

  /*
   * ⚠️ مبالغ ارسال از `config/shop.php` بک‌اند درج می‌شوند، نه از
   *    متن ثابت.
   *
   *    پیش‌تر همان اعداد داخل متن نوشته شده بودند و روزی که
   *    فروشگاه نرخ را عوض می‌کرد، این صفحه به مشتری عددی
   *    می‌گفت که صندوق قبولش نداشت — و مشتری می‌توانست همین
   *    صفحه را اسکرین‌شات بگیرد و حق هم داشته باشد.
   */
  const values = await contentValues(locale)

  return (
    <ContentPageShell
      content={interpolate(pickLocale(shippingContent, locale), values)}
      breadcrumbLabel={t('links.shipping')}
    />
  )
}
