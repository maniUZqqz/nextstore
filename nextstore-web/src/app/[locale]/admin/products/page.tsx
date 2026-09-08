/**
 * صفحه‌ی فهرست محصولات در پنل مدیریت
 * ---------------------------------------------------------------------------
 * مسیر: /fa/admin/products
 *
 * دو پارامتر آدرس پشتیبانی می‌شوند تا کارت‌های هشدار داشبورد بتوانند
 * مستقیم به نمای درست لینک بدهند:
 *     ?status=active   → فقط محصولات منتشرشده
 *     ?low_stock=1     → فقط کالاهای رو به اتمام
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AdminProductsList } from '@/components/admin/AdminProductsList'
import type { ProductStatusValue } from '@/types/admin'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin' })

  return { title: t('products.title') }
}

/** وضعیت‌های معتبر انتشار — هر چیز دیگری نادیده گرفته می‌شود. */
const VALID_STATUSES: ProductStatusValue[] = ['draft', 'active', 'archived']

export default async function AdminProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ status?: string; low_stock?: string; q?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const { status, low_stock: lowStock, q } = await searchParams

  return (
    <AdminProductsList
      initialStatus={VALID_STATUSES.find((value) => value === status)}
      /* هر مقداری جز '0' و رشته‌ی خالی یعنی روشن */
      initialLowStock={lowStock === '1' || lowStock === 'true'}
      /* عبارت جستجو کوتاه نگه داشته می‌شود تا کوئری غول‌آسا نسازد */
      initialSearch={(q ?? '').slice(0, 100)}
    />
  )
}
