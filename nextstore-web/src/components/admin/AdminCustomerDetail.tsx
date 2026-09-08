'use client'

/**
 * پروفایل یک مشتری — پنل مدیریت
 * ---------------------------------------------------------------------------
 * کارت هویت · آمار خرید · آدرس‌ها · سفارش‌های اخیر · فعال/غیرفعال
 *
 * ⚠️ اینجا هیچ فیلد قابل ویرایشی نیست جز وضعیت حساب. نام، ایمیل و
 *    رمز داده‌ی شخصی کاربرند؛ هر فیلد ویرایش‌پذیر دیگری یک مسیر
 *    جعل هویت باز می‌کند. بک‌اند هم همین محدودیت را دارد.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import {
  Mail, Phone, Calendar, ShoppingBag, Wallet, Star, LifeBuoy, Heart,
  MapPin, AlertCircle, Loader2, Ban, CheckCircle2, ExternalLink,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import * as customersApi from '@/lib/api/admin-customers'
import { ApiError } from '@/lib/api/client'
import { formatNumber, formatPrice, formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { STATUS_CLASSES } from '@/components/account/OrdersList'

export function AdminCustomerDetail({ customerId }: { customerId: number }) {
  const t = useTranslations('admin.customers')
  const tStates = useTranslations('states')
  const locale = useLocale() as Locale
  const queryClient = useQueryClient()

  const customerQuery = useQuery({
    queryKey: ['admin', 'customer', customerId],
    queryFn: () => customersApi.getAdminCustomer(customerId),
  })

  const statusMutation = useMutation({
    mutationFn: (isActive: boolean) => customersApi.setCustomerActive(customerId, isActive),
    onSuccess: (_data, isActive) => {
      toast.success(t(isActive ? 'enabled' : 'disabled'))
      queryClient.invalidateQueries({ queryKey: ['admin', 'customer', customerId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] })
    },
    onError: (error) => {
      /*
       * ۴۲۲ با کد CUSTOMER_IS_STAFF یعنی این حساب متعلق به کارکنان
       * است. پیام سرور گویاست و باید همان نشان داده شود، نه پیام
       * عمومی «مشکلی پیش آمد».
       */
      toast.error(error instanceof ApiError ? error.message : tStates('errorTitle'))
    },
  })

  if (customerQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 animate-pulse rounded-(--radius-lg) bg-muted" />
        <div className="h-24 animate-pulse rounded-(--radius-lg) bg-muted" />
        <div className="h-48 animate-pulse rounded-(--radius-lg) bg-muted" />
      </div>
    )
  }

  if (customerQuery.isError || !customerQuery.data) {
    const notFound = customerQuery.error instanceof ApiError && customerQuery.error.status === 404

    return (
      <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
        <AlertCircle className="size-12 text-warning" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-bold text-foreground">
          {notFound ? t('notFound') : tStates('errorTitle')}
        </h2>
        <Link
          href="/admin/customers"
          className="mt-6 inline-flex h-10 items-center rounded-(--radius-md) border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          {t('backToList')}
        </Link>
      </div>
    )
  }

  const customer = customerQuery.data

  /** کارت‌های آمار — ترتیب اینجا همان ترتیب نمایش است. */
  const stats = [
    { key: 'orders', Icon: ShoppingBag, value: formatNumber(customer.ordersCount, locale) },
    { key: 'spent', Icon: Wallet, value: formatPrice(customer.totalSpent, locale) },
    { key: 'reviews', Icon: Star, value: formatNumber(customer.reviewsCount, locale) },
    { key: 'tickets', Icon: LifeBuoy, value: formatNumber(customer.ticketsCount, locale) },
    { key: 'wishlist', Icon: Heart, value: formatNumber(customer.wishlistCount, locale) },
  ]

  return (
    <div>
      {/* ================= کارت هویت ================= */}
      <div className="mb-5 rounded-(--radius-lg) border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-foreground sm:text-xl">{customer.name}</h1>

              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-(--radius-sm) px-2 py-0.5 text-xs font-medium',
                  customer.isActive
                    ? 'bg-success/10 text-success'
                    : 'bg-destructive/10 text-destructive',
                )}
              >
                {customer.isActive
                  ? <CheckCircle2 className="size-3" aria-hidden="true" />
                  : <Ban className="size-3" aria-hidden="true" />}
                {t(customer.isActive ? 'active' : 'inactive')}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
              <a
                href={`mailto:${customer.email}`}
                dir="ltr"
                className="inline-flex items-center gap-1.5 text-primary hover:underline"
              >
                <Mail className="size-3.5" aria-hidden="true" />
                {customer.email}
              </a>

              {customer.phone && (
                <a
                  href={`tel:${customer.phone}`}
                  dir="ltr"
                  className="inline-flex items-center gap-1.5 font-mono text-primary hover:underline"
                >
                  <Phone className="size-3.5" aria-hidden="true" />
                  {customer.phone}
                </a>
              )}

              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="size-3.5" aria-hidden="true" />
                {t('joinedOn')} {formatDate(customer.createdAt, locale)}
              </span>
            </div>
          </div>

          {/* --- فعال / غیرفعال --- */}
          <button
            type="button"
            onClick={() => {
              const next = !customer.isActive
              if (next || window.confirm(t('disableConfirm'))) {
                statusMutation.mutate(next)
              }
            }}
            disabled={statusMutation.isPending}
            className={cn(
              'inline-flex h-10 shrink-0 items-center gap-2 rounded-(--radius-md) px-4 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50',
              customer.isActive
                ? 'border border-border text-destructive'
                : 'bg-success text-success-foreground',
            )}
          >
            {statusMutation.isPending
              ? <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              : customer.isActive
                ? <Ban className="size-4" aria-hidden="true" />
                : <CheckCircle2 className="size-4" aria-hidden="true" />}
            {t(customer.isActive ? 'disable' : 'enable')}
          </button>
        </div>
      </div>

      {/* ================= آمار ================= */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map(({ key, Icon, value }) => (
          <div key={key} className="rounded-(--radius-lg) border border-border bg-card p-3">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon className="size-3.5" aria-hidden="true" />
              {t(`stat.${key}`)}
            </p>
            <p className="mt-1.5 font-bold tabular-nums text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-start">
        {/* ================= سفارش‌های اخیر ================= */}
        <section className="rounded-(--radius-lg) border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="font-medium text-foreground">{t('recentOrders')}</h2>

            {/*
              لینک به فهرست کامل — بک‌اند فقط ده سفارش آخر را می‌فرستد
              و مشتری قدیمی می‌تواند خیلی بیشتر داشته باشد.
            */}
            {customer.ordersCount > customer.recentOrders.length && (
              <Link
                href="/admin/orders"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {t('allOrders', { count: customer.ordersCount })}
                <ExternalLink className="size-3" aria-hidden="true" />
              </Link>
            )}
          </div>

          {customer.recentOrders.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              {t('noOrders')}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {customer.recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.orderNumber}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-accent/40"
                  >
                    <div className="min-w-0">
                      <p dir="ltr" className="font-mono text-sm text-foreground">
                        {order.orderNumber}
                      </p>
                      {/*
                        ⚠️ هر دو فیلد در تایپ Order اختیاری‌اند:
                           `createdAt` می‌تواند null باشد و `itemsCount`
                           فقط وقتی می‌آید که رابطه‌ی اقلام شمرده شده
                           باشد. فرض وجودشان یعنی «Invalid Date» یا
                           «undefined کالا» روی صفحه.
                      */}
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {order.createdAt ? formatDate(order.createdAt, locale) : '—'}
                        {typeof order.itemsCount === 'number' && (
                          <>
                            {' · '}
                            {t('itemsCount', { count: order.itemsCount })}
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'rounded-(--radius-sm) px-2 py-0.5 text-xs font-medium',
                          STATUS_CLASSES[order.statusColor],
                        )}
                      >
                        {order.statusLabel}
                      </span>

                      <span className="font-medium tabular-nums text-foreground">
                        {formatPrice(order.total, locale)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ================= آدرس‌ها ================= */}
        <section className="rounded-(--radius-lg) border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="font-medium text-foreground">{t('addresses')}</h2>
          </div>

          {customer.addresses.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              {t('noAddresses')}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {customer.addresses.map((address) => (
                <li key={address.id} className="px-4 py-3">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <MapPin className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    {address.label}

                    {address.isDefault && (
                      <span className="rounded-(--radius-sm) bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                        {t('defaultAddress')}
                      </span>
                    )}
                  </p>

                  <p className="mt-1 text-xs leading-6 text-muted-foreground">
                    {address.fullAddress}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {address.recipientName}
                    {' · '}
                    <span dir="ltr" className="font-mono">{address.recipientPhone}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-6">
        <Link
          href="/admin/customers"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t('backToList')}
        </Link>
      </div>
    </div>
  )
}
