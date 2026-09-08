'use client'

/**
 * فرم ساخت و ویرایش مقاله — پنل مدیریت
 * ---------------------------------------------------------------------------
 * همین یک کامپوننت هر دو حالت را پوشش می‌دهد؛ تفاوتشان فقط در وجود
 * `postId` است.
 *
 * ⚠️ ستون فارسی و انگلیسی هر دو در فرم هستند و *هم‌زمان* ذخیره
 *    می‌شوند. اگر فرم فقط زبان جاری پنل را می‌فرستاد، ذخیره‌ی هر بار
 *    ترجمه‌ی زبان دیگر را پاک می‌کرد — به همین دلیل بک‌اند هم مقدار
 *    خام هر دو زبان را برمی‌گرداند نه رشته‌ی زبان جاری.
 *
 * ⚠️ تب‌ها فقط *نمایش* را عوض می‌کنند، نه داده را. هر دو ستون همیشه
 *    در state هستند، پس جابه‌جایی بین تب‌ها چیزی را از دست نمی‌دهد.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import { Loader2, Save, ArrowRight, AlertCircle } from 'lucide-react'
import { Link, useRouter } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import * as postsApi from '@/lib/api/admin-posts'
import { ApiError } from '@/lib/api/client'
import { cn } from '@/lib/utils/cn'
import type { AdminPostCategory, AdminPostDetail, PostInput, Translated } from '@/types/admin'

/** زبان‌های محتوا — با config('app.supported_locales') بک‌اند یکی است. */
const CONTENT_LOCALES = ['fa', 'en'] as const
type ContentLocale = (typeof CONTENT_LOCALES)[number]

/** مقدار اولیه‌ی یک فیلد دوزبانه — هر دو کلید حتماً وجود دارند. */
const emptyTranslated = (): Translated => ({ fa: '', en: '' })

/**
 * پوسته: داده را می‌گیرد و حالت‌های بارگذاری و خطا را نشان می‌دهد.
 *
 * ⚠️ چرا فرم به دو کامپوننت شکسته شده؟
 *    نسخه‌ی اول همه‌چیز در یک کامپوننت بود و مقادیر فرم را با
 *    useEffect از پاسخ سرور پر می‌کرد. آن الگو دو مشکل دارد: یک
 *    رندر اضافه‌ی اجباری، و مهم‌تر اینکه اگر داده دوباره برسد
 *    (مثلاً refetch پس از بازگشت به تب مرورگر) نوشته‌های ذخیره‌نشده‌ی
 *    ادمین را بی‌صدا بازنویسی می‌کند.
 *
 *    راه درست ری‌اکت: کامپوننت داخلی مقدار اولیه را مستقیم از prop
 *    می‌گیرد و با تغییر `key` از نو ساخته می‌شود. نتیجه: هیچ افکتی
 *    لازم نیست و داده‌ی تازه هرگز روی ویرایش جاری نمی‌نویسد.
 */
export function AdminPostForm({ postId }: { postId?: number }) {
  const t = useTranslations('admin.posts')
  const tStates = useTranslations('states')
  const locale = useLocale() as Locale

  const isEdit = typeof postId === 'number'

  const categoriesQuery = useQuery({
    queryKey: ['admin', 'post-categories', locale],
    queryFn: () => postsApi.getAdminPostCategories(locale),
    staleTime: 5 * 60 * 1000,
  })

  const postQuery = useQuery({
    queryKey: ['admin', 'post', postId],
    queryFn: () => postsApi.getAdminPost(postId as number),
    enabled: isEdit,
  })

  /* --- در حال بارگذاری مقاله برای ویرایش --- */
  if (isEdit && postQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-(--radius-md) bg-muted" />
        <div className="h-96 animate-pulse rounded-(--radius-lg) bg-muted" />
      </div>
    )
  }

  if (isEdit && postQuery.isError) {
    return (
      <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
        <AlertCircle className="size-12 text-warning" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-bold text-foreground">{tStates('errorTitle')}</h2>
        <Link
          href="/admin/posts"
          className="mt-5 inline-flex h-10 items-center rounded-(--radius-md) border border-border px-4 text-sm font-medium text-foreground hover:bg-accent"
        >
          {t('title')}
        </Link>
      </div>
    )
  }

  return (
    <PostFormFields
      /*
       * کلید، فرم را با آمدن مقاله‌ی دیگری از نو می‌سازد.
       * جایگزین useEffect برای همگام‌سازی مقادیر اولیه.
       */
      key={postQuery.data?.id ?? 'new'}
      postId={postId}
      initial={postQuery.data}
      categories={categoriesQuery.data ?? []}
    />
  )
}

