'use client'

/**
 * فرم ثبت نظر
 * ---------------------------------------------------------------------------
 * انتخابگر ستاره + عنوان + متن + فهرست پویای نقاط قوت و ضعف.
 *
 * ⚠️ انتخابگر ستاره با دکمه‌های واقعی ساخته شده، نه div کلیک‌پذیر.
 *    یعنی با Tab قابل رسیدن و با Enter/Space قابل انتخاب است و
 *    صفحه‌خوان «۴ از ۵ ستاره» را اعلام می‌کند. الگوی رایجِ
 *    span+onClick هیچ‌کدام از این‌ها را ندارد.
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Star, Plus, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { ReviewInput } from '@/types/review'

interface ReviewFormProps {
  onSubmit: (input: ReviewInput) => void
  onCancel: () => void
  isSubmitting: boolean
}

/** حداکثر تعداد موارد در هر فهرست — با قاعده‌ی بک‌اند یکی است. */
const MAX_LIST_ITEMS = 5

/**
 * رنگ عنوان هر فهرست.
 *
 * ⚠️ نگاشت ثابت و نه `text-${tone}` به‌صورت رشته‌ی پویا.
 *    Tailwind کلاس‌ها را با اسکن *متن* فایل پیدا می‌کند، نه با
 *    اجرای کد. کلاسی که در زمان اجرا ساخته شود در بیلد تولیدی
 *    وجود ندارد و بی‌صدا حذف می‌شود — عنوان‌ها در توسعه رنگی
 *    دیده می‌شوند و در تولید بی‌رنگ.
 */
const TONE_CLASS = {
  success: 'text-success',
  destructive: 'text-destructive',
} as const

export function ReviewForm({ onSubmit, onCancel, isSubmitting }: ReviewFormProps) {
  const t = useTranslations('reviews')

  const [rating, setRating] = useState(0)
  /* ستاره‌ای که ماوس رویش است — پیش‌نمایش پیش از کلیک */
  const [hovered, setHovered] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [pros, setPros] = useState<string[]>([''])
  const [cons, setCons] = useState<string[]>([''])
  const [error, setError] = useState<string | null>(null)

  /** ویرایش یک عنصر از فهرست پویا. */
  const updateItem = (
    list: string[],
    setList: (next: string[]) => void,
    index: number,
    value: string,
  ) => {
    const next = [...list]
    next[index] = value
    setList(next)
  }

  const addItem = (list: string[], setList: (next: string[]) => void) => {
    if (list.length >= MAX_LIST_ITEMS) return
    setList([...list, ''])
  }

  const removeItem = (
    list: string[],
    setList: (next: string[]) => void,
    index: number,
  ) => {
    /* همیشه دست‌کم یک فیلد بماند، وگرنه راهی برای افزودن دوباره نیست */
    setList(list.length === 1 ? [''] : list.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      setError(t('ratingRequired'))
      return
    }
    setError(null)

    /*
     * فیلدهای خالی حذف می‌شوند.
     * بک‌اند هم آن‌ها را پاک می‌کند، ولی نفرستادنشان یعنی بدنه‌ی
     * سبک‌تر و یک لایه اتکای کمتر به رفتار سرور.
     */
    const clean = (list: string[]) => list.map((s) => s.trim()).filter(Boolean)

    onSubmit({
      rating,
      title: title.trim() || undefined,
      comment: comment.trim() || undefined,
      pros: clean(pros).length > 0 ? clean(pros) : undefined,
      cons: clean(cons).length > 0 ? clean(cons) : undefined,
    })
  }

  /** فهرست پویای نقاط قوت یا ضعف. */
  const renderList = (
    label: string,
    list: string[],
    setList: (next: string[]) => void,
    tone: keyof typeof TONE_CLASS,
  ) => (
    <fieldset className="min-w-0 flex-1">
      <legend className={cn('text-xs font-medium', TONE_CLASS[tone])}>{label}</legend>

      <ul className="mt-2 space-y-2">
        {list.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              maxLength={80}
              onChange={(e) => updateItem(list, setList, index, e.target.value)}
              aria-label={`${label} ${index + 1}`}
              className="h-9 min-w-0 flex-1 rounded-(--radius-md) border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />

            <button
              type="button"
              onClick={() => removeItem(list, setList, index)}
              aria-label={`${label} ${index + 1} — ${t('formCancel')}`}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-(--radius-md) border border-border text-muted-foreground transition-colors hover:text-destructive"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      {list.length < MAX_LIST_ITEMS && (
        <button
          type="button"
          onClick={() => addItem(list, setList)}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          {t('formAdd')}
        </button>
      )}
    </fieldset>
  )

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-(--radius-lg) border border-border bg-background p-5"
    >
      <h3 className="text-sm font-bold text-foreground">{t('writeTitle')}</h3>

      {/* --- انتخابگر ستاره --- */}
      <fieldset className="mt-4">
        <legend className="text-xs font-medium text-foreground">
          {t('formRating')}
        </legend>

        <div
          className="mt-2 flex items-center gap-1"
          onMouseLeave={() => setHovered(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = star <= (hovered || rating)

            return (
              <button
                key={star}
                type="button"
                onClick={() => {
                  setRating(star)
                  setError(null)
                }}
                onMouseEnter={() => setHovered(star)}
                aria-label={`${star}`}
                aria-pressed={rating === star}
                className="rounded-(--radius-sm) p-0.5 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Star
                  className={cn(
                    'size-7 transition-colors',
                    filled ? 'fill-warning text-warning' : 'text-muted-foreground/40',
                  )}
                  aria-hidden="true"
                />
              </button>
            )
          })}

          <span className="ms-2 text-xs text-muted-foreground">
            {t('formRatingHint')}
          </span>
        </div>

        {error && (
          <p role="alert" className="mt-2 text-xs text-destructive">
            {error}
          </p>
        )}
      </fieldset>

      {/* --- عنوان --- */}
      <div className="mt-5">
        <label htmlFor="review-title" className="text-xs font-medium text-foreground">
          {t('formTitle')}
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          maxLength={120}
          placeholder={t('formTitlePlaceholder')}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1.5 h-10 w-full rounded-(--radius-md) border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* --- متن --- */}
      <div className="mt-4">
        <label htmlFor="review-comment" className="text-xs font-medium text-foreground">
          {t('formComment')}
        </label>
        <textarea
          id="review-comment"
          rows={4}
          value={comment}
          maxLength={2000}
          placeholder={t('formCommentPlaceholder')}
          onChange={(e) => setComment(e.target.value)}
          className="mt-1.5 w-full resize-y rounded-(--radius-md) border border-border bg-background px-3 py-2 text-sm leading-7 text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* --- نقاط قوت و ضعف --- */}
      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:gap-8">
        {renderList(t('formPros'), pros, setPros, 'success')}
        {renderList(t('formCons'), cons, setCons, 'destructive')}
      </div>

      {/* --- دکمه‌ها --- */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-(--radius-md) bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {isSubmitting ? t('formSubmitting') : t('formSubmit')}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-11 items-center justify-center rounded-(--radius-md) border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          {t('formCancel')}
        </button>
      </div>
    </form>
  )
}
