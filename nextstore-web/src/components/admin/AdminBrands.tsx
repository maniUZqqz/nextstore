'use client'

/**
 * مدیریت برندها — پنل مدیریت
 * ---------------------------------------------------------------------------
 * جدول · جستجو · فیلتر وضعیت · افزودن · ویرایش · حذف
 *
 * ساده‌تر از دسته‌بندی است چون برند فهرست تخت است، نه درخت.
 *
 * پوشش حالت‌ها: loading · error · empty · empty-filtered · success
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import Image from 'next/image'
import {
  Plus, Search, Pencil, Trash2, Star, AlertCircle, Tags, Loader2, EyeOff, ExternalLink,
} from 'lucide-react'
import type { Locale } from '@/i18n/routing'
import * as taxonomyApi from '@/lib/api/admin-taxonomy'
import { ApiError } from '@/lib/api/client'
import { cn } from '@/lib/utils/cn'
import { BilingualFields, emptyTranslated, type ContentLocale } from './BilingualFields'
import type { AdminBrand, BrandInput, Translated } from '@/types/admin'

const BRANDS_QUERY_KEY = ['admin', 'brands'] as const

type StatusFilter = '' | 'active' | 'inactive'

export function AdminBrands() {
  const t = useTranslations('admin.brands')
  const tStates = useTranslations('states')
  const tCommon = useTranslations('common')
  const locale = useLocale() as Locale
  const queryClient = useQueryClient()

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('')
  const [editing, setEditing] = useState<AdminBrand | 'new' | null>(null)

  const brandsQuery = useQuery({
    queryKey: [...BRANDS_QUERY_KEY, { search, status, locale }],
    queryFn: () =>
      taxonomyApi.getAdminBrands(
        { q: search || undefined, status: status || undefined },
        locale,
      ),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: BRANDS_QUERY_KEY })
  }

  const deleteMutation = useMutation({
    mutationFn: (id: number) => taxonomyApi.deleteBrand(id),
    onSuccess: () => {
      toast.success(t('deleted'))
      invalidate()
    },
    /* پیام سرور تعداد محصولات را می‌گوید — پیام عمومی آن را می‌پوشاند */
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : tStates('errorTitle'))
    },
  })

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput.trim())
  }

  const brands = brandsQuery.data ?? []
  const isFiltered = search !== '' || status !== ''

  /* --- فرم باز است --- */
  if (editing !== null) {
    return (
      <BrandForm
        brand={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
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
          onClick={() => setEditing('new')}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-(--radius-md) bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" aria-hidden="true" />
          {t('new')}
        </button>
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
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          aria-label={t('allStatuses')}
          className="h-10 rounded-(--radius-md) border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">{t('allStatuses')}</option>
          <option value="active">{t('statusActive')}</option>
          <option value="inactive">{t('statusInactive')}</option>
        </select>

        {brandsQuery.isFetching && (
          <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      {/* ================= محتوا ================= */}
      {brandsQuery.isLoading ? (
        <ul className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="h-16 animate-pulse rounded-(--radius-md) bg-muted" />
          ))}
        </ul>
      ) : brandsQuery.isError ? (
        <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
          <AlertCircle className="size-12 text-warning" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-foreground">{tStates('errorTitle')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{tStates('errorDesc')}</p>
        </div>
      ) : brands.length === 0 ? (
        <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
          <Tags className="size-12 text-muted-foreground" aria-hidden="true" />
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
        <ul className="divide-y divide-border rounded-(--radius-lg) border border-border">
          {brands.map((brand) => {
            const isBusy = deleteMutation.isPending && deleteMutation.variables === brand.id

            return (
              <li
                key={brand.id}
                className={cn(
                  'flex flex-wrap items-center gap-3 px-4 py-3 transition-opacity',
                  isBusy && 'opacity-50',
                )}
              >
                {/* --- لوگو --- */}
                <div className="relative size-10 shrink-0 overflow-hidden rounded-(--radius-md) bg-muted">
                  {brand.logo ? (
                    <Image
                      src={brand.logo}
                      alt={brand.displayName}
                      fill
                      sizes="40px"
                      className="object-contain p-1"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center text-sm font-bold text-muted-foreground">
                      {brand.displayName.charAt(0)}
                    </span>
                  )}
                </div>

                {/* --- نام و نامک --- */}
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                    <span className="truncate">{brand.displayName}</span>

                    {brand.isFeatured && (
                      <Star className="size-3.5 shrink-0 fill-warning text-warning" aria-label={t('featured')} />
                    )}

                    {!brand.isActive && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-(--radius-sm) bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        <EyeOff className="size-3" aria-hidden="true" />
                        {t('active')}
                      </span>
                    )}
                  </p>

                  <p dir="ltr" className="mt-0.5 truncate text-start text-xs text-muted-foreground">
                    {brand.slug}
                    {brand.countryCode && ` · ${brand.countryCode}`}
                  </p>
                </div>

                <span className="shrink-0 text-xs text-muted-foreground">
                  {t('products', { count: brand.productsCount })}
                </span>

                {/* --- عملیات --- */}
                <div className="flex shrink-0 items-center gap-0.5">
                  {brand.website && (
                    <a
                      href={brand.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={t('website')}
                      aria-label={t('website')}
                      className="inline-flex size-8 items-center justify-center rounded-(--radius-md) text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setEditing(brand)}
                    title={t('edit')}
                    aria-label={t('edit')}
                    className="inline-flex size-8 items-center justify-center rounded-(--radius-md) text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(t('deleteConfirm'))) deleteMutation.mutate(brand.id)
                    }}
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
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* =========================================================================
 * فرم برند
 * ======================================================================= */

function BrandForm({
  brand,
  onClose,
  onSaved,
}: {
  brand: AdminBrand | null
  onClose: () => void
  onSaved: () => void
}) {
  const t = useTranslations('admin.brands')
  const tStates = useTranslations('states')

  const isEdit = brand !== null

  const [tab, setTab] = useState<ContentLocale>('fa')
  const [name, setName] = useState<Translated>(brand?.name ?? emptyTranslated())
  const [description, setDescription] = useState<Translated>(brand?.description ?? emptyTranslated())
  const [slug, setSlug] = useState(brand?.slug ?? '')
  const [logo, setLogo] = useState(brand?.logoPath ?? '')
  const [website, setWebsite] = useState(brand?.website ?? '')
  const [countryCode, setCountryCode] = useState(brand?.countryCode ?? '')
  const [isActive, setIsActive] = useState(brand?.isActive ?? true)
  const [isFeatured, setIsFeatured] = useState(brand?.isFeatured ?? false)

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const saveMutation = useMutation({
    mutationFn: (input: BrandInput) =>
      isEdit ? taxonomyApi.updateBrand(brand.id, input) : taxonomyApi.createBrand(input),

    onSuccess: () => {
      toast.success(t(isEdit ? 'updated' : 'created'))
      onSaved()
    },

    onError: (error) => {
      if (error instanceof ApiError && error.isValidation && error.fieldErrors) {
        setFieldErrors(error.fieldErrors)

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
      slug: slug.trim() || undefined,
      logo: logo.trim() || undefined,
      website: website.trim() || undefined,
      country_code: countryCode.trim() || undefined,
      is_active: isActive,
      is_featured: isFeatured,
    })
  }

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
          namespace="admin.brands"
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
            <label htmlFor="brand-slug" className="text-xs font-medium text-foreground">
              {t('slug')}
            </label>
            <input
              id="brand-slug"
              name="slug"
              type="text"
              dir="ltr"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              maxLength={150}
              placeholder="my-brand"
              className="mt-1.5 h-10 w-full rounded-(--radius-md) border border-border bg-background px-3 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">{t('slugHint')}</p>
            {errorFor('slug') && (
              <p role="alert" className="mt-1 text-xs text-destructive">{errorFor('slug')}</p>
            )}
          </div>

          <div>
            <label htmlFor="brand-logo" className="text-xs font-medium text-foreground">
              {t('logo')}
            </label>
            <input
              id="brand-logo"
              name="logo"
              type="text"
              dir="ltr"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              maxLength={255}
              placeholder="brands/apple.svg"
              className="mt-1.5 h-10 w-full rounded-(--radius-md) border border-border bg-background px-3 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">{t('logoHint')}</p>
          </div>

          <div>
            <label htmlFor="brand-website" className="text-xs font-medium text-foreground">
              {t('website')}
            </label>
            <input
              id="brand-website"
              name="website"
              type="url"
              dir="ltr"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              maxLength={255}
              placeholder="https://example.com"
              className="mt-1.5 h-10 w-full rounded-(--radius-md) border border-border bg-background px-3 text-xs text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">{t('websiteHint')}</p>
            {errorFor('website') && (
              <p role="alert" className="mt-1 text-xs text-destructive">{errorFor('website')}</p>
            )}
          </div>

          <div>
            <label htmlFor="brand-country" className="text-xs font-medium text-foreground">
              {t('countryCode')}
            </label>
            <input
              id="brand-country"
              name="country_code"
              type="text"
              dir="ltr"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
              maxLength={2}
              placeholder="IR"
              className="mt-1.5 h-10 w-full rounded-(--radius-md) border border-border bg-background px-3 font-mono text-xs uppercase text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">{t('countryHint')}</p>
            {errorFor('country_code') && (
              <p role="alert" className="mt-1 text-xs text-destructive">{errorFor('country_code')}</p>
            )}
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
