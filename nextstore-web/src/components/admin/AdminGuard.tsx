'use client'

/**
 * محافظ پنل مدیریت
 * ---------------------------------------------------------------------------
 * ⚠️ این لایه فقط برای *تجربه‌ی کاربری* است، نه امنیت.
 *
 *    امنیت واقعی در بک‌اند با میدل‌ور EnsureIsAdmin اعمال می‌شود:
 *    حتی اگر کسی این کامپوننت را دور بزند، هر درخواست API
 *    پاسخ ۴۰۳ می‌گیرد و هیچ داده‌ای بیرون نمی‌رود.
 *
 *    کار این کامپوننت این است که کاربر بی‌دسترسی، صفحه‌ی خالی
 *    پر از خطا نبیند و پیام روشنی بگیرد.
 */

import { useTranslations } from 'next-intl'
import { ShieldAlert, Loader2 } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useAuth } from '@/hooks/useAuth'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const t = useTranslations('admin')
  const tAuth = useTranslations('auth')

  const { user, isLoading } = useAuth()

  /* --- در حال بررسی توکن --- */
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    )
  }

  /* --- بدون دسترسی --- */
  if (!user?.isAdmin) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center rounded-(--radius-lg) border border-border bg-card px-6 py-16 text-center">
        <ShieldAlert className="size-14 text-destructive" aria-hidden="true" />

        <h1 className="mt-4 text-lg font-bold text-foreground">
          {t('accessDenied')}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t('accessDeniedDesc')}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-(--radius-md) bg-primary px-6 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {t('backToShop')}
          </Link>

          {!user && (
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-(--radius-md) border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              {tAuth('login.submit')}
            </Link>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
