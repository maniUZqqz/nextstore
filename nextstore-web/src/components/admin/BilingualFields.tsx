'use client'

/**
 * فیلدهای دوزبانه با تب زبان
 * ---------------------------------------------------------------------------
 * هم فرم دسته‌بندی از آن استفاده می‌کند و هم فرم برند.
 *
 * ⚠️ تب‌ها فقط *نمایش* را عوض می‌کنند، نه داده را. هر دو زبان همیشه
 *    در state والد هستند و هر دو با هم ذخیره می‌شوند — اگر فرم فقط
 *    زبان جاری را می‌فرستاد، ذخیره‌ی هر بار ترجمه‌ی زبان دیگر را
 *    پاک می‌کرد.
 *
 * ⚠️ هر دو زبان همیشه رندر می‌شوند و غیرفعال با hidden پنهان است.
 *    اگر با شرط رندر می‌شدند، مرورگر موقعیت مکان‌نما و ارتفاع دستی
 *    textarea را با هر تعویض تب از دست می‌داد.
 */

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils/cn'
import type { Translated } from '@/types/admin'

/** زبان‌های محتوا — با config('app.supported_locales') بک‌اند یکی است. */
export const CONTENT_LOCALES = ['fa', 'en'] as const
export type ContentLocale = (typeof CONTENT_LOCALES)[number]

/** مقدار اولیه‌ی یک فیلد دوزبانه — هر دو کلید حتماً وجود دارند. */
export const emptyTranslated = (): Translated => ({ fa: '', en: '' })

export function BilingualFields({
  namespace,
  tab,
  onTabChange,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  errorFor,
  descriptionRows = 4,
}: {
  /** فضای نام ترجمه — 'admin.categories' یا 'admin.brands' */
  namespace: 'admin.categories' | 'admin.brands'
  tab: ContentLocale
  onTabChange: (locale: ContentLocale) => void
  name: Translated
  onNameChange: (value: Translated) => void
  description: Translated
  onDescriptionChange: (value: Translated) => void
  /** خطای سرور برای یک فیلد، مثلاً 'name.fa' */
  errorFor: (field: string) => string | undefined
  descriptionRows?: number
}) {
  const t = useTranslations(namespace)

  return (
    <div className="rounded-(--radius-lg) border border-border">
      {/* --- تب زبان --- */}
      <div role="tablist" aria-label={t('nameLabel')} className="flex border-b border-border">
        {CONTENT_LOCALES.map((code) => {
          const active = tab === code
          /* نشان خطا روی تبی که مشکل دارد — حتی وقتی باز نیست */
          const hasError = Boolean(errorFor(`name.${code}`) || errorFor(`description.${code}`))

          return (
            <button
              key={code}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(code)}
              className={cn(
                'relative px-5 py-3 text-sm font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t(code === 'fa' ? 'tabFa' : 'tabEn')}

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

      {CONTENT_LOCALES.map((code) => (
        <div key={code} hidden={tab !== code} className="space-y-4 p-5">
          <div>
            <label htmlFor={`name-${code}`} className="text-xs font-medium text-foreground">
              {t('nameLabel')}
            </label>
            <input
              id={`name-${code}`}
              name={`name_${code}`}
              type="text"
              dir={code === 'fa' ? 'rtl' : 'ltr'}
              value={name[code]}
              onChange={(e) => onNameChange({ ...name, [code]: e.target.value })}
              maxLength={120}
              className="mt-1.5 h-10 w-full rounded-(--radius-md) border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {errorFor(`name.${code}`) && (
              <p role="alert" className="mt-1 text-xs text-destructive">
                {errorFor(`name.${code}`)}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`description-${code}`} className="text-xs font-medium text-foreground">
              {t('descriptionLabel')}
            </label>
            <textarea
              id={`description-${code}`}
              name={`description_${code}`}
              dir={code === 'fa' ? 'rtl' : 'ltr'}
              rows={descriptionRows}
              value={description[code]}
              onChange={(e) => onDescriptionChange({ ...description, [code]: e.target.value })}
              maxLength={1000}
              className="mt-1.5 w-full resize-y rounded-(--radius-md) border border-border bg-background px-3 py-2 text-sm leading-7 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {errorFor(`description.${code}`) && (
              <p role="alert" className="mt-1 text-xs text-destructive">
                {errorFor(`description.${code}`)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
