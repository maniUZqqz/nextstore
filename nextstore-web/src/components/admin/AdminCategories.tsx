'use client'

/**
 * مدیریت دسته‌بندی‌ها — پنل مدیریت
 * ---------------------------------------------------------------------------
 * نمای درختی · جستجو · افزودن · ویرایش · حذف · جابه‌جایی ترتیب
 *
 * پوشش حالت‌ها: loading · error · empty · empty-filtered · success
 *
 * ⚠️ مرتب‌سازی با دکمه‌ی بالا/پایین است، نه کشیدن و رها کردن.
 *    Drag&Drop روی درخت تودرتو یا یک کتابخانه‌ی سنگین می‌خواهد یا
 *    پیاده‌سازی‌ای که با کیبورد و صفحه‌خوان کار نمی‌کند. دکمه هم
 *    قابل دسترسی است، هم روی موبایل کار می‌کند.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import {
  Plus, Search, Pencil, Trash2, ChevronUp, ChevronDown, Star,
  AlertCircle, FolderTree, Loader2, CornerDownLeft, EyeOff,
} from 'lucide-react'
import type { Locale } from '@/i18n/routing'
import * as taxonomyApi from '@/lib/api/admin-taxonomy'
import { ApiError } from '@/lib/api/client'
import { cn } from '@/lib/utils/cn'
import { BilingualFields, emptyTranslated, type ContentLocale } from './BilingualFields'
import type { AdminCategory, CategoryInput, Translated } from '@/types/admin'

const CATEGORIES_QUERY_KEY = ['admin', 'categories'] as const

/** حالت فرم: بسته، ساخت زیر یک والد، یا ویرایش. */
type FormState =
  | null
  | { mode: 'create'; parentId: number | null }
  | { mode: 'edit'; category: AdminCategory }

