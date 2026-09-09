'use client'

/**
 * مدیریت بنرهای صفحه‌ی اصلی — پنل مدیریت
 * ---------------------------------------------------------------------------
 * تب جایگاه · نشان وضعیت · روشن/خاموش سریع · ویرایش · حذف
 *
 * پوشش حالت‌ها: loading · error · empty · success
 *
 * ⚠️ بدون صفحه‌بندی، عمداً: بنرها چند قلم‌اند و ترتیبشان قابل تغییر
 *    است. جابه‌جا کردن قلمی که در صفحه‌ی بعد نشسته، کار نشدنی می‌شود.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import {
  Plus, Pencil, Trash2, Eye, EyeOff, AlertCircle, Loader2, ImageIcon,
  Clock, CalendarX2, CheckCircle2,
} from 'lucide-react'
import type { Locale } from '@/i18n/routing'
import * as bannersApi from '@/lib/api/admin-banners'
import type { BannerInput } from '@/lib/api/admin-banners'
import { ApiError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { AdminBannerForm } from '@/components/admin/AdminBannerForm'
import type { AdminBanner, BannerPlacement, BannerState } from '@/types/banner'

const PLACEMENT_TABS: BannerPlacement[] = ['hero', 'promo']

/**
 * نگاشت وضعیت به رنگ و آیکون.
 *
 * ⚠️ نگاشت ثابت و نه کلاس پویا: Tailwind کلاس‌ها را با اسکن *متن*
 *    فایل پیدا می‌کند، پس رشته‌ای که در زمان اجرا ساخته شود در بیلد
 *    تولیدی وجود ندارد و بی‌صدا حذف می‌شود.
 */
const STATE_STYLE: Record<BannerState, string> = {
  live: 'bg-success/10 text-success',
  scheduled: 'bg-info/10 text-info',
  expired: 'bg-warning/10 text-warning',
  disabled: 'bg-muted text-muted-foreground',
}

