'use client'

/**
 * گفتگوی یک تیکت — پنل مدیریت
 * ---------------------------------------------------------------------------
 * اطلاعات مشتری · حباب‌های پیام · فرم پاسخ پشتیبانی · بستن و بازگشایی
 *
 * ⚠️ قرینه‌ی TicketConversation سمت مشتری است، با سه تفاوت:
 *      ۱. کارت مشتری (نام، ایمیل، سفارش) بالای گفتگو نشان داده می‌شود
 *      ۲. پاسخ با `isStaff: true` ثبت می‌شود و وضعیت را به «پاسخ داده
 *         شده» می‌برد — یعنی تیکت از صف کاری بیرون می‌رود
 *      ۳. حباب «ما» اینجا سمت پشتیبانی است، پس برچسب‌ها جابه‌جا می‌شوند
 *
 *    عمداً کامپوننت مشترک نشد: شرط‌های `isAdmin` در سراسر یک کامپوننت
 *    مشترک، هر دو نما را سخت‌تر می‌خواند و ریسک نشت اطلاعات مشتری به
 *    نمای عمومی را می‌سازد.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import {
  Send, Lock, RotateCcw, AlertCircle, Loader2, Headset, User as UserIcon,
  Package, Mail,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import * as ticketsApi from '@/lib/api/admin-tickets'
import { ApiError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { STATUS_CLASSES } from '@/components/account/OrdersList'
import type { TicketMessage } from '@/types/ticket'

/** حداقل طول پاسخ — هم‌راستا با ReplyTicketRequest بک‌اند (min:2). */
const MIN_REPLY = 2

