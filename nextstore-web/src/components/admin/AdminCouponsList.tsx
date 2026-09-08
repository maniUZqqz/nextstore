'use client'

/**
 * مدیریت کدهای تخفیف — پنل مدیریت
 * ---------------------------------------------------------------------------
 * تب وضعیت با نشان عددی · جستجو · جدول · فرم کشویی · صفحه‌بندی
 *
 * پوشش حالت‌ها: loading · error · empty · empty-filtered · success
 *
 * ⚠️ فرم به‌جای مودال، در بالای جدول باز می‌شود.
 *
 *    مدیری که کوپن تازه می‌سازد معمولاً می‌خواهد کوپن مشابهی را
 *    ببیند تا مقادیر را هماهنگ بگذارد — «آن یکی چند درصد بود؟».
 *    مودال دقیقاً همان جدول را می‌پوشاند.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import {
  Plus, Search, Pencil, Trash2, Eye, EyeOff, AlertCircle, Loader2, Ticket, X,
} from 'lucide-react'
import type { Locale } from '@/i18n/routing'
import * as couponsApi from '@/lib/api/admin-coupons'
import { ApiError } from '@/lib/api/client'
import { formatNumber, formatPrice, formatDate, currencyLabel } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { CouponForm } from '@/components/admin/CouponForm'
import type { AdminCoupon, CouponTab } from '@/types/admin'

/** تب‌ها — ترتیب اینجا همان ترتیب نمایش است. */
const TABS: CouponTab[] = ['all', 'active', 'scheduled', 'exhausted', 'expired', 'disabled']

/**
 * نگاشت وضعیت به کلاس رنگ.
 *
 * نگاشت ثابت و نه کلاس پویا: Tailwind کلاس‌ها را با اسکن *متن* فایل
 * پیدا می‌کند، پس رشته‌ای که در زمان اجرا ساخته شود در بیلد تولیدی
 * وجود ندارد و بی‌صدا حذف می‌شود.
 */
const STATE_CLASSES: Record<AdminCoupon['state'], string> = {
  active: 'bg-success/10 text-success',
  scheduled: 'bg-info/10 text-info',
  exhausted: 'bg-warning/15 text-warning',
  expired: 'bg-muted text-muted-foreground',
  disabled: 'bg-destructive/10 text-destructive',
}

