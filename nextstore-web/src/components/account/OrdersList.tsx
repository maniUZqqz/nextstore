'use client'

/**
 * فهرست سفارش‌های کاربر
 * ---------------------------------------------------------------------------
 * پوشش حالت‌ها: loading · empty · error · success
 *
 * هر کارت سفارش نشان می‌دهد:
 *   شماره سفارش · تاریخ · وضعیت رنگی · تعداد اقلام · مبلغ
 *   و در صورت نیاز دکمه‌ی «پرداخت» یا «لغو»
 */

import { useQuery } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import {
  Package, ChevronLeft, AlertCircle, CreditCard, Calendar,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getOrders } from '@/lib/api/orders'
import type { Order, StatusColor } from '@/types/order'
import { formatPrice, formatNumber, formatDate, currencyLabel } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

/**
 * نگاشت رنگ معنایی به کلاس Tailwind.
 *
 * بک‌اند فقط نام رنگ را می‌فرستد (success، warning، …) و نگاشت به
 * کلاس اینجا انجام می‌شود. مزیت: تغییر پالت فقط یک نقطه دارد و
 * Tailwind می‌تواند کلاس‌ها را در بیلد ببیند (کلاس پویا حذف می‌شود).
 */
export const STATUS_CLASSES: Record<StatusColor, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/15 text-warning',
  info: 'bg-info/10 text-info',
  destructive: 'bg-destructive/10 text-destructive',
  muted: 'bg-muted text-muted-foreground',
}

export function OrdersList() {
  const t = useTranslations('order')
  const tStates = useTranslations('states')
  const locale = useLocale() as Locale

  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: () => getOrders(1),
  })

  /* --- حالت بارگذاری --- */
  if (ordersQuery.isLoading) {
    return (
      <ul className="space-y-3">
        {[0, 1, 2].map((i) => (
          <li
            key={i}
            className="h-32 animate-pulse rounded-(--radius-lg) border border-border bg-muted"
          />
        ))}
      </ul>
    )
  }

  /* --- حالت خطا --- */
  if (ordersQuery.isError) {
    return (
      <div className="flex flex-col items-center rounded-(--radius-lg) border border-border bg-card py-16 text-center">
        <AlertCircle className="size-12 text-warning" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-bold text-foreground">{tStates('errorTitle')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{tStates('errorDesc')}</p>
      </div>
    )
  }

  const orders = ordersQuery.data?.data ?? []

  /* --- حالت خالی --- */
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-(--radius-lg) border border-border bg-card py-20 text-center">
        <Package className="size-14 text-muted-foreground" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-bold text-foreground">{t('empty')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t('emptyDesc')}</p>

        <Link
          href="/products"
          className="mt-6 inline-flex h-11 items-center rounded-(--radius-md) bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t('payNow')}
        </Link>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {orders.map((order: Order) => (
        <li
          key={order.id}
          className="rounded-(--radius-lg) border border-border bg-card p-4 transition-shadow hover:shadow-[var(--shadow-sm)]"
        >
          {/* --- سرصفحه کارت: شماره سفارش و وضعیت --- */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{t('orderNumber')}</span>
                <span className="font-mono text-sm font-bold text-foreground" dir="ltr">
                  {order.orderNumber}
                </span>
              </p>

              {order.createdAt && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="size-3.5" aria-hidden="true" />
                  {formatDate(order.createdAt, locale)}
                </p>
              )}
            </div>

            {/* برچسب وضعیت با رنگ معنایی */}
            <span
              className={cn(
                'shrink-0 rounded-(--radius-sm) px-2.5 py-1 text-xs font-semibold',
                STATUS_CLASSES[order.statusColor],
              )}
            >
              {order.statusLabel}
            </span>
          </div>

          <hr className="my-3 border-border" />

          {/* --- پاصفحه: تعداد، مبلغ و اقدام --- */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-sm">
              {order.itemsCount !== undefined && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Package className="size-4" aria-hidden="true" />
                  {t('itemsCount', { count: formatNumber(order.itemsCount, locale) })}
                </span>
              )}

              <span className="flex items-baseline gap-1">
                <span className="font-bold text-foreground" data-price>
                  {formatPrice(order.total, locale)}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {currencyLabel(locale)}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/*
                دکمه پرداخت — فقط برای سفارش‌های در انتظار پرداخت.
                اگر کاربر وسط پرداخت منصرف شده باشد، از اینجا می‌تواند
                ادامه دهد و سفارشش گم نمی‌شود.
              */}
              {order.status === 'pending' && (
                <Link
                  href={`/account/orders/${order.orderNumber}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-(--radius-md) bg-primary px-3.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                >
                  <CreditCard className="size-3.5" aria-hidden="true" />
                  {t('payNow')}
                </Link>
              )}

              <Link
                href={`/account/orders/${order.orderNumber}`}
                className="inline-flex h-9 items-center gap-1 rounded-(--radius-md) border border-border px-3.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
              >
                {t('detail')}
                <ChevronLeft className="rtl-flip size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