export function AdminTicketDetail({ ticketNumber }: { ticketNumber: string }) {
  const t = useTranslations('admin.tickets')
  const tStates = useTranslations('states')
  const locale = useLocale() as Locale
  const queryClient = useQueryClient()

  const [reply, setReply] = useState('')

  const ticketQuery = useQuery({
    queryKey: ['admin', 'ticket', ticketNumber],
    queryFn: () => ticketsApi.getAdminTicket(ticketNumber),
  })

  /**
   * باطل کردن کوئری‌های وابسته.
   *
   * ⚠️ فهرست هم باید تازه شود: پاسخ پشتیبانی وضعیت را عوض می‌کند و
   *    تیکت از تب «نیازمند رسیدگی» بیرون می‌رود. بدون این، پشتیبان
   *    برمی‌گردد و تیکتی را در صف می‌بیند که همین حالا جواب داده.
   */
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'tickets'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
  }

  /** پاسخ سرور را مستقیم در کش می‌نشاند — بدون درخواست دوم. */
  const applyResult = (data: Awaited<ReturnType<typeof ticketsApi.getAdminTicket>>) => {
    queryClient.setQueryData(['admin', 'ticket', ticketNumber], data)
    invalidate()
  }

  const replyMutation = useMutation({
    mutationFn: (body: string) => ticketsApi.replyAsStaff(ticketNumber, body),
    onSuccess: (data) => {
      setReply('')
      toast.success(t('replied'))
      applyResult(data)
    },
    onError: (error) => {
      /*
       * ۴۰۹ یعنی تیکت بسته شده — نه خطای اعتبارسنجی. داده هم تازه
       * می‌شود تا دکمه‌ی بازگشایی ظاهر شود.
       */
      if (error instanceof ApiError && error.status === 409) {
        toast.error(error.message)
        queryClient.invalidateQueries({ queryKey: ['admin', 'ticket', ticketNumber] })
        return
      }
      toast.error(tStates('errorTitle'))
    },
  })

  const closeMutation = useMutation({
    mutationFn: () => ticketsApi.closeAdminTicket(ticketNumber),
    onSuccess: (data) => {
      toast.success(t('closed'))
      applyResult(data)
    },
    onError: () => toast.error(tStates('errorTitle')),
  })

  const reopenMutation = useMutation({
    mutationFn: () => ticketsApi.reopenAdminTicket(ticketNumber),
    onSuccess: (data) => {
      toast.success(t('reopened'))
      applyResult(data)
    },
    onError: () => toast.error(tStates('errorTitle')),
  })

  if (ticketQuery.isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-28 animate-pulse rounded-(--radius-lg) bg-muted" />
        <div className="h-32 animate-pulse rounded-(--radius-lg) bg-muted" />
        <div className="h-32 animate-pulse rounded-(--radius-lg) bg-muted" />
      </div>
    )
  }

  if (ticketQuery.isError || !ticketQuery.data) {
    const notFound = ticketQuery.error instanceof ApiError && ticketQuery.error.status === 404

    return (
      <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
        <AlertCircle className="size-12 text-warning" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-bold text-foreground">
          {notFound ? t('notFound') : tStates('errorTitle')}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {notFound ? t('notFoundDesc') : tStates('errorDesc')}
        </p>

        <Link
          href="/admin/tickets"
          className="mt-6 inline-flex h-10 items-center rounded-(--radius-md) border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          {t('backToQueue')}
        </Link>
      </div>
    )
  }

  const ticket = ticketQuery.data
  const replyIsValid = reply.trim().length >= MIN_REPLY
  const isBusy = replyMutation.isPending || closeMutation.isPending || reopenMutation.isPending

  return (
    <div>
      {/* ================= سربرگ ================= */}
      <div className="mb-5 rounded-(--radius-lg) border border-border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-foreground sm:text-xl">{ticket.subject}</h1>

            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
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
              <span aria-hidden="true">·</span>
              <span>{formatDateTime(ticket.createdAt, locale)}</span>
            </p>
          </div>

          <span
            className={cn(
              'shrink-0 rounded-(--radius-sm) px-2.5 py-1 text-xs font-medium',
              STATUS_CLASSES[ticket.statusColor],
            )}
          >
            {ticket.statusLabel}
          </span>
        </div>

        {/* --- مشتری و سفارش --- */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-3 text-xs">
          {ticket.customer && (
            <>
              <span className="inline-flex items-center gap-1.5 text-foreground">
                <UserIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                {ticket.customer.name}
              </span>

              <a
                href={`mailto:${ticket.customer.email}`}
                dir="ltr"
                className="inline-flex items-center gap-1.5 text-primary hover:underline"
              >
                <Mail className="size-3.5" aria-hidden="true" />
                {ticket.customer.email}
              </a>
            </>
          )}

          {ticket.orderNumber && (
            <Link
              href={`/admin/orders/${ticket.orderNumber}`}
              className="inline-flex items-center gap-1.5 text-primary hover:underline"
            >
              <Package className="size-3.5" aria-hidden="true" />
              <span dir="ltr" className="font-mono">{ticket.orderNumber}</span>
            </Link>
          )}
        </div>
      </div>

      {/* ================= گفتگو ================= */}
      <ol className="space-y-3">
        {ticket.messages.map((message) => (
          <MessageBubble key={message.id} message={message} locale={locale} />
        ))}
      </ol>

      {/* ================= پاسخ یا بازگشایی ================= */}
      {ticket.acceptsReply ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (replyIsValid && !isBusy) replyMutation.mutate(reply.trim())
          }}
          className="mt-5 rounded-(--radius-lg) border border-border bg-card p-4"
        >
          <label
            htmlFor="admin-ticket-reply"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            {t('replyLabel')}
          </label>

          <textarea
            id="admin-ticket-reply"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={4}
            maxLength={5000}
            placeholder={t('replyPlaceholder')}
            className="w-full rounded-(--radius-md) border border-border bg-background px-3 py-2 text-sm leading-7 text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={!replyIsValid || isBusy}
              className="inline-flex h-10 items-center gap-2 rounded-(--radius-md) bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {replyMutation.isPending
                ? <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                : <Send className="size-4" aria-hidden="true" />}
              {t('send')}
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm(t('closeConfirm'))) closeMutation.mutate()
              }}
              disabled={isBusy}
              className="ms-auto inline-flex h-10 items-center gap-2 rounded-(--radius-md) border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
              <Lock className="size-4" aria-hidden="true" />
              {t('close')}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-5 flex flex-col items-center rounded-(--radius-lg) border border-dashed border-border py-10 text-center">
          <Lock className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-foreground">{t('closedTitle')}</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">{t('closedDesc')}</p>

          <button
            type="button"
            onClick={() => reopenMutation.mutate()}
            disabled={isBusy}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-(--radius-md) bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {reopenMutation.isPending
              ? <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              : <RotateCcw className="size-4" aria-hidden="true" />}
            {t('reopen')}
          </button>
        </div>
      )}

      <div className="mt-6">
        <Link
          href="/admin/tickets"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t('backToQueue')}
        </Link>
      </div>
    </div>
  )
}

/* =========================================================================
 * یک حباب پیام
 * ======================================================================= */

function MessageBubble({ message, locale }: { message: TicketMessage; locale: Locale }) {
  const t = useTranslations('admin.tickets')

  return (
    <li
      className={cn(
        'rounded-(--radius-lg) border p-4',
        /*
          ⚠️ برجسته‌سازی اینجا **برعکس** نمای مشتری است.
             آنجا پاسخ پشتیبانی رنگی بود چون خبر تازه برای مشتری است.
             اینجا پیام *مشتری* باید بیرون بزند: چیزی است که پشتیبان
             باید بخواند و به آن جواب دهد.
        */
        message.isStaff
          ? 'border-border bg-card'
          : 'border-primary/30 bg-primary/5',
      )}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 font-medium',
            message.isStaff ? 'text-muted-foreground' : 'text-primary',
          )}
        >
          {message.isStaff
            ? <Headset className="size-3.5" aria-hidden="true" />
            : <UserIcon className="size-3.5" aria-hidden="true" />}
          {message.isStaff
            ? `${t('staffLabel')}${message.authorName ? ` · ${message.authorName}` : ''}`
            : (message.authorName ?? t('customerLabel'))}
        </span>

        <span className="text-muted-foreground" aria-hidden="true">·</span>
        <time dateTime={message.createdAt} className="text-muted-foreground">
          {formatDateTime(message.createdAt, locale)}
        </time>
      </div>

      <p className="whitespace-pre-line text-sm leading-7 text-foreground">{message.body}</p>
    </li>
  )
}
