'use client'

/**
 * فهرست تیکت‌های پشتیبانی کاربر
 * ---------------------------------------------------------------------------
 * تب وضعیت · کارت تیکت · صفحه‌بندی
 *
 * پوشش حالت‌ها: loading · error · empty · empty-filtered · success
 *
 * ⚠️ رنگ و برچسب وضعیت از بک‌اند می‌آید (`statusLabel` / `statusColor`)،
 *    نه از نگاشتی در این فایل. نوشتن نگاشت اینجا یعنی افزودن یک وضعیت
 *    تازه در enum لاراول، این فهرست را بی‌صدا با برچسب خالی رها می‌کند.
 */

import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import {
  Plus, MessageSquare, AlertCircle, Loader2, ChevronLeft, Package,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import * as ticketsApi from '@/lib/api/tickets'
import { formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { STATUS_CLASSES } from '@/components/account/OrdersList'
import { AdminPagination } from '@/components/admin/AdminPagination'
import type { Ticket, TicketFilter } from '@/types/ticket'

/** تب‌ها — ترتیب اینجا همان ترتیب نمایش است. */
const FILTERS: TicketFilter[] = ['all', 'open', 'closed']

export function TicketsList({ initialFilter }: { initialFilter?: TicketFilter }) {
  const t = useTranslations('tickets')
  const tStates = useTranslations('states')
  const locale = useLocale() as Locale

  const [filter, setFilter] = useState<TicketFilter>(initialFilter ?? 'all')
  const [page, setPage] = useState(1)

  const ticketsQuery = useQuery({
    queryKey: ['tickets', { filter, page }],
    queryFn: () => ticketsApi.getTickets({ status: filter, page }),
    /* نگه‌داشتن داده‌ی قبلی هنگام تعویض صفحه — بدون آن فهرست می‌پرد */
    placeholderData: keepPreviousData,
  })

  const tickets = ticketsQuery.data?.data ?? []
  const meta = ticketsQuery.data?.meta

  return (
    <div>
      {/* ================= سربرگ ================= */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>

        <Link
          href="/account/tickets/new"
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-(--radius-md) bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" aria-hidden="true" />
          {t('new')}
        </Link>
      </div>

      {/* ================= تب وضعیت ================= */}
      <div
        role="tablist"
        aria-label={t('filterLabel')}
        className="mb-4 flex gap-1 overflow-x-auto border-b border-border"
      >
        {FILTERS.map((tab) => {
          const active = filter === tab

          return (
            <button
              key={tab}
              role="tab"
              aria-selected={active}
              onClick={() => {
                setFilter(tab)
                setPage(1)
              }}
              className={cn(
                'relative shrink-0 px-4 py-2.5 text-sm font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t(`filter.${tab}`)}

              {active && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" aria-hidden="true" />
              )}
            </button>
          )
        })}

        {ticketsQuery.isFetching && (
          <span className="ms-auto flex items-center pe-2">
            <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
          </span>
        )}
      </div>

      {/* ================= محتوا ================= */}
      {ticketsQuery.isLoading ? (
        <ul className="space-y-3">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-24 animate-pulse rounded-(--radius-lg) bg-muted" />
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
          <MessageSquare className="size-12 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-foreground">
            {filter === 'all' ? t('empty') : t('emptyFiltered')}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">{t('emptyDesc')}</p>

          {filter === 'all' && (
            <Link
              href="/account/tickets/new"
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-(--radius-md) bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" aria-hidden="true" />
              {t('emptyCta')}
            </Link>
          )}
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} locale={locale} />
            ))}
          </ul>

          {meta && (
            <div className="mt-4">
              <AdminPagination meta={meta} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* =========================================================================
 * کارت یک تیکت
 * ======================================================================= */

function TicketCard({ ticket, locale }: { ticket: Ticket; locale: Locale }) {
  const t = useTranslations('tickets')

  return (
    <li>
      {/*
        کل کارت یک لینک است، نه فقط عنوان.
        در موبایل هدف کلیک کوچک یعنی خطای لمسی؛ اینجا کل سطح کارت
        قابل فشردن است.
      */}
      <Link
        href={`/account/tickets/${ticket.ticketNumber}`}
        className="block rounded-(--radius-lg) border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate font-medium text-foreground">{ticket.subject}</h2>

              <span
                className={cn(
                  'shrink-0 rounded-(--radius-sm) px-2 py-0.5 text-xs font-medium',
                  STATUS_CLASSES[ticket.statusColor],
                )}
              >
                {ticket.statusLabel}
              </span>
            </div>

            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              {/* شماره‌ی تیکت همیشه چپ‌به‌راست — رشته‌ی TK-000000 در RTL وارونه می‌شود */}
              <code dir="ltr" className="font-mono">{ticket.ticketNumber}</code>
              <span aria-hidden="true">·</span>
              <span>{ticket.departmentLabel}</span>
              <span aria-hidden="true">·</span>
              <span
                className={cn(
                  'rounded-(--radius-sm) px-1.5 py-0.5',
                  STATUS_CLASSES[ticket.priorityColor],
                )}
              >
                {ticket.priorityLabel}
              </span>
            </p>

            {ticket.orderNumber && (
              <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Package className="size-3.5" aria-hidden="true" />
                <span dir="ltr" className="font-mono">{ticket.orderNumber}</span>
              </p>
            )}
          </div>

          <ChevronLeft
            className="size-5 shrink-0 text-muted-foreground rtl:rotate-0 ltr:rotate-180"
            aria-hidden="true"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare className="size-3.5" aria-hidden="true" />
            {t('messagesCount', { count: ticket.messagesCount })}
          </span>

          {ticket.lastReplyAt && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                {t('lastReply')} {formatDate(ticket.lastReplyAt, locale)}
              </span>
            </>
          )}
        </div>
      </Link>
    </li>
  )
}
