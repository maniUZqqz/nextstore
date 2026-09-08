'use client'

/**
 * فرم ساخت و ویرایش محصول
 * ---------------------------------------------------------------------------
 * یک کامپوننت برای هر دو کار: اگر `slug` داده شود ویرایش است، وگرنه
 * ساخت. چرا یکی؟ چون هر دو دقیقاً همان بیست فیلد را دارند و دو نسخه
 * یعنی هر تغییر باید دو جا اعمال شود — و یکی همیشه جا می‌ماند.
 *
 * ⚠️ فیلدهای متنی دو زبانه‌اند و هر دو زبان باید پر شوند.
 *    اگر فرم فقط زبان جاری را می‌فرستاد، ادمین فارسی‌زبان با یک
 *    بار ذخیره، ترجمه‌ی انگلیسی را پاک می‌کرد — بدون هیچ هشداری.
 *    به همین دلیل بک‌اند هم name.fa و name.en را الزامی کرده است.
 *
 * ⚠️ قیمت‌ها عدد صحیح ریالی‌اند، نه اعشاری. محاسبات پولی با float
 *    خطای گردکردن می‌سازد؛ ۰.۱ + ۰.۲ در جاوااسکریپت ۰.۳ نیست.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { AlertCircle, Loader2, ArrowRight, ArrowLeft, Save } from 'lucide-react'
import { Link, useRouter } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getAdminProduct, createProduct, updateProduct } from '@/lib/api/admin'
import { getCategories, getBrands } from '@/lib/api/catalog'
import { ApiError } from '@/lib/api/client'
import type { ProductInput, ProductStatusValue } from '@/types/admin'
import type { Category } from '@/types/product'
import { formatNumber } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

/** شکل داده‌ی فرم — همه چیز رشته است چون ورودی HTML رشته می‌دهد. */
interface FormState {
  nameFa: string
  nameEn: string
  shortDescFa: string
  shortDescEn: string
  descFa: string
  descEn: string

  categoryId: string
  brandId: string
  sku: string

  price: string
  salePrice: string
  costPrice: string

  stock: string
  lowStockThreshold: string

  weight: string

  status: ProductStatusValue
  isFeatured: boolean
}

/** مقادیر اولیه‌ی فرم خالی (حالت ساخت). */
const EMPTY_FORM: FormState = {
  nameFa: '', nameEn: '',
  shortDescFa: '', shortDescEn: '',
  descFa: '', descEn: '',
  categoryId: '', brandId: '', sku: '',
  price: '', salePrice: '', costPrice: '',
  stock: '0', lowStockThreshold: '5',
  weight: '',
  status: 'draft',
  isFeatured: false,
}

