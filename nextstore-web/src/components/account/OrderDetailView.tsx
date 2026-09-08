'use client'

/**
 * جزئیات یک سفارش
 * ---------------------------------------------------------------------------
 * نمایش می‌دهد:
 *   نوار پیشرفت وضعیت · اقلام · آدرس تحویل · اطلاعات پرداخت · خلاصه مالی
 *   و در صورت امکان، دکمه‌های «پرداخت» و «لغو سفارش»
 *
 * ⚠️ نام و قیمت اقلام از عکس لحظه‌ی خرید خوانده می‌شوند، نه از
 *    کاتالوگ فعلی. اگر ادمین فردا قیمت را عوض کند، این فاکتور
 *    تغییر نمی‌کند — همان چیزی که مشتری پرداخت کرده است.
 */

import { useState } from 'react'
import Image from 'next/image'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import {
  Package, MapPin, CreditCard, Check, X, AlertCircle,
  Loader2, StickyNote, Truck, ShoppingBag,
} from 'lucide-react'
import { toast } from 'sonner'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getOrder, cancelOrder, initiatePayment } from '@/lib/api/orders'
import { ApiError } from '@/lib/api/client'
import { formatPrice, formatNumber, formatDate, currencyLabel } from '@/lib/utils/format'
import { STATUS_CLASSES } from './OrdersList'
import { cn } from '@/lib/utils/cn'

/** مراحل چرخه‌ی سفارش — همان ترتیب OrderStatus در بک‌اند. */
const TIMELINE = ['pending', 'paid', 'processing', 'shipped', 'delivered'] as const

