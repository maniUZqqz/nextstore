'use client'

/**
 * فرم بازنشانی رمز عبور با توکن
 * ---------------------------------------------------------------------------
 * توکن و ایمیل از پارامترهای نشانی می‌آیند — همان‌هایی که در پیوند
 * ایمیل نشسته‌اند.
 *
 * ⚠️ پیش از هر چیز بررسی می‌شود که هر دو پارامتر باشند.
 *
 *    کاربری که نشانی را دستی تایپ کرده یا پیوند در برنامه‌ی ایمیلش
 *    بریده شده، باید همان لحظه بفهمد — نه بعد از پر کردن دو فیلد رمز
 *    و دیدن خطای «توکن نامعتبر».
 *
 * ⚠️ ایمیل نمایش داده می‌شود ولی **قابل ویرایش نیست**: بخشی از پیوند
 *    امضاشده است و عوض کردنش فقط توکن را بی‌اعتبار می‌کند.
 */

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, KeyRound, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { Link, useRouter } from '@/i18n/navigation'
import { resetPassword, clearToken } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { FormField } from '@/components/auth/FormField'

export function ResetPasswordForm() {
  const t = useTranslations('auth.reset')
  const tFields = useTranslations('auth.fields')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''

  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [done, setDone] = useState(false)

  const mutation = useMutation({
    mutationFn: () =>
      resetPassword(
        {
          token,
          email,
          password,
          password_confirmation: confirmation,
        },
        locale,
      ),

    onSuccess: (response) => {
      setFieldErrors({})
      setDone(true)
      toast.success(response.message)

      /*
       * ⚠️ توکن محلی هم باید دور انداخته شود.
       *
       *    بک‌اند هنگام بازنشانی **همه‌ی** توکن‌های Sanctum کاربر را
       *    پاک می‌کند (تا اگر کسی به حساب دسترسی داشته، بیرون بیفتد).
       *    اگر مرورگر توکن قدیمی را نگه دارد، برنامه فکر می‌کند کاربر
       *    وارد است و هر درخواست بعدی ۴۰۱ می‌گیرد — حالتی که از دید
       *    کاربر شبیه «سایت خراب شده» است، نه «دوباره وارد شو».
       */
      clearToken()
      queryClient.clear()

      /*
       * ⚠️ هدایت با تأخیر، نه فوری.
       *
       *    پرش بی‌درنگ به صفحه‌ی ورود، پیام موفقیت را قبل از خوانده
       *    شدن می‌برد و کاربر نمی‌داند رمزش عوض شد یا نه — بعد هم
       *    رمز قدیمی را امتحان می‌کند.
       */
      setTimeout(() => router.push('/login'), 2500)
    },

    onError: (error) => {
      if (error instanceof ApiError) {
        if (error.isValidation && error.fieldErrors) {
          setFieldErrors(error.fieldErrors)
          toast.error(error.message)
          return
        }

        if (error.status === 429) {
          toast.error(t('tooMany'))
          return
        }
      }

      toast.error(t('failed'))
    },
  })

  /* --- پیوند ناقص --- */
  if (!token || !email) {
    return (
      <div className="text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="size-7" aria-hidden="true" />
        </span>

        <h2 className="mt-4 text-base font-bold text-foreground">{t('invalidTitle')}</h2>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">{t('invalidBody')}</p>

        <Link
          href="/forgot-password"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-(--radius-md) bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t('requestAgain')}
        </Link>
      </div>
    )
  }

  /* --- انجام شد --- */
  if (done) {
    return (
      <div className="text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </span>

        <h2 className="mt-4 text-base font-bold text-foreground">{t('doneTitle')}</h2>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">{t('doneBody')}</p>

        <Link
          href="/login"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-(--radius-md) bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t('goToLogin')}
        </Link>
      </div>
    )
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        mutation.mutate()
      }}
      method="post"
      className="flex flex-col gap-4"
    >
      {/* حسابی که رمزش عوض می‌شود — خواندنی، نه ویرایش‌شدنی */}
      <div>
        <p className="text-sm font-medium text-foreground">{tFields('email')}</p>
        <p
          dir="ltr"
          className="mt-1.5 rounded-(--radius-md) border border-border bg-muted px-3 py-2.5 text-start text-sm text-muted-foreground"
        >
          {email}
        </p>
      </div>

      <FormField
        label={t('newPassword')}
        name="password"
        id="password"
        type="password"
        required
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={fieldErrors.password?.[0]}
        hint={t('passwordHint')}
      />

      <FormField
        label={t('confirmPassword')}
        name="password_confirmation"
        id="password_confirmation"
        type="password"
        required
        autoComplete="new-password"
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
      />

      {/*
        خطای توکن جای فیلد ندارد، پس بالای دکمه می‌نشیند.
        بدون این، پیام فقط در toast می‌آمد و با بستنش ناپدید می‌شد.
      */}
      {fieldErrors.token?.[0] && (
        <p className="flex items-start gap-2 rounded-(--radius-md) border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-xs leading-6 text-destructive">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {fieldErrors.token[0]}
        </p>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-(--radius-md) bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {mutation.isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <KeyRound className="size-4" aria-hidden="true" />
        )}
        {t('submit')}
      </button>
    </form>
  )
}
