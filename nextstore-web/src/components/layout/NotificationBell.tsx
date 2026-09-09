'use client'

/**
 * زنگوله‌ی اعلان در هدر
 * ---------------------------------------------------------------------------
 * نشان عددی + کشوی پیش‌نمایش با پنج اعلان آخر.
 *
 * ⚠️ برای کاربر واردنشده **هیچ چیزی رندر نمی‌شود** — نه زنگوله‌ی خاکستری
 *    و نه نشان صفر.
 *
 *    زنگوله‌ای که همیشه خالی است فقط جای هدر را می‌گیرد، و بدتر: هر
 *    بازدیدکننده‌ی مهمان یک درخواست ۴۰۱ به سرور می‌زد.
 *
 * ⚠️ شمارنده از اندپوینت **سبک** می‌آید نه از فهرست کامل.
 *
 *    این کامپوننت در هر صفحه‌ی سایت رندر می‌شود؛ گرفتن فهرست
 *    صفحه‌بندی‌شده برای یک عدد یعنی یک پاسخ چندکیلوبایتی در هر
 *    بارگذاری. فهرست فقط وقتی گرفته می‌شود که کاربر کشو را باز کند.
 */

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { Bell, Check, Loader2 } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { useAuth } from '@/hooks/useAuth'
import * as api from '@/lib/api/notifications'
import { NotificationIcon, NOTIFICATION_COLOR } from '@/lib/utils/notification-icon'
import { formatNumber, formatDateTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { AppNotification } from '@/types/notification'

/** کلید کش شمارنده — صفحه‌ی اعلان‌ها هم بعد از تغییر باطلش می‌کند. */
export const UNREAD_QUERY_KEY = ['notifications', 'unread-count'] as const

export function NotificationBell() {
  const t = useTranslations('notifications')
  const locale = useLocale() as Locale
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const unreadQuery = useQuery({
    queryKey: UNREAD_QUERY_KEY,
    queryFn: api.getUnreadCount,
    /* فقط وقتی کاربر وارد است؛ وگرنه هر مهمان یک ۴۰۱ می‌گیرد */
    enabled: isAuthenticated,
    /*
     * ⚠️ یک دقیقه تازه می‌ماند و در فوکوس پنجره دوباره گرفته می‌شود.
     *
     *    اعلان از سمت سرور می‌آید و کاربر خبر ندارد. بدون بازخوانی،
     *    تا رفرش بعدی زنگوله خاموش می‌ماند. یک دقیقه تعادل قابل قبولی
     *    است: نه آن‌قدر کوتاه که هر صفحه یک درخواست بزند، نه آن‌قدر
     *    بلند که کاربر پاسخ پشتیبانی را نبیند.
     */
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  })

  /* فهرست فقط وقتی گرفته می‌شود که کشو باز شود */
  const listQuery = useQuery({
    queryKey: ['notifications', 'preview'],
    queryFn: () => api.getNotifications(),
    enabled: isAuthenticated && isOpen,
    staleTime: 30_000,
  })

  const markAllMutation = useMutation({
    mutationFn: api.markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markOneMutation = useMutation({
    mutationFn: (id: number) => api.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  /*
   * بستن کشو با کلیک بیرون و کلید Escape.
   *
   * ⚠️ هر دو لازم‌اند: کاربر ماوس کشو را با کلیک بیرون می‌بندد و کاربر
   *    صفحه‌کلید با Escape. نبودِ دومی یعنی کسی که با Tab رسیده، هیچ
   *    راهی برای بستن ندارد جز رفتن تا انتهای فهرست.
   */
  useEffect(() => {
    if (!isOpen) return

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  if (!isAuthenticated) return null

  const unread = unreadQuery.data ?? 0
  const items = (listQuery.data?.data ?? []).slice(0, 5)

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label={unread > 0 ? t('ariaWithCount', { count: unread }) : t('aria')}
        className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Bell className="size-5" aria-hidden="true" />

        {unread > 0 && (
          <span
            /*
             * ⚠️ عدد بالای ۹ به «۹+» تبدیل می‌شود.
             *
             *    نشان دایره‌ای برای دو رقم جا ندارد و «۱۲۷» از کادر
             *    بیرون می‌زد و روی آیکون می‌افتاد.
             */
            className="absolute -end-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-4 text-destructive-foreground"
            aria-hidden="true"
          >
            {unread > 9 ? `${formatNumber(9, locale)}+` : formatNumber(unread, locale)}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label={t('title')}
          className="absolute end-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-(--radius-lg) border border-border bg-card shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-bold text-foreground">{t('title')}</span>

            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary disabled:opacity-60"
              >
                {markAllMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="size-3.5" aria-hidden="true" />
                )}
                {t('markAllRead')}
              </button>
            )}
          </div>

          {listQuery.isLoading ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-(--radius-md) bg-muted" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              {t('empty')}
            </p>
          ) : (
            <ul className="max-h-80 divide-y divide-border overflow-y-auto">
              {items.map((item) => (
                <NotificationRow
                  key={item.id}
                  notification={item}
                  locale={locale}
                  onOpen={() => {
                    if (!item.isRead) markOneMutation.mutate(item.id)
                    setIsOpen(false)
                  }}
                />
              ))}
            </ul>
          )}

          <Link
            href="/account/notifications"
            onClick={() => setIsOpen(false)}
            className="block border-t border-border px-4 py-3 text-center text-sm font-medium text-primary transition-colors hover:bg-accent"
          >
            {t('seeAll')}
          </Link>
        </div>
      )}
    </div>
  )
}

/* ========================================================================== */

/** یک ردیف در کشوی پیش‌نمایش. */
function NotificationRow({
  notification,
  locale,
  onOpen,
}: {
  notification: AppNotification
  locale: Locale
  onOpen: () => void
}) {
  const tone = NOTIFICATION_COLOR[notification.color] ?? NOTIFICATION_COLOR.info

  const content = (
    <span className="flex items-start gap-3 px-4 py-3 text-start">
      <span className={cn('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full', tone)}>
        <NotificationIcon name={notification.icon} className="size-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span className={cn('block text-sm', notification.isRead ? 'text-foreground' : 'font-bold text-foreground')}>
          {notification.title}
        </span>
        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
          {notification.body}
        </span>
        <span className="mt-1 block text-[11px] tabular-nums text-muted-foreground">
          {formatDateTime(notification.createdAt, locale)}
        </span>
      </span>

      {/* نقطه‌ی خوانده‌نشده — نشانه‌ی بصری بدون اشغال فضا */}
      {!notification.isRead && (
        <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
      )}
    </span>
  )

  /*
   * ⚠️ اعلان بدون مقصد، دکمه می‌شود نه لینک.
   *
   *    `<Link href="">` در نکست به صفحه‌ی جاری می‌رود و کشو را
   *    می‌بندد بدون اینکه کاری کرده باشد — کاربر فکر می‌کند چیزی
   *    خراب است. دکمه فقط اعلان را خوانده‌شده می‌کند.
   */
  return (
    <li className={cn(!notification.isRead && 'bg-primary/[0.03]')}>
      {notification.link ? (
        <Link href={notification.link} onClick={onOpen} className="block hover:bg-accent">
          {content}
        </Link>
      ) : (
        <button type="button" onClick={onOpen} className="block w-full hover:bg-accent">
          {content}
        </button>
      )}
    </li>
  )
}
