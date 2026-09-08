'use client'

/**
 * نمای گفتگوی یک تیکت
 * ---------------------------------------------------------------------------
 * سربرگ وضعیت · حباب‌های پیام · فرم پاسخ · بستن و بازگشایی
 *
 * ⚠️ حباب پیام‌ها با `isStaff` سمت‌بندی می‌شوند، نه با مقایسه‌ی نام
 *    فرستنده با کاربر جاری. اگر پشتیبان و مشتری هم‌نام باشند مقایسه‌ی
 *    نام دو طرف گفتگو را قاطی می‌کند؛ `isStaff` را بک‌اند از روی نقش
 *    تعیین می‌کند و همیشه درست است.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import {
  Send, Lock, RotateCcw, AlertCircle, Loader2, Headset, User as UserIcon, Package,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import * as ticketsApi from '@/lib/api/tickets'
import { ApiError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { STATUS_CLASSES } from '@/components/account/OrdersList'
import type { TicketMessage } from '@/types/ticket'

/**
 * حداقل طول پاسخ — هم‌راستا با ReplyTicketRequest بک‌اند (min:2).
 *
 * ⚠️ عمداً کمتر از ثبت تیکت (۲۰ نویسه) است: پاسخ کوتاهی مثل «ممنون»
 *    یا «بله» در ادامه‌ی گفتگو کاملاً طبیعی است، در حالی که همان متن
 *    به‌عنوان *شرح مشکل* بی‌فایده بود.
 */
const MIN_REPLY = 2

export function TicketConversation({ ticketNumber }: { ticketNumber: string }) {
  const t = useTranslations('tickets')
  const tStates = useTranslations('states')
  const locale = useLocale() as Locale
  const queryClient = useQueryClient()

  const [reply, setReply] = useState('')

  const ticketQuery = useQuery({
    queryKey: ['ticket', ticketNumber],
    queryFn: () => ticketsApi.getTicket(ticketNumber),
  })

  /**
   * باطل کردن کوئری‌های وابسته.
   *
   * علاوه بر خود گفتگو، فهرست هم باید تازه شود: پاسخ دادن، وضعیت و
   * «آخرین پاسخ» را عوض می‌کند و کاربری که برمی‌گردد نباید داده‌ی کهنه ببیند.
   */
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['ticket', ticketNumber] })
    queryClient.invalidateQueries({ queryKey: ['tickets'] })
  }

  const replyMutation = useMutation({
    mutationFn: (body: string) => ticketsApi.replyToTicket(ticketNumber, body),
    onSuccess: () => {
      setReply('')
      invalidate()
    },
    onError: (error) => {
      /*
       * ⚠️ ۴۰۹ یعنی تیکت بسته شده — نه خطای اعتبارسنجی.
       *    پیام عمومی «مشکلی پیش آمد» اینجا گمراه‌کننده است: کاربر
       *    فکر می‌کند متنش مشکل دارد، در حالی که فقط باید تیکت را
       *    باز کند. داده هم تازه می‌شود تا دکمه‌ی بازگشایی ظاهر شود.
       */
      if (error instanceof ApiError && error.status === 409) {
        toast.error(error.message)
        invalidate()
        return
      }
      toast.error(tStates('errorTitle'))
    },
  })

  const closeMutation = useMutation({
    mutationFn: () => ticketsApi.closeTicket(ticketNumber),
    onSuccess: (data) => {
      toast.success(t('closed'))
      queryClient.setQueryData(['ticket', ticketNumber], data)
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
    onError: () => toast.error(tStates('errorTitle')),
  })

  const reopenMutation = useMutation({
    mutationFn: () => ticketsApi.reopenTicket(ticketNumber),
    onSuccess: (data) => {
      toast.success(t('reopened'))
      queryClient.setQueryData(['ticket', ticketNumber], data)
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
    onError: () => toast.error(tStates('errorTitle')),
  })

  /* --- حالت‌های بارگذاری و خطا --- */

  if (ticketQuery.isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-(--radius-lg) bg-muted" />
        <div className="h-32 animate-pulse rounded-(--radius-lg) bg-muted" />
        <div className="h-32 animate-pulse rounded-(--radius-lg) bg-muted" />
      </div>
    )
  }

  if (ticketQuery.isError || !ticketQuery.data) {
    /*
     * ۴۰۴ اینجا هم «وجود ندارد» است و هم «مال شما نیست» — بک‌اند
     * عمداً این دو را تفکیک نمی‌کند تا شمارش تیکت‌ها ممکن نباشد.
     * پس پیام هم باید همین‌قدر خنثی بماند.
     */
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
          href="/account/tickets"
          className="mt-6 inline-flex h-10 items-center rounded-(--radius-md) border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          {t('backToList')}
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

            {ticket.orderNumber && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Package className="size-3.5" aria-hidden="true" />
                {t('relatedOrder')}
                <Link
                  href={`/account/orders/${ticket.orderNumber}`}
                  dir="ltr"
                  className="font-mono text-primary hover:underline"
                >
                  {ticket.orderNumber}
                </Link>
              </p>
            )}
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
            htmlFor="ticket-reply"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            {t('replyLabel')}
          </label>

          <textarea
            id="ticket-reply"
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

            {/*
              «بستن» در همان نوار پاسخ است، نه در سربرگ.
              کاربری که مشکلش حل شده، همان جایی تصمیم می‌گیرد که
              آخرین پاسخ را خوانده است.
            */}
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
          href="/account/tickets"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t('backToList')}
        </Link>
      </div>
    </div>
  )
}

/* =========================================================================
 * یک حباب پیام
 * ======================================================================= */

function MessageBubble({ message, locale }: { message: TicketMessage; locale: Locale }) {
  const t = useTranslations('tickets')

  return (
    <li
      className={cn(
        'rounded-(--radius-lg) border p-4',
        message.isStaff
          /* پاسخ پشتیبانی برجسته‌تر است تا در گفتگوی بلند سریع پیدا شود */
          ? 'border-primary/30 bg-primary/5'
          : 'border-border bg-card',
      )}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 font-medium',
            message.isStaff ? 'text-primary' : 'text-foreground',
          )}
        >
          {message.isStaff
            ? <Headset className="size-3.5" aria-hidden="true" />
            : <UserIcon className="size-3.5" aria-hidden="true" />}
          {message.isStaff ? t('staff') : (message.authorName ?? t('you'))}
        </span>

        <span className="text-muted-foreground" aria-hidden="true">·</span>
        <time dateTime={message.createdAt} className="text-muted-foreground">
          {formatDateTime(message.createdAt, locale)}
        </time>
      </div>

      {/*
        `whitespace-pre-line` تا خطوط جدیدی که کاربر تایپ کرده حفظ شوند.
        بدون آن، پیام چندبندی یک بلوک به‌هم‌چسبیده می‌شود.
      */}
      <p className="whitespace-pre-line text-sm leading-7 text-foreground">{message.body}</p>
    </li>
  )
}