export function AdminCouponsList({ initialState }: { initialState?: CouponTab }) {
  const t = useTranslations('admin.coupons')
  const tAdmin = useTranslations('admin')
  const tStates = useTranslations('states')
  const tCommon = useTranslations('common')
  const locale = useLocale() as Locale
  const queryClient = useQueryClient()

  const [state, setState] = useState<CouponTab>(initialState ?? 'all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  /**
   * فرم باز.
   *
   * `null` یعنی بسته، `'new'` یعنی ساخت، و یک کوپن یعنی ویرایش همان.
   */
  const [editing, setEditing] = useState<AdminCoupon | 'new' | null>(null)

  const couponsQuery = useQuery({
    queryKey: ['admin', 'coupons', { state, search, page }],
    queryFn: () =>
      couponsApi.getAdminCoupons({
        /* 'all' فیلتری نیست — نفرستادنش همان نتیجه را می‌دهد */
        state: state === 'all' ? undefined : state,
        q: search || undefined,
        page,
      }),
    /* نگه‌داشتن داده‌ی قبلی هنگام تعویض صفحه — بدون آن جدول می‌پرد */
    placeholderData: keepPreviousData,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] })
  }

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      couponsApi.toggleCoupon(id, isActive),
    onSuccess: (_data, variables) => {
      toast.success(t(variables.isActive ? 'enabled' : 'disabled'))
      invalidate()
    },
    onError: () => toast.error(tStates('errorTitle')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => couponsApi.deleteCoupon(id),
    onSuccess: () => {
      toast.success(t('deleted'))
      invalidate()
    },
    onError: (error) => {
      /*
       * ۴۲۲ با کد COUPON_HAS_USAGE یعنی کوپن مصرف شده. پیام سرور
       * راه‌حل را هم می‌گوید («غیرفعالش کنید») و باید عیناً نشان داده
       * شود، نه پیام عمومی.
       */
      toast.error(error instanceof ApiError ? error.message : tStates('errorTitle'))
    },
  })

  /** اعمال جستجو — صفحه به اول برمی‌گردد وگرنه ممکن است خالی بماند. */
  const applySearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  const coupons = couponsQuery.data?.data ?? []
  const counts = couponsQuery.data?.counts
  const types = couponsQuery.data?.types ?? []
  const meta = couponsQuery.data?.meta

  const isFiltered = state !== 'all' || search !== ''

  return (
    <div>
      {/* ================= سربرگ ================= */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>

        <button
          type="button"
          onClick={() => setEditing(editing === 'new' ? null : 'new')}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-(--radius-md) bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          {editing === 'new'
            ? <X className="size-4" aria-hidden="true" />
            : <Plus className="size-4" aria-hidden="true" />}
          {editing === 'new' ? tCommon('cancel') : t('new')}
        </button>
      </div>

      {/* ================= فرم ================= */}
      {editing !== null && types.length > 0 && (
        <div className="mb-5">
          <CouponForm
            coupon={editing === 'new' ? null : editing}
            types={types}
            onDone={() => {
              setEditing(null)
              invalidate()
            }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {/* ================= تب وضعیت ================= */}
      <div
        role="tablist"
        aria-label={t('colState')}
        className="mb-4 flex gap-1 overflow-x-auto border-b border-border"
      >
        {TABS.map((tab) => {
          const active = state === tab
          const count = counts?.[tab]

          return (
            <button
              key={tab}
              role="tab"
              aria-selected={active}
              onClick={() => {
                setState(tab)
                setPage(1)
              }}
              className={cn(
                'relative shrink-0 px-4 py-2.5 text-sm font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t(`state.${tab}`)}

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

        {couponsQuery.isFetching && (
          <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      {/* ================= محتوا ================= */}
      {couponsQuery.isLoading ? (
        <ul className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="h-14 animate-pulse rounded-(--radius-md) bg-muted" />
          ))}
        </ul>
      ) : couponsQuery.isError ? (
        <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
          <AlertCircle className="size-12 text-warning" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-foreground">{tStates('errorTitle')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{tStates('errorDesc')}</p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
          <Ticket className="size-12 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-foreground">
            {isFiltered ? t('emptyFiltered') : t('empty')}
          </h2>

          {!isFiltered && (
            <button
              type="button"
              onClick={() => setEditing('new')}
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-(--radius-md) bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" aria-hidden="true" />
              {t('emptyCta')}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* جدول در ظرفِ اسکرول افقی — بدون آن نمایشگر کوچک به‌هم می‌ریزد */}
          <div className="overflow-x-auto rounded-(--radius-lg) border border-border">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr className="text-xs text-muted-foreground">
                  <th scope="col" className="px-4 py-3 text-start font-medium">{t('colCode')}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{t('colDiscount')}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{t('colMinTotal')}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{t('colUsage')}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{t('colWindow')}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{t('colState')}</th>
                  <th scope="col" className="px-4 py-3 text-end font-medium">{t('colActions')}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {coupons.map((coupon) => (
                  <CouponRow
                    key={coupon.id}
                    coupon={coupon}
                    locale={locale}
                    isBusy={
                      (toggleMutation.isPending && toggleMutation.variables?.id === coupon.id) ||
                      (deleteMutation.isPending && deleteMutation.variables === coupon.id)
                    }
                    onEdit={() => setEditing(coupon)}
                    onToggle={() =>
                      toggleMutation.mutate({ id: coupon.id, isActive: !coupon.isActive })
                    }
                    onDelete={() => {
                      if (window.confirm(t('deleteConfirm'))) deleteMutation.mutate(coupon.id)
                    }}
                  />
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

function CouponRow({
  coupon,
  locale,
  isBusy,
  onEdit,
  onToggle,
  onDelete,
}: {
  coupon: AdminCoupon
  locale: Locale
  isBusy: boolean
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  const t = useTranslations('admin.coupons')
  const tCommon = useTranslations('common')

  return (
    <tr className={cn('transition-opacity', isBusy && 'opacity-50')}>
      {/* --- کد --- */}
      <td className="px-4 py-3">
        {/* کد همیشه چپ‌به‌راست — رشته‌ی لاتین در RTL وارونه می‌شود */}
        <p dir="ltr" className="font-mono font-medium text-foreground">{coupon.code}</p>
        {coupon.description && (
          <p className="mt-0.5 max-w-[22rem] truncate text-xs text-muted-foreground">
            {coupon.description}
          </p>
        )}
      </td>

      {/* --- مقدار تخفیف --- */}
      <td className="px-4 py-3">
        {/*
          ⚠️ مبلغ بدون واحد در پنل مالی خطرناک است: «۲۰۰,۰۰۰» می‌تواند
             ریال خوانده شود یا تومان، و مدیر بر اساس همان عدد کمپین
             می‌سازد. درصد واحد ندارد و نمی‌خواهد.
        */}
        <p className="text-foreground">
          {coupon.type === 'percent'
            ? t('percentValue', { value: coupon.value })
            : `${formatPrice(coupon.value, locale)} ${currencyLabel(locale)}`}
        </p>

        {/* سقف فقط برای نوع درصدی معنا دارد و فقط وقتی تعیین شده */}
        {coupon.type === 'percent' && coupon.maxDiscount !== null && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t('capTo', { amount: formatPrice(coupon.maxDiscount, locale) })}
          </p>
        )}
      </td>

      <td className="px-4 py-3 text-muted-foreground">
        {coupon.minOrderTotal > 0
          ? `${formatPrice(coupon.minOrderTotal, locale)} ${currencyLabel(locale)}`
          : '—'}
      </td>

      {/* --- مصرف --- */}
      <td className="px-4 py-3">
        <span className="tabular-nums text-foreground">
          {formatNumber(coupon.usedCount, locale)}
          <span className="text-muted-foreground">
            {' / '}
            {/* تهی یعنی نامحدود — نماد بی‌نهایت گویاتر از خط تیره است */}
            {coupon.usageLimit === null ? '∞' : formatNumber(coupon.usageLimit, locale)}
          </span>
        </span>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t('perUser', { count: coupon.perUserLimit })}
        </p>
      </td>

      {/* --- بازه --- */}
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {coupon.startsAt || coupon.expiresAt ? (
          <>
            <p>{coupon.startsAt ? formatDate(coupon.startsAt, locale) : '—'}</p>
            <p>{coupon.expiresAt ? formatDate(coupon.expiresAt, locale) : '—'}</p>
          </>
        ) : (
          t('noWindow')
        )}
      </td>

      <td className="px-4 py-3">
        <span
          className={cn(
            'inline-flex rounded-(--radius-sm) px-2 py-0.5 text-xs font-medium',
            STATE_CLASSES[coupon.state],
          )}
        >
          {t(`state.${coupon.state}`)}
        </span>
      </td>

      {/* --- عملیات --- */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={onToggle}
            disabled={isBusy}
            title={t(coupon.isActive ? 'disable' : 'enable')}
            aria-label={t(coupon.isActive ? 'disable' : 'enable')}
            className="inline-flex size-8 items-center justify-center rounded-(--radius-md) text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            {coupon.isActive
              ? <EyeOff className="size-4" aria-hidden="true" />
              : <Eye className="size-4" aria-hidden="true" />}
          </button>

          <button
            type="button"
            onClick={onEdit}
            title={tCommon('edit')}
            aria-label={tCommon('edit')}
            className="inline-flex size-8 items-center justify-center rounded-(--radius-md) text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Pencil className="size-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={isBusy}
            title={tCommon('delete')}
            aria-label={tCommon('delete')}
            className="inline-flex size-8 items-center justify-center rounded-(--radius-md) text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  )
}
