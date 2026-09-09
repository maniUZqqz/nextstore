'use client'

/**
 * فرم ساخت و ویرایش بنر — پنل مدیریت
 * ---------------------------------------------------------------------------
 * ⚠️ چهار فیلد دوزبانه دارد (برچسب، عنوان، زیرعنوان، متن دکمه)، پس از
 *    `BilingualFields` استفاده نمی‌کند: آن کامپوننت به «نام + توضیح»
 *    گره خورده و عمومی‌کردنش برای این یک مورد، دو مصرف‌کننده‌ی موجودش
 *    را هم پیچیده می‌کرد.
 *
 * ⚠️ هر دو زبان همیشه در state هستند و با هم فرستاده می‌شوند. تب فقط
 *    نمایش را عوض می‌کند — اگر فقط زبان جاری فرستاده می‌شد، هر ذخیره
 *    ترجمه‌ی زبان دیگر را پاک می‌کرد.
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Save, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { BANNER_ICON_NAMES, bannerIcon } from '@/lib/utils/banner-icon'
import type { BannerInput } from '@/lib/api/admin-banners'
import type { AdminBanner, BannerMeta, BannerPlacement } from '@/types/banner'

const LOCALES = ['fa', 'en'] as const
type ContentLocale = (typeof LOCALES)[number]

/** مقدار خالی یک فیلد دوزبانه — هر دو کلید حتماً هست. */
const empty = (): Record<string, string> => ({ fa: '', en: '' })

/**
 * تبدیل زمان ISO به قالبی که `<input type="datetime-local">` می‌فهمد.
 *
 * ⚠️ ورودی datetime-local فقط «YYYY-MM-DDTHH:mm» را می‌پذیرد و هر
 *    چیز دیگری را بی‌صدا نادیده می‌گیرد: فیلد خالی می‌ماند و مدیر
 *    فکر می‌کند تاریخی ثبت نشده، بعد ذخیره می‌کند و تاریخ واقعی
 *    پاک می‌شود.
 *
 * ⚠️ رشته از getter های **محلیِ** Date ساخته می‌شود، نه با برش
 *    `toISOString()`.
 *
 *    ISO زمان UTC است؛ بریدنش یعنی مدیری که ساعت ۲ بامداد تهران را
 *    انتخاب کرده، در فرم ساعت ۲۲:۳۰ روز قبل را می‌دید — و با هر بار
 *    باز و ذخیره کردن، تاریخ نیم‌روز عقب‌تر می‌رفت.
 */
