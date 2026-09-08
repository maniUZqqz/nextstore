'use client'

/**
 * تنظیمات فروشگاه — پنل مدیریت
 * ---------------------------------------------------------------------------
 * فرم گروه‌بندی‌شده: عمومی · تماس · شبکه‌های اجتماعی
 *
 * ⚠️ شمای فرم — کلیدها، گروهشان، دوزبانه بودنشان و نوع ورودی — از
 *    **بک‌اند** می‌آید، نه از فهرستی در این فایل.
 *
 *    افزودن یک تنظیم تازه باید فقط یک تغییر در `AdminSettingController`
 *    باشد؛ اگر فرم هم فهرست خودش را داشت، تنظیم جدید بی‌صدا نامرئی
 *    می‌ماند و کسی متوجه نمی‌شد چرا کار نمی‌کند.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Save, Loader2, AlertCircle, Store, Phone, Share2 } from 'lucide-react'
import * as settingsApi from '@/lib/api/admin-settings'
import { cn } from '@/lib/utils/cn'
import type { AdminSetting, SettingGroup } from '@/types/admin'

/** ترتیب و آیکون گروه‌ها. */
const GROUPS: { key: SettingGroup; Icon: typeof Store }[] = [
  { key: 'general', Icon: Store },
  { key: 'contact', Icon: Phone },
  { key: 'social', Icon: Share2 },
]

