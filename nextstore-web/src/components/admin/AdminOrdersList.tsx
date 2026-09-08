'use client'

/**
 * فهرست سفارش‌ها در پنل مدیریت
 * ---------------------------------------------------------------------------
 * سه قابلیت:
 *   ۱. فیلتر بر اساس وضعیت
 *   ۲. جستجو در شماره سفارش و نام گیرنده
 *   ۳. صفحه‌بندی
 *
 * ⚠️ چرا در موبایل کارت و در دسکتاپ جدول؟
 *    جدول پنج‌ستونی روی صفحه‌ی ۳۶۰ پیکسلی یا افقی اسکرول می‌شود
 *    (کاربر ستون مبلغ را نمی‌بیند) یا متن‌ها می‌شکنند. کارت همان
 *    داده را عمودی می‌چیند و هیچ ستونی گم نمی‌شود.
 *
 * ⚠️ جستجو با تأخیر (debounce) ارسال می‌شود. بدون آن، تایپ «سفارش»
 *    شش درخواست پشت‌سرهم می‌فرستد و پاسخ‌ها ممکن است بی‌ترتیب
 *    برسند و نتیجه‌ی اشتباه نشان دهند.
 */

import { useState, useEffect } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { Search, AlertCircle, PackageSearch, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getAdminOrders, getOrderStatuses } from '@/lib/api/admin'
import type { OrderStatusValue } from '@/types/order'
import { STATUS_CLASSES } from '@/components/account/OrdersList'
import { AdminPagination } from './AdminPagination'
import { formatPrice, formatNumber, formatDate, currencyLabel } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