export function AdminBannersList() {
  const t = useTranslations('admin.banners')
  const tStates = useTranslations('states')
  const tCommon = useTranslations('common')
  const locale = useLocale() as Locale
  const queryClient = useQueryClient()

  const [placement, setPlacement] = useState<BannerPlacement>('hero')

  /** بنری که فرمش باز است؛ `'new'` یعنی ساخت تازه. */
  const [editing, setEditing] = useState<AdminBanner | 'new' | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const bannersQuery = useQuery({
    queryKey: ['admin', 'banners', placement],
    queryFn: () => bannersApi.getBanners(placement),
  })

  /**
   * تازه‌سازی فهرست پنل پس از هر تغییر.
   *
   * ⚠️ کش صفحه‌ی اصلی اینجا باطل **نمی‌شود** و نباید بشود.
   *
   *    نسخه‌ی اول همین‌جا `/api/revalidate` را صدا می‌زد. آن مسیر یک
   *    راز مشترک می‌خواهد که عمداً به باندل مرورگر نمی‌رسد، پس
   *    درخواست بی‌صدا رد می‌شد و کش هرگز تازه نمی‌شد — بدترین حالت:
   *    کدی که وانمود می‌کند کار می‌کند.
   *
   *    کار درست را بک‌اند انجام می‌دهد: `AdminBannerController` پس از
   *    هر نوشتن `CacheInvalidator::flushBanners()` را صدا می‌زند و
   *    آن از سمت سرور با راز درست به نکست خبر می‌دهد.
   */
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] })
  }

  const saveMutation = useMutation({
    mutationFn: (input: BannerInput) =>
      editing && editing !== 'new'
        ? bannersApi.updateBanner(editing.id, input)
        : bannersApi.createBanner(input),

    onSuccess: () => {
      toast.success(tCommon('saved'))
      setEditing(null)
      setFieldErrors({})
      invalidate()
    },

    onError: (error) => {
      if (error instanceof ApiError && error.isValidation && error.fieldErrors) {
        setFieldErrors(error.fieldErrors)
        toast.error(error.message)
        return
      }
      toast.error(tStates('errorTitle'))
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (id: number) => bannersApi.toggleBanner(id),
    onSuccess: () => invalidate(),
    onError: () => toast.error(tStates('errorTitle')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => bannersApi.deleteBanner(id),
    onSuccess: (response) => {
      toast.success(response.message)
      setEditing(null)
      invalidate()
    },
    onError: () => toast.error(tStates('errorTitle')),
  })

  const banners = bannersQuery.data?.data ?? []
  const meta = bannersQuery.data?.meta

  const errorFor = (field: string) => fieldErrors[field]?.[0]

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFieldErrors({})
            setEditing('new')
          }}
          className="inline-flex h-10 items-center gap-2 rounded-(--radius-md) bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" aria-hidden="true" />
          {t('new')}
        </button>
      </div>

      {/* ================= تب جایگاه ================= */}
      <div
        role="tablist"
        aria-label={t('title')}
        className="mb-4 flex gap-1 overflow-x-auto border-b border-border"
      >
        {PLACEMENT_TABS.map((tab) => {
          const active = placement === tab

          return (
            <button
              key={tab}
              role="tab"
              aria-selected={active}
              onClick={() => {
                setPlacement(tab)
                /* فرم باز به جایگاه قبلی تعلق دارد */
                setEditing(null)
              }}
              className={cn(
                'relative shrink-0 px-4 py-2.5 text-sm font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t(`placement.${tab}`)}
              {active && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" aria-hidden="true" />
              )}
            </button>
          )
        })}

        {bannersQuery.isFetching && (
          <span className="ms-auto flex items-center pe-2">
            <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
          </span>
        )}
      </div>

      {/* ================= فرم ================= */}
      {editing && meta && (
        <div className="mb-4">
          <AdminBannerForm
            /*
             * ⚠️ `key` اجباری است.
             *
             *    فرم مقدار اولیه‌اش را در useState می‌گیرد، پس با عوض
             *    شدن prop دوباره خوانده نمی‌شود. بدون کلید، کلیک روی
             *    «ویرایش» بنر دوم، فرم بنر اول را با داده‌ی قدیمی نگه
             *    می‌داشت.
             */
            key={editing === 'new' ? 'new' : editing.id}
            banner={editing === 'new' ? undefined : editing}
            meta={meta}
            defaultPlacement={placement}
            isSaving={saveMutation.isPending}
            errorFor={errorFor}
            onSubmit={(input) => saveMutation.mutate(input)}
            onCancel={() => {
              setEditing(null)
              setFieldErrors({})
            }}
          />
        </div>
      )}

      {/* ================= فهرست ================= */}
      {bannersQuery.isLoading ? (
        <ul className="space-y-3">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-24 animate-pulse rounded-(--radius-lg) bg-muted" />
          ))}
        </ul>
      ) : bannersQuery.isError ? (
        <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
          <AlertCircle className="size-12 text-warning" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-foreground">{tStates('errorTitle')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{tStates('errorDesc')}</p>
        </div>
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
          <ImageIcon className="size-12 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-foreground">{t('empty')}</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">{t('emptyDesc')}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {banners.map((banner) => (
            <BannerRow
              key={banner.id}
              banner={banner}
              locale={locale}
              isBusy={
                (toggleMutation.isPending && toggleMutation.variables === banner.id)
                || (deleteMutation.isPending && deleteMutation.variables === banner.id)
              }
              onEdit={() => {
                setFieldErrors({})
                setEditing(banner)
              }}
              onToggle={() => toggleMutation.mutate(banner.id)}
              onDelete={() => {
                if (window.confirm(t('deleteConfirm'))) deleteMutation.mutate(banner.id)
              }}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

/* ========================================================================== */

/** یک بنر در فهرست. */
function BannerRow({
  banner,
  locale,
  isBusy,
  onEdit,
  onToggle,
  onDelete,
}: {
  banner: AdminBanner
  locale: Locale
  isBusy: boolean
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  const t = useTranslations('admin.banners')
  const tCommon = useTranslations('common')

  const StateIcon = {
    live: CheckCircle2,
    scheduled: Clock,
    expired: CalendarX2,
    disabled: EyeOff,
  }[banner.state]

  return (
    <li className="rounded-(--radius-lg) border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-foreground">
              {/* عنوان به زبان جاری پنل، با بازگشت به فارسی */}
              {banner.title[locale] || banner.title.fa || '—'}
            </span>

            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]',
                STATE_STYLE[banner.state],
              )}
            >
              <StateIcon className="size-3" aria-hidden="true" />
              {t(`state.${banner.state}`)}
            </span>

            <span className="text-xs tabular-nums text-muted-foreground">
              #{banner.sortOrder}
            </span>
          </div>

          {banner.subtitle[locale] || banner.subtitle.fa ? (
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {banner.subtitle[locale] || banner.subtitle.fa}
            </p>
          ) : null}

          <code dir="ltr" className="mt-1 block truncate font-mono text-xs text-muted-foreground">
            {banner.href}
          </code>

          {/*
            بازه‌ی زمانی — فقط وقتی تعریف شده.

            ⚠️ همین است که «چرا این بنر دیده نمی‌شود» را جواب می‌دهد.
               بدون نمایشش، مدیر بنری با تیک «فعال» می‌دید که در سایت
               نبود و هیچ سرنخی نداشت.
          */}
          {(banner.startsAt || banner.endsAt) && (
            <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
              {banner.startsAt && (
                <span>{t('from')}: {formatDateTime(banner.startsAt, locale)}</span>
              )}
              {banner.endsAt && (
                <span>{t('until')}: {formatDateTime(banner.endsAt, locale)}</span>
              )}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onToggle}
            disabled={isBusy}
            aria-label={banner.isActive ? t('disable') : t('enable')}
            title={banner.isActive ? t('disable') : t('enable')}
            className="inline-flex size-9 items-center justify-center rounded-(--radius-md) border border-border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
          >
            {isBusy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : banner.isActive ? (
              <Eye className="size-4" aria-hidden="true" />
            ) : (
              <EyeOff className="size-4" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={onEdit}
            aria-label={tCommon('edit')}
            title={tCommon('edit')}
            className="inline-flex size-9 items-center justify-center rounded-(--radius-md) border border-border text-muted-foreground transition-colors hover:text-foreground"
          >
            <Pencil className="size-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={isBusy}
            aria-label={tCommon('delete')}
            title={tCommon('delete')}
            className="inline-flex size-9 items-center justify-center rounded-(--radius-md) border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:opacity-60"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  )
}