export function AdminSettingsForm() {
  const t = useTranslations('admin.settings')
  const tStates = useTranslations('states')
  const queryClient = useQueryClient()

  /**
   * مقادیر ویرایش‌شده.
   *
   * `null` یعنی هنوز چیزی عوض نشده و باید از پاسخ سرور خوانده شود.
   * جدا نگه‌داشتنشان یعنی «ذخیره‌نشده» را می‌شود از «ذخیره‌شده» تفکیک کرد.
   */
  const [draft, setDraft] = useState<Record<string, AdminSetting['value']> | null>(null)

  const settingsQuery = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => settingsApi.getAdminSettings(),
  })

  const saveMutation = useMutation({
    mutationFn: (items: Pick<AdminSetting, 'key' | 'value'>[]) =>
      settingsApi.saveAdminSettings(items),
    onSuccess: (data) => {
      toast.success(t('saved'))
      queryClient.setQueryData(['admin', 'settings'], data)
      /* پیش‌نویس پاک می‌شود تا مقادیر تازه‌ی سرور مبنا شوند */
      setDraft(null)
    },
    onError: () => toast.error(tStates('errorTitle')),
  })

  if (settingsQuery.isLoading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-(--radius-lg) bg-muted" />
        ))}
      </div>
    )
  }

  if (settingsQuery.isError || !settingsQuery.data) {
    return (
      <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
        <AlertCircle className="size-12 text-warning" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-bold text-foreground">{tStates('errorTitle')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{tStates('errorDesc')}</p>
      </div>
    )
  }

  const settings = settingsQuery.data

  /** مقدار جاری یک تنظیم — پیش‌نویس اگر عوض شده، وگرنه مقدار سرور. */
  const valueOf = (setting: AdminSetting): AdminSetting['value'] =>
    draft?.[setting.key] ?? setting.value

  /** ثبت یک تغییر در پیش‌نویس. */
  const change = (key: string, value: AdminSetting['value']) => {
    setDraft((current) => ({ ...(current ?? {}), [key]: value }))
  }

  const isDirty = draft !== null && Object.keys(draft).length > 0

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!saveMutation.isPending) {
          saveMutation.mutate(settings.map((s) => ({ key: s.key, value: valueOf(s) })))
        }
      }}
    >
      <div className="mb-5">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="space-y-5">
        {GROUPS.map(({ key: group, Icon }) => {
          const items = settings.filter((s) => s.group === group)
          if (items.length === 0) return null

          return (
            <section key={group} className="rounded-(--radius-lg) border border-border bg-card">
              <h2 className="flex items-center gap-2 border-b border-border px-4 py-3 font-medium text-foreground">
                <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                {t(`group.${group}`)}
              </h2>

              <div className="grid gap-4 p-4 sm:grid-cols-2">
                {items.map((setting) => (
                  <SettingField
                    key={setting.key}
                    setting={setting}
                    value={valueOf(setting)}
                    onChange={(value) => change(setting.key, value)}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {/* ================= ذخیره ================= */}
      {/*
        ⚠️ پس‌زمینه **مات** است، نه نیمه‌شفاف.

           نسخه‌ی اول `bg-background/95` با blur داشت و فیلدهای زیر نوار
           شبح‌وار از پشتش دیده می‌شدند — روی فرمی که همه‌اش ورودی است،
           نتیجه شلوغی و ناخوانایی بود. شفافیت برای هدر سایت (که روی
           تصویر و متن می‌لغزد) منطقی است، برای این نوار نه.
      */}
      <div className="sticky bottom-0 mt-5 flex items-center gap-3 border-t border-border bg-background py-4 shadow-[0_-4px_12px_-8px_rgb(0_0_0/0.25)]">
        <button
          type="submit"
          disabled={saveMutation.isPending || !isDirty}
          className="inline-flex h-11 items-center gap-2 rounded-(--radius-md) bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saveMutation.isPending
            ? <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            : <Save className="size-4" aria-hidden="true" />}
          {t('save')}
        </button>

        {/*
          نشانگر «تغییر ذخیره‌نشده».

          فرم تنظیمات بلند است و نوار ذخیره چسبان؛ بدون این نشانگر،
          مدیر نمی‌داند چیزی عوض کرده یا نه و برای اطمینان دوباره
          ذخیره می‌زند.
        */}
        {isDirty && (
          <span className="text-xs text-warning">{t('unsaved')}</span>
        )}
      </div>
    </form>
  )
}

/* =========================================================================
 * یک فیلد تنظیم
 * ======================================================================= */

function SettingField({
  setting,
  value,
  onChange,
}: {
  setting: AdminSetting
  value: AdminSetting['value']
  onChange: (value: AdminSetting['value']) => void
}) {
  const t = useTranslations('admin.settings')

  const inputClass =
    'w-full rounded-(--radius-md) border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring'

  /* --- تنظیم دوزبانه: دو ورودی کنار هم --- */
  if (setting.translatable) {
    const pair = typeof value === 'string' ? { fa: value, en: '' } : value

    return (
      <div className={setting.input === 'textarea' ? 'sm:col-span-2' : undefined}>
        <p className="mb-1.5 text-sm font-medium text-foreground">{t(`key.${setting.key}`)}</p>

        <div className="grid gap-2 sm:grid-cols-2">
          {(['fa', 'en'] as const).map((lang) => (
            <div key={lang}>
              <label
                htmlFor={`setting-${setting.key}-${lang}`}
                className="mb-1 block text-xs text-muted-foreground"
              >
                {t(`lang.${lang}`)}
              </label>

              {setting.input === 'textarea' ? (
                <textarea
                  id={`setting-${setting.key}-${lang}`}
                  value={pair[lang]}
                  onChange={(e) => onChange({ ...pair, [lang]: e.target.value })}
                  rows={3}
                  /* متن انگلیسی باید چپ‌به‌راست تایپ شود حتی در پنل فارسی */
                  dir={lang === 'en' ? 'ltr' : 'rtl'}
                  className={cn(inputClass, 'leading-7')}
                />
              ) : (
                <input
                  id={`setting-${setting.key}-${lang}`}
                  type="text"
                  value={pair[lang]}
                  onChange={(e) => onChange({ ...pair, [lang]: e.target.value })}
                  dir={lang === 'en' ? 'ltr' : 'rtl'}
                  className={inputClass}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  /* --- تنظیم تک‌زبانه --- */
  const single = typeof value === 'string' ? value : ''

  return (
    <div className={setting.input === 'textarea' ? 'sm:col-span-2' : undefined}>
      <label
        htmlFor={`setting-${setting.key}`}
        className="mb-1.5 block text-sm font-medium text-foreground"
      >
        {t(`key.${setting.key}`)}
      </label>

      <input
        id={`setting-${setting.key}`}
        /*
          `type` از بک‌اند می‌آید: url و email اعتبارسنجی بومی مرورگر و
          صفحه‌کلید مناسب موبایل را فعال می‌کنند.
        */
        type={setting.input === 'textarea' ? 'text' : setting.input}
        value={single}
        onChange={(e) => onChange(e.target.value)}
        /* آدرس و ایمیل همیشه چپ‌به‌راست */
        dir={setting.input === 'text' ? undefined : 'ltr'}
        placeholder={setting.input === 'url' ? 'https://' : undefined}
        className={inputClass}
      />
    </div>
  )
}