export function AdminOrdersList({
  initialStatus,
  initialSearch = '',
}: {
  /** وضعیت اولیه از پارامتر آدرس — داشبورد با ?status=paid لینک می‌دهد */
  initialStatus?: OrderStatusValue
  /** عبارت جستجوی اولیه از ?q= تا لینک جستجو قابل اشتراک باشد */
  initialSearch?: string
}) {
  const t = useTranslations('admin')
  const tOrder = useTranslations('order')
  const tStates = useTranslations('states')
  const tCommon = useTranslations('common')
  const locale = useLocale() as Locale

  const [status, setStatus] = useState<OrderStatusValue | ''>(initialStatus ?? '')
  const [searchInput, setSearchInput] = useState(initialSearch)
  const [search, setSearch] = useState(initialSearch)
  const [page, setPage] = useState(1)

  /*
   * تأخیر ۴۰۰ میلی‌ثانیه‌ای پیش از ارسال جستجو.
   * پاک‌سازی تایمر در return باعث می‌شود هر کلید تایمر قبلی را لغو
   * کند — یعنی درخواست فقط پس از توقف تایپ می‌رود.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 400)

    return () => clearTimeout(timer)
  }, [searchInput])

  /** فهرست وضعیت‌ها برای دراپ‌داون فیلتر — تقریباً هرگز تغییر نمی‌کند */
  const statusesQuery = useQuery({
    queryKey: ['admin', 'order-statuses', locale],
    queryFn: () => getOrderStatuses(locale),
    staleTime: Infinity,
  })

  const ordersQuery = useQuery({
    queryKey: ['admin', 'orders', { status, search, page, locale }],
    queryFn: () =>
      getAdminOrders({
        status: status || undefined,
        q: search || undefined,
        page,
      }),
    /*
     * نگه‌داشتن داده‌ی قبلی هنگام تعویض صفحه.
     * بدون این، فهرست یک لحظه خالی می‌شود و ارتفاع صفحه می‌پرد.
     */
    placeholderData: keepPreviousData,
  })

  const orders = ordersQuery.data?.data ?? []
  const meta = ordersQuery.data?.meta

  const hasFilters = status !== '' || search !== ''

  /** پاک کردن همه‌ی فیلترها با یک کلیک */
  const resetFilters = () => {
    setStatus('')
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  /* در RTL فلش «ادامه» باید به چپ اشاره کند، در LTR به راست */
  const ChevronEnd = locale === 'fa' ? ChevronLeft : ChevronRight

  return (
    <div className="flex flex-col gap-4">
      {/* ================= سرصفحه ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-foreground">{t('orders.title')}</h1>
          {meta && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t('orders.results', { count: formatNumber(meta.total, locale) })}
            </p>
          )}
        </div>
      </div>

      {/* ================= نوار فیلتر ================= */}
      <div className="flex flex-col gap-2 rounded-(--radius-lg) border border-border bg-card p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t('orders.searchPlaceholder')}
            aria-label={tCommon('search')}
            className="h-10 w-full rounded-(--radius-md) border border-border bg-background ps-9 pe-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary"
          />
        </div>

        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as OrderStatusValue | '')
            setPage(1)
          }}
          aria-label={tOrder('status')}
          className="h-10 rounded-(--radius-md) border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-primary sm:w-48"
        >
          <option value="">{t('orders.allStatuses')}</option>
          {statusesQuery.data?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="h-10 shrink-0 rounded-(--radius-md) border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {t('reset')}
          </button>
        )}
      </div>

      {/* ================= محتوا ================= */}
      {ordersQuery.isLoading ? (
        <ul className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <li
              key={i}
              className="h-20 animate-pulse rounded-(--radius-lg) border border-border bg-muted"
            />
          ))}
        </ul>
      ) : ordersQuery.isError ? (
        <div className="flex flex-col items-center rounded-(--radius-lg) border border-border bg-card py-16 text-center">
          <AlertCircle className="size-12 text-warning" aria-hidden="true" />
          <h2 className="mt-4 text-base font-bold text-foreground">{tStates('errorTitle')}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{tStates('errorDesc')}</p>
          <button
            type="button"
            onClick={() => ordersQuery.refetch()}
            className="mt-5 h-10 rounded-(--radius-md) bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {tCommon('retry')}
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center rounded-(--radius-lg) border border-border bg-card py-16 text-center">
          <PackageSearch className="size-12 text-muted-foreground" aria-hidden="true" />
          <p className="mt-4 text-sm text-muted-foreground">{t('orders.empty')}</p>
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 h-10 rounded-(--radius-md) border border-border px-5 text-sm text-foreground hover:bg-accent"
            >
              {t('reset')}
            </button>
          )}
        </div>
      ) : (
        <>
          {/*
            یک ساختار داده، دو نمایش:
            <ul> در موبایل کارت است و از md به بالا ردیف جدول‌مانند.
          */}
          <ul className="space-y-2">
            {/* سرستون‌ها فقط در دسکتاپ معنا دارند */}
            <li
              aria-hidden="true"
              className="hidden gap-3 px-4 pb-1 text-xs font-medium text-muted-foreground md:grid md:grid-cols-[1.2fr_1.4fr_1fr_1fr_auto]"
            >
              <span>{tOrder('orderNumber')}</span>
              <span>{t('orders.customer')}</span>
              <span>{tOrder('date')}</span>
              <span>{tOrder('total')}</span>
              <span className="w-5" />
            </li>

            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.orderNumber}`}
                  className="grid gap-2 rounded-(--radius-lg) border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40 md:grid-cols-[1.2fr_1.4fr_1fr_1fr_auto] md:items-center md:gap-3"
                >
                  {/* شماره سفارش + وضعیت */}
                  <div className="flex items-center justify-between gap-2 md:block">
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {order.orderNumber}
                    </span>
                    <span
                      className={cn(
                        'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium md:mt-1',
                        STATUS_CLASSES[order.statusColor],
                      )}
                    >
                      {order.statusLabel}
                    </span>
                  </div>

                  {/* مشتری */}
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">
                      {order.customer.name ?? t('orders.guest')}
                    </p>
                    {order.customer.city && (
                      <p className="truncate text-xs text-muted-foreground">
                        {order.customer.city}
                      </p>
                    )}
                  </div>

                  {/* تاریخ */}
                  <p className="text-xs text-muted-foreground md:text-sm">
                    {order.createdAt ? formatDate(order.createdAt, locale) : t('orders.notYet')}
                  </p>

                  {/* مبلغ */}
                  <p className="text-sm font-semibold text-foreground">
                    {formatPrice(order.total, locale)}
                    <span className="ms-1 text-xs font-normal text-muted-foreground">
                      {currencyLabel(locale)}
                    </span>
                  </p>

                  <ChevronEnd
                    className="hidden size-5 text-muted-foreground md:block"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>

          {meta && <AdminPagination meta={meta} onPageChange={setPage} />}
        </>
      )}
    </div>
  )
}
