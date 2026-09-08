'use client'

/**
 * فهرست مشتریان — پنل مدیریت
 * ---------------------------------------------------------------------------
 * تب وضعیت با نشان عددی · جستجو · مرتب‌سازی · جدول · صفحه‌بندی
 *
 * پوشش حالت‌ها: loading · error · empty · empty-filtered · success
 *
 * ⚠️ ستون «مجموع خرید» فقط سفارش‌های *پرداخت‌شده* را می‌شمارد — همان
 *    قاعده‌ای که در کوئری بک‌اند اعمال شده. سبد رها شده هم یک سفارش
 *    pending است و شمردنش «مشتری برتر»ی می‌ساخت که هیچ‌وقت پولی نداده.
 */

import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import {
  Search, Users, AlertCircle, Loader2, ShoppingBag, Ban, CheckCircle2,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import * as customersApi from '@/lib/api/admin-customers'
import { formatNumber, formatDate, formatPrice } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { AdminPagination } from '@/components/admin/AdminPagination'
import type { AdminCustomer, CustomerSort, CustomerTab } from '@/types/admin'

/** تب‌ها — ترتیب اینجا همان ترتیب نمایش است. */
const TABS: CustomerTab[] = ['all', 'buyers', 'active', 'inactive']

/** مرتب‌سازی‌های مجاز — باید با ثابت SORTS بک‌اند یکی بماند. */
const SORTS: CustomerSort[] = ['newest', 'oldest', 'orders', 'spent', 'name']

export function AdminCustomersList({ initialStatus }: { initialStatus?: CustomerTab }) {
  const t = useTranslations('admin.customers')
  const tAdmin = useTranslations('admin')
  const tStates = useTranslations('states')
  const tCommon = useTranslations('common')
  const locale = useLocale() as Locale

  const [status, setStatus] = useState<CustomerTab>(initialStatus ?? 'all')
  const [sort, setSort] = useState<CustomerSort>('newest')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const customersQuery = useQuery({
    queryKey: ['admin', 'customers', { status, sort, search, page }],
    queryFn: () =>
      customersApi.getAdminCustomers({
        /* 'all' فیلتری نیست — نفرستادنش همان نتیجه را می‌دهد و درخواست تمیزتر می‌ماند */
        status: status === 'all' ? undefined : status,
        sort,
        q: search || undefined,
        page,
      }),
    /* نگه‌داشتن داده‌ی قبلی هنگام تعویض صفحه — بدون آن جدول می‌پرد */
    placeholderData: keepPreviousData,
  })

  /** اعمال جستجو — صفحه به اول برمی‌گردد وگرنه ممکن است خالی بماند. */
  const applySearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  const customers = customersQuery.data?.data ?? []
  const counts = customersQuery.data?.counts
  const meta = customersQuery.data?.meta

  const isFiltered = status !== 'all' || search !== ''

  return (
    <div>
      {/* ================= سربرگ ================= */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* ================= تب وضعیت ================= */}
      <div
        role="tablist"
        aria-label={t('colStatus')}
        className="mb-4 flex gap-1 overflow-x-auto border-b border-border"
      >
        {TABS.map((tab) => {
          const active = status === tab
          const count = counts?.[tab]

          return (
            <button
              key={tab}
              role="tab"
              aria-selected={active}
              onClick={() => {
                setStatus(tab)
                setPage(1)
              }}
              className={cn(
                'relative shrink-0 px-4 py-2.5 text-sm font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t(`status.${tab}`)}

              {typeof count === 'number' && (
                <span className="ms-1.5 text-xs tabular-nums opacity-70">
                  {formatNumber(count, locale)}
                </span>
              )}

              {active && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" aria-hidden="true" />
              )}
            </button>
          )
        })}
      </div>

      {/* ================= جستجو و مرتب‌سازی ================= */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form onSubmit={applySearch} className="flex min-w-0 flex-1 gap-2 sm:max-w-md">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchPlaceholder')}
              className="h-10 w-full rounded-(--radius-md) border border-border bg-background ps-9 pe-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <button
            type="submit"
            className="h-10 shrink-0 rounded-(--radius-md) border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {tCommon('search')}
          </button>
        </form>

        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as CustomerSort)
            setPage(1)
          }}
          aria-label={t('sortLabel')}
          className="h-10 rounded-(--radius-md) border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {SORTS.map((option) => (
            <option key={option} value={option}>
              {t(`sort.${option}`)}
            </option>
          ))}
        </select>

        {customersQuery.isFetching && (
          <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      {/* ================= محتوا ================= */}
      {customersQuery.isLoading ? (
        <ul className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <li key={i} className="h-14 animate-pulse rounded-(--radius-md) bg-muted" />
          ))}
        </ul>
      ) : customersQuery.isError ? (
        <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
          <AlertCircle className="size-12 text-warning" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-foreground">{tStates('errorTitle')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{tStates('errorDesc')}</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
          <Users className="size-12 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-foreground">
            {isFiltered ? t('emptyFiltered') : t('empty')}
          </h2>
        </div>
      ) : (
        <>
          {/*
            جدول در ظرفِ اسکرول افقی.
            بدون آن، جدول در نمایشگر کوچک کل صفحه را پهن می‌کند و
            سربرگ و سایدبار هم به‌هم می‌ریزند.
          */}
          <div className="overflow-x-auto rounded-(--radius-lg) border border-border">
            <table className="w-full min-w-[880px] text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr className="text-xs text-muted-foreground">
                  <th scope="col" className="px-4 py-3 text-start font-medium">{t('colCustomer')}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{t('colPhone')}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{t('colOrders')}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{t('colSpent')}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{t('colLastOrder')}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{t('colJoined')}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{t('colStatus')}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {customers.map((customer) => (
                  <CustomerRow key={customer.id} customer={customer} locale={locale} />
                ))}
              </tbody>
            </table>
          </div>

          {meta && (
            <div className="mt-4">
              <AdminPagination meta={meta} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      <p className="sr-only" aria-live="polite">
        {meta ? tAdmin('results', { count: meta.total }) : ''}
      </p>
    </div>
  )
}

/* =========================================================================
 * یک ردیف جدول
 * ======================================================================= */

function CustomerRow({ customer, locale }: { customer: AdminCustomer; locale: Locale }) {
  const t = useTranslations('admin.customers')

  return (
    <tr className="transition-colors hover:bg-accent/40">
      {/* --- نام و ایمیل --- */}
      <td className="px-4 py-3">
        <Link
          href={`/admin/customers/${customer.id}`}
          className="block min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <p className="truncate font-medium text-foreground">{customer.name}</p>
          {/* ایمیل همیشه چپ‌به‌راست — در صفحه‌ی RTL وارونه خوانده می‌شود */}
          <p dir="ltr" className="truncate text-xs text-muted-foreground">
            {customer.email}
          </p>
        </Link>
      </td>

      <td className="px-4 py-3">
        {customer.phone ? (
          <span dir="ltr" className="font-mono text-xs text-muted-foreground">
            {customer.phone}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>

      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1.5 tabular-nums text-foreground">
          <ShoppingBag className="size-3.5 text-muted-foreground" aria-hidden="true" />
          {formatNumber(customer.ordersCount, locale)}
        </span>
      </td>

      {/* --- مجموع خرید --- */}
      <td className="px-4 py-3">
        {customer.totalSpent > 0 ? (
          <span className="font-medium tabular-nums text-foreground">
            {formatPrice(customer.totalSpent, locale)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>

      <td className="px-4 py-3 text-xs text-muted-foreground">
        {customer.lastOrderAt ? formatDate(customer.lastOrderAt, locale) : '—'}
      </td>

      <td className="px-4 py-3 text-xs text-muted-foreground">
        {formatDate(customer.createdAt, locale)}
      </td>

      {/* --- وضعیت حساب --- */}
      <td className="px-4 py-3">
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
      </td>
    </tr>
  )
}
