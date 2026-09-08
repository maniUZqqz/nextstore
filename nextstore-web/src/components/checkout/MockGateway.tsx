'use client'

/**
 * درگاه پرداخت شبیه‌سازی‌شده
 * ===========================================================================
 * جای «صفحه‌ی بانک» را می‌گیرد و همان قرارداد را پیاده می‌کند:
 *
 *   ۱. پارامترها را از URL می‌خواند (ref، amount، order)
 *   ۲. مبلغ و شماره سفارش را به کاربر نشان می‌دهد
 *   ۳. کاربر «موفق» یا «ناموفق» را انتخاب می‌کند
 *   ۴. تأیید نزد بک‌اند انجام می‌شود
 *   ۵. نتیجه نمایش داده می‌شود
 *
 * ⚠️ نکته‌ی امنیتی که اینجا هم رعایت شده: تأیید نهایی سمت سرور
 *    انجام می‌شود. این صفحه فقط می‌گوید «کاربر دکمه را زد» — تصمیم
 *    نهایی درباره‌ی موفق بودن پرداخت با بک‌اند است.
 */

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import {
  ShieldCheck, CheckCircle2, XCircle, Loader2, CreditCard, AlertTriangle,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { verifyPayment } from '@/lib/api/orders'
import type { OrderDetail } from '@/types/order'
import { formatPrice, currencyLabel } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

type Phase = 'form' | 'verifying' | 'result'

export function MockGateway() {
  const t = useTranslations('gateway')
  const tResult = useTranslations('orderResult')
  const tOrder = useTranslations('order')
  const tCommon = useTranslations('common')
  const locale = useLocale() as Locale

  const params = useSearchParams()

  const reference = params.get('ref') ?? ''
  const amount = Number(params.get('amount') ?? 0)
  const orderNumber = params.get('order') ?? ''

  const [phase, setPhase] = useState<Phase>('form')
  const [succeeded, setSucceeded] = useState(false)
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  /* پارامتر ناقص یعنی کاربر مستقیم وارد این صفحه شده است */
  const isValidRequest = Boolean(reference && orderNumber)

  /** ارسال نتیجه به بک‌اند برای تأیید نهایی. */
  const submit = async (success: boolean) => {
    setPhase('verifying')
    setError(null)

    try {
      const result = await verifyPayment({ ref: reference, success })
      setSucceeded(result.success)
      setOrder(result.order)
    } catch {
      setSucceeded(false)
      setError(tCommon('error'))
    } finally {
      setPhase('result')
    }
  }

  /* --- درخواست نامعتبر --- */
  if (!isValidRequest) {
    return (
      <div className="flex flex-col items-center rounded-(--radius-lg) border border-border bg-card p-8 text-center">
        <AlertTriangle className="size-12 text-warning" aria-hidden="true" />
        <h1 className="mt-4 text-lg font-bold text-foreground">
          {tCommon('error')}
        </h1>
        <Link
          href="/"
          className="mt-5 inline-flex h-11 items-center rounded-(--radius-md) bg-primary px-6 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          {tCommon('back')}
        </Link>
      </div>
    )
  }

  /* --- در حال تأیید --- */
  if (phase === 'verifying') {
    return (
      <div className="flex flex-col items-center rounded-(--radius-lg) border border-border bg-card p-10 text-center">
        <Loader2 className="size-10 animate-spin text-primary" aria-hidden="true" />
        <p className="mt-4 text-sm font-medium text-foreground" role="status">
          {t('verifying')}
        </p>
      </div>
    )
  }

  /* --- نتیجه --- */
  if (phase === 'result') {
    return (
      <div className="flex flex-col items-center rounded-(--radius-lg) border border-border bg-card p-6 text-center sm:p-8">
        {succeeded ? (
          <CheckCircle2 className="size-14 text-success" aria-hidden="true" />
        ) : (
          <XCircle className="size-14 text-destructive" aria-hidden="true" />
        )}

        <h1 className="mt-4 text-lg font-bold text-foreground sm:text-xl">
          {succeeded ? tResult('successTitle') : tResult('failTitle')}
        </h1>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {error ?? (succeeded ? tResult('successDesc') : tResult('failDesc'))}
        </p>

        {/* جزئیات سفارش */}
        {order && (
          <dl className="mt-6 w-full space-y-2.5 rounded-(--radius-md) bg-muted p-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">{tOrder('orderNumber')}</dt>
              <dd className="font-mono font-medium text-foreground" dir="ltr">
                {order.orderNumber}
              </dd>
            </div>

            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">{tOrder('total')}</dt>
              <dd className="font-bold text-foreground" data-price>
                {formatPrice(order.total, locale)} {currencyLabel(locale)}
              </dd>
            </div>

            {order.payment?.trackingNumber && (
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{tResult('trackingNumber')}</dt>
                <dd className="font-mono font-medium text-foreground" dir="ltr">
                  {order.payment.trackingNumber}
                </dd>
              </div>
            )}

            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">{tOrder('status')}</dt>
              <dd
                className={cn(
                  'font-medium',
                  order.statusColor === 'success' && 'text-success',
                  order.statusColor === 'warning' && 'text-warning',
                  order.statusColor === 'info' && 'text-info',
                  order.statusColor === 'destructive' && 'text-destructive',
                )}
              >
                {order.statusLabel}
              </dd>
            </div>
          </dl>
        )}

        <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
          {order && (
            <Link
              href={`/account/orders/${order.orderNumber}`}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-(--radius-md) bg-primary text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              {tResult('viewOrder')}
            </Link>
          )}

          <Link
            href="/products"
            className="inline-flex h-11 flex-1 items-center justify-center rounded-(--radius-md) border border-border text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {tResult('continueShopping')}
          </Link>
        </div>
      </div>
    )
  }

  /* ==========================================================
     فرم درگاه — شبیه صفحه‌ی بانک
     ========================================================== */
  return (
    <div className="overflow-hidden rounded-(--radius-lg) border border-border bg-card">
      {/* سرصفحه شبیه بانک */}
      <div className="border-b border-border bg-muted p-5 text-center">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <CreditCard className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-3 text-base font-bold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* اطلاعات تراکنش */}
      <dl className="space-y-3 p-5 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">{t('orderNumber')}</dt>
          <dd className="font-mono font-medium text-foreground" dir="ltr">
            {orderNumber}
          </dd>
        </div>

        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">{t('referenceId')}</dt>
          <dd className="truncate font-mono text-xs text-muted-foreground" dir="ltr">
            {reference}
          </dd>
        </div>

        <hr className="border-border" />

        <div className="flex items-baseline justify-between">
          <dt className="font-medium text-foreground">{t('amount')}</dt>
          <dd className="flex items-baseline gap-1">
            <span className="text-xl font-black text-foreground" data-price>
              {formatPrice(amount, locale)}
            </span>
            <span className="text-xs text-muted-foreground">{currencyLabel(locale)}</span>
          </dd>
        </div>
      </dl>

      {/* دکمه‌های شبیه‌سازی */}
      <div className="flex flex-col gap-2.5 border-t border-border p-5">
        <button
          type="button"
          onClick={() => submit(true)}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-(--radius-md) bg-success font-bold text-success-foreground transition-opacity hover:opacity-90 active:scale-[0.98]"
        >
          <CheckCircle2 className="size-5" aria-hidden="true" />
          {t('paySuccess')}
        </button>

        <button
          type="button"
          onClick={() => submit(false)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-(--radius-md) border border-border text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <XCircle className="size-4" aria-hidden="true" />
          {t('payFail')}
        </button>

        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
          {t('demoNotice')}
        </p>
      </div>
    </div>
  )
}
