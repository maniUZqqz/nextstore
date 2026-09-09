'use client'

/**
 * فاکتور قابل چاپ سفارش
 * ---------------------------------------------------------------------------
 * ⚠️ چرا صفحه‌ی چاپ و نه تولید PDF در سرور؟
 *
 *    گزینه‌ی رایج `dompdf` است، ولی متن فارسی را درست نمی‌سازد: حروف
 *    را به هم نمی‌چسباند و راست‌به‌چپ را وارونه می‌چیند. راه‌حل‌هایش
 *    (تعبیه‌ی فونت، وارونه‌سازی دستی رشته‌ها) شکننده‌اند و با هر تغییر
 *    قالب دوباره می‌شکنند.
 *
 *    مرورگر همین کار را بی‌نقص انجام می‌دهد: فونت وزیرمتن، اتصال
 *    حروف، جهت متن، و اعداد فارسی — همه همان‌طور که در سایت دیده
 *    می‌شوند. کاربر با Ctrl+P خروجی PDF می‌گیرد که کیفیتش از هر
 *    کتابخانه‌ی سمت سرور بهتر است.
 *
 *    هزینه‌اش یک کلیک اضافه است. سودش این است که فاکتور در هر دو زبان
 *    درست در می‌آید و هیچ وابستگی تازه‌ای هم اضافه نمی‌شود.
 *
 * ⚠️ این صفحه **هیچ عنصر ناوبری ندارد** — نه هدر، نه فوتر، نه منو.
 *    فاکتور سندی است که ممکن است به‌عنوان مدرک نگه داشته شود؛ منوی
 *    سایت روی آن فقط جوهر هدر می‌دهد.
 */

import { useQuery } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { Printer, ArrowRight, AlertCircle } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getOrder } from '@/lib/api/orders'
import { getSiteSettings } from '@/lib/api/settings'
import { formatPrice, formatNumber, formatDateTime, currencyLabel } from '@/lib/utils/format'