export function OrderDetailView({ orderNumber }: { orderNumber: string }) {
  const t = useTranslations('order')
  const tCart = useTranslations('cart')
  const tCommon = useTranslations('common')
  const tStates = useTranslations('states')
  const locale = useLocale() as Locale

  const queryClient = useQueryClient()
  const [isPaying, setIsPaying] = useState(false)

  const orderQuery = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => getOrder(orderNumber),
  })

  /** لغو سفارش — موجودی کالاها در بک‌اند بازگردانده می‌شود. */
  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(orderNumber),
    onSuccess: (order) => {
      queryClient.setQueryData(['order', orderNumber], order)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success(t('cancelled'))
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : tCommon('error'))
    },
  })

  /** ادامه‌ی پرداخت سفارشی که ناتمام مانده است. */
  const handlePay = async () => {
    setIsPaying(true)
    try {
      const callback = `${window.location.origin}/${locale}/checkout/gateway`
      const { redirectUrl } = await initiatePayment(orderNumber, 'mock', callback)
      window.location.href = redirectUrl
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : tCommon('error'))
      setIsPaying(false)
    }
  }

  /* --- حالت بارگذاری --- */
  if (orderQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-(--radius-lg) border border-border bg-muted" />
        <div className="h-64 animate-pulse rounded-(--radius-lg) border border-border bg-muted" />
        <div className="h-40 animate-pulse rounded-(--radius-lg) border border-border bg-muted" />
      </div>
    )
  }

  /* --- حالت خطا --- */
  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div className="flex flex-col items-center rounded-(--radius-lg) border border-border bg-card py-16 text-center">
        <AlertCircle className="size-12 text-warning" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-bold text-foreground">{tStates('errorTitle')}</h2>
        <Link
          href="/account/orders"
          className="mt-5 inline-flex h-10 items-center rounded-(--radius-md) bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          {t('title')}
        </Link>
      </div>
    )
  }

  const order = orderQuery.data
  const address = order.shippingAddress
  /* وضعیت لغو یا بازگشت وجه، مرحله‌ی صفر دارد و نوار پیشرفت معنا ندارد */
  const isAborted = order.statusStep === 0

  return (
    <div className="flex flex-col gap-5">
      {/* ==========================================================
          سرصفحه: شماره، تاریخ، وضعیت
          ========================================================== */}
      <section className="rounded-(--radius-lg) border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('orderNumber')}</span>
              <span className="font-mono text-base font-bold text-foreground" dir="ltr">
                {order.orderNumber}
              </span>
            </p>

            {order.createdAt && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t('date')}: {formatDate(order.createdAt, locale)}
              </p>
            )}
          </div>

          <span
            className={cn(
              'rounded-(--radius-sm) px-3 py-1.5 text-sm font-semibold',
              STATUS_CLASSES[order.statusColor],
            )}
          >
            {order.statusLabel}
          </span>
        </div>

        {/* --- نوار پیشرفت سفارش --- */}
        {!isAborted && (
          <ol className="mt-6 flex items-center">
            {TIMELINE.map((stage, index) => {
              const stepNumber = index + 1
              const isDone = order.statusStep >= stepNumber
              const isCurrent = order.statusStep === stepNumber

              return (
                <li key={stage} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <span
                      className={cn(
                        'flex size-8 items-center justify-center rounded-full text-xs font-bold transition-colors',
                        isDone
                          ? 'bg-success text-success-foreground'
                          : 'bg-muted text-muted-foreground',
                        /* مرحله‌ی جاری با حلقه مشخص می‌شود */
                        isCurrent && 'ring-2 ring-success/30 ring-offset-2 ring-offset-card',
                      )}
                    >
                      {isDone ? (
                        <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                      ) : (
                        formatNumber(stepNumber, locale)
                      )}
                    </span>

                    <span
                      className={cn(
                        'whitespace-nowrap text-[10px] sm:text-xs',
                        isDone ? 'font-medium text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {t(`timeline.${stage}`)}
                    </span>
                  </div>

                  {/* خط اتصال بین مراحل */}
                  {index < TIMELINE.length - 1 && (
                    <span
                      className={cn(
                        'mx-1 mb-5 h-0.5 flex-1 rounded-full transition-colors',
                        order.statusStep > stepNumber ? 'bg-success' : 'bg-border',
                      )}
                      aria-hidden="true"
                    />
                  )}
                </li>
              )
            })}
          </ol>
        )}

        {/* --- دکمه‌های اقدام --- */}
        {(order.status === 'pending' || order.isCancellable) && (
          <div className="mt-5 flex flex-wrap gap-2.5">
            {order.status === 'pending' && (
              <button
                type="button"
                onClick={handlePay}
                disabled={isPaying}
                className="inline-flex h-11 items-center gap-2 rounded-(--radius-md) bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isPaying ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <CreditCard className="size-4" aria-hidden="true" />
                )}
                {t('payNow')}
              </button>
            )}

            {order.isCancellable && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(t('cancelConfirm'))) cancelMutation.mutate()
                }}
                disabled={cancelMutation.isPending}
                className="inline-flex h-11 items-center gap-2 rounded-(--radius-md) border border-border px-5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
              >
                {cancelMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <X className="size-4" aria-hidden="true" />
                )}
                {t('cancel')}
              </button>
            )}
          </div>
        )}
      </section>

      {/* ==========================================================
          اقلام سفارش
          ========================================================== */}
      <section className="rounded-(--radius-lg) border border-border bg-card">
        <h2 className="flex items-center gap-2 border-b border-border px-4 py-3.5 text-sm font-bold text-foreground sm:px-5">
          <ShoppingBag className="size-4" aria-hidden="true" />
          {t('items')}
        </h2>

        <ul className="divide-y divide-border">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-3 p-4 sm:gap-4 sm:px-5">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-(--radius-md) bg-muted sm:size-20">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center p-1 text-center text-[10px] text-muted-foreground">
                    {item.name}
                  </span>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                {/* اگر محصول هنوز در کاتالوگ باشد، لینک می‌شود */}
                {item.slug ? (
                  <Link
                    href={`/products/${item.slug}`}
                    className="line-clamp-2 text-sm font-medium text-foreground hover:text-primary"
                  >
                    {item.name}
                  </Link>
                ) : (
                  <span className="line-clamp-2 text-sm font-medium text-foreground">
                    {item.name}
                  </span>
                )}

                <span className="text-xs text-muted-foreground" dir="ltr">
                  {item.sku}
                </span>

                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">
                    {formatPrice(item.unitPrice, locale)} × {formatNumber(item.quantity, locale)}
                  </span>

                  <span className="text-sm font-bold text-foreground" data-price>
                    {formatPrice(item.lineTotal, locale)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* --- خلاصه مالی --- */}
        <dl className="space-y-2.5 border-t border-border p-4 text-sm sm:px-5">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">{tCart('subtotal')}</dt>
            <dd className="font-medium text-foreground" data-price>
              {formatPrice(order.subtotal, locale)}
            </dd>
          </div>

          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">{tCart('shipping')}</dt>
            <dd
              className={cn(
                'font-medium',
                order.shippingCost === 0 ? 'text-success' : 'text-foreground',
              )}
              data-price
            >
              {order.shippingCost === 0
                ? tCommon('free')
                : formatPrice(order.shippingCost, locale)}
            </dd>
          </div>

          {order.discount > 0 && (
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">{tCart('discount')}</dt>
              <dd className="font-medium text-success" data-price>
                −{formatPrice(order.discount, locale)}
              </dd>
            </div>
          )}

          <hr className="border-border" />

          <div className="flex items-baseline justify-between">
            <dt className="font-bold text-foreground">{tCart('total')}</dt>
            <dd className="flex items-baseline gap-1">
              <span className="text-lg font-black text-foreground" data-price>
                {formatPrice(order.total, locale)}
              </span>
              <span className="text-[11px] text-muted-foreground">{currencyLabel(locale)}</span>
            </dd>
          </div>
        </dl>
      </section>

      {/* ==========================================================
          آدرس تحویل و اطلاعات پرداخت
          ========================================================== */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* --- آدرس --- */}
        <section className="rounded-(--radius-lg) border border-border bg-card p-4 sm:p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
            <MapPin className="size-4" aria-hidden="true" />
            {t('shippingAddress')}
          </h2>

          <p className="text-sm font-medium text-foreground">{address.recipientName}</p>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            {[address.province, address.city, address.street]
              .filter(Boolean)
              .join('، ')}
            {address.buildingNo && `، پلاک ${address.buildingNo}`}
            {address.unit && `، واحد ${address.unit}`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
            {address.recipientPhone}
          </p>

          {address.postalCode && (
            <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
              {address.postalCode}
            </p>
          )}

          <p className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
            <Truck className="size-3.5" aria-hidden="true" />
            {t('shippingMethod')}: {order.shippingMethod}
          </p>
        </section>

        {/* --- پرداخت --- */}
        <section className="rounded-(--radius-lg) border border-border bg-card p-4 sm:p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
            <CreditCard className="size-4" aria-hidden="true" />
            {t('paymentInfo')}
          </h2>

          {order.payment ? (
            <dl className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{t('status')}</dt>
                <dd
                  className={cn(
                    'font-medium',
                    order.payment.status === 'succeeded' ? 'text-success' : 'text-muted-foreground',
                  )}
                >
                  {order.payment.statusLabel}
                </dd>
              </div>

              {order.payment.trackingNumber && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">
                    {locale === 'fa' ? 'شماره پیگیری' : 'Tracking number'}
                  </dt>
                  <dd className="font-mono font-medium text-foreground" dir="ltr">
                    {order.payment.trackingNumber}
                  </dd>
                </div>
              )}

              {order.payment.paidAt && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">
                    {locale === 'fa' ? 'زمان پرداخت' : 'Paid at'}
                  </dt>
                  <dd className="text-foreground">
                    {formatDate(order.payment.paidAt, locale)}
                  </dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-xs text-muted-foreground">
              {locale === 'fa' ? 'هنوز پرداختی ثبت نشده است' : 'No payment recorded yet'}
            </p>
          )}
        </section>
      </div>

      {/* ==========================================================
          یادداشت مشتری
          ========================================================== */}
      {order.customerNote && (
        <section className="rounded-(--radius-lg) border border-border bg-muted p-4">
          <h2 className="mb-2 flex items-center gap-2 text-xs font-bold text-foreground">
            <StickyNote className="size-3.5" aria-hidden="true" />
            {t('customerNote')}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">{order.customerNote}</p>
        </section>
      )}

      <Link
        href="/account/orders"
        className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Package className="size-4" aria-hidden="true" />
        {t('title')}
      </Link>
    </div>
  )
}
