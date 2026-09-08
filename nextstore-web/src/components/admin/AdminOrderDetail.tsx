'use client'

/**
 * جزئیات سفارش در پنل مدیریت + فرم تغییر وضعیت
 * ---------------------------------------------------------------------------
 * چیدمان: دو ستون در دسکتاپ، یک ستون در موبایل
 *   ستون اصلی → اقلام سفارش، آدرس، یادداشت مشتری
 *   ستون کناری → وضعیت، فرم تغییر، مشتری، خلاصه مالی
 *
 * ⚠️ مهم‌ترین تصمیم این فایل: گزینه‌های دراپ‌داون «وضعیت جدید» از
 *    سرور می‌آیند (allowedTransitions)، نه از یک آرایه‌ی محلی.
 *
 *    اگر فرانت‌اند خودش قواعد انتقال را تکرار می‌کرد، با اولین
 *    تغییر در OrderStatus بک‌اند، ادمین گزینه‌ای می‌دید که سرور
 *    ردش می‌کند — و پیام خطا هم چیزی توضیح نمی‌داد. حالا اگر
 *    انتقالی مجاز نباشد، اصلاً در فهرست نیست.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import {
  AlertCircle, ArrowRight, ArrowLeft, User, Mail, Phone, MapPin,
  StickyNote, Loader2, CheckCircle2, Package,
} from 'lucide-react'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getAdminOrder, updateOrderStatus } from '@/lib/api/admin'
import type { OrderStatusValue } from '@/types/order'
import { STATUS_CLASSES } from '@/components/account/OrdersList'
import { formatPrice, formatNumber, formatDate, currencyLabel } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

export function AdminOrderDetail({ orderNumber }: { orderNumber: string }) {
  const t = useTranslations('admin')
  const tOrder = useTranslations('order')
  const tCart = useTranslations('cart')
  const tStates = useTranslations('states')
  const tCommon = useTranslations('common')
  const locale = useLocale() as Locale
  const queryClient = useQueryClient()

  /* --- فرم تغییر وضعیت --- */
  const [nextStatus, setNextStatus] = useState<OrderStatusValue | ''>('')
  const [trackingCode, setTrackingCode] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const orderQuery = useQuery({
    queryKey: ['admin', 'order', orderNumber, locale],
    queryFn: () => getAdminOrder(orderNumber),
  })

  const statusMutation = useMutation({
    mutationFn: () =>
      updateOrderStatus(orderNumber, {
        status: nextStatus as OrderStatusValue,
        /* رشته‌ی خالی نباید فرستاده شود — سرور آن را «پاک کن» می‌فهمد */
        tracking_code: trackingCode.trim() || undefined,
        admin_note: adminNote.trim() || undefined,
      }),

    onSuccess: (updated) => {
      /* پاسخ سرور مستقیم در کش می‌نشیند — یک درخواست کمتر */
      queryClient.setQueryData(['admin', 'order', orderNumber, locale], updated)

      /*
       * فهرست سفارش‌ها و داشبورد هم دیگر معتبر نیستند: شمارنده‌ی
       * «در انتظار اقدام» و توزیع وضعیت‌ها تغییر کرده‌اند.
       */
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })

      setNextStatus('')
      setTrackingCode('')
      setAdminNote('')
      setSuccessMessage(t('orders.statusUpdated'))
    },
  })

  /* --- بارگذاری --- */
  if (orderQuery.isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="h-96 animate-pulse rounded-(--radius-lg) border border-border bg-muted" />
        <div className="h-72 animate-pulse rounded-(--radius-lg) border border-border bg-muted" />
      </div>
    )
  }

  /* --- خطا یا سفارش ناموجود --- */
  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div className="flex flex-col items-center rounded-(--radius-lg) border border-border bg-card py-16 text-center">
        <AlertCircle className="size-12 text-warning" aria-hidden="true" />
        <h2 className="mt-4 text-base font-bold text-foreground">{tStates('errorTitle')}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{tStates('errorDesc')}</p>
        <Link
          href="/admin/orders"
          className="mt-5 h-10 rounded-(--radius-md) border border-border px-5 text-sm leading-10 text-foreground hover:bg-accent"
        >
          {t('backToList')}
        </Link>
      </div>
    )
  }

  const order = orderQuery.data
  const address = order.shippingAddress
  const BackIcon = locale === 'fa' ? ArrowRight : ArrowLeft

  /** ردیف‌های زمان‌بندی — فقط مواردی که واقعاً رخ داده‌اند */
  const timeline = [
    { key: 'placedAt', value: order.createdAt },
    { key: 'paidAt', value: order.paidAt },
    { key: 'shippedAt', value: order.shippedAt },
    { key: 'deliveredAt', value: order.deliveredAt },
    { key: 'cancelledAt', value: order.cancelledAt },
  ].filter((row) => row.value)

  /**
   * ردیف‌های خلاصه‌ی مالی.
   *
   * ردیف‌هایی که مقدارشان صفر است پنهان می‌شوند: نمایش «تخفیف: ۰»
   * و «مالیات: ۰» فاکتور را شلوغ می‌کند بی‌آنکه چیزی بگوید.
   */
  const money = [
    { key: 'subtotal', label: tCart('subtotal'), value: order.subtotal, hidden: false },
    { key: 'discount', label: tCart('discount'), value: -order.discount, hidden: order.discount === 0 },
    { key: 'shipping', label: tCart('shipping'), value: order.shippingCost, hidden: false },
    { key: 'tax', label: tCart('tax'), value: order.tax, hidden: order.tax === 0 },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* ================= سرصفحه ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/orders"
            aria-label={t('backToList')}
            className="flex size-9 items-center justify-center rounded-(--radius-md) border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <BackIcon className="size-4" aria-hidden="true" />
          </Link>

          <div>
            <h1 className="font-mono text-lg font-bold text-foreground">
              {order.orderNumber}
            </h1>
            <p className="text-xs text-muted-foreground">
              {order.createdAt ? formatDate(order.createdAt, locale) : t('orders.notYet')}
            </p>
          </div>
        </div>

        <span
          className={cn(
            'inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium',
            STATUS_CLASSES[order.statusColor],
          )}
        >
          {order.statusLabel}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem] lg:items-start">
        {/* ============ ستون اصلی ============ */}
        <div className="flex flex-col gap-4">
          {/* --- اقلام سفارش --- */}
          <section className="rounded-(--radius-lg) border border-border bg-card">
            <h2 className="border-b border-border px-4 py-3 text-sm font-bold text-foreground">
              {tOrder('items')}
            </h2>

            <ul className="divide-y divide-border">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 p-3">
                  {/*
                    تصویر از عکس لحظه‌ای سفارش می‌آید و ممکن است null
                    باشد (محصول حذف شده). جای خالی با آیکون پر می‌شود
                    تا چیدمان نپرد.
                  */}
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-(--radius-md) border border-border bg-muted">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <Package
                        className="absolute inset-0 m-auto size-6 text-muted-foreground"
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{item.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {item.sku}
                    </p>
                  </div>

                  <div className="shrink-0 text-end">
                    <p className="text-sm font-semibold text-foreground">
                      {formatPrice(item.lineTotal, locale)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatNumber(item.quantity, locale)} × {formatPrice(item.unitPrice, locale)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* --- آدرس تحویل --- */}
          <section className="rounded-(--radius-lg) border border-border bg-card p-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <MapPin className="size-4 text-muted-foreground" aria-hidden="true" />
              {tOrder('shippingAddress')}
            </h2>

            <div className="mt-3 space-y-1 text-sm leading-6 text-muted-foreground">
              <p className="text-foreground">{address.recipientName}</p>
              <p dir="ltr" className="text-start font-mono">
                {address.recipientPhone}
              </p>
              <p>
                {address.province}، {address.city}، {address.street}
                {address.buildingNo ? `، ${address.buildingNo}` : ''}
                {address.unit ? `، ${address.unit}` : ''}
              </p>
              {address.postalCode && (
                <p dir="ltr" className="text-start font-mono">
                  {address.postalCode}
                </p>
              )}
            </div>
          </section>

          {/* --- یادداشت مشتری (اگر باشد) --- */}
          {order.customerNote && (
            <section className="rounded-(--radius-lg) border border-border bg-card p-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
                <StickyNote className="size-4 text-muted-foreground" aria-hidden="true" />
                {tOrder('customerNote')}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {order.customerNote}
              </p>
            </section>
          )}
        </div>

        {/* ============ ستون کناری ============ */}
        <div className="flex flex-col gap-4">
          {/* --- فرم تغییر وضعیت --- */}
          <section className="rounded-(--radius-lg) border border-border bg-card p-4">
            <h2 className="text-sm font-bold text-foreground">{t('orders.changeStatus')}</h2>

            {order.allowedTransitions.length === 0 ? (
              /*
               * وضعیت پایانی (تحویل‌شده، لغوشده، مرجوع). نمایش فرم
               * غیرفعال گیج‌کننده است؛ یک جمله‌ی روشن بهتر است.
               */
              <p className="mt-3 rounded-(--radius-md) bg-muted px-3 py-2.5 text-xs leading-5 text-muted-foreground">
                {t('orders.noTransitions')}
              </p>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  setSuccessMessage('')
                  statusMutation.mutate()
                }}
                className="mt-3 flex flex-col gap-3"
              >
                <div>
                  <label
                    htmlFor="next-status"
                    className="mb-1.5 block text-xs text-muted-foreground"
                  >
                    {t('orders.newStatus')}
                  </label>
                  <select
                    id="next-status"
                    required
                    value={nextStatus}
                    onChange={(event) =>
                      setNextStatus(event.target.value as OrderStatusValue | '')
                    }
                    className="h-10 w-full rounded-(--radius-md) border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-primary"
                  >
                    <option value="">{t('orders.selectStatus')}</option>
                    {order.allowedTransitions.map((transition) => (
                      <option key={transition.value} value={transition.value}>
                        {transition.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/*
                  کد رهگیری فقط وقتی معنا دارد که سفارش ارسال شود.
                  نمایش همیشگی‌اش فرم را شلوغ می‌کند.
                */}
                {nextStatus === 'shipped' && (
                  <div>
                    <label
                      htmlFor="tracking-code"
                      className="mb-1.5 block text-xs text-muted-foreground"
                    >
                      {t('orders.trackingCode')}
                    </label>
                    <input
                      id="tracking-code"
                      type="text"
                      dir="ltr"
                      value={trackingCode}
                      onChange={(event) => setTrackingCode(event.target.value)}
                      placeholder={t('orders.trackingPlaceholder')}
                      className="h-10 w-full rounded-(--radius-md) border border-border bg-background px-3 text-start font-mono text-sm text-foreground outline-none placeholder:font-sans placeholder:text-muted-foreground focus-visible:border-primary"
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="admin-note"
                    className="mb-1.5 block text-xs text-muted-foreground"
                  >
                    {t('orders.adminNote')}
                  </label>
                  <textarea
                    id="admin-note"
                    rows={3}
                    value={adminNote}
                    onChange={(event) => setAdminNote(event.target.value)}
                    placeholder={t('orders.adminNotePlaceholder')}
                    className="w-full resize-y rounded-(--radius-md) border border-border bg-background px-3 py-2 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!nextStatus || statusMutation.isPending}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-(--radius-md) bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {statusMutation.isPending && (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  )}
                  {t('orders.apply')}
                </button>
              </form>
            )}

            {/*
              ⚠️ پیام نتیجه عمداً *بیرون* از فرم است.
                 پیش‌تر داخل فرم بود و یک باگ ظریف می‌ساخت: وقتی
                 ادمین آخرین انتقال را می‌زد (مثلاً «تحویل شده»)،
                 allowedTransitions خالی می‌شد، فرم از DOM حذف
                 می‌شد و پیام موفقیت هم با آن می‌رفت. یعنی دقیقاً
                 در مهم‌ترین لحظه، ادمین هیچ تأییدی نمی‌دید و
                 نمی‌دانست تغییر ثبت شده یا نه.

                 aria-live هم تضمین می‌کند کاربر صفحه‌خوان نتیجه را
                 بشنود؛ بدون آن تغییر متن بی‌صدا رخ می‌دهد.
            */}
            <p aria-live="polite" className="mt-3 min-h-4">
              {statusMutation.isError && (
                <span className="text-xs text-destructive">
                  {statusMutation.error instanceof Error
                    ? statusMutation.error.message
                    : tCommon('error')}
                </span>
              )}
              {successMessage && (
                <span className="inline-flex items-center gap-1.5 text-xs text-success">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  {successMessage}
                </span>
              )}
            </p>
          </section>

          {/* --- مشتری --- */}
          <section className="rounded-(--radius-lg) border border-border bg-card p-4">
            <h2 className="text-sm font-bold text-foreground">
              {t('orders.customerAccount')}
            </h2>

            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <User className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">
                  {order.customer.name ?? address.recipientName}
                </span>
              </li>

              {order.customer.email ? (
                <li className="flex items-center gap-2">
                  <Mail className="size-4 shrink-0" aria-hidden="true" />
                  <span dir="ltr" className="truncate">
                    {order.customer.email}
                  </span>
                </li>
              ) : (
                /* سفارش مهمان یا حساب حذف‌شده */
                <li className="text-xs">{t('orders.guest')}</li>
              )}

              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0" aria-hidden="true" />
                <span dir="ltr" className="font-mono">
                  {order.customer.phone ?? address.recipientPhone}
                </span>
              </li>
            </ul>
          </section>

          {/* --- خلاصه مالی --- */}
          <section className="rounded-(--radius-lg) border border-border bg-card p-4">
            <h2 className="text-sm font-bold text-foreground">{t('orders.invoice')}</h2>

            <dl className="mt-3 space-y-2 text-sm">
              {money
                .filter((row) => !row.hidden)
                .map((row) => (
                  <div key={row.key} className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="text-foreground">{formatPrice(row.value, locale)}</dd>
                  </div>
                ))}

              <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
                <dt className="font-medium text-foreground">{tOrder('total')}</dt>
                <dd className="font-bold text-foreground">
                  {formatPrice(order.total, locale)}
                  <span className="ms-1 text-xs font-normal text-muted-foreground">
                    {currencyLabel(locale)}
                  </span>
                </dd>
              </div>
            </dl>

            {order.payment && (
              <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                {order.payment.gateway} — {order.payment.statusLabel}
                {order.payment.trackingNumber && (
                  <span dir="ltr" className="ms-1 font-mono">
                    #{order.payment.trackingNumber}
                  </span>
                )}
              </p>
            )}
          </section>

          {/* --- زمان‌بندی --- */}
          <section className="rounded-(--radius-lg) border border-border bg-card p-4">
            <h2 className="text-sm font-bold text-foreground">{t('orders.history')}</h2>

            <ol className="mt-3 space-y-2 text-sm">
              {timeline.map((row) => (
                <li key={row.key} className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">{t(`orders.${row.key}`)}</span>
                  <span className="text-xs text-foreground">
                    {formatDate(row.value as string, locale)}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          {/* --- یادداشت داخلی ثبت‌شده --- */}
          <section className="rounded-(--radius-lg) border border-border bg-card p-4">
            <h2 className="text-sm font-bold text-foreground">
              {t('orders.internalNote')}
            </h2>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              {order.adminNote || t('orders.noNote')}
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