/**
 * خودِ فرم — مقادیر اولیه را از prop می‌گیرد و بعد مستقل است.
 */
function PostFormFields({
  postId,
  initial,
  categories,
}: {
  postId?: number
  initial?: AdminPostDetail
  categories: AdminPostCategory[]
}) {
  const t = useTranslations('admin.posts')
  const tForm = useTranslations('admin.posts.form')
  const tStates = useTranslations('states')
  const locale = useLocale() as Locale
  const router = useRouter()
  const queryClient = useQueryClient()

  const isEdit = typeof postId === 'number'

  /* --- تب زبان فعال؛ فقط نمایش را عوض می‌کند --- */
  const [tab, setTab] = useState<ContentLocale>(locale === 'en' ? 'en' : 'fa')

  /* --- وضعیت فرم؛ مقدار اولیه مستقیم از prop --- */
  const [title, setTitle] = useState<Translated>(initial?.title ?? emptyTranslated())
  const [excerpt, setExcerpt] = useState<Translated>(initial?.excerpt ?? emptyTranslated())
  const [body, setBody] = useState<Translated>(initial?.body ?? emptyTranslated())
  const [categoryId, setCategoryId] = useState<number | ''>(initial?.postCategoryId ?? '')
  const [author, setAuthor] = useState(initial?.authorName ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [cover, setCover] = useState(initial?.coverImagePath ?? '')
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false)
  const [publishNow, setPublishNow] = useState(initial?.status === 'published')

  /** خطاهای اعتبارسنجی سرور، به تفکیک فیلد. */
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  /* --- ذخیره --- */
  const saveMutation = useMutation({
    mutationFn: (input: PostInput) =>
      isEdit ? postsApi.updatePost(postId, input) : postsApi.createPost(input),

    onSuccess: (saved) => {
      toast.success(t(isEdit ? 'updated' : 'created'))
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'post', saved.id] })
      router.push('/admin/posts')
    },

    onError: (error) => {
      /*
       * خطای اعتبارسنجی زیر فیلد مربوطه نشان داده می‌شود، نه فقط در
       * یک toast. ادمینی که ده فیلد پر کرده باید ببیند کدامشان
       * مشکل دارد، نه اینکه دنبالش بگردد.
       */
      if (error instanceof ApiError && error.isValidation && error.fieldErrors) {
        setFieldErrors(error.fieldErrors)

        /* اگر خطا در زبان دیگری است، همان تب باز شود تا دیده شود */
        const errored = Object.keys(error.fieldErrors)
        const otherLocale = CONTENT_LOCALES.find((l) => l !== tab)
        if (otherLocale && errored.some((key) => key.endsWith(`.${otherLocale}`))) {
          setTab(otherLocale)
        }

        toast.error(error.message)
        return
      }

      toast.error(tStates('errorTitle'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    if (categoryId === '') {
      setFieldErrors({ post_category_id: [tForm('category')] })
      return
    }

    saveMutation.mutate({
      title,
      excerpt,
      body,
      post_category_id: categoryId,
      /* خالی یعنی «خودت بساز» — رشته‌ی تهی نباید فرستاده شود */
      slug: slug.trim() || undefined,
      author_name: author.trim() || undefined,
      cover_image: cover.trim() || undefined,
      is_featured: isFeatured,
      /*
       * تاریخ انتشار: زمان فعلی یا تهی.
       * زمان‌بندی برای آینده هنوز در فرم نیست — بک‌اند پشتیبانی
       * می‌کند و افزودنش یک فیلد تاریخ است.
       */
      published_at: publishNow ? new Date().toISOString() : null,
    })
  }

  /** خطای یک فیلد، اگر سرور فرستاده باشد. */
  const errorFor = (field: string) => fieldErrors[field]?.[0]

  return (
    <form onSubmit={handleSubmit}>
      {/* ================= سربرگ ================= */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/posts"
            aria-label={t('title')}
            className="inline-flex size-9 items-center justify-center rounded-(--radius-md) border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {/* در RTL فلش باید به راست باشد؛ rtl:rotate آن را برمی‌گرداند */}
            <ArrowRight className="size-4 rtl:rotate-0 ltr:rotate-180" aria-hidden="true" />
          </Link>

          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            {isEdit ? t('edit') : t('new')}
          </h1>
        </div>

        <button
          type="submit"
          disabled={saveMutation.isPending}
          aria-busy={saveMutation.isPending}
          className="inline-flex h-10 items-center gap-2 rounded-(--radius-md) bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        >
          {saveMutation.isPending
            ? <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            : <Save className="size-4" aria-hidden="true" />}
          {saveMutation.isPending ? tForm('saving') : tForm('save')}
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* ============ ستون اصلی: محتوای دوزبانه ============ */}
        <div className="rounded-(--radius-lg) border border-border">
          {/* --- تب زبان --- */}
          <div role="tablist" aria-label={tForm('title')} className="flex border-b border-border">
            {CONTENT_LOCALES.map((code) => {
              const active = tab === code
              /* نشان خطا روی تبی که مشکل دارد — حتی وقتی باز نیست */
              const hasError = Object.keys(fieldErrors).some((key) => key.endsWith(`.${code}`))

              return (
                <button
                  key={code}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(code)}
                  className={cn(
                    'relative px-5 py-3 text-sm font-medium transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tForm(code === 'fa' ? 'tabFa' : 'tabEn')}

                  {hasError && (
                    <span
                      className="ms-1.5 inline-block size-1.5 rounded-full bg-destructive align-middle"
                      aria-hidden="true"
                    />
                  )}

                  {active && (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" aria-hidden="true" />
                  )}
                </button>
              )
            })}
          </div>

          {/*
            هر دو زبان همیشه رندر می‌شوند و غیرفعال با hidden پنهان.
            اگر به‌جای آن با شرط رندر می‌شدند، مرورگر موقعیت مکان‌نما و
            ارتفاع دستی textarea را با هر تعویض تب از دست می‌داد.
          */}
          {CONTENT_LOCALES.map((code) => (
            <div key={code} hidden={tab !== code} className="space-y-4 p-5">
              {/* --- عنوان --- */}
              <div>
                <label htmlFor={`title-${code}`} className="text-xs font-medium text-foreground">
                  {tForm('title')}
                </label>
                <input
                  id={`title-${code}`}
                  type="text"
                  dir={code === 'fa' ? 'rtl' : 'ltr'}
                  value={title[code]}
                  onChange={(e) => setTitle({ ...title, [code]: e.target.value })}
                  maxLength={200}
                  className="mt-1.5 h-10 w-full rounded-(--radius-md) border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {errorFor(`title.${code}`) && (
                  <p role="alert" className="mt-1 text-xs text-destructive">
                    {errorFor(`title.${code}`)}
                  </p>
                )}
              </div>

              {/* --- خلاصه --- */}
              <div>
                <label htmlFor={`excerpt-${code}`} className="text-xs font-medium text-foreground">
                  {tForm('excerpt')}
                </label>
                <textarea
                  id={`excerpt-${code}`}
                  dir={code === 'fa' ? 'rtl' : 'ltr'}
                  rows={2}
                  value={excerpt[code]}
                  onChange={(e) => setExcerpt({ ...excerpt, [code]: e.target.value })}
                  maxLength={500}
                  className="mt-1.5 w-full resize-y rounded-(--radius-md) border border-border bg-background px-3 py-2 text-sm leading-6 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="mt-1 text-xs text-muted-foreground">{tForm('excerptHint')}</p>
                {errorFor(`excerpt.${code}`) && (
                  <p role="alert" className="mt-1 text-xs text-destructive">
                    {errorFor(`excerpt.${code}`)}
                  </p>
                )}
              </div>

              {/* --- متن --- */}
              <div>
                <label htmlFor={`body-${code}`} className="text-xs font-medium text-foreground">
                  {tForm('body')}
                </label>
                {/*
                  ⚠️ جهت همیشه ltr است، حتی برای متن فارسی.

                     این کادر «سورس HTML» است نه متن روان. با dir=rtl
                     الگوریتم دوجهتی مرورگر تگ‌ها را جابه‌جا می‌کند:
                     <p> ته خط می‌افتد، </h2> وسط جمله ظاهر می‌شود و
                     پیدا کردن اینکه کدام تگ کجا بسته شده تقریباً
                     ناممکن می‌شود.

                     با ltr ساختار مارک‌آپ سر جایش می‌ماند و خودِ متن
                     فارسی داخل هر خط، طبق قواعد دوجهتی همچنان درست
                     راست‌به‌چپ نمایش داده می‌شود.
                */}
                <textarea
                  id={`body-${code}`}
                  dir="ltr"
                  rows={18}
                  value={body[code]}
                  onChange={(e) => setBody({ ...body, [code]: e.target.value })}
                  className="mt-1.5 w-full resize-y rounded-(--radius-md) border border-border bg-background px-3 py-2 text-start font-mono text-xs leading-6 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="mt-1 text-xs text-muted-foreground">{tForm('bodyHint')}</p>
                {errorFor(`body.${code}`) && (
                  <p role="alert" className="mt-1 text-xs text-destructive">
                    {errorFor(`body.${code}`)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ============ ستون کناری: تنظیمات ============ */}
        <aside className="space-y-4 rounded-(--radius-lg) border border-border p-5 lg:h-fit">
          {/* --- دسته --- */}
          <div>
            <label htmlFor="post-category" className="text-xs font-medium text-foreground">
              {tForm('category')}
            </label>
            <select
              id="post-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
              className="mt-1.5 h-10 w-full rounded-(--radius-md) border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">—</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errorFor('post_category_id') && (
              <p role="alert" className="mt-1 text-xs text-destructive">
                {errorFor('post_category_id')}
              </p>
            )}
          </div>

          {/* --- نویسنده --- */}
          <div>
            <label htmlFor="post-author" className="text-xs font-medium text-foreground">
              {tForm('author')}
            </label>
            <input
              id="post-author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              maxLength={120}
              className="mt-1.5 h-10 w-full rounded-(--radius-md) border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* --- نامک --- */}
          <div>
            <label htmlFor="post-slug" className="text-xs font-medium text-foreground">
              {tForm('slug')}
            </label>
            <input
              id="post-slug"
              type="text"
              dir="ltr"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              maxLength={200}
              placeholder="my-article"
              className="mt-1.5 h-10 w-full rounded-(--radius-md) border border-border bg-background px-3 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">{tForm('slugHint')}</p>
            {errorFor('slug') && (
              <p role="alert" className="mt-1 text-xs text-destructive">{errorFor('slug')}</p>
            )}
          </div>

          {/* --- کاور --- */}
          <div>
            <label htmlFor="post-cover" className="text-xs font-medium text-foreground">
              {tForm('cover')}
            </label>
            <input
              id="post-cover"
              type="text"
              dir="ltr"
              value={cover}
              onChange={(e) => setCover(e.target.value)}
              maxLength={255}
              placeholder="posts/my-article.svg"
              className="mt-1.5 h-10 w-full rounded-(--radius-md) border border-border bg-background px-3 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">{tForm('coverHint')}</p>
          </div>

          <hr className="border-border" />

          {/* --- ویژه --- */}
          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-primary"
            />
            <span className="min-w-0">
              <span className="block text-sm text-foreground">{tForm('featured')}</span>
              <span className="block text-xs text-muted-foreground">{tForm('featuredHint')}</span>
            </span>
          </label>

          {/* --- انتشار --- */}
          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={publishNow}
              onChange={(e) => setPublishNow(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-primary"
            />
            <span className="min-w-0">
              <span className="block text-sm text-foreground">{tForm('publishNow')}</span>
              <span className="block text-xs text-muted-foreground">{tForm('publishHint')}</span>
            </span>
          </label>

          <p className="text-xs text-muted-foreground">{tForm('readingTime')}</p>
        </aside>
      </div>
    </form>
  )
}
