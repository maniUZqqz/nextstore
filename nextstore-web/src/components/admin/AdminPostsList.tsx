'use client'

/**
 * فهرست مقالات مجله — پنل مدیریت
 * ---------------------------------------------------------------------------
 * تب وضعیت · فیلتر دسته · جستجو · جدول · صفحه‌بندی
 *
 * پوشش حالت‌ها: loading · error · empty · empty-filtered · success
 *
 * ⚠️ تغییر وضعیت انتشار از روی همین جدول انجام می‌شود، نه با باز
 *    کردن فرم. پرتکرارترین کار روی مقالات همین است و بردنش داخل
 *    فرم یعنی سه کلیک اضافه برای کاری که یکی کافی است.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import {
  Plus, Search, Pencil, Trash2, Eye, EyeOff, ExternalLink,
  AlertCircle, FileText, Loader2, Star,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import * as postsApi from '@/lib/api/admin-posts'
import { formatNumber, formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { AdminPagination } from '@/components/admin/AdminPagination'
import type { AdminPost, PostStatusValue } from '@/types/admin'

/** تب‌های وضعیت — ترتیب اینجا همان ترتیب نمایش است. */
const STATUS_TABS: (PostStatusValue | 'all')[] = ['all', 'published', 'scheduled', 'draft']

/**
 * نگاشت وضعیت به کلاس رنگ.
 *
 * نگاشت ثابت و نه کلاس پویا: Tailwind کلاس‌ها را با اسکن *متن* فایل
 * پیدا می‌کند، پس رشته‌ای که در زمان اجرا ساخته شود در بیلد تولیدی
 * وجود ندارد و بی‌صدا حذف می‌شود.
 */
const STATUS_CLASSES: Record<PostStatusValue, string> = {
  published: 'bg-success/10 text-success',
  scheduled: 'bg-info/10 text-info',
  draft: 'bg-muted text-muted-foreground',
}

