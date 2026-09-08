'use client'

/**
 * فهرست محصولات در پنل مدیریت
 * ---------------------------------------------------------------------------
 * قابلیت‌ها: فیلتر وضعیت · فقط کم‌موجود · جستجو · صفحه‌بندی
 *          + ویرایش سریع موجودی همان‌جا در فهرست
 *
 * ⚠️ چرا ویرایش موجودی در خود فهرست و نه در فرم ویرایش؟
 *    پرتکرارترین کار انبارداری «رسید بیست عدد از این کالا» است.
 *    اگر برای هر کالا باید فرم کامل باز شود، ویرایش ده کالا یعنی
 *    ده بار رفت‌وبرگشت. ورودی درجا این کار را به یک تایپ و Enter
 *    کاهش می‌دهد.
 */

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import {
  Search, AlertCircle, PackageSearch, Plus, Pencil, Trash2, Loader2, Check, Package,
} from 'lucide-react'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import {
  getAdminProducts, updateProductStock, deleteProduct,
} from '@/lib/api/admin'
import type { AdminProduct, ProductStatusValue } from '@/types/admin'
import { AdminPagination } from './AdminPagination'
import { formatPrice, formatNumber, currencyLabel } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

/** نگاشت وضعیت انتشار به کلاس رنگ — ثابت تا Tailwind آن را ببیند. */
const PRODUCT_STATUS_CLASSES: Record<ProductStatusValue, string> = {
  draft: 'bg-warning/15 text-warning',
  active: 'bg-success/10 text-success',
  archived: 'bg-muted text-muted-foreground',
}

export function AdminProductsList({
  initialStatus,
  initialLowStock = false,
  initialSearch = '',
}: {
  initialStatus?: ProductStatusValue
  /** داشبورد با ?low_stock=1 به اینجا لینک می‌دهد */
  initialLowStock?: boolean
  /**
   * عبارت جستجوی اولیه از پارامتر ?q= در آدرس.
   *
   * ⚠️ چرا لازم است؟ بدون این، آدرسی مثل
   *        /admin/products?q=آیفون
   *    فهرست *کامل* را نشان می‌داد و کاربر فکر می‌کرد جستجو
   *    نتیجه‌ای نداشته — در حالی که اصلاً اعمال نشده بود. این
   *    یعنی لینک جستجو قابل اشتراک‌گذاری و بوکمارک نبود.
   */
  initialSearch?: string
}) {
  const t = useTranslations('admin')
  const tStates = useTranslations('states')
  const tCommon = useTranslations('common')
  const locale = useLocale() as Locale
  const queryClient = useQueryClient()

  const [status, setStatus] = useState<ProductStatusValue | ''>(initialStatus ?? '')
  const [lowStock, setLowStock] = useState(initialLowStock)
  const [searchInput, setSearchInput] = useState(initialSearch)
  const [search, setSearch] = useState(initialSearch)
  const [page, setPage] = useState(1)

  /** نامک محصولی که موجودی‌اش همین حالا ذخیره شد — برای نشان تیک */
  const [justSaved, setJustSaved] = useState<string | null>(null)

  /* تأخیر در جستجو تا هر کلید یک درخواست نفرستد */
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 400)

    return () => clearTimeout(timer)
  }, [searchInput])

  const productsQuery = useQuery({
    queryKey: ['admin', 'products', { status, lowStock, search, page, locale }],
    queryFn: () =>
      getAdminProducts({
        status: status || undefined,
        low_stock: lowStock || undefined,
        q: search || undefined,
        page,
      }),
    placeholderData: keepPreviousData,
  })

  const stockMutation = useMutation({
    mutationFn: ({ slug, stock }: { slug: string; stock: number }) =>
      updateProductStock(slug, stock),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })

      /* نشان تیک دو ثانیه می‌ماند و بعد خودش پاک می‌شود */
      setJustSaved(variables.slug)
      setTimeout(() => setJustSaved(null), 2000)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => deleteProduct(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })

  const products = productsQuery.data?.data ?? []
  const meta = productsQuery.data?.meta

  const hasFilters = status !== '' || lowStock || search !== ''

  const resetFilters = () => {
    setStatus('')
    setLowStock(false)
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ================= سرصفحه ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-foreground">{t('products.title')}</h1>
          {meta && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t('products.results', { count: formatNumber(meta.total, locale) })}
            </p>
          )}
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex h-10 items-center gap-2 rounded-(--radius-md) bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" aria-hidden="true" />
          {t('products.add')}
        </Link>
      </div>

      {/* ================= نوار فیلتر ================= */}
      <div className="flex flex-col gap-2 rounded-(--radius-lg) border border-border bg-card p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t('products.searchPlaceholder')}
            aria-label={tCommon('search')}
            className="h-10 w-full rounded-(--radius-md) border border-border bg-background ps-9 pe-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary"
          />
        </div>

        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as ProductStatusValue | '')
            setPage(1)
          }}
          aria-label={t('products.status')}
          className="h-10 rounded-(--radius-md) border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-primary sm:w-44"
        >
          <option value="">{t('products.allStatuses')}</option>
          <option value="draft">{t('products.statuses.draft')}</option>
          <option value="active">{t('products.statuses.active')}</option>
          <option value="archived">{t('products.statuses.archived')}</option>
        </select>

        <label className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-(--radius-md) border border-border px-3 text-sm text-foreground">
          <input
            type="checkbox"
            checked={lowStock}
            onChange={(event) => {
              setLowStock(event.target.checked)
              setPage(1)
            }}
            className="size-4 accent-[var(--color-primary)]"
          />
          {t('products.onlyLowStock')}
        </label>

        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="h-10 shrink-0 rounded-(--radius-md) border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {t('reset')}
          </button>
        )}
      </div>

      {/* ================= محتوا ================= */}
      {productsQuery.isLoading ? (
        <ul className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <li
              key={i}
              className="h-24 animate-pulse rounded-(--radius-lg) border border-border bg-muted"
            />
          ))}
        </ul>
      ) : productsQuery.isError ? (
        <div className="flex flex-col items-center rounded-(--radius-lg) border border-border bg-card py-16 text-center">
          <AlertCircle className="size-12 text-warning" aria-hidden="true" />
          <h2 className="mt-4 text-base font-bold text-foreground">{tStates('errorTitle')}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{tStates('errorDesc')}</p>
          <button
            type="button"
            onClick={() => productsQuery.refetch()}
            className="mt-5 h-10 rounded-(--radius-md) bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {tCommon('retry')}
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center rounded-(--radius-lg) border border-border bg-card py-16 text-center">
          <PackageSearch className="size-12 text-muted-foreground" aria-hidden="true" />
          <p className="mt-4 text-sm text-muted-foreground">{t('products.empty')}</p>
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 h-10 rounded-(--radius-md) border border-border px-5 text-sm text-foreground hover:bg-accent"
            >
              {t('reset')}
            </button>
          )}
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {products.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                locale={locale}
                savedSlug={justSaved}
                isSavingStock={
                  stockMutation.isPending && stockMutation.variables?.slug === product.slug
                }
                onSaveStock={(stock) =>
                  stockMutation.mutate({ slug: product.slug, stock })
                }
                onDelete={() => {
                  if (window.confirm(t('products.deleteConfirm'))) {
                    deleteMutation.mutate(product.slug)
                  }
                }}
              />
            ))}
          </ul>

          {meta && <AdminPagination meta={meta} onPageChange={setPage} />}
        </>
      )}
    </div>
  )
}

