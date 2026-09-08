'use client'

/**
 * فرم ثبت تیکت پشتیبانی تازه
 * ---------------------------------------------------------------------------
 * موضوع · دپارتمان · اولویت · سفارش مرتبط (اختیاری) · متن پیام
 *
 * ⚠️ گزینه‌های دپارتمان و اولویت از `GET /tickets/meta` می‌آیند، نه از
 *    فهرستی در این فایل. برچسب‌ها در enum های PHP زندگی می‌کنند و
 *    کپی‌کردنشان یعنی افزودن دپارتمان تازه در بک‌اند، این فرم را
 *    بی‌صدا ناقص می‌گذارد.
 *
 * ⚠️ قیدهای طول (۵ و ۲۰ نویسه) عمداً با StoreTicketRequest بک‌اند یکی
 *    هستند. اینجا فقط برای *بازخورد زودهنگام* است؛ اعتبارسنجی واقعی
 *    همچنان سمت سرور انجام می‌شود و خطای ۴۲۲ آن هم نمایش داده می‌شود.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import { Send, Loader2, AlertCircle } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import * as ticketsApi from '@/lib/api/tickets'
import * as ordersApi from '@/lib/api/orders'
import { ApiError } from '@/lib/api/client'
import { cn } from '@/lib/utils/cn'
import type { TicketDepartment, TicketPriority } from '@/types/ticket'

/** حداقل طول‌ها — هم‌راستا با StoreTicketRequest. */
const MIN_SUBJECT = 5
const MIN_BODY = 20