export function OrderInvoice({ orderNumber }: { orderNumber: string }) {
  const t = useTranslations('invoice')
  const tOrder = useTranslations('order')
  const tStates = useTranslations('states')
  const locale = useLocale() as Locale

  const orderQuery = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => getOrder(orderNumber),
  })

  /*
   * اطلاعات فروشگاه — نام، تلفن، نشانی.
   *
   * ⚠️ از تنظیمات می‌آید نه از متن ثابت: فاکتوری که شماره‌ی قدیمی
   *    فروشگاه را چاپ کند، مشتری را به جایی می‌فرستد که جواب نمی‌دهد.
   */
  const settingsQuery = useQuery({
    queryKey: ['settings', locale],
    queryFn: () => getSiteSettings(locale),
    staleTime: 60 * 60 * 1000,
  })

  if (orderQuery.isLoading) {
    return <div className="h-96 animate-pulse rounded-(--radius-lg) bg-muted" aria-hidden="true" />
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
        <AlertCircle className="size-12 text-warning" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-bold text-foreground">{tStates('errorTitle')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{tStates('errorDesc')}</p>
      </div>
    )
  }

  const order = orderQuery.data
  const settings = settingsQuery.data
  const address = order.shippingAddress
  const unit = currencyLabel(locale)

  /** یک ردیف از جدول جمع‌بندی. */
  const summaryRow = (label: string, value: number, options?: { muted?: boolean; bold?: boolean }) => (
    <tr className={options?.bold ? 'border-t border-neutral-300 font-bold' : undefined}>
      <td className="py-1.5 text-start">{label}</td>
      <td className={`py-1.5 text-end tabular-nums ${options?.muted ? 'text-neutral-500' : ''}`}>
        {formatPrice(value, locale)} {unit}
      </td>
    </tr>
  )

  return (
    <>
      {/*
        نوار ابزار — فقط روی صفحه، نه روی کاغذ.

        ⚠️ `print:hidden` روی هر چیزی که سند نیست: دکمه‌ی چاپ روی
           فاکتور چاپ‌شده، هم بی‌معناست و هم جای محتوا را می‌گیرد.
      */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/account/orders/${order.orderNumber}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowRight className="rtl-flip size-4" aria-hidden="true" />
          {t('backToOrder')}
        </Link>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-10 items-center gap-2 rounded-(--radius-md) bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Printer className="size-4" aria-hidden="true" />
          {t('print')}
        </button>
      </div>

      <p className="mb-6 flex items-start gap-2 rounded-(--radius-md) border border-info/30 bg-info/10 px-3.5 py-3 text-xs leading-6 text-foreground print:hidden">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
        {t('saveHint')}
      </p>

      {/*
        خودِ سند.

        ⚠️ رنگ‌ها اینجا **ثابت** هستند، نه توکن تم.

           فاکتور روی کاغذ سفید چاپ می‌شود. اگر کاربر تم تاریک داشته
           باشد و از توکن‌ها استفاده می‌کردیم، متن روشن روی کاغذ سفید
           تقریباً نامرئی در می‌آمد — و کاربر تازه بعد از چاپ می‌فهمید.
      */}
      <article className="rounded-(--radius-lg) border border-neutral-300 bg-white p-6 text-neutral-900 sm:p-8 print:rounded-none print:border-0 print:p-0">
        {/* ---------- سربرگ ---------- */}
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-300 pb-5">
          <div>
            <h1 className="text-xl font-bold">{settings?.siteName ?? 'NextStore'}</h1>

            <div className="mt-2 space-y-0.5 text-xs leading-6 text-neutral-600">
              {settings?.contactAddress && <p>{settings.contactAddress}</p>}
              {settings?.contactPhone && <p dir="ltr" className="text-start">{settings.contactPhone}</p>}
              {settings?.contactEmail && <p dir="ltr" className="text-start">{settings.contactEmail}</p>}
            </div>
          </div>

          <div className="text-end">
            <p className="text-lg font-bold">{t('title')}</p>
            <p className="mt-1 text-sm tabular-nums" dir="ltr">{order.orderNumber}</p>
            {order.createdAt && (
              <p className="mt-1 text-xs text-neutral-600">
                {formatDateTime(order.createdAt, locale)}
              </p>
            )}
          </div>
        </header>

        {/* ---------- گیرنده ---------- */}
        <section className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <h2 className="text-xs font-bold text-neutral-500">{t('billTo')}</h2>
            <p className="mt-1.5 text-sm font-medium">{address.recipientName}</p>
            <p className="mt-0.5 text-xs leading-6 text-neutral-600">
              {/*
                ⚠️ جداکننده به زبان وابسته است: ویرگول فارسی «،» در متن
                   انگلیسی غلط دیده می‌شود و برعکس.
              */}
              {[address.province, address.city, address.street]
                .filter(Boolean)
                .join(locale === 'fa' ? '، ' : ', ')}

              {/* پلاک و واحد فقط وقتی ثبت شده‌اند */}
              {address.buildingNo && (
                <>
                  {locale === 'fa' ? '، پلاک ' : ', No. '}
                  <span dir="ltr">{address.buildingNo}</span>
                </>
              )}
              {address.unit && (
                <>
                  {locale === 'fa' ? '، واحد ' : ', Unit '}
                  <span dir="ltr">{address.unit}</span>
                </>
              )}

              {address.postalCode && (
                <>
                  <br />
                  {t('postalCode')}: <span dir="ltr">{address.postalCode}</span>
                </>
              )}
            </p>
            <p dir="ltr" className="mt-0.5 text-start text-xs text-neutral-600">
              {address.recipientPhone}
            </p>
          </div>

          <div>
            <h2 className="text-xs font-bold text-neutral-500">{t('orderInfo')}</h2>
            <dl className="mt-1.5 space-y-1 text-xs leading-6">
              <div className="flex gap-2">
                <dt className="text-neutral-600">{tOrder('status')}:</dt>
                <dd className="font-medium">{order.statusLabel}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-neutral-600">{t('shippingMethod')}:</dt>
                <dd className="font-medium">{order.shippingMethodLabel}</dd>
              </div>
              {order.payment && (
                <div className="flex gap-2">
                  <dt className="text-neutral-600">{t('paymentStatus')}:</dt>
                  <dd className="font-medium">{order.payment.statusLabel}</dd>
                </div>
              )}
            </dl>
          </div>
        </section>

        {/* ---------- اقلام ---------- */}
        <table className="mt-6 w-full text-sm">
          <caption className="sr-only">{t('items')}</caption>

          <thead>
            <tr className="border-y border-neutral-300 text-xs text-neutral-600">
              <th scope="col" className="py-2 text-start font-medium">{t('product')}</th>
              <th scope="col" className="py-2 text-end font-medium">{t('unitPrice')}</th>
              <th scope="col" className="py-2 text-end font-medium">{t('quantity')}</th>
              <th scope="col" className="py-2 text-end font-medium">{t('lineTotal')}</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-200">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="py-2.5 text-start">
                  <span className="block">{item.name}</span>
                  {item.sku && (
                    <code dir="ltr" className="block text-[11px] text-neutral-500">{item.sku}</code>
                  )}
                </td>
                <td className="py-2.5 text-end tabular-nums">{formatPrice(item.unitPrice, locale)}</td>
                <td className="py-2.5 text-end tabular-nums">{formatNumber(item.quantity, locale)}</td>
                <td className="py-2.5 text-end tabular-nums">{formatPrice(item.lineTotal, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ---------- جمع‌بندی ---------- */}
        <div className="mt-5 flex justify-end">
          <table className="w-full max-w-xs text-sm">
            <tbody>
              {summaryRow(t('subtotal'), order.subtotal)}

              {/* تخفیف فقط وقتی وجود دارد نمایش داده می‌شود */}
              {order.discount > 0 && summaryRow(t('discount'), -order.discount, { muted: true })}

              {summaryRow(t('shipping'), order.shippingCost, { muted: order.shippingCost === 0 })}
              {order.tax > 0 && summaryRow(t('tax'), order.tax, { muted: true })}
              {summaryRow(t('total'), order.total, { bold: true })}
            </tbody>
          </table>
        </div>

        {order.customerNote && (
          <section className="mt-6 border-t border-neutral-300 pt-4">
            <h2 className="text-xs font-bold text-neutral-500">{t('note')}</h2>
            <p className="mt-1 text-xs leading-6 text-neutral-700">{order.customerNote}</p>
          </section>
        )}

        <footer className="mt-8 border-t border-neutral-300 pt-4 text-center text-[11px] leading-6 text-neutral-500">
          <p>{t('thanks', { store: settings?.siteName ?? 'NextStore' })}</p>
          <p className="mt-0.5">{t('footerNote')}</p>
        </footer>
      </article>
    </>
  )
}
