'use client'

/**
 * پنل نتیجه‌ی تأیید ایمیل
 * ---------------------------------------------------------------------------
 * ⚠️ تأیید **یک بار** انجام می‌شود، نه در هر رندر.
 *
 *    `useMutation` به‌جای `useQuery` عمدی است: این یک عملیات است نه
 *    خواندن داده. با `useQuery`، هر بار که تب فوکوس می‌گرفت درخواست
 *    دوباره می‌رفت — و کاربر برای چند لحظه دوباره «در حال بررسی» را
 *    می‌دید.
 *
 * ⚠️ پیام از **سرور** می‌آید نه از فایل ترجمه.
 *
 *    بک‌اند بین «تأیید شد» و «از قبل تأیید شده بود» فرق می‌گذارد و
 *    این تفاوت برای کاربر معنادار است. متن ثابت فرانت هر دو را یکی
 *    نشان می‌داد.
 */

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { verifyEmail } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'

export function VerifyEmailPanel() {
  const t = useTranslations('auth.verifyEmail')
  const locale = useLocale()

  const params = useSearchParams()
  const path = params.get('path')

  const mutation = useMutation({
    mutationFn: (signedPath: string) => verifyEmail(signedPath, locale),
  })

  /*
   * ⚠️ نگهبان `useRef` لازم است.
   *
   *    در حالت توسعه، ری‌اکت هر افکت را دوبار اجرا می‌کند. بدون این،
   *    دو درخواست می‌رفت و دومی — چون اولی کار را تمام کرده — پیام
   *    «از قبل تأیید شده» می‌گرفت، که برای کاربری که تازه کلیک کرده
   *    گیج‌کننده است.
   */
  const started = useRef(false)

  useEffect(() => {
    if (started.current || path === null) return
    started.current = true
    mutation.mutate(path)
  }, [path, mutation])

  /* پیوند ناقص — کاربر نشانی را دستی کوتاه کرده یا ایمیل بریده شده */
  if (path === null) {
    return <Result kind="error" text={t('missingLink')} />
  }

  if (mutation.isPending || mutation.isIdle) {
    return (
      <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        {t('checking')}
      </p>
    )
  }

  if (mutation.isError) {
    const message =
      mutation.error instanceof ApiError ? mutation.error.message : t('failed')

    return <Result kind="error" text={message} />
  }

  return <Result kind="success" text={mutation.data.message} />
}

/** نتیجه‌ی نهایی — همیشه با یک راه ادامه، نه بن‌بست. */
function Result({ kind, text }: { kind: 'success' | 'error'; text: string }) {
  const t = useTranslations('auth.verifyEmail')

  const Icon = kind === 'success' ? CheckCircle2 : XCircle

  return (
    <div className="mt-6" role="status" aria-live="polite">
      <Icon
        className={`mx-auto size-10 ${kind === 'success' ? 'text-success' : 'text-destructive'}`}
        aria-hidden="true"
      />

      <p className="mt-3 text-sm leading-7 text-foreground">{text}</p>

      {/*
        ⚠️ هر دو حالت یک راه ادامه دارند.

           صفحه‌ای که فقط می‌گوید «پیوند نامعتبر است» بن‌بست است؛
           کاربر باید بداند از کجا پیوند تازه بگیرد.
      */}
      <Link
        href={kind === 'success' ? '/account' : '/account/profile'}
        className="mt-6 inline-flex h-10 items-center rounded-(--radius-md) bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        {t(kind === 'success' ? 'goToAccount' : 'goToProfile')}
      </Link>
    </div>
  )
}