export function TicketForm() {
  const t = useTranslations('tickets')
  const tStates = useTranslations('states')
  const tCommon = useTranslations('common')
  const locale = useLocale() as Locale
  const router = useRouter()
  const queryClient = useQueryClient()

  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [department, setDepartment] = useState<TicketDepartment | ''>('')
  const [priority, setPriority] = useState<TicketPriority>('normal')
  const [orderId, setOrderId] = useState<number | ''>('')

  /** خطاهای اعتبارسنجی سرور، به تفکیک فیلد. */
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const metaQuery = useQuery({
    queryKey: ['tickets', 'meta', locale],
    queryFn: () => ticketsApi.getTicketMeta(locale),
    /* گزینه‌ها به‌ندرت عوض می‌شوند */
    staleTime: 30 * 60 * 1000,
  })

  /*
   * سفارش‌های کاربر — برای چسباندن اختیاری تیکت به یک سفارش.
   * بیشتر تیکت‌های پشتیبانی درباره‌ی یک سفارش مشخص‌اند و بدون این،
   * کاربر ناچار است شماره را دستی در متن بنویسد.
   */
  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getOrders(),
    staleTime: 5 * 60 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      ticketsApi.createTicket({
        subject: subject.trim(),
        body: body.trim(),
        department: department as TicketDepartment,
        priority,
        order_id: orderId === '' ? undefined : orderId,
      }),
    onSuccess: (ticket) => {
      toast.success(t('created', { number: ticket.ticketNumber }))
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      /*
       * `replace` و نه `push`: اگر کاربر دکمه‌ی بازگشت را بزند نباید
       * به فرمِ پرشده برگردد و تیکت دومی بسازد.
       */
      router.replace(`/account/tickets/${ticket.ticketNumber}`)
    },
    onError: (error) => {
      if (error instanceof ApiError && error.isValidation && error.fieldErrors) {
        setFieldErrors(error.fieldErrors)
        return
      }
      toast.error(tStates('errorTitle'))
    },
  })

  const meta = metaQuery.data
  const orders = ordersQuery.data?.data ?? []

  const subjectOk = subject.trim().length >= MIN_SUBJECT
  const bodyOk = body.trim().length >= MIN_BODY
  const canSubmit = subjectOk && bodyOk && department !== '' && !createMutation.isPending

  /** پیام خطای سرور برای یک فیلد. */
  const errorFor = (field: string) => fieldErrors[field]?.[0]

  const inputClass = (field: string) =>
    cn(
      'h-10 w-full rounded-(--radius-md) border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring',
      errorFor(field) ? 'border-destructive' : 'border-border',
    )

  if (metaQuery.isError) {
    return (
      <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
        <AlertCircle className="size-12 text-warning" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-bold text-foreground">{tStates('errorTitle')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{tStates('errorDesc')}</p>
      </div>
    )
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        /* خطاهای قبلی پاک می‌شوند تا خطای کهنه کنار فیلد اصلاح‌شده نماند */
        setFieldErrors({})
        if (canSubmit) createMutation.mutate()
      }}
      className="space-y-5 rounded-(--radius-lg) border border-border bg-card p-4 sm:p-6"
    >
      {/* --- موضوع --- */}
      <div>
        <label htmlFor="ticket-subject" className="mb-1.5 block text-sm font-medium text-foreground">
          {t('fieldSubject')}
        </label>

        <input
          id="ticket-subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={150}
          placeholder={t('fieldSubjectPlaceholder')}
          aria-invalid={Boolean(errorFor('subject'))}
          aria-describedby={errorFor('subject') ? 'ticket-subject-error' : undefined}
          className={inputClass('subject')}
        />

        {errorFor('subject') && (
          <p id="ticket-subject-error" className="mt-1.5 text-xs text-destructive">
            {errorFor('subject')}
          </p>
        )}
      </div>

      {/* --- دپارتمان و اولویت --- */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="ticket-department"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {t('fieldDepartment')}
          </label>

          <select
            id="ticket-department"
            value={department}
            onChange={(e) => setDepartment(e.target.value as TicketDepartment)}
            aria-invalid={Boolean(errorFor('department'))}
            className={inputClass('department')}
          >
            <option value="" disabled>
              {metaQuery.isLoading ? tCommon('loading') : t('fieldDepartmentPlaceholder')}
            </option>

            {(meta?.departments ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {errorFor('department') && (
            <p className="mt-1.5 text-xs text-destructive">{errorFor('department')}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="ticket-priority"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {t('fieldPriority')}
          </label>

          <select
            id="ticket-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
            aria-invalid={Boolean(errorFor('priority'))}
            className={inputClass('priority')}
          >
            {(meta?.priorities ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {errorFor('priority') && (
            <p className="mt-1.5 text-xs text-destructive">{errorFor('priority')}</p>
          )}
        </div>
      </div>

      {/* --- سفارش مرتبط --- */}
      {orders.length > 0 && (
        <div>
          <label htmlFor="ticket-order" className="mb-1.5 block text-sm font-medium text-foreground">
            {t('fieldOrder')}
            <span className="ms-1.5 text-xs font-normal text-muted-foreground">
              {t('optional')}
            </span>
          </label>

          <select
            id="ticket-order"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value === '' ? '' : Number(e.target.value))}
            className={inputClass('order_id')}
          >
            <option value="">{t('fieldOrderNone')}</option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.orderNumber} — {order.statusLabel}
              </option>
            ))}
          </select>

          {errorFor('order_id') && (
            <p className="mt-1.5 text-xs text-destructive">{errorFor('order_id')}</p>
          )}
        </div>
      )}

      {/* --- متن پیام --- */}
      <div>
        <label htmlFor="ticket-body" className="mb-1.5 block text-sm font-medium text-foreground">
          {t('fieldBody')}
        </label>

        <textarea
          id="ticket-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={7}
          maxLength={5000}
          placeholder={t('fieldBodyPlaceholder')}
          aria-invalid={Boolean(errorFor('body'))}
          aria-describedby="ticket-body-hint"
          className={cn(
            'w-full rounded-(--radius-md) border bg-background px-3 py-2 text-sm leading-7 text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring',
            errorFor('body') ? 'border-destructive' : 'border-border',
          )}
        />

        {errorFor('body') ? (
          <p className="mt-1.5 text-xs text-destructive">{errorFor('body')}</p>
        ) : (
          /*
            راهنما همیشه دیده می‌شود، نه فقط بعد از خطا.
            دلیل حداقل ۲۰ نویسه اینجا توضیح داده می‌شود تا کاربر آن را
            یک سخت‌گیری بی‌دلیل نبیند.
          */
          <p id="ticket-body-hint" className="mt-1.5 text-xs text-muted-foreground">
            {t('fieldBodyHint', { min: MIN_BODY })}
          </p>
        )}
      </div>

      {/* --- ثبت --- */}
      <div className="flex items-center gap-3 border-t border-border pt-5">
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex h-11 items-center gap-2 rounded-(--radius-md) bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {createMutation.isPending
            ? <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            : <Send className="size-4" aria-hidden="true" />}
          {t('submit')}
        </button>

        <p className="text-xs text-muted-foreground">{t('submitHint')}</p>
      </div>
    </form>
  )
}