export function AdminCategories() {
  const t = useTranslations('admin.categories')
  const tStates = useTranslations('states')
  const tCommon = useTranslations('common')
  const locale = useLocale() as Locale
  const queryClient = useQueryClient()

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<FormState>(null)

  const categoriesQuery = useQuery({
    queryKey: [...CATEGORIES_QUERY_KEY, { search, locale }],
    queryFn: () => taxonomyApi.getAdminCategories({ q: search || undefined }, locale),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY })
  }

  const deleteMutation = useMutation({
    mutationFn: (id: number) => taxonomyApi.deleteCategory(id),
    onSuccess: () => {
      toast.success(t('deleted'))
      invalidate()
    },
    /*
     * پیام سرور نشان داده می‌شود، نه یک پیام عمومی.
     * سرور می‌گوید «این دسته ۴ محصول دارد…» — عددی که فقط او
     * می‌داند و برای تصمیم ادمین مهم است.
     */
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : tStates('errorTitle'))
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (items: { id: number; sort_order: number }[]) =>
      taxonomyApi.reorderCategories(items),
    onSuccess: () => {
      toast.success(t('orderSaved'))
      invalidate()
    },
    onError: () => toast.error(tStates('errorTitle')),
  })

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput.trim())
  }

  const categories = categoriesQuery.data ?? []
  const isFiltered = search !== ''

  /**
   * جابه‌جایی یک دسته میان هم‌نیاهایش.
   *
   * ترتیب *همه‌ی* هم‌نیاها از نو شماره‌گذاری و یکجا فرستاده می‌شود.
   * فرستادن فقط دو ردیف جابه‌جاشده کافی نیست: داده‌ی موجود ممکن است
   * ترتیب‌های تکراری یا حفره‌دار داشته باشد و نتیجه غیرقابل‌پیش‌بینی
   * می‌شود.
   */
  const move = (siblings: AdminCategory[], index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= siblings.length) return

    const reordered = [...siblings]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(target, 0, moved)

    reorderMutation.mutate(
      reordered.map((category, position) => ({ id: category.id, sort_order: position })),
    )
  }

  /* --- فرم باز است --- */
  if (form !== null) {
    return (
      <CategoryForm
        state={form}
        allCategories={categories}
        onClose={() => setForm(null)}
        onSaved={() => {
          setForm(null)
          invalidate()
        }}
      />
    )
  }

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
          onClick={() => setForm({ mode: 'create', parentId: null })}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-(--radius-md) bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" aria-hidden="true" />
          {t('new')}
        </button>
      </div>

      {/* ================= جستجو ================= */}
      <form onSubmit={applySearch} className="mb-4 flex gap-2 sm:max-w-md">
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

        {categoriesQuery.isFetching && (
          <Loader2 className="my-auto size-4 animate-spin text-muted-foreground" aria-hidden="true" />
        )}
      </form>

      {/* ================= محتوا ================= */}
      {categoriesQuery.isLoading ? (
        <ul className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="h-14 animate-pulse rounded-(--radius-md) bg-muted" />
          ))}
        </ul>
      ) : categoriesQuery.isError ? (
        <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
          <AlertCircle className="size-12 text-warning" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-foreground">{tStates('errorTitle')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{tStates('errorDesc')}</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
          <FolderTree className="size-12 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-foreground">
            {isFiltered ? t('emptyFiltered') : t('empty')}
          </h2>

          {!isFiltered && (
            <button
              type="button"
              onClick={() => setForm({ mode: 'create', parentId: null })}
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-(--radius-md) bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" aria-hidden="true" />
              {t('emptyCta')}
            </button>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-(--radius-lg) border border-border">
          {categories.map((category, index) => (
            <CategoryRow
              key={category.id}
              category={category}
              siblings={categories}
              index={index}
              depth={0}
              locale={locale}
              isBusy={deleteMutation.isPending && deleteMutation.variables === category.id}
              isReordering={reorderMutation.isPending}
              onEdit={(target) => setForm({ mode: 'edit', category: target })}
              onAddChild={(parentId) => setForm({ mode: 'create', parentId })}
              onDelete={(id) => {
                if (window.confirm(t('deleteConfirm'))) deleteMutation.mutate(id)
              }}
              onMove={move}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

/* =========================================================================
 * یک ردیف درخت (با فرزندانش)
 * ======================================================================= */

function CategoryRow({
  category,
  siblings,
  index,
  depth,
  locale,
  isBusy,
  isReordering,
  onEdit,
  onAddChild,
  onDelete,
  onMove,
}: {
  category: AdminCategory
  siblings: AdminCategory[]
  index: number
  depth: number
  locale: Locale
  isBusy: boolean
  isReordering: boolean
  onEdit: (category: AdminCategory) => void
  onAddChild: (parentId: number) => void
  onDelete: (id: number) => void
  onMove: (siblings: AdminCategory[], index: number, direction: -1 | 1) => void
}) {
  const t = useTranslations('admin.categories')
  const tCommon = useTranslations('common')

  const children = category.children ?? []

  return (
    <>
      {/*
        data-depth و data-category قلاب‌های پایدار برای تست مرورگرند.
        ریشه‌ها و فرزندان در DOM همگی <li> برادرند (فهرست تخت با
        تورفتگی بصری)، پس بدون این نشانه هیچ راهی نیست که تست بفهمد
        کدام ردیف ریشه است و کدام زیردسته.
      */}
      <li
        data-category={category.id}
        data-depth={depth}
        className={cn('transition-opacity', isBusy && 'opacity-50')}
      >
        <div
          className="flex flex-wrap items-center gap-3 px-4 py-3"
          /*
            تورفتگی منطقی: در RTL از راست و در LTR از چپ.
            padding-inline-start این کار را بدون شرط جاوااسکریپتی
            انجام می‌دهد.
          */
          style={{ paddingInlineStart: `${depth * 1.5 + 1}rem` }}
        >
          {depth > 0 && (
            <CornerDownLeft
              className="size-3.5 shrink-0 text-muted-foreground rtl:rotate-90 ltr:-rotate-90"
              aria-hidden="true"
            />
          )}

          {/* --- نام و نامک --- */}
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
              <span className="truncate">{category.displayName}</span>

              {category.isFeatured && (
                <Star className="size-3.5 shrink-0 fill-warning text-warning" aria-label={t('featured')} />
              )}

              {!category.isActive && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-(--radius-sm) bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                  <EyeOff className="size-3" aria-hidden="true" />
                  {t('active')}
                </span>
              )}
            </p>

            <p dir="ltr" className="mt-0.5 truncate text-start text-xs text-muted-foreground">
              {category.slug}
            </p>
          </div>

          {/* --- شمارنده‌ها --- */}
          <span className="shrink-0 text-xs text-muted-foreground">
            {t('products', { count: category.productsCount })}
          </span>

          {/* --- عملیات --- */}
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={() => onMove(siblings, index, -1)}
              disabled={index === 0 || isReordering}
              title={t('moveUp')}
              aria-label={t('moveUp')}
              className="inline-flex size-8 items-center justify-center rounded-(--radius-md) text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30"
            >
              <ChevronUp className="size-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onMove(siblings, index, 1)}
              disabled={index === siblings.length - 1 || isReordering}
              title={t('moveDown')}
              aria-label={t('moveDown')}
              className="inline-flex size-8 items-center justify-center rounded-(--radius-md) text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30"
            >
              <ChevronDown className="size-4" aria-hidden="true" />
            </button>

            {/*
              افزودن زیردسته فقط روی سطح اول.
              درخت عمداً دوسطحی نگه داشته شده — سه سطح در مگامنو
              جا نمی‌شود و ناوبری را پیچیده می‌کند.
            */}
            {depth === 0 && (
              <button
                type="button"
                onClick={() => onAddChild(category.id)}
                title={t('newChild')}
                aria-label={t('newChild')}
                className="inline-flex size-8 items-center justify-center rounded-(--radius-md) text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Plus className="size-4" aria-hidden="true" />
              </button>
            )}

            <button
              type="button"
              onClick={() => onEdit(category)}
              title={t('edit')}
              aria-label={t('edit')}
              className="inline-flex size-8 items-center justify-center rounded-(--radius-md) text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Pencil className="size-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onDelete(category.id)}
              disabled={isBusy}
              title={tCommon('delete')}
              aria-label={tCommon('delete')}
              className="inline-flex size-8 items-center justify-center rounded-(--radius-md) text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            >
              {isBusy
                ? <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                : <Trash2 className="size-4" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </li>

      {/* --- زیردسته‌ها --- */}
      {children.map((child, childIndex) => (
        <CategoryRow
          key={child.id}
          category={child}
          siblings={children}
          index={childIndex}
          depth={depth + 1}
          locale={locale}
          isBusy={false}
          isReordering={isReordering}
          onEdit={onEdit}
          onAddChild={onAddChild}
          onDelete={onDelete}
          onMove={onMove}
        />
      ))}
    </>
  )
}

/* =========================================================================
 * فرم دسته‌بندی
 * ======================================================================= */

function CategoryForm({
  state,
  allCategories,
  onClose,
  onSaved,
}: {
  state: Exclude<FormState, null>
  allCategories: AdminCategory[]
  onClose: () => void
  onSaved: () => void
}) {
  const t = useTranslations('admin.categories')
  const tStates = useTranslations('states')

  const isEdit = state.mode === 'edit'
  const existing = isEdit ? state.category : null

  const [tab, setTab] = useState<ContentLocale>('fa')
  const [name, setName] = useState<Translated>(existing?.name ?? emptyTranslated())
  const [description, setDescription] = useState<Translated>(existing?.description ?? emptyTranslated())
  const [parentId, setParentId] = useState<number | ''>(
    isEdit ? (existing?.parentId ?? '') : (state.parentId ?? ''),
  )
  const [slug, setSlug] = useState(existing?.slug ?? '')
  const [icon, setIcon] = useState(existing?.icon ?? '')
  const [isActive, setIsActive] = useState(existing?.isActive ?? true)
  const [isFeatured, setIsFeatured] = useState(existing?.isFeatured ?? false)

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const saveMutation = useMutation({
    mutationFn: (input: CategoryInput) =>
      isEdit && existing
        ? taxonomyApi.updateCategory(existing.id, input)
        : taxonomyApi.createCategory(input),

    onSuccess: () => {
      toast.success(t(isEdit ? 'updated' : 'created'))
      onSaved()
    },

    onError: (error) => {
      if (error instanceof ApiError && error.isValidation && error.fieldErrors) {
        setFieldErrors(error.fieldErrors)

        /* اگر خطا در زبان دیگری است، همان تب باز شود تا دیده شود */
        const errored = Object.keys(error.fieldErrors)
        const other = tab === 'fa' ? 'en' : 'fa'
        if (errored.some((key) => key.endsWith(`.${other}`))) setTab(other)

        toast.error(error.message)
        return
      }
      toast.error(error instanceof ApiError ? error.message : tStates('errorTitle'))
    },
  })

  const errorFor = (field: string) => fieldErrors[field]?.[0]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    saveMutation.mutate({
      name,
      description,
      parent_id: parentId === '' ? null : parentId,
      slug: slug.trim() || undefined,
      icon: icon.trim() || undefined,
      is_active: isActive,
      is_featured: isFeatured,
    })
  }

  /**
   * گزینه‌های والد: فقط دسته‌های سطح اول.
   *
   * ⚠️ خودِ دسته‌ی در حال ویرایش و فرزندانش حذف می‌شوند — انتخابشان
   *    حلقه می‌سازد. سرور هم ردش می‌کند، ولی نشان دادن گزینه‌ای که
   *    همیشه خطا می‌دهد فقط کاربر را سردرگم می‌کند.
   */
  const parentOptions = allCategories.filter((candidate) => candidate.id !== existing?.id)

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          {isEdit ? t('edit') : t('new')}
        </h1>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-(--radius-md) border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {t('cancel')}
          </button>

          <button
            type="submit"
            disabled={saveMutation.isPending}
            aria-busy={saveMutation.isPending}
            className="inline-flex h-10 items-center gap-2 rounded-(--radius-md) bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          >
            {saveMutation.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {saveMutation.isPending ? t('saving') : t('save')}
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <BilingualFields
          namespace="admin.categories"
          tab={tab}
          onTabChange={setTab}
          name={name}
          onNameChange={setName}
          description={description}
          onDescriptionChange={setDescription}
          errorFor={errorFor}
        />

        <aside className="space-y-4 rounded-(--radius-lg) border border-border p-5 lg:h-fit">
          <div>
            <label htmlFor="category-parent" className="text-xs font-medium text-foreground">
              {t('parent')}
            </label>
            <select
              id="category-parent"
              name="parent_id"
              value={parentId}
              onChange={(e) => setParentId(e.target.value === '' ? '' : Number(e.target.value))}
              className="mt-1.5 h-10 w-full rounded-(--radius-md) border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">{t('noParent')}</option>
              {parentOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.displayName}
                </option>
              ))}
            </select>
            {errorFor('parent_id') && (
              <p role="alert" className="mt-1 text-xs text-destructive">{errorFor('parent_id')}</p>
            )}
          </div>

          <div>
            <label htmlFor="category-slug" className="text-xs font-medium text-foreground">
              {t('slug')}
            </label>
            <input
              id="category-slug"
              name="slug"
              type="text"
              dir="ltr"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              maxLength={150}
              placeholder="my-category"
              className="mt-1.5 h-10 w-full rounded-(--radius-md) border border-border bg-background px-3 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">{t('slugHint')}</p>
            {errorFor('slug') && (
              <p role="alert" className="mt-1 text-xs text-destructive">{errorFor('slug')}</p>
            )}
          </div>

          <div>
            <label htmlFor="category-icon" className="text-xs font-medium text-foreground">
              {t('icon')}
            </label>
            <input
              id="category-icon"
              name="icon"
              type="text"
              dir="ltr"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              maxLength={60}
              placeholder="smartphone"
              className="mt-1.5 h-10 w-full rounded-(--radius-md) border border-border bg-background px-3 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">{t('iconHint')}</p>
          </div>

          <hr className="border-border" />

          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              name="is_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-primary"
            />
            <span className="min-w-0">
              <span className="block text-sm text-foreground">{t('active')}</span>
              <span className="block text-xs text-muted-foreground">{t('activeHint')}</span>
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              name="is_featured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="size-4 shrink-0 accent-primary"
            />
            <span className="text-sm text-foreground">{t('featured')}</span>
          </label>
        </aside>
      </div>
    </form>
  )
}
