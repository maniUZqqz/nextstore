'use client'

/**
 * صندوق پیام‌های «تماس با ما» — پنل مدیریت
 * ---------------------------------------------------------------------------
 * تب خوانده‌نشده/خوانده‌شده/همه با نشان عددی · جست‌وجو · باز کردن پیام ·
 * حذف · صفحه‌بندی
 *
 * پوشش حالت‌ها: loading · error · empty · empty-filtered · success
 *
 * ⚠️ چرا کارت و نه جدول؟ همان دلیل صف نظرات: ستون اصلی **متن پیام**
 *    است و متن چندخطی در سلول جدول یا بریده می‌شود یا ردیف را
 *    غول‌آسا می‌کند.
 *
 * ⚠️ اینجا هیچ دکمه‌ی «پاسخ» نیست و نبودش عمدی است.
 *
 *    پاسخ به پیام تماس از راه ایمیل بیرون از سامانه می‌رود؛ دکمه‌ای
 *    که فقط `mailto:` را باز کند بهتر از دکمه‌ای است که وانمود کند
 *    گفتگویی در جریان است. کسی که گفتگو می‌خواهد باید تیکت بزند.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import {
  Mail, MailOpen, Trash2, Search, AlertCircle, Loader2, Inbox,
  ChevronDown, User as UserIcon, Reply,
} from 'lucide-react'
import type { Locale } from '@/i18n/routing'
import * as contactApi from '@/lib/api/admin-contact'
import type { ContactStatusTab } from '@/lib/api/admin-contact'
import { formatNumber, formatDateTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { AdminPagination } from '@/components/admin/AdminPagination'
import type { ContactMessage } from '@/types/contact'

/**
 * تب‌ها — ترتیب اینجا همان ترتیب نمایش است.
 *
 * `unread` اول می‌آید و پیش‌فرض هم هست: کاری که مدیر روزانه انجام
 * می‌دهد رسیدگی به پیام‌های تازه است، نه مرور آرشیو.
 */
const STATUS_TABS: ContactStatusTab[] = ['unread', 'read', 'all']

