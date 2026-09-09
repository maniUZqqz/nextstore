'use client'

/**
 * فهرست کامل اعلان‌ها — بخش حساب کاربری
 * ---------------------------------------------------------------------------
 * تب خوانده‌نشده/همه · علامت‌گذاری همه · حذف تکی · صفحه‌بندی
 *
 * پوشش حالت‌ها: loading · error · empty · empty-filtered · success
 *
 * ⚠️ برخلاف کشوی زنگوله، اینجا اعلان با باز شدن صفحه **خوانده‌شده
 *    نمی‌شود**.
 *
 *    کاربر ممکن است فقط بخواهد ببیند چه چیزی هست و بعداً رسیدگی کند.
 *    خوانده‌شدنِ خودکار یعنی نشان زنگوله خالی می‌شود در حالی که هیچ
 *    کاری انجام نشده — و همان اعلان دیگر به چشم نمی‌آید.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import { Bell, Check, Trash2, AlertCircle, Loader2 } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import * as api from '@/lib/api/notifications'
import { NotificationIcon, NOTIFICATION_COLOR } from '@/lib/utils/notification-icon'
import { formatNumber, formatDateTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { AdminPagination } from '@/components/admin/AdminPagination'
import type { AppNotification } from '@/types/notification'

type Tab = 'unread' | 'all'

export function NotificationsList() {
  const t = useTranslations('notifications')
  const tStates = useTranslations('states')
  const locale = useLocale() as Locale
  const queryClient = useQueryClient()

  const [tab, setTab] = useState<Tab>('unread')
  const [page, setPage] = useState(1)

  const query = useQuery({
    queryKey: ['notifications', 'list', { tab, page }],
    queryFn: () => api.getNotifications({ status: tab, page }),
    /* بدون این، هر تعویض تب کل فهرست را به اسکلت خاکستری تبدیل می‌کند */
    placeholderData: keepPreviousData,
  })

  /** پس از هر تغییر، هم فهرست و هم شمارنده‌ی زنگوله باید تازه شوند. */
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notifications'] })

  const markOne = useMutation({
    mutationFn: (id: number) => api.markNotificationRead(id),
    onSuccess: invalidate,
    onError: () => toast.error(tStates('errorTitle')),
  })

  const markAll = useMutation({
    mutationFn: api.markAllNotificationsRead,
    onSuccess: (response) => {
      toast.success(response.message)
      invalidate()
    },
    onError: () => toast.error(tStates('errorTitle')),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteNotification(id),
    onSuccess: (response) => {
      toast.success(response.message)
      invalidate()
    },
    onError: () => toast.error(tStates('errorTitle')),
  })

  const items = query.data?.data ?? []
  const meta = query.data?.meta
  const unread = meta?.unread ?? 0

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>

        {unread > 0 && (
          <button
            type="button"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="inline-flex h-10 items-center gap-2 rounded-(--radius-md) border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
          >
            {markAll.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="size-4" aria-hidden="true" />
            )}
            {t('markAllRead')}
          </button>
        )}
      </div>

      {/* ================= تب‌ها ================= */}
      <div
        role="tablist"
        aria-label={t('title')}
        className="mb-4 flex gap-1 overflow-x-auto border-b border-border"
      >
        {(['unread', 'all'] as Tab[]).map((value) => {
          const active = tab === value

          return (
            <button
              key={value}
              role="tab"
              aria-selected={active}
              onClick={() => {
                setTab(value)
                setPage(1)
              }}
              className={cn(
                'relative shrink-0 px-4 py-2.5 text-sm font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t(`tab.${value}`)}

              {value === 'unread' && unread > 0 && (
                <span className="ms-1.5 text-xs tabular-nums opacity-70">
                  {formatNumber(unread, locale)}
                </span>
              )}

              {active && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" aria-hidden="true" />
              )}
            </button>
          )
        })}

        {query.isFetching && (
          <span className="ms-auto flex items-center pe-2">
            <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
          </span>
        )}
      </div>

      {/* ================= محتوا ================= */}
      {query.isLoading ? (
        <ul className="space-y-3">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-20 animate-pulse rounded-(--radius-lg) bg-muted" />
          ))}
        </ul>
      ) : query.isError ? (
        <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
          <AlertCircle className="size-12 text-warning" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-foreground">{tStates('errorTitle')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{tStates('errorDesc')}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
          <Bell className="size-12 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-foreground">
            {/*
              «همه را خوانده‌ای» خبر خوبی است، نه پوچی — و با «هنوز
              اعلانی نیامده» یکی نیست.
            */}
            {tab === 'unread' ? t('emptyUnread') : t('empty')}
          </h2>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((item) => (
              <NotificationCard
                key={item.id}
                notification={item}
                locale={locale}
                isBusy={
                  (markOne.isPending && markOne.variables === item.id)
                  || (remove.isPending && remove.variables === item.id)
                }
                onMarkRead={() => markOne.mutate(item.id)}
                onDelete={() => remove.mutate(item.id)}
              />
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

/* ========================================================================== */

/** یک اعلان در فهرست کامل. */
function NotificationCard({
  notification,
  locale,
  isBusy,
  onMarkRead,
  onDelete,
}: {
  notification: AppNotification
  locale: Locale
  isBusy: boolean
  onMarkRead: () => void
  onDelete: () => void
}) {
  const t = useTranslations('notifications')

  const tone = NOTIFICATION_COLOR[notification.color] ?? NOTIFICATION_COLOR.info

  return (
    <li
      className={cn(
        'rounded-(--radius-lg) border bg-card p-4',
        notification.isRead ? 'border-border' : 'border-primary/40',
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn('mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full', tone)}>
          <NotificationIcon name={notification.icon} className="size-4" />
        </span>

        <div className="min-w-0 flex-1">
          <p className={cn('text-sm', notification.isRead ? 'text-foreground' : 'font-bold text-foreground')}>
            {notification.title}
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{notification.body}</p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-xs tabular-nums text-muted-foreground">
              {formatDateTime(notification.createdAt, locale)}
            </span>

            {notification.link && (
              <Link
                href={notification.link}
                onClick={() => {
                  if (!notification.isRead) onMarkRead()
                }}
                className="text-xs font-medium text-primary hover:underline"
              >
                {t('open')}
              </Link>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {!notification.isRead && (
            <button
              type="button"
              onClick={onMarkRead}
              disabled={isBusy}
              aria-label={t('markRead')}
              title={t('markRead')}
              className="inline-flex size-9 items-center justify-center rounded-(--radius-md) border border-border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
            >
              {isBusy ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="size-4" aria-hidden="true" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onDelete}
            disabled={isBusy}
            aria-label={t('delete')}
            title={t('delete')}
            className="inline-flex size-9 items-center justify-center rounded-(--radius-md) border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:opacity-60"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  )
}