function toLocalInput(iso: string | null): string {
  if (!iso) return ''

  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const pad = (n: number) => String(n).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    + `T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function AdminBannerForm({
  banner,
  meta,
  defaultPlacement,
  isSaving,
  errorFor,
  onSubmit,
  onCancel,
}: {
  /** بنر در حال ویرایش؛ نبودنش یعنی ساخت تازه. */
  banner?: AdminBanner
  meta: BannerMeta
  defaultPlacement: BannerPlacement
  isSaving: boolean
  errorFor: (field: string) => string | undefined
  onSubmit: (input: BannerInput) => void
  onCancel: () => void
}) {
  const t = useTranslations('admin.banners')
  const tCommon = useTranslations('common')

  const [tab, setTab] = useState<ContentLocale>('fa')

  const [placement, setPlacement] = useState<BannerPlacement>(
    banner?.placement ?? defaultPlacement,
  )
  const [theme, setTheme] = useState(banner?.theme ?? 'primary')
  const [badge, setBadge] = useState(banner?.badge ?? empty())
  const [title, setTitle] = useState(banner?.title ?? empty())
  const [subtitle, setSubtitle] = useState(banner?.subtitle ?? empty())
  const [ctaLabel, setCtaLabel] = useState(banner?.ctaLabel ?? empty())
  const [href, setHref] = useState(banner?.href ?? '/products')
  const [icon, setIcon] = useState(banner?.icon ?? '')
  const [sortOrder, setSortOrder] = useState(String(banner?.sortOrder ?? 0))
  const [isActive, setIsActive] = useState(banner?.isActive ?? true)
  const [startsAt, setStartsAt] = useState(toLocalInput(banner?.startsAt ?? null))
  const [endsAt, setEndsAt] = useState(toLocalInput(banner?.endsAt ?? null))

  const inputClass =
    'h-10 w-full rounded-(--radius-md) border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-primary'

  /** ورودی دوزبانه — هر دو زبان رندر می‌شوند و غیرفعال پنهان است. */
  const bilingual = (
    id: string,
    label: string,
    value: Record<string, string>,
    setValue: (next: Record<string, string>) => void,
    maxLength: number,
  ) => (
    <div>
      <label htmlFor={`${id}-${tab}`} className="mb-1.5 block text-xs text-muted-foreground">
        {label}
      </label>

      {/*
        ⚠️ هر دو زبان همیشه در DOM هستند و غیرفعال با `hidden` پنهان
           می‌شود. اگر با شرط رندر می‌شدند، مرورگر با هر تعویض تب
           موقعیت مکان‌نما را از دست می‌داد.
      */}
      {LOCALES.map((code) => (
        <input
          key={code}
          id={`${id}-${code}`}
          type="text"
          dir={code === 'en' ? 'ltr' : 'rtl'}
          hidden={code !== tab}
          maxLength={maxLength}
          value={value[code] ?? ''}
          onChange={(event) => setValue({ ...value, [code]: event.target.value })}
          className={cn(inputClass, errorFor(`${id}.${code}`) && 'border-destructive')}
        />
      ))}

      {LOCALES.map((code) => {
        const message = errorFor(`${id}.${code}`)
        if (!message) return null

        return (
          <p key={code} className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive">
            <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            {code === 'fa' ? message : `EN — ${message}`}
          </p>
        )
      })}
    </div>
  )

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit({
          placement,
          theme,
          badge,
          title,
          subtitle,
          cta_label: ctaLabel,
          href: href.trim(),
          icon: icon || null,
          sort_order: Number(sortOrder) || 0,
          is_active: isActive,
          /*
           * ⚠️ رشته‌ی خالی به null تبدیل می‌شود، نه فرستاده شود.
           *
           *    قاعده‌ی `nullable|date` بک‌اند رشته‌ی خالی را رد می‌کند و
           *    مدیری که تاریخ را پاک کرده بود، خطای بی‌ربط «تاریخ
           *    معتبر نیست» می‌گرفت.
           */
          starts_at: startsAt || null,
          ends_at: endsAt || null,
        })
      }}
      className="rounded-(--radius-lg) border border-primary/40 bg-card p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground">
          {banner ? t('editTitle') : t('newTitle')}
        </h2>

        <button
          type="button"
          onClick={onCancel}
          aria-label={tCommon('cancel')}
          className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {/* --- تب زبان --- */}
      <div role="tablist" aria-label={t('language')} className="mb-4 flex border-b border-border">
        {LOCALES.map((code) => {
          const active = tab === code
          /* نشان خطا روی تبی که مشکل دارد — حتی وقتی باز نیست */
          const hasError = ['badge', 'title', 'subtitle', 'ctaLabel']
            .some((field) => errorFor(`${field}.${code}`))

          return (
            <button
              key={code}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(code)}
              className={cn(
                'relative px-4 py-2 text-sm font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {code === 'fa' ? 'فارسی' : 'English'}
              {hasError && <span className="ms-1 text-destructive">•</span>}
              {active && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" aria-hidden="true" />
              )}
            </button>
          )
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {bilingual('title', t('fields.title'), title, setTitle, 120)}
        {bilingual('badge', t('fields.badge'), badge, setBadge, 40)}
        {bilingual('subtitle', t('fields.subtitle'), subtitle, setSubtitle, 180)}
        {bilingual('cta_label', t('fields.cta'), ctaLabel, setCtaLabel, 40)}

        <div>
          <label htmlFor="banner-placement" className="mb-1.5 block text-xs text-muted-foreground">
            {t('fields.placement')}
          </label>
          <select
            id="banner-placement"
            value={placement}
            onChange={(event) => setPlacement(event.target.value as BannerPlacement)}
            className={inputClass}
          >
            {meta.placements.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="banner-theme" className="mb-1.5 block text-xs text-muted-foreground">
            {t('fields.theme')}
          </label>
          <select
            id="banner-theme"
            value={theme}
            onChange={(event) => setTheme(event.target.value as typeof theme)}
            className={inputClass}
          >
            {meta.themes.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="banner-href" className="mb-1.5 block text-xs text-muted-foreground">
            {t('fields.href')}
          </label>
          <input
            id="banner-href"
            type="text"
            dir="ltr"
            value={href}
            onChange={(event) => setHref(event.target.value)}
            placeholder="/products?category=digital"
            className={cn(inputClass, 'text-start', errorFor('href') && 'border-destructive')}
          />
          {errorFor('href') ? (
            <p className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive">
              <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
              {errorFor('href')}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-muted-foreground">{t('hrefHint')}</p>
          )}
        </div>

        {/*
          آیکون فقط برای بنرهای میانی معنا دارد.

          ⚠️ در اسلایدر هیرو اصلاً رندر نمی‌شود، پس نشان‌دادن این
             انتخابگر آنجا فقط مدیر را به انتخابی وامی‌دارد که هیچ
             اثری ندارد.
        */}
        {placement === 'promo' && (
          <div>
            <label htmlFor="banner-icon" className="mb-1.5 block text-xs text-muted-foreground">
              {t('fields.icon')}
            </label>
            <div className="flex items-center gap-2">
              <select
                id="banner-icon"
                value={icon}
                onChange={(event) => setIcon(event.target.value)}
                className={inputClass}
              >
                <option value="">{t('noIcon')}</option>
                {BANNER_ICON_NAMES.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>

              {/* پیش‌نمایش زنده — نام آیکون بدون دیدنش بی‌معناست */}
              {icon &&
                (() => {
                  const Preview = bannerIcon(icon)
                  return (
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-(--radius-md) border border-border text-muted-foreground">
                      <Preview className="size-5" aria-hidden="true" />
                    </span>
                  )
                })()}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="banner-sort" className="mb-1.5 block text-xs text-muted-foreground">
            {t('fields.sortOrder')}
          </label>
          <input
            id="banner-sort"
            type="number"
            min={0}
            max={999}
            dir="ltr"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            className={cn(inputClass, 'text-start')}
          />
        </div>

        {/*
          ⚠️ دو تاریخ در ظرف مشترکِ تمام‌عرض، نه دو خانه‌ی مستقل شبکه.

             فیلد آیکون فقط در جایگاه «بنر میانی» رندر می‌شود؛ با
             نبودنش تعداد خانه‌ها فرد می‌شد و «پایان نمایش» به ردیف
             بعد می‌افتاد — دو تاریخِ یک بازه، جدا از هم و در دو
             سطر. حالا هرچه بالادست تغییر کند، این جفت کنار هم
             می‌ماند.
        */}
        <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
          <div>
            <label htmlFor="banner-starts" className="mb-1.5 block text-xs text-muted-foreground">
              {t('fields.startsAt')}
            </label>
            <input
              id="banner-starts"
              type="datetime-local"
              dir="ltr"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              className={cn(inputClass, 'text-start')}
            />
          </div>

          <div>
            <label htmlFor="banner-ends" className="mb-1.5 block text-xs text-muted-foreground">
              {t('fields.endsAt')}
            </label>
            <input
              id="banner-ends"
              type="datetime-local"
              dir="ltr"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
              className={cn(inputClass, 'text-start', errorFor('ends_at') && 'border-destructive')}
            />
            {errorFor('ends_at') && (
              <p className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive">
                <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                {errorFor('ends_at')}
              </p>
            )}
          </div>
        </div>
      </div>

      <label className="mt-4 flex w-fit items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
          className="size-4 accent-[var(--color-primary)]"
        />
        {t('fields.isActive')}
      </label>

      <p className="mt-2 text-xs text-muted-foreground">{t('scheduleHint')}</p>

      <div className="mt-5 flex gap-2">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex h-10 items-center gap-2 rounded-(--radius-md) bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isSaving ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="size-4" aria-hidden="true" />
          )}
          {tCommon('save')}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 items-center rounded-(--radius-md) border border-border px-5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {tCommon('cancel')}
        </button>
      </div>
    </form>
  )
}
