'use client'

/**
 * فرم درخواست بازیابی رمز عبور
 * ---------------------------------------------------------------------------
 * ⚠️ صفحه‌ی ورود از روز اول به «/forgot-password» لینک می‌داد و صفحه‌ی
 *    سؤالات متداول هم به مشتری می‌گفت از آن استفاده کند — ولی نه
 *    صفحه‌ای بود و نه مسیری. کاربری که رمزش را فراموش می‌کرد به ۴۰۴
 *    می‌رسید و حسابش عملاً از دست می‌رفت.
 *
 * ⚠️ پس از ارسال، فرم جایش را به یک پیام می‌دهد و **دوباره نشان داده
 *    نمی‌شود**.
 *
 *    اگر فرم بماند، کاربری که ایمیل را فوری نمی‌بیند دکمه را چند بار
 *    می‌زند و به سقف نرخ می‌خورد — بعد هم فکر می‌کند سامانه خراب است.
 */

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import { Loader2, Send, MailCheck, AlertCircle } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { forgotPassword } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { FormField } from '@/components/auth/FormField'

export function ForgotPasswordForm() {
  const t = useTranslations('auth.forgot')
  const tFields = useTranslations('auth.fields')
  const locale = useLocale()

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const mutation = useMutation({
    mutationFn: () => forgotPassword(email.trim(), locale),

    onSuccess: (response) => {
      setFieldErrors({})
      setSent(true)
      toast.success(response.message)
    },

    onError: (error) => {
      if (error instanceof ApiError) {
        if (error.isValidation && error.fieldErrors) {
          setFieldErrors(error.fieldErrors)
          return
        }

        /*
         * ⚠️ ۴۲۹ پیام مخصوص خودش دارد.
         *
         *    این مسیر زیر سقف سخت‌گیرانه‌ی احراز هویت است (۵ در دقیقه).
         *    بدون پیام جدا، کاربری که دو بار زده فکر می‌کند ایمیلش
         *    اشتباه است و آن را بارها بازنویسی می‌کند.
         */
        if (error.status === 429) {
          toast.error(t('tooMany'))
          return
        }
      }

      toast.error(t('failed'))
    },
  })

  if (sent) {
    return (
      <div className="text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
          <MailCheck className="size-7" aria-hidden="true" />
        </span>

        <h2 className="mt-4 text-base font-bold text-foreground">{t('sentTitle')}</h2>

        {/*
          ⚠️ نشانی وارد شده تکرار می‌شود.
             کسی که ایمیل نمی‌گیرد باید بتواند ببیند چه چیزی تایپ
             کرده — بیشتر وقت‌ها همان‌جا غلط تایپی پیداست.
        */}
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          {t('sentBody')}
        </p>
        <p dir="ltr" className="mt-1 text-sm font-medium text-foreground">
          {email.trim()}
        </p>

        <p className="mt-4 flex items-start gap-2 rounded-(--radius-md) border border-info/30 bg-info/10 px-3.5 py-3 text-start text-xs leading-6 text-foreground">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
          {t('spamHint')}
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-(--radius-md) bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {t('backToLogin')}
          </Link>

          {/*
            راه برگشت برای کسی که ایمیل را اشتباه نوشته.
            بدون آن باید صفحه را رفرش کند تا فرم دوباره بیاید.
          */}
          <button
            type="button"
            onClick={() => setSent(false)}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('tryAnother')}
          </button>
        </div>
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
      <FormField
        label={tFields('email')}
        name="email"
        id="email"
        type="email"
        required
        dir="ltr"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={fieldErrors.email?.[0]}
      />

      <button
        type="submit"
        disabled={mutation.isPending}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-(--radius-md) bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {mutation.isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="size-4" aria-hidden="true" />
        )}
        {t('submit')}
      </button>
    </form>
  )
}