export function AdminContactInbox({
  initialStatus,
}: {
  initialStatus?: ContactStatusTab
}) {
  const t = useTranslations('admin.contact')
  const tStates = useTranslations('states')
  const tCommon = useTranslations('common')
  const locale = useLocale() as Locale
  const queryClient = useQueryClient()

  const [status, setStatus] = useState<ContactStatusTab>(initialStatus ?? 'unread')
  const [page, setPage] = useState(1)

  /** متن داخل کادر جست‌وجو — با هر کلید عوض می‌شود. */
  const [searchInput, setSearchInput] = useState('')
  /**
   * عبارتی که واقعاً به سرور می‌رود.
   *
   * ⚠️ جدا از `searchInput` است چون جست‌وجو با **ثبت فرم** انجام
   *    می‌شود نه با هر کلید. صندوقی که با هر نویسه یک درخواست بفرستد،
   *    روی عبارت «سفارش» شش درخواست می‌زند که پنج‌تایش دور ریخته
   *    می‌شود.
   */
  const [search, setSearch] = useState('')

  /** شناسه‌ی پیامی که هم‌اکنون باز است. */
  const [openId, setOpenId] = useState<number | null>(null)

  const messagesQuery = useQuery({
    queryKey: ['admin', 'contact', { status, page, search }],
    queryFn: () =>
      contactApi.getContactMessages({
        status,
        page,
        q: search || undefined,
      }),
    /*
     * داده‌ی صفحه‌ی قبل تا رسیدن صفحه‌ی بعد سر جایش می‌ماند: بدون این،
     * هر تعویض تب کل فهرست را به اسکلت خاکستری تبدیل می‌کند و صفحه
     * می‌پرد.
     */
    placeholderData: keepPreviousData,
  })

  /**
   * باز کردن یک پیام.
   *
   * ⚠️ این یک **جهش** است نه کوئری، چون عارضه دارد: سرور پیام را
   *    خوانده‌شده می‌کند. اگر با `useQuery` نوشته می‌شد، ری‌اکت‌کوئری
   *    در بازگشت به تب یا وصل‌شدن دوباره‌ی شبکه خودش refetch می‌کرد و
   *    پیام‌هایی که مدیر هرگز باز نکرده، خوانده‌شده علامت می‌خوردند.
   */
  const openMutation = useMutation({
    mutationFn: (id: number) => contactApi.getContactMessage(id),

    /*
     * ⚠️ کش **در جا** به‌روز می‌شود، نه با `invalidateQueries`.
     *
     *    نسخه‌ی اول فهرست را باطل می‌کرد. نتیجه در تب «خوانده‌نشده»
     *    این بود: مدیر روی پیامی کلیک می‌کرد، سرور آن را خوانده‌شده
     *    می‌کرد، فهرست دوباره گرفته می‌شد و پیام — که دیگر خوانده‌نشده
     *    نبود — از فهرست بیرون می‌افتاد. یعنی کارت درست وقتی که باز
     *    می‌شد، غیب می‌شد و متن پیام هرگز دیده نمی‌شد.
     *
     *    حالا فقط همان قلم و شمارنده‌ها دستکاری می‌شوند. فهرست در
     *    تعویض تب یا صفحه خودش تازه می‌شود — همان لحظه‌ای که مدیر
     *    دیگر آن کارت را باز نگه نداشته.
     */
    onSuccess: (response) => {
      queryClient.setQueriesData<contactApi.AdminContactListResponse>(
        { queryKey: ['admin', 'contact'] },
        (cached) => {
          if (!cached) return cached

          return {
            ...cached,
            counts: response.counts,
            data: cached.data.map((item) =>
              item.id === response.data.id
                ? { ...item, isRead: true, readAt: response.data.readAt }
                : item,
            ),
          }
        },
      )
    },

    onError: () => toast.error(tStates('errorTitle')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => contactApi.deleteContactMessage(id),
    onSuccess: (response) => {
      toast.success(response.message)
      setOpenId(null)
      queryClient.invalidateQueries({ queryKey: ['admin', 'contact'] })
    },
    onError: () => toast.error(tStates('errorTitle')),
  })

  const messages = messagesQuery.data?.data ?? []
  const meta = messagesQuery.data?.meta
  const counts = messagesQuery.data?.counts

  /** متن کامل پیامی که باز است — از پاسخ جهش، نه از فهرست. */
  const openMessage = openMutation.data?.data

  const countFor = (tab: ContactStatusTab) => counts?.[tab]

  /**
   * باز و بسته کردن یک پیام.
   *
   * ⚠️ دوباره کلیک روی پیامِ باز، آن را می‌بندد و درخواست تازه‌ای
   *    نمی‌فرستد — وگرنه هر باز/بسته کردن یک رفت‌وبرگشت شبکه بود.
   */
  const toggle = (message: ContactMessage) => {
    if (openId === message.id) {
      setOpenId(null)
      return
    }

    setOpenId(message.id)
    openMutation.mutate(message.id)
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* ================= جست‌وجو ================= */}
      <form
        onSubmit={(event) => {
          event.preventDefault()
          setSearch(searchInput.trim())
          setPage(1)
          setOpenId(null)
        }}
        className="mb-4 flex gap-2"
        role="search"
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            className="h-10 w-full rounded-(--radius-md) border border-border bg-background ps-9 pe-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary"
          />
        </div>

        <button
          type="submit"
          className="h-10 shrink-0 rounded-(--radius-md) bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          {tCommon('search')}
        </button>
      </form>

      {/* ================= تب وضعیت ================= */}
      <div
        role="tablist"
        aria-label={t('title')}
        className="mb-4 flex gap-1 overflow-x-auto border-b border-border"
      >
        {STATUS_TABS.map((tab) => {
          const active = status === tab
          const count = countFor(tab)

          return (
            <button
              key={tab}
              role="tab"
              aria-selected={active}
              onClick={() => {
                setStatus(tab)
                setPage(1)
                /* پیام بازمانده به تب قبلی تعلق دارد */
                setOpenId(null)
              }}
              className={cn(
                'relative shrink-0 px-4 py-2.5 text-sm font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t(`status.${tab}`)}

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

        {messagesQuery.isFetching && (
          <span className="ms-auto flex items-center pe-2">
            <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
          </span>
        )}
      </div>

      {/* ================= محتوا ================= */}
      {messagesQuery.isLoading ? (
        <ul className="space-y-3">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-24 animate-pulse rounded-(--radius-lg) bg-muted" />
          ))}
        </ul>
      ) : messagesQuery.isError ? (
        <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
          <AlertCircle className="size-12 text-warning" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-foreground">{tStates('errorTitle')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{tStates('errorDesc')}</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
          <Inbox className="size-12 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-foreground">
            {/*
              سه پیام خالیِ متفاوت، چون سه معنای متفاوت دارند:
              «چیزی پیدا نشد» بعد از جست‌وجو، «همه را خوانده‌ای» در تب
              خوانده‌نشده‌ها (که خبر خوبی است، نه پوچی)، و «هنوز پیامی
              نیامده» در تب همه.
            */}
            {search
              ? t('emptySearch')
              : status === 'unread'
                ? t('emptyUnread')
                : t('empty')}
          </h2>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {messages.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                locale={locale}
                isOpen={openId === message.id}
                isLoadingBody={openId === message.id && openMutation.isPending}
                body={openId === message.id ? openMessage : undefined}
                isDeleting={deleteMutation.isPending && deleteMutation.variables === message.id}
                onToggle={() => toggle(message)}
                onDelete={() => {
                  if (window.confirm(t('deleteConfirm'))) deleteMutation.mutate(message.id)
                }}
              />
            ))}
          </ul>

          {/* کامپوننت خودش برای یک صفحه چیزی رندر نمی‌کند */}
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

/**
 * یک پیام در فهرست.
 *
 * ⚠️ خلاصه‌ی بسته، متن پیام را **نشان نمی‌دهد** — فقط فرستنده و موضوع.
 *
 *    اگر متن در فهرست دیده شود، مدیر عملاً همه را می‌خواند بدون آنکه
 *    هیچ‌کدام خوانده‌شده علامت بخورند، و شمارنده برای همیشه قرمز
 *    می‌ماند.
 */
function MessageCard({
  message,
  locale,
  isOpen,
  isLoadingBody,
  body,
  isDeleting,
  onToggle,
  onDelete,
}: {
  message: ContactMessage
  locale: Locale
  isOpen: boolean
  isLoadingBody: boolean
  body?: ContactMessage
  isDeleting: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  const t = useTranslations('admin.contact')

  const Icon = message.isRead ? MailOpen : Mail

  return (
    <li
      className={cn(
        'rounded-(--radius-lg) border bg-card transition-colors',
        message.isRead ? 'border-border' : 'border-primary/40',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-start gap-3 p-4 text-start"
      >
        <span
          className={cn(
            'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full',
            message.isRead ? 'bg-accent text-muted-foreground' : 'bg-primary/10 text-primary',
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={cn(
                'truncate text-sm',
                message.isRead ? 'text-foreground' : 'font-bold text-foreground',
              )}
            >
              {message.name}
            </span>

            {/*
              نشان «مشتری» وقتی فرستنده حساب دارد.
              مدیر باید بداند با چه کسی طرف است پیش از آنکه پیام را باز کند.
            */}
            {message.user && (
              <span className="inline-flex items-center gap-1 rounded-full bg-info/10 px-2 py-0.5 text-[11px] text-info">
                <UserIcon className="size-3" aria-hidden="true" />
                {t('registered')}
              </span>
            )}

            <span dir="ltr" className="truncate text-xs text-muted-foreground">
              {message.email}
            </span>
          </span>

          <span className="mt-1 block truncate text-sm text-muted-foreground">
            {message.subject}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-2">
          <span className="hidden text-xs tabular-nums text-muted-foreground sm:inline">
            {formatDateTime(message.createdAt, locale)}
          </span>
          <ChevronDown
            className={cn('size-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')}
            aria-hidden="true"
          />
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-border px-4 py-4">
          {isLoadingBody || !body ? (
            <div className="h-16 animate-pulse rounded-(--radius-md) bg-muted" aria-hidden="true" />
          ) : (
            <>
              <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                {body.message}
              </p>

              <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                <div className="flex gap-1.5">
                  <dt>{t('sentAt')}:</dt>
                  <dd className="tabular-nums">{formatDateTime(body.createdAt, locale)}</dd>
                </div>

                {body.ip && (
                  <div className="flex gap-1.5">
                    <dt>{t('ip')}:</dt>
                    <dd dir="ltr" className="font-mono">{body.ip}</dd>
                  </div>
                )}

                {/*
                  حساب فرستنده — وقتی با نامی که در فرم نوشته فرق دارد.
                  یکی‌بودنشان حالت عادی است و نمایشش فقط شلوغی می‌آورد.
                */}
                {body.user && (body.user.email !== body.email || body.user.name !== body.name) && (
                  <div className="flex gap-1.5">
                    <dt>{t('account')}:</dt>
                    <dd>
                      {body.user.name} <span dir="ltr">({body.user.email})</span>
                    </dd>
                  </div>
                )}
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                {/*
                  ⚠️ `mailto:` و نه فرم پاسخ در پنل.

                     پاسخ باید از صندوق واقعی فروشگاه برود تا در رشته‌ی
                     ایمیل خود کاربر بنشیند. فرمی در پنل، ایمیلی از
                     آدرس سرور می‌فرستاد که احتمال زیادی داشت در
                     هرزنامه بیفتد.

                     `subject` با «Re:» پر می‌شود تا پاسخ به همان
                     گفتگو بچسبد.
                */}
                <a
                  href={`mailto:${body.email}?subject=${encodeURIComponent('Re: ' + body.subject)}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-(--radius-md) bg-primary px-3 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Reply className="size-3.5" aria-hidden="true" />
                  {t('reply')}
                </a>

                <button
                  type="button"
                  onClick={onDelete}
                  disabled={isDeleting}
                  className="inline-flex h-9 items-center gap-1.5 rounded-(--radius-md) border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:opacity-60"
                >
                  {isDeleting ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  )}
                  {t('delete')}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </li>
  )
}
