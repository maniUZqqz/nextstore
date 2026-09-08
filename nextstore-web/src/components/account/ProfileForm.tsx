'use client'

/**
 * فرم ویرایش اطلاعات حساب
 * ---------------------------------------------------------------------------
 * پوشش حالت‌ها: loading · error · success
 *
 * ⚠️ مثل فرم مقاله در پنل مدیریت، مقدار اولیه از prop می‌آید و
 *    کامپوننت با `key` از نو ساخته می‌شود — نه با useEffect.
 *    اگر داده دوباره برسد (refetch پس از بازگشت به تب مرورگر)،
 *    نوشته‌های ذخیره‌نشده‌ی کاربر بازنویسی نمی‌شوند.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import { Loader2, Save, AlertCircle, BadgeCheck, CircleAlert } from 'lucide-react'
import type { Locale } from '@/i18n/routing'
import * as profileApi from '@/lib/api/profile'
import { ApiError } from '@/lib/api/client'
import { AUTH_QUERY_KEY } from '@/hooks/useAuth'
import { FormField } from '@/components/auth/FormField'
import { formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { ProfileInput, User } from '@/types/user'

/** کلید کش پروفایل — جدا از AUTH_QUERY_KEY چون فیلدهای بیشتری دارد. */
export const PROFILE_QUERY_KEY = ['profile'] as const

export function ProfileForm() {
  /* پوسته فقط حالت‌های بارگذاری و خطا را نشان می‌دهد — متن فرم در ProfileFields است */
  const tStates = useTranslations('states')

  const profileQuery = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: profileApi.getProfile,
    staleTime: 60_000,
  })

  if (profileQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-(--radius-lg) bg-muted" />
        <div className="h-80 animate-pulse rounded-(--radius-lg) bg-muted" />
      </div>
    )
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
        <AlertCircle className="size-12 text-warning" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-bold text-foreground">{tStates('errorTitle')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{tStates('errorDesc')}</p>
      </div>
    )
  }

  return <ProfileFields key={profileQuery.data.id} user={profileQuery.data} />
}

/* =========================================================================
 * خودِ فرم — مقدار اولیه از prop
 * ======================================================================= */

function ProfileFields({ user }: { user: User }) {
  const t = useTranslations('profile')
  const tStates = useTranslations('states')
  const locale = useLocale() as Locale
  const queryClient = useQueryClient()

  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email ?? '')
  const [phone, setPhone] = useState(user.phone ?? '')
  const [birthDate, setBirthDate] = useState(user.birthDate ?? '')

  /** خطاهای اعتبارسنجی سرور، به تفکیک فیلد. */
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const saveMutation = useMutation({
    mutationFn: (input: ProfileInput) => profileApi.updateProfile(input),

    onSuccess: (updated) => {
      toast.success(t('saved'))
      setFieldErrors({})

      /*
       * هر دو کش به‌روز می‌شوند: پروفایل و کاربرِ هدر.
       * بدون به‌روزرسانی AUTH_QUERY_KEY، نام در منوی کاربر تا
       * رفرش بعدی همان مقدار قدیمی می‌ماند.
       */
      queryClient.setQueryData(PROFILE_QUERY_KEY, updated)
      queryClient.setQueryData(AUTH_QUERY_KEY, updated)
    },

    onError: (error) => {
      if (error instanceof ApiError && error.isValidation && error.fieldErrors) {
        setFieldErrors(error.fieldErrors)
        toast.error(error.message)
        return
      }
      toast.error(tStates('errorTitle'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    saveMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      /* رشته‌ی خالی به null تبدیل می‌شود تا بک‌اند فیلد را پاک کند */
      phone: phone.trim() || null,
      birth_date: birthDate || null,
    })
  }

  const errorFor = (field: string) => fieldErrors[field]?.[0]

  return (
    <div className="space-y-4">
      {/* ================= کارت خلاصه ================= */}
      <div className="flex flex-wrap items-center gap-4 rounded-(--radius-lg) border border-border bg-card p-5">
        {/* آواتار — حرف اول نام */}
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-black text-primary-foreground">
          {user.name.charAt(0)}
        </span>

        <div className="min-w-0">
          <p className="truncate text-base font-bold text-foreground">{user.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t('roleLabel')}: {user.roleLabel}
          </p>
          {user.createdAt && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t('memberSince', { date: formatDate(user.createdAt, locale) })}
            </p>
          )}
        </div>
      </div>

      {/* ================= فرم ================= */}
      <form onSubmit={handleSubmit} className="rounded-(--radius-lg) border border-border p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField
              label={t('name')}
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errorFor('name')}
              autoComplete="name"
              maxLength={120}
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <VerifiedBadge verified={user.emailVerified} />
            </div>
            <FormField
              label={t('email')}
              name="email"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errorFor('email')}
              autoComplete="email"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <VerifiedBadge verified={user.phoneVerified} />
            </div>
            <FormField
              label={t('phone')}
              name="phone"
              type="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={errorFor('phone')}
              placeholder={t('phonePlaceholder')}
              autoComplete="tel"
            />
          </div>

          <div className="sm:col-span-2">
            <FormField
              label={t('birthDate')}
              name="birth_date"
              type="date"
              dir="ltr"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              error={errorFor('birth_date')}
            />
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">{t('verifyHint')}</p>

        <button
          type="submit"
          disabled={saveMutation.isPending}
          aria-busy={saveMutation.isPending}
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-(--radius-md) bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        >
          {saveMutation.isPending
            ? <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            : <Save className="size-4" aria-hidden="true" />}
          {saveMutation.isPending ? t('saving') : t('save')}
        </button>
      </form>
    </div>
  )
}

/**
 * نشان تأیید کنار ایمیل و موبایل.
 *
 * ⚠️ بیرون از کامپوننت والد تعریف شده، نه داخلش.
 *    تعریف داخلی یعنی ری‌اکت در هر رندر یک *نوع کامپوننت جدید*
 *    می‌بیند و کل زیردرخت را دور می‌ریزد و از نو می‌سازد — که هم
 *    کند است و هم وضعیت داخلی را از بین می‌برد.
 */
function VerifiedBadge({ verified }: { verified: boolean }) {
  const t = useTranslations('profile')

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-(--radius-sm) px-1.5 py-0.5 text-[11px] font-medium',
        verified ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground',
      )}
    >
      {verified
        ? <BadgeCheck className="size-3" aria-hidden="true" />
        : <CircleAlert className="size-3" aria-hidden="true" />}
      {t(verified ? 'verified' : 'unverified')}
    </span>
  )
}
