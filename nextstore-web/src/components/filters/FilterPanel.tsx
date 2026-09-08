'use client'

/**
 * پنل فیلتر محصولات
 * ---------------------------------------------------------------------------
 * یک کامپوننت، دو نمایش:
 *   دسکتاپ → ستون کناری ثابت
 *   موبایل  → کشوی تمام‌صفحه که با دکمه «فیلترها» باز می‌شود
 *
 * تمام فیلترها در URL ذخیره می‌شوند، پس:
 *   - با رفرش از بین نمی‌روند
 *   - لینک قابل اشتراک‌گذاری است
 *   - دکمه بازگشت مرورگر درست کار می‌کند
 *
 * برای جلوگیری از رفت‌وبرگشت زیاد به سرور، تغییرات ابتدا در state
 * محلی جمع می‌شوند و با فشردن «اعمال فیلتر» یک‌جا به URL می‌روند.
 */

import { useState, useEffect, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { SlidersHorizontal, X, Check, Loader2 } from 'lucide-react'
import { usePathname, useRouter } from '@/i18n/navigation'
import type { Category, Brand } from '@/types/product'
import { Portal } from '@/components/common/Portal'
import { cn } from '@/lib/utils/cn'

interface FilterPanelProps {
  categories: Category[]
  brands: Brand[]
  /** مقادیر فعلی فیلترها که از URL خوانده شده‌اند */
  current: {
    category?: string
    brands: string[]
    inStock: boolean
    onSale: boolean
  }
  /** تعداد نتایج فعلی — روی دکمه اعمال نمایش داده می‌شود */
  resultCount: number
}

export function FilterPanel({
  categories,
  brands,
  current,
  resultCount,
}: FilterPanelProps) {
  const t = useTranslations('filters')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  /** باز بودن کشو در موبایل */
  const [isOpen, setIsOpen] = useState(false)

  /* --- وضعیت موقت فیلترها (پیش از اعمال) --- */
  const [category, setCategory] = useState(current.category)
  const [selectedBrands, setSelectedBrands] = useState<string[]>(current.brands)
  const [inStock, setInStock] = useState(current.inStock)
  const [onSale, setOnSale] = useState(current.onSale)

  /*
   * همگام‌سازی با URL وقتی کاربر از دکمه بازگشت مرورگر استفاده می‌کند.
   *
   * ⚠️ این کار با `useEffect` انجام نمی‌شود، به دو دلیل:
   *
   *    ۱. افکت *پس از* رندر اجرا می‌شود، پس کاربر یک فریم فیلترهای
   *       قدیمی را می‌بیند و بعد پرش می‌کند. تنظیم state حین رندر،
   *       پیش از هر نقاشی روی صفحه انجام می‌شود.
   *
   *    ۲. مهم‌تر: وابستگی افکت `current.brands` بود — یک آرایه که
   *       والد در هر رندر تازه می‌سازد. مقایسه‌ی React با `Object.is`
   *       است، پس هر رندر والد (حتی رندری بی‌ربط) آرایه‌ای با مرجع
   *       جدید می‌داد و انتخاب‌های نیمه‌کاره‌ی کاربر را ریست می‌کرد.
   *
   * امضا از روی *مقدار* ساخته می‌شود نه مرجع، پس ریست دقیقاً وقتی
   * رخ می‌دهد که فیلترهای URL واقعاً عوض شده باشند.
   */
  const signature = JSON.stringify([
    current.category ?? '',
    /* کپی پیش از sort — sort آرایه را در جا عوض می‌کند و prop والد را خراب می‌کرد */
    [...current.brands].sort(),
    current.inStock,
    current.onSale,
  ])

  const [prevSignature, setPrevSignature] = useState(signature)

  if (signature !== prevSignature) {
    setPrevSignature(signature)
    setCategory(current.category)
    setSelectedBrands(current.brands)
    setInStock(current.inStock)
    setOnSale(current.onSale)
  }

  /* قفل کردن اسکرول بدنه هنگام باز بودن کشو */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  /** تعداد فیلترهای فعال — روی دکمه موبایل نمایش داده می‌شود. */
  const activeCount =
    (current.category ? 1 : 0) +
    current.brands.length +
    (current.inStock ? 1 : 0) +
    (current.onSale ? 1 : 0)

  /** ساخت URL جدید از وضعیت فعلی فیلترها و رفتن به آن. */
  const applyFilters = () => {
    const params = new URLSearchParams()

    /* عبارت جستجو و مرتب‌سازی فعلی باید حفظ شوند */
    const existing = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    )
    const q = existing.get('q')
    const sort = existing.get('sort')
    if (q) params.set('q', q)
    if (sort) params.set('sort', sort)

    if (category) params.set('category', category)
    selectedBrands.forEach((slug) => params.append('brand', slug))
    if (inStock) params.set('in_stock', 'true')
    if (onSale) params.set('on_sale', 'true')

    startTransition(() => {
      router.push(params.toString() ? `${pathname}?${params}` : pathname)
      setIsOpen(false)
    })
  }

  /** پاک کردن همه فیلترها (به‌جز جستجو). */
  const clearFilters = () => {
    setCategory(undefined)
    setSelectedBrands([])
    setInStock(false)
    setOnSale(false)

    const existing = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    )
    const params = new URLSearchParams()
    const q = existing.get('q')
    if (q) params.set('q', q)

    startTransition(() => {
      router.push(params.toString() ? `${pathname}?${params}` : pathname)
      setIsOpen(false)
    })
  }

  /** افزودن یا حذف یک برند از انتخاب‌ها. */
  const toggleBrand = (slug: string) => {
    setSelectedBrands((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    )
  }

  /* =====================================================================
   * محتوای فیلترها — بین نمای دسکتاپ و موبایل مشترک است
   * =================================================================== */
  const filterBody = (
    <div className="flex flex-col gap-5">
      {/* --- دسته‌بندی --- */}
      <section>
        <h3 className="mb-2.5 text-sm font-bold text-foreground">{t('category')}</h3>

        <ul className="space-y-0.5">
          <li>
            <button
              type="button"
              onClick={() => setCategory(undefined)}
              className={cn(
                'w-full rounded-(--radius-sm) px-3 py-2 text-start text-sm transition-colors',
                !category
                  ? 'bg-accent font-medium text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent',
              )}
            >
              {tCommon('viewAll')}
            </button>
          </li>

          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                type="button"
                onClick={() => setCategory(cat.slug)}
                className={cn(
                  'flex w-full items-center justify-between rounded-(--radius-sm) px-3 py-2 text-sm transition-colors',
                  category === cat.slug
                    ? 'bg-accent font-medium text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent',
                )}
              >
                <span>{cat.name}</span>
                <span className="text-xs opacity-70">{cat.productsCount}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* --- برند --- */}
      {brands.length > 0 && (
        <section>
          <h3 className="mb-2.5 text-sm font-bold text-foreground">{t('brand')}</h3>

          <ul className="max-h-60 space-y-0.5 overflow-y-auto">
            {brands.map((brand) => {
              const checked = selectedBrands.includes(brand.slug)

              return (
                <li key={brand.id}>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-(--radius-sm) px-3 py-2 text-sm transition-colors hover:bg-accent">
                    {/* چک‌باکس سفارشی — چک‌باکس بومی سخت استایل می‌گیرد */}
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleBrand(brand.slug)}
                      className="sr-only"
                    />
                    <span
                      className={cn(
                        'flex size-4 shrink-0 items-center justify-center rounded border transition-colors',
                        checked
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input',
                      )}
                      aria-hidden="true"
                    >
                      {checked && <Check className="size-3" strokeWidth={3} />}
                    </span>

                    <span className="flex-1 text-muted-foreground">{brand.name}</span>
                    <span className="text-xs text-muted-foreground opacity-70">
                      {brand.productsCount}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* --- موجودی و تخفیف --- */}
      <section>
        <h3 className="mb-2.5 text-sm font-bold text-foreground">{t('availability')}</h3>

        <div className="space-y-0.5">
          {[
            { label: t('onlyInStock'), checked: inStock, toggle: () => setInStock((v) => !v) },
            { label: t('onlyOnSale'), checked: onSale, toggle: () => setOnSale((v) => !v) },
          ].map((item) => (
            <label
              key={item.label}
              className="flex cursor-pointer items-center gap-2.5 rounded-(--radius-sm) px-3 py-2 text-sm transition-colors hover:bg-accent"
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={item.toggle}
                className="sr-only"
              />
              <span
                className={cn(
                  'flex size-4 shrink-0 items-center justify-center rounded border transition-colors',
                  item.checked
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input',
                )}
                aria-hidden="true"
              >
                {item.checked && <Check className="size-3" strokeWidth={3} />}
              </span>
              <span className="text-muted-foreground">{item.label}</span>
            </label>
          ))}
        </div>
      </section>
    </div>
  )

  return (
    <>
      {/* ==========================================================
          دکمه باز کردن فیلتر — فقط موبایل
          ========================================================== */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-(--radius-md) border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent lg:hidden"
      >
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        {t('title')}

        {/* نشانگر تعداد فیلتر فعال */}
        {activeCount > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
            {activeCount}
          </span>
        )}
      </button>

      {/* ==========================================================
          نمای دسکتاپ — ستون کناری
          ========================================================== */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-24 rounded-(--radius-lg) border border-border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">{t('title')}</h2>

            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-primary hover:underline"
              >
                {t('clear')}
              </button>
            )}
          </div>

          {filterBody}

          <button
            type="button"
            onClick={applyFilters}
            disabled={isPending}
            className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-(--radius-md) bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {t('apply')}
          </button>
        </div>
      </aside>

      {/* ==========================================================
          نمای موبایل — کشوی تمام‌صفحه

          از Portal استفاده می‌شود تا کشو همیشه نسبت به viewport
          جای‌گذاری شود، نه نسبت به هر والدی که ممکن است بعداً
          filter یا transform بگیرد و containing block بسازد.
          ========================================================== */}
      <Portal>
        <div
          className={cn(
            'fixed inset-0 z-[60] bg-black/60 lg:hidden',
            'transition-opacity duration-[var(--duration-base)]',
            isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />

      <div
        className={cn(
          'fixed inset-y-0 end-0 z-[70] flex w-[86%] max-w-sm flex-col bg-background shadow-[var(--shadow-lg)] lg:hidden',
          'transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out)]',
          isOpen ? 'translate-x-0' : 'translate-x-full rtl:-translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label={t('title')}
        /* عنصر پنهان نباید با Tab قابل رسیدن باشد */
        inert={!isOpen}
      >
        {/* سرصفحه کشو */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <h2 className="text-base font-bold text-foreground">{t('title')}</h2>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label={tCommon('close')}
            className="inline-flex size-9 items-center justify-center rounded-(--radius-md) text-muted-foreground hover:bg-accent"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {/* بدنه اسکرول‌شونده */}
        <div className="flex-1 overflow-y-auto p-4">{filterBody}</div>

        {/* پاصفحه با دکمه‌های اقدام */}
        <div className="flex shrink-0 gap-2 border-t border-border p-4">
          <button
            type="button"
            onClick={clearFilters}
            className="h-11 flex-1 rounded-(--radius-md) border border-border text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {t('clear')}
          </button>

          <button
            type="button"
            onClick={applyFilters}
            disabled={isPending}
            className="flex h-11 flex-[2] items-center justify-center gap-2 rounded-(--radius-md) bg-primary text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {t('apply')} ({resultCount})
          </button>
        </div>
      </div>
      </Portal>
    </>
  )
}
