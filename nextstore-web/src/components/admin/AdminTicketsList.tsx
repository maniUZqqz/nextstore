'use client'

/**
 * صف پشتیبانی — پنل مدیریت
 * ---------------------------------------------------------------------------
 * تب وضعیت با نشان عددی · جستجو · جدول · صفحه‌بندی
 *
 * پوشش حالت‌ها: loading · error · empty · empty-filtered · success
 *
 * ⚠️ چرا جدول و نه کارت (برخلاف صف تعدیل نظرات)؟
 *    آنجا ستون اصلی متن چندخطی نظر بود و مدیر باید کلش را می‌خواند.
 *    اینجا تصمیم از روی *فراداده* گرفته می‌شود — چه کسی، چند وقت
 *    منتظر، چه اولویتی — و متن گفتگو یک کلیک آن‌طرف‌تر است. جدول
 *    این ستون‌ها را قابل مقایسه می‌کند.
 */

import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import {
  Search, LifeBuoy, AlertCircle, Loader2, MessageSquare, Package,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import * as ticketsApi from '@/lib/api/admin-tickets'
import { formatNumber, formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { STATUS_CLASSES } from '@/components/account/OrdersList'
import { AdminPagination } from '@/components/admin/AdminPagination'
import type { Ticket } from '@/types/ticket'
import type { AdminTicketTab } from '@/types/admin'

/** تب‌ها — ترتیب اینجا همان ترتیب نمایش است. */
const TABS: AdminTicketTab[] = ['needs_attention', 'answered', 'closed', 'all']

export function AdminTicketsList({ initialStatus }: { initialStatus?: AdminTicketTab }) {
  const t = useTranslations('admin.tickets')
  const tAdmin = useTranslations('admin')
  const tStates = useTranslations('states')
  const tCommon = useTranslations('common')
  const locale = useLocale() as Locale

  const [status, setStatus] = useState<AdminTicketTab>(initialStatus ?? 'needs_attention')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const ticketsQuery = useQuery({
    queryKey: ['admin', 'tickets', { status, search, page }],
    /*
     * `status` همیشه فرستاده می‌شود — حتی 'all'.
     * بک‌اند در نبود این پارامتر صف «نیازمند رسیدگی» را برمی‌گرداند،
     * پس حذف کردنش برای تب «همه» دقیقاً نتیجه‌ی عکس می‌داد.
     */
    queryFn: () => ticketsApi.getAdminTickets({ status, q: search || undefined, page }),
    /* نگه‌داشتن داده‌ی قبلی هنگام تعویض صفحه — بدون آن جدول می‌پرد */
    placeholderData: keepPreviousData,
  })

  /** اعمال جستجو — صفحه به اول برمی‌گردد وگرنه ممکن است خالی بماند. */
  const applySearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  const tickets = ticketsQuery.data?.data ?? []
  const counts = ticketsQuery.data?.counts
  const meta = ticketsQuery.data?.meta

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

      {/* ================= جستجو ================= */}
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

        {ticketsQuery.isFetching && (
          <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      {/* ================= محتوا ================= */}
      {ticketsQuery.isLoading ? (
        <ul className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <li key={i} className="h-14 animate-pulse rounded-(--radius-md) bg-muted" />
          ))}
        </ul>
      ) : ticketsQuery.isError ? (
        <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
          <AlertCircle className="size-12 text-warning" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-foreground">{tStates('errorTitle')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{tStates('errorDesc')}</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
          <LifeBuoy className="size-12 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-foreground">
            {/*
              صف خالی پیام موفقیت است نه پوچی — وقتی پشتیبان تب
              «نیازمند رسیدگی» را باز می‌کند و چیزی نیست، یعنی
              کارش تمام شده.
            */}
            {status === 'needs_attention' && !search
              ? t('emptyQueue')
              : isFiltered ? t('emptyFiltered') : t('empty')}
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
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr className="text-xs text-muted-foreground">
                  <th scope="col" className="px-4 py-3 text-start font-medium">{t('colSubject')}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{t('colCustomer')}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{t('colDepartment')}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{t('colPriority')}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{t('colStatus')}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{t('colLastReply')}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {tickets.map((ticket) => (
                  <TicketRow key={ticket.id} ticket={ticket} locale={locale} />
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

function TicketRow({ ticket, locale }: { ticket: Ticket; locale: Locale }) {
  const t = useTranslations('admin.tickets')

  return (
    <tr className="transition-colors hover:bg-accent/40">
      {/* --- موضوع --- */}
      <td className="px-4 py-3">
        <Link
          href={`/admin/tickets/${ticket.ticketNumber}`}
          className="block min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <p className="truncate font-medium text-foreground">{ticket.subject}</p>

          <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            {/* شماره‌ی تیکت همیشه چپ‌به‌راست — رشته‌ی TK-000000 در RTL وارونه می‌شود */}
            <code dir="ltr" className="font-mono">{ticket.ticketNumber}</code>

            <span className="inline-flex items-center gap-1">
              <MessageSquare className="size-3" aria-hidden="true" />
              {ticket.messagesCount}
            </span>

            {ticket.orderNumber && (
              <span className="inline-flex items-center gap-1">
                <Package className="size-3" aria-hidden="true" />
                <span dir="ltr" className="font-mono">{ticket.orderNumber}</span>
              </span>
            )}
          </p>
        </Link>
      </td>

      {/*
        مشتری — کلید `customer` فقط در صف پشتیبانی بارگذاری می‌شود.
        اگر روزی آن `with` حذف شود، اینجا به‌جای خطای زمان اجرا خط
        تیره دیده می‌شود.
      */}
      <td className="px-4 py-3">
        {ticket.customer ? (
          <>
            <p className="truncate text-foreground">{ticket.customer.name}</p>
            <p dir="ltr" className="truncate text-xs text-muted-foreground">
              {ticket.customer.email}
            </p>
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>

      <td className="px-4 py-3 text-muted-foreground">{ticket.departmentLabel}</td>

      <td className="px-4 py-3">
        <span
          className={cn(
            'inline-flex rounded-(--radius-sm) px-2 py-0.5 text-xs font-medium',
            STATUS_CLASSES[ticket.priorityColor],
          )}
        >
          {ticket.priorityLabel}
        </span>
      </td>

      <td className="px-4 py-3">
        <span
          className={cn(
            'inline-flex rounded-(--radius-sm) px-2 py-0.5 text-xs font-medium',
            STATUS_CLASSES[ticket.statusColor],
          )}
        >
          {ticket.statusLabel}
        </span>
      </td>

      <td className="px-4 py-3 text-xs text-muted-foreground">
        {ticket.lastReplyAt ? formatDate(ticket.lastReplyAt, locale) : t('never')}
      </td>
    </tr>
  )
}