/* =========================================================================
 * یک ردیف محصول
 *
 * جدا شده چون هر ردیف حالت محلی خودش را دارد (مقدار ورودی موجودی).
 * اگر داخل حلقه‌ی والد می‌ماند، یا باید یک آبجکت state برای همه‌ی
 * ردیف‌ها نگه می‌داشتیم یا با هر تایپ کل فهرست دوباره رندر می‌شد.
 * ======================================================================= */

function ProductRow({
  product,
  locale,
  savedSlug,
  isSavingStock,
  onSaveStock,
  onDelete,
}: {
  product: AdminProduct
  locale: Locale
  savedSlug: string | null
  isSavingStock: boolean
  onSaveStock: (stock: number) => void
  onDelete: () => void
}) {
  const t = useTranslations('admin')
  const tCommon = useTranslations('common')

  const [stockValue, setStockValue] = useState(String(product.stock))

  /*
   * همگام‌سازی ورودی با مقدار سرور.
   *
   * ⚠️ چرا این کار در بدنه‌ی رندر انجام می‌شود و نه در useEffect؟
   *
   *    مسئله: پس از ذخیره‌ی موفق، فهرست دوباره گرفته می‌شود و prop
   *    تازه می‌رسد، اما useState مقدار اولیه را فقط یک بار می‌خواند
   *    و ورودی روی عدد قدیمی می‌ماند — کاربر فکر می‌کند ذخیره نشده.
   *
   *    راه‌حل رایج (setState داخل useEffect) باعث می‌شود کاربر یک
   *    فریم مقدار غلط را ببیند و بعد بپرد. الگوی مستندشده‌ی ری‌اکت
   *    برای «تنظیم state هنگام تغییر prop» همین است: مقایسه با
   *    مقدار قبلی در حین رندر. ری‌اکت بی‌درنگ دوباره رندر می‌کند،
   *    پیش از آنکه چیزی روی صفحه نقش ببندد.
   */
  const [syncedStock, setSyncedStock] = useState(product.stock)

  if (syncedStock !== product.stock) {
    setSyncedStock(product.stock)
    setStockValue(String(product.stock))
  }

  const parsedStock = Number(stockValue)
  const isDirty = stockValue !== String(product.stock)
  const isValid = Number.isInteger(parsedStock) && parsedStock >= 0

  return (
    <li className="grid gap-3 rounded-(--radius-lg) border border-border bg-card p-3 md:grid-cols-[auto_1fr_auto_auto_auto] md:items-center">
      {/* تصویر */}
      <div className="relative size-14 shrink-0 overflow-hidden rounded-(--radius-md) border border-border bg-muted">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail.url}
            alt={product.thumbnail.alt}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <Package
            className="absolute inset-0 m-auto size-6 text-muted-foreground"
            aria-hidden="true"
          />
        )}
      </div>

      {/* نام و مشخصات */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
          <span
            className={cn(
              'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs',
              PRODUCT_STATUS_CLASSES[product.status],
            )}
          >
            {product.statusLabel}
          </span>
        </div>

        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-mono">{product.sku}</span>
          {product.category && <span>{product.category.name}</span>}
          {/*
            حاشیه سود فقط وقتی قیمت تمام‌شده ثبت شده باشد.

            ⚠️ حاشیه‌ی منفی یعنی کالا زیر قیمت تمام‌شده فروخته می‌شود —
               معمولاً چون تخفیف بیش از حد روی آن اعمال شده. این مهم‌ترین
               عددی است که یک ادمین باید ببیند، پس با رنگ هشدار از بقیه
               جدا می‌شود. پیش‌تر با همان خاکستریِ کد کالا نمایش داده
               می‌شد و عملاً دیده نمی‌شد.
          */}
          {product.marginPercent !== null && (
            <span
              className={cn(
                product.marginPercent < 0 && 'font-medium text-destructive',
              )}
            >
              {t('products.margin')}: {formatNumber(product.marginPercent, locale)}٪
            </span>
          )}
        </p>
      </div>

      {/* قیمت */}
      <div className="text-sm md:text-end">
        <p className="font-semibold text-foreground">
          {formatPrice(product.finalPrice, locale)}
          <span className="ms-1 text-xs font-normal text-muted-foreground">
            {currencyLabel(locale)}
          </span>
        </p>
        {product.isOnSale && (
          <p className="text-xs text-muted-foreground line-through">
            {formatPrice(product.price, locale)}
          </p>
        )}
      </div>

      {/* ویرایش سریع موجودی */}
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (isValid && isDirty) onSaveStock(parsedStock)
        }}
        className="flex items-center gap-1.5"
      >
        <label htmlFor={`stock-${product.id}`} className="sr-only">
          {t('products.quickStock')}
        </label>
        <input
          id={`stock-${product.id}`}
          type="number"
          min={0}
          max={100000}
          value={stockValue}
          onChange={(event) => setStockValue(event.target.value)}
          className={cn(
            'h-9 w-20 rounded-(--radius-md) border bg-background px-2 text-center text-sm text-foreground outline-none focus-visible:border-primary',
            /* هشدار بصری وقتی موجودی زیر آستانه است */
            product.stock === 0
              ? 'border-destructive/50'
              : product.isLowStock
                ? 'border-warning/60'
                : 'border-border',
          )}
        />

        {/*
          دکمه ذخیره فقط وقتی ظاهر می‌شود که مقدار تغییر کرده باشد.
          فضای ثابت رزرو شده تا با ظاهر شدنش چیدمان نپرد.
        */}
        <span className="flex size-9 items-center justify-center">
          {isSavingStock ? (
            <Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" />
          ) : savedSlug === product.slug ? (
            <Check className="size-4 text-success" aria-hidden="true" />
          ) : isDirty ? (
            <button
              type="submit"
              disabled={!isValid}
              aria-label={tCommon('save')}
              className="flex size-9 items-center justify-center rounded-(--radius-md) bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Check className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </span>
      </form>

      {/* عملیات */}
      <div className="flex items-center gap-1">
        <Link
          href={`/admin/products/${product.slug}`}
          aria-label={`${tCommon('edit')} — ${product.name}`}
          className="flex size-9 items-center justify-center rounded-(--radius-md) border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Pencil className="size-4" aria-hidden="true" />
        </Link>

        <button
          type="button"
          onClick={onDelete}
          aria-label={`${tCommon('delete')} — ${product.name}`}
          className="flex size-9 items-center justify-center rounded-(--radius-md) border border-border text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}