export function AdminPostsList({
  initialStatus,
  initialSearch = '',
}: {
  initialStatus?: PostStatusValue
  initialSearch?: string
}) {
  const t = useTranslations('admin.posts')
  const tStates = useTranslations('states')
  const tCommon = useTranslations('common')
  const locale = useLocale() as Locale
  const queryClient = useQueryClient()

  const [status, setStatus] = useState<PostStatusValue | 'all'>(initialStatus ?? 'all')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [searchInput, setSearchInput] = useState(initialSearch)
  const [search, setSearch] = useState(initialSearch)
  const [page, setPage] = useState(1)

  /* --- دسته‌ها برای انتخابگر فیلتر --- */
  const categoriesQuery = useQuery({
    queryKey: ['admin', 'post-categories', locale],
    queryFn: () => postsApi.getAdminPostCategories(locale),
    /* دسته‌ها به‌ندرت عوض می‌شوند */
    staleTime: 5 * 60 * 1000,
  })

  /* --- فهرست مقالات --- */
  const postsQuery = useQuery({
    queryKey: ['admin', 'posts', { status, categoryId, search, page, locale }],
    queryFn: () =>
      postsApi.getAdminPosts({
        status: status === 'all' ? undefined : status,
        category_id: categoryId === '' ? undefined : categoryId,
        q: search || undefined,
        page,
      }),
    /* نگه‌داشتن داده‌ی قبلی هنگام تعویض صفحه — بدون آن جدول می‌پرد */
    placeholderData: keepPreviousData,
  })

  /** باطل کردن هر کوئری‌ای که به مقالات وابسته است. */
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'post-categories'] })
  }

  const publishMutation = useMutation({
    mutationFn: ({ id, published }: { id: number; published: boolean }) =>
      postsApi.togglePostPublish(id, published),
    onSuccess: (_data, variables) => {
      toast.success(t(variables.published ? 'published' : 'unpublished'))
      invalidate()
    },
    onError: () => toast.error(tStates('errorTitle')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => postsApi.deletePost(id),
    onSuccess: () => {
      toast.success(t('deleted'))
      invalidate()
    },
    onError: () => toast.error(tStates('errorTitle')),
  })

  /** اعمال جستجو — صفحه به اول برمی‌گردد وگرنه ممکن است خالی بماند. */
  const applySearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  const posts = postsQuery.data?.data ?? []
  const counts = postsQuery.data?.counts
  const meta = postsQuery.data?.meta

  /* تشخیص «خالی به‌خاطر فیلتر» از «واقعاً خالی» — پیام هرکدام فرق دارد */
  const isFiltered = status !== 'all' || categoryId !== '' || search !== ''

  return (
    <div>
      {/* ================= سربرگ ================= */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>

        <Link
          href="/admin/posts/new"
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-(--radius-md) bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" aria-hidden="true" />
          {t('new')}
        </Link>
      </div>

      {/* ================= تب وضعیت ================= */}
      <div
        role="tablist"
        aria-label={t('colStatus')}
        className="mb-4 flex gap-1 overflow-x-auto border-b border-border"
      >
        {STATUS_TABS.map((tab) => {
          const active = status === tab
          const count = counts?.[tab]

          return (
            <button
              key={tab}
              role="tab"
              aria-selected={active}
              onClick={() => {
                setStatus(tab)
                setPage(1)
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
      </div>

      {/* ================= فیلترها ================= */}
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

        <select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value === '' ? '' : Number(e.target.value))
            setPage(1)
          }}
          aria-label={t('colCategory')}
          className="h-10 rounded-(--radius-md) border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">{t('allCategories')}</option>
          {(categoriesQuery.data ?? []).map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        {postsQuery.isFetching && (
          <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      {/* ================= محتوا ================= */}
      {postsQuery.isLoading ? (
        <ul className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <li key={i} className="h-16 animate-pulse rounded-(--radius-md) bg-muted" />
          ))}
        </ul>
      ) : postsQuery.isError ? (
        <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
          <AlertCircle className="size-12 text-warning" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-foreground">{tStates('errorTitle')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{tStates('errorDesc')}</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
          <FileText className="size-12 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-foreground">
            {isFiltered ? t('emptyFiltered') : t('empty')}
          </h2>

          {!isFiltered && (
            <Link
              href="/admin/posts/new"
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-(--radius-md) bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" aria-hidden="true" />
              {t('emptyCta')}
            </Link>
          )}
        </div>
      ) : (
        <>
          {/*
            جدول در ظرفِ اسکرول افقی.
            بدون آن، جدول در موبایل کل صفحه را پهن می‌کند و هدر و
            فوتر هم به‌هم می‌ریزند.
          */}
          <div className="overflow-x-auto rounded-(--radius-lg) border border-border">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="border-b border-border bg-muted/40 text-start">
                <tr className="text-xs text-muted-foreground">
                  <th scope="col" className="px-4 py-3 text-start font-medium">{t('colTitle')}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{t('colCategory')}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{t('colAuthor')}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{t('colViews')}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{t('colStatus')}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{t('colUpdated')}</th>
                  <th scope="col" className="px-4 py-3 text-end font-medium">{t('colActions')}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {posts.map((post) => (
                  <PostRow
                    key={post.id}
                    post={post}
                    locale={locale}
                    isBusy={
                      (publishMutation.isPending && publishMutation.variables?.id === post.id) ||
                      (deleteMutation.isPending && deleteMutation.variables === post.id)
                    }
                    onTogglePublish={() =>
                      publishMutation.mutate({
                        id: post.id,
                        published: post.status !== 'published',
                      })
                    }
                    onDelete={() => {
                      if (window.confirm(t('deleteConfirm'))) deleteMutation.mutate(post.id)
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>

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

/* =========================================================================
 * یک ردیف جدول
 * ======================================================================= */

function PostRow({
  post,
  locale,
  isBusy,
  onTogglePublish,
  onDelete,
}: {
  post: AdminPost
  locale: Locale
  isBusy: boolean
  onTogglePublish: () => void
  onDelete: () => void
}) {
  const t = useTranslations('admin.posts')
  /* برچسب «حذف» در فضای نام مشترک است و نباید در این فایل دوباره نوشته شود */
  const tCommon = useTranslations('common')
  const isPublished = post.status === 'published'

  return (
    <tr className={cn('transition-opacity', isBusy && 'opacity-50')}>
      {/* --- عنوان --- */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {post.isFeatured && (
            <Star
              className="size-3.5 shrink-0 fill-warning text-warning"
              aria-label={t('form.featured')}
            />
          )}
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{post.title}</p>
            <p dir="ltr" className="truncate text-xs text-muted-foreground">
              {post.slug}
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3 text-muted-foreground">{post.category?.name ?? '—'}</td>
      <td className="px-4 py-3 text-muted-foreground">{post.authorName ?? '—'}</td>
      <td className="px-4 py-3 tabular-nums text-muted-foreground">
        {formatNumber(post.viewsCount, locale)}
      </td>

      {/* --- وضعیت --- */}
      <td className="px-4 py-3">
        <span
          className={cn(
            'inline-flex rounded-(--radius-sm) px-2 py-0.5 text-xs font-medium',
            STATUS_CLASSES[post.status],
          )}
        >
          {t(`status.${post.status}`)}
        </span>
      </td>

      <td className="px-4 py-3 text-xs text-muted-foreground">
        {post.updatedAt ? formatDate(post.updatedAt, locale) : '—'}
      </td>

      {/* --- عملیات --- */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={onTogglePublish}
            disabled={isBusy}
            title={t(isPublished ? 'unpublish' : 'publish')}
            aria-label={t(isPublished ? 'unpublish' : 'publish')}
            className="inline-flex size-8 items-center justify-center rounded-(--radius-md) text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            {isPublished
              ? <EyeOff className="size-4" aria-hidden="true" />
              : <Eye className="size-4" aria-hidden="true" />}
          </button>

          {/*
            لینک «مشاهده در سایت» فقط برای مقاله‌ی منتشرشده.
            مقاله‌ی پیش‌نویس در مسیر عمومی ۴۰۴ می‌دهد، پس نشان دادن
            لینکی که به صفحه‌ی خطا می‌رود بدتر از نبودنش است.
          */}
          {isPublished && (
            <Link
              href={`/blog/${post.slug}`}
              target="_blank"
              title={t('view')}
              aria-label={t('view')}
              className="inline-flex size-8 items-center justify-center rounded-(--radius-md) text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
            </Link>
          )}

          <Link
            href={`/admin/posts/${post.id}`}
            title={t('edit')}
            aria-label={t('edit')}
            className="inline-flex size-8 items-center justify-center rounded-(--radius-md) text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Pencil className="size-4" aria-hidden="true" />
          </Link>

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
