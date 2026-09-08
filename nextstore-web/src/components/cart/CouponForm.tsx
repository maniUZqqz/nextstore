'use client'

/**
 * فرم کد تخفیف — داخل خلاصه‌ی سبد
 * ---------------------------------------------------------------------------
 * دو حالت دارد: ورود کد، و نمایش کد اعمال‌شده با دکمه‌ی برداشتن.
 *
 * ⚠️ خطای سرور همان‌جا زیر ورودی نشان داده می‌شود، نه با toast.
 *
 *    پیام‌های این فرم از هم قابل تفکیک‌اند — «مهلت تمام شده»، «ظرفیت
 *    تکمیل»، «حداقل مبلغ نرسیده» — و کاربر باید بتواند هنگام تایپ کد
 *    بعدی همچنان آن را ببیند. toast پس از چند ثانیه محو می‌شود و
 *    دقیقاً وقتی ناپدید می‌شود که کاربر می‌خواهد دوباره بخواندش.
 */

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { Tag, X, Loader2, Check } from 'lucide-react'
import type { Locale } from '@/i18n/routing'
import * as cartApi from '@/lib/api/cart'
import { ApiError } from '@/lib/api/client'
import { formatPrice, currencyLabel } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { Cart } from '@/types/cart'

export function CouponForm({ coupon }: { coupon: Cart['coupon'] }) {
  const t = useTranslations('cart')
  const tStates = useTranslations('states')
  const locale = useLocale() as Locale
  const queryClient = useQueryClient()

  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const applyMutation = useMutation({
    mutationFn: (value: string) => cartApi.applyCoupon(value),
    onSuccess: (cart) => {
      setCode('')
      setError(null)
      /* پاسخ سرور مستقیم در کش می‌نشیند — بدون درخواست دوم */
      queryClient.setQueryData(['cart'], cart)
    },
    onError: (err) => {
      /*
       * پیام سرور دقیق است و باید عیناً نشان داده شود.
       * جایگزین کردنش با متن عمومی، تفاوت «کد اشتباه» و «سبد شما به
       * حداقل نرسیده» را از بین می‌برد — دومی با افزودن یک کالا حل
       * می‌شود و کاربر باید بداند.
       */
      setError(err instanceof ApiError ? err.message : tStates('errorTitle'))
    },
  })

  const removeMutation = useMutation({
    mutationFn: () => cartApi.removeCoupon(),
    onSuccess: (cart) => {
      setError(null)
      queryClient.setQueryData(['cart'], cart)
    },
    onError: () => setError(tStates('errorTitle')),
  })

  /* --- کد اعمال‌شده --- */
  if (coupon) {
    return (
      <div className="mb-4 flex items-center justify-between gap-2 rounded-(--radius-md) border border-success/30 bg-success/5 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Check className="size-4 shrink-0 text-success" aria-hidden="true" />

          <div className="min-w-0">
            {/* کد همیشه چپ‌به‌راست — رشته‌ی لاتین در صفحه‌ی RTL وارونه می‌شود */}
            <p dir="ltr" className="truncate font-mono text-sm font-medium text-success">
              {coupon.code}
            </p>
            <p className="text-xs text-muted-foreground">
              {/* واحد پول لازم است — «۱,۰۰۰,۰۰۰ تخفیف» بدون آن مبهم است */}
              {formatPrice(coupon.discountAmount, locale)} {currencyLabel(locale)} {t('discount')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => removeMutation.mutate()}
          disabled={removeMutation.isPending}
          aria-label={t('removeCoupon')}
          title={t('removeCoupon')}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-(--radius-md) text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
        >
          {removeMutation.isPending
            ? <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            : <X className="size-4" aria-hidden="true" />}
        </button>
      </div>
    )
  }

  /* --- ورود کد --- */
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const trimmed = code.trim()
        if (trimmed && !applyMutation.isPending) applyMutation.mutate(trimmed)
      }}
      className="mb-4"
    >
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Tag
            className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value)
              /* خطای کهنه با اولین تایپ پاک می‌شود */
              if (error) setError(null)
            }}
            maxLength={40}
            /*
             * `dir="ltr"` و بزرگ‌حرف‌سازی بصری.
             *
             * ⚠️ متن واقعی دست‌نخورده می‌ماند و فقط ظاهرش بزرگ‌حرف
             *    می‌شود؛ نرمال‌سازی واقعی در بک‌اند انجام می‌شود تا
             *    تنها یک جا باشد.
             */
            dir="ltr"
            placeholder={t('couponPlaceholder')}
            aria-label={t('couponPlaceholder')}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'coupon-error' : undefined}
            className={cn(
              'h-10 w-full rounded-(--radius-md) border bg-background ps-9 pe-3 font-mono text-sm uppercase text-foreground outline-none placeholder:font-sans placeholder:normal-case placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring',
              error ? 'border-destructive' : 'border-border',
            )}
          />
        </div>

        <button
          type="submit"
          disabled={!code.trim() || applyMutation.isPending}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-(--radius-md) border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
        >
          {applyMutation.isPending && (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          {t('applyCoupon')}
        </button>
      </div>

      {error && (
        <p id="coupon-error" role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}