export function AdminProductForm({ slug }: { slug?: string }) {
  const t = useTranslations('admin')
  const tCommon = useTranslations('common')
  const tStates = useTranslations('states')
  const locale = useLocale() as Locale
  const router = useRouter()
  const queryClient = useQueryClient()

  const isEdit = Boolean(slug)

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [clientError, setClientError] = useState('')

  /* --- بارگذاری محصول در حالت ویرایش --- */
  const productQuery = useQuery({
    queryKey: ['admin', 'product', slug],
    queryFn: () => getAdminProduct(slug as string),
    /* در حالت ساخت اصلاً درخواستی نمی‌رود */
    enabled: isEdit,
  })

  /*
   * پر کردن فرم از پاسخ سرور.
   *
   * ⚠️ چرا این کار در بدنه‌ی رندر انجام می‌شود، نه در useEffect؟
   *
   *    داده در اولین رندر هنوز نرسیده است، پس مقدار اولیه‌ی useState
   *    همیشه خالی می‌ماند و باید بعداً پر شود.
   *
   *    اگر با useEffect پر می‌کردیم، کاربر یک فریم فرم خالی را
   *    می‌دید و بعد مقادیر ناگهان ظاهر می‌شدند. الگوی مستندشده‌ی
   *    ری‌اکت برای همگام‌سازی state با prop/داده‌ی تازه، مقایسه‌ی
   *    شناسه‌ی داده در حین رندر است — ری‌اکت پیش از نقاشی صفحه
   *    دوباره رندر می‌کند، پس پرشی دیده نمی‌شود.
   *
   *    مقایسه با شناسه‌ی محصول (نه خود آبجکت) انجام می‌شود تا رفرش
   *    پس‌زمینه‌ی react-query ویرایش‌های ذخیره‌نشده‌ی ادمین را پاک
   *    نکند.
   */
  const [loadedProductId, setLoadedProductId] = useState<number | null>(null)

  if (productQuery.data && productQuery.data.id !== loadedProductId) {
    const product = productQuery.data
    setLoadedProductId(product.id)

    setForm({
      nameFa: product.name.fa,
      nameEn: product.name.en,
      shortDescFa: product.shortDescription.fa,
      shortDescEn: product.shortDescription.en,
      descFa: product.description.fa,
      descEn: product.description.en,

      categoryId: product.categoryId ? String(product.categoryId) : '',
      brandId: product.brandId ? String(product.brandId) : '',
      sku: product.sku,

      price: String(product.price),
      salePrice: product.salePrice !== null ? String(product.salePrice) : '',
      costPrice: product.costPrice !== null ? String(product.costPrice) : '',

      stock: String(product.stock),
      lowStockThreshold: String(product.lowStockThreshold),

      weight: product.weight !== null ? String(product.weight) : '',

      status: product.status,
      isFeatured: product.isFeatured,
    })
  }

  /* --- دسته‌بندی‌ها و برندها برای دراپ‌داون --- */
  const categoriesQuery = useQuery({
    queryKey: ['categories', locale],
    queryFn: () => getCategories(locale),
    staleTime: 3_600_000,
  })

  const brandsQuery = useQuery({
    queryKey: ['brands', locale],
    queryFn: () => getBrands(locale),
    staleTime: 3_600_000,
  })

  const saveMutation = useMutation({
    mutationFn: (input: ProductInput) =>
      isEdit ? updateProduct(slug as string, input) : createProduct(input),

    onSuccess: (saved) => {
      /* فهرست، داشبورد و کاتالوگ عمومی همگی کهنه شده‌اند */
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })

      /*
       * پس از ساخت، نامک تازه از سرور می‌آید. هدایت به صفحه‌ی
       * ویرایش همان محصول یعنی ادمین می‌تواند بلافاصله ادامه دهد
       * و رفرش صفحه هم داده را از دست نمی‌دهد.
       */
      if (!isEdit) {
        router.replace(`/admin/products/${saved.slug}`)
      } else {
        queryClient.setQueryData(['admin', 'product', slug], saved)
      }
    },
  })

  /** به‌روزرسانی یک فیلد فرم. */
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }))

  /**
   * اعتبارسنجی سمت کلاینت پیش از ارسال.
   *
   * سرور هم همین‌ها را بررسی می‌کند (و آن اعتبارسنجی واقعی است)،
   * اما بازخورد فوری بهتر از رفت‌وبرگشت شبکه است.
   */
  const validate = (): string => {
    if (form.nameFa.trim().length < 3 || form.nameEn.trim().length < 3) {
      return t('products.nameRequired')
    }

    const price = Number(form.price)
    if (!Number.isInteger(price) || price < 1000) {
      return t('products.priceRequired')
    }

    if (form.salePrice !== '') {
      const sale = Number(form.salePrice)
      if (!Number.isInteger(sale) || sale >= price) {
        return t('products.salePriceInvalid')
      }
    }

    return ''
  }

  /** تبدیل رشته‌ی خالی به null و رشته‌ی عددی به عدد. */
  const numberOrNull = (value: string): number | null =>
    value.trim() === '' ? null : Number(value)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    const error = validate()
    setClientError(error)
    if (error) return

    saveMutation.mutate({
      name: { fa: form.nameFa.trim(), en: form.nameEn.trim() },
      short_description: {
        fa: form.shortDescFa.trim(),
        en: form.shortDescEn.trim(),
      },
      description: { fa: form.descFa.trim(), en: form.descEn.trim() },

      category_id: numberOrNull(form.categoryId),
      brand_id: numberOrNull(form.brandId),
      /* کد کالای خالی یعنی «خودت بساز» — نباید رشته‌ی تهی برود */
      sku: form.sku.trim() || undefined,

      price: Number(form.price),
      sale_price: numberOrNull(form.salePrice),
      cost_price: numberOrNull(form.costPrice),

      stock: Number(form.stock),
      low_stock_threshold: Number(form.lowStockThreshold || 0),

      weight: numberOrNull(form.weight),

      status: form.status,
      is_featured: form.isFeatured,
    })
  }

  /* --- بارگذاری محصول --- */
  if (isEdit && productQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 animate-pulse rounded-(--radius-lg) border border-border bg-muted" />
        <div className="h-96 animate-pulse rounded-(--radius-lg) border border-border bg-muted" />
      </div>
    )
  }

  if (isEdit && productQuery.isError) {
    return (
      <div className="flex flex-col items-center rounded-(--radius-lg) border border-border bg-card py-16 text-center">
        <AlertCircle className="size-12 text-warning" aria-hidden="true" />
        <h2 className="mt-4 text-base font-bold text-foreground">{tStates('errorTitle')}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{tStates('errorDesc')}</p>
        <Link
          href="/admin/products"
          className="mt-5 h-10 rounded-(--radius-md) border border-border px-5 text-sm leading-10 text-foreground hover:bg-accent"
        >
          {t('products.backToList')}
        </Link>
      </div>
    )
  }

  /* خطاهای اعتبارسنجی سرور، به تفکیک فیلد */
  const fieldErrors =
    saveMutation.error instanceof ApiError ? saveMutation.error.fieldErrors : undefined

  const BackIcon = locale === 'fa' ? ArrowRight : ArrowLeft

  /*
   * درخت دسته‌بندی‌ها به فهرست تخت تبدیل می‌شود تا در <select>
   * قابل نمایش باشد. فرورفتگی با فاصله‌ی غیرشکننده ساخته می‌شود
   * چون <select> بومی از استایل روی <option> پشتیبانی نمی‌کند.
   */
  const flatCategories = flattenCategories(categoriesQuery.data?.data ?? [])

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* ================= سرصفحه ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/products"
            aria-label={t('products.backToList')}
            className="flex size-9 items-center justify-center rounded-(--radius-md) border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <BackIcon className="size-4" aria-hidden="true" />
          </Link>

          <div>
            <h1 className="text-lg font-bold text-foreground">
              {isEdit ? t('products.edit') : t('products.createTitle')}
            </h1>
            <p className="text-xs text-muted-foreground">{t('products.requiredHint')}</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="inline-flex h-10 items-center gap-2 rounded-(--radius-md) bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saveMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="size-4" aria-hidden="true" />
          )}
          {saveMutation.isPending ? t('saving') : tCommon('save')}
        </button>
      </div>

      {/* ================= پیام‌ها ================= */}
      <div aria-live="polite">
        {clientError && <Alert tone="destructive">{clientError}</Alert>}

        {saveMutation.isError && !clientError && (
          <Alert tone="destructive">
            {saveMutation.error instanceof Error
              ? saveMutation.error.message
              : tCommon('error')}
          </Alert>
        )}

        {saveMutation.isSuccess && !saveMutation.isPending && (
          <Alert tone="success">{t('products.saved')}</Alert>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem] lg:items-start">
        {/* ============ ستون اصلی: محتوا ============ */}
        <div className="flex flex-col gap-4">
          <Section title={t('products.sections.content')}>
            {/*
              نام فارسی و انگلیسی کنار هم — نه در تب‌های جدا.
              دیدن همزمان هر دو، جا افتادن یکی را غیرممکن می‌کند.
            */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                id="name-fa"
                label={t('products.fields.nameFa')}
                required
                error={fieldErrors?.['name.fa']?.[0]}
              >
                <input
                  id="name-fa"
                  type="text"
                  dir="rtl"
                  value={form.nameFa}
                  onChange={(event) => set('nameFa', event.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field
                id="name-en"
                label={t('products.fields.nameEn')}
                required
                error={fieldErrors?.['name.en']?.[0]}
              >
                <input
                  id="name-en"
                  type="text"
                  dir="ltr"
                  value={form.nameEn}
                  onChange={(event) => set('nameEn', event.target.value)}
                  className={cn(inputClass, 'text-start')}
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="short-fa" label={t('products.fields.shortDescFa')}>
                <textarea
                  id="short-fa"
                  rows={2}
                  dir="rtl"
                  value={form.shortDescFa}
                  onChange={(event) => set('shortDescFa', event.target.value)}
                  className={textareaClass}
                />
              </Field>

              <Field id="short-en" label={t('products.fields.shortDescEn')}>
                <textarea
                  id="short-en"
                  rows={2}
                  dir="ltr"
                  value={form.shortDescEn}
                  onChange={(event) => set('shortDescEn', event.target.value)}
                  className={cn(textareaClass, 'text-start')}
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="desc-fa" label={t('products.fields.descFa')}>
                <textarea
                  id="desc-fa"
                  rows={6}
                  dir="rtl"
                  value={form.descFa}
                  onChange={(event) => set('descFa', event.target.value)}
                  className={textareaClass}
                />
              </Field>

              <Field id="desc-en" label={t('products.fields.descEn')}>
                <textarea
                  id="desc-en"
                  rows={6}
                  dir="ltr"
                  value={form.descEn}
                  onChange={(event) => set('descEn', event.target.value)}
                  className={cn(textareaClass, 'text-start')}
                />
              </Field>
            </div>
          </Section>

          <Section title={t('products.sections.pricing')}>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field
                id="price"
                label={t('products.fields.price')}
                required
                error={fieldErrors?.price?.[0]}
                hint={priceHint(form.price, locale)}
              >
                <input
                  id="price"
                  type="number"
                  min={1000}
                  step={1000}
                  dir="ltr"
                  value={form.price}
                  onChange={(event) => set('price', event.target.value)}
                  className={cn(inputClass, 'text-start')}
                />
              </Field>

              <Field
                id="sale-price"
                label={t('products.fields.salePrice')}
                error={fieldErrors?.sale_price?.[0]}
                hint={priceHint(form.salePrice, locale)}
              >
                <input
                  id="sale-price"
                  type="number"
                  min={0}
                  step={1000}
                  dir="ltr"
                  value={form.salePrice}
                  onChange={(event) => set('salePrice', event.target.value)}
                  className={cn(inputClass, 'text-start')}
                />
              </Field>

              <Field
                id="cost-price"
                label={t('products.costPrice')}
                hint={t('products.costPriceHint')}
                error={fieldErrors?.cost_price?.[0]}
              >
                <input
                  id="cost-price"
                  type="number"
                  min={0}
                  step={1000}
                  dir="ltr"
                  value={form.costPrice}
                  onChange={(event) => set('costPrice', event.target.value)}
                  className={cn(inputClass, 'text-start')}
                />
              </Field>
            </div>
          </Section>

          <Section title={t('products.sections.inventory')}>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field
                id="stock"
                label={t('products.fields.stock')}
                required
                error={fieldErrors?.stock?.[0]}
              >
                <input
                  id="stock"
                  type="number"
                  min={0}
                  max={100000}
                  dir="ltr"
                  value={form.stock}
                  onChange={(event) => set('stock', event.target.value)}
                  className={cn(inputClass, 'text-start')}
                />
              </Field>

              <Field
                id="low-stock"
                label={t('products.fields.lowStockThreshold')}
                error={fieldErrors?.low_stock_threshold?.[0]}
              >
                <input
                  id="low-stock"
                  type="number"
                  min={0}
                  max={1000}
                  dir="ltr"
                  value={form.lowStockThreshold}
                  onChange={(event) => set('lowStockThreshold', event.target.value)}
                  className={cn(inputClass, 'text-start')}
                />
              </Field>

              <Field
                id="weight"
                label={t('products.fields.weight')}
                error={fieldErrors?.weight?.[0]}
              >
                <input
                  id="weight"
                  type="number"
                  min={0}
                  dir="ltr"
                  value={form.weight}
                  onChange={(event) => set('weight', event.target.value)}
                  className={cn(inputClass, 'text-start')}
                />
              </Field>
            </div>
          </Section>
        </div>

        {/* ============ ستون کناری: انتشار و دسته‌بندی ============ */}
        <div className="flex flex-col gap-4">
          <Section title={t('products.sections.publish')}>
            <Field
              id="status"
              label={t('products.fields.publishStatus')}
              required
              error={fieldErrors?.status?.[0]}
            >
              <select
                id="status"
                value={form.status}
                onChange={(event) => set('status', event.target.value as ProductStatusValue)}
                className={inputClass}
              >
                <option value="draft">{t('products.statuses.draft')}</option>
                <option value="active">{t('products.statuses.active')}</option>
                <option value="archived">{t('products.statuses.archived')}</option>
              </select>
            </Field>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) => set('isFeatured', event.target.checked)}
                className="size-4 accent-[var(--color-primary)]"
              />
              {t('products.fields.isFeatured')}
            </label>
          </Section>

          <Section title={t('products.sections.organization')}>
            <Field
              id="category"
              label={t('products.fields.category')}
              error={fieldErrors?.category_id?.[0]}
            >
              <select
                id="category"
                value={form.categoryId}
                onChange={(event) => set('categoryId', event.target.value)}
                className={inputClass}
              >
                <option value="">{t('products.fields.none')}</option>
                {flatCategories.map(({ category, depth }) => (
                  <option key={category.id} value={category.id}>
                    {/* فرورفتگی با فاصله‌ی غیرشکننده */}
                    {'  '.repeat(depth)}
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              id="brand"
              label={t('products.fields.brand')}
              error={fieldErrors?.brand_id?.[0]}
            >
              <select
                id="brand"
                value={form.brandId}
                onChange={(event) => set('brandId', event.target.value)}
                className={inputClass}
              >
                <option value="">{t('products.fields.none')}</option>
                {brandsQuery.data?.data.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              id="sku"
              label={t('products.fields.sku')}
              hint={t('products.fields.skuHint')}
              error={fieldErrors?.sku?.[0]}
            >
              <input
                id="sku"
                type="text"
                dir="ltr"
                value={form.sku}
                onChange={(event) => set('sku', event.target.value)}
                className={cn(inputClass, 'text-start font-mono')}
              />
            </Field>
          </Section>
        </div>
      </div>
    </form>
  )
}

/* =========================================================================
 * قطعات کوچک مشترک
 * ======================================================================= */

const inputClass =
  'h-10 w-full rounded-(--radius-md) border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-primary'

const textareaClass =
  'w-full resize-y rounded-(--radius-md) border border-border bg-background px-3 py-2 text-sm leading-6 text-foreground outline-none focus-visible:border-primary'

/** یک بخش کارت‌مانند از فرم. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-(--radius-lg) border border-border bg-card p-4">
      <h2 className="text-sm font-bold text-foreground">{title}</h2>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </section>
  )
}

/**
 * یک فیلد فرم با برچسب، راهنما و خطا.
 *
 * ⚠️ ورودی به‌عنوان children می‌آید و خودش `id` را دارد، پس <label>
 *    با htmlFor به آن وصل می‌شود. متن راهنما و خطا با aria-describedby
 *    روی ورودی نمی‌نشیند چون children را دستکاری نمی‌کنیم؛ در عوض
 *    خطا بلافاصله پس از ورودی و در همان مسیر خواندن قرار می‌گیرد و
 *    منطقه‌ی aria-live بالای فرم آن را اعلام می‌کند.
 */
function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs text-muted-foreground">
        {label}
        {required && (
          <span className="ms-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children}

      {/* راهنما فقط وقتی خطایی نیست — دو خط زیر هم شلوغ می‌شود */}
      {hint && !error && (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}

      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}

/** نوار پیام رنگی بالای فرم. */
function Alert({
  tone,
  children,
}: {
  tone: 'destructive' | 'success'
  children: React.ReactNode
}) {
  return (
    <p
      className={cn(
        'rounded-(--radius-md) px-3 py-2.5 text-sm',
        tone === 'destructive'
          ? 'bg-destructive/10 text-destructive'
          : 'bg-success/10 text-success',
      )}
    >
      {children}
    </p>
  )
}

/**
 * نمایش خوانای مبلغ زیر ورودی قیمت.
 *
 * ادمین «۱۲۰۰۰۰۰۰» را تایپ می‌کند و نمی‌داند دوازده میلیون است یا
 * صد و بیست میلیون. این راهنما همان عدد را با جداکننده نشان می‌دهد.
 */
function priceHint(value: string, locale: Locale): string | undefined {
  const amount = Number(value)
  if (!value.trim() || !Number.isFinite(amount) || amount <= 0) return undefined

  return formatNumber(amount, locale)
}

/**
 * تخت کردن درخت دسته‌بندی برای نمایش در <select>.
 * عمق هر گره نگه داشته می‌شود تا با فاصله فرورفتگی بسازیم.
 */
function flattenCategories(
  categories: Category[],
  depth = 0,
): Array<{ category: Category; depth: number }> {
  return categories.flatMap((category) => [
    { category, depth },
    ...flattenCategories(category.children ?? [], depth + 1),
  ])
}
