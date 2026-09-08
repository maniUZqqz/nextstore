'use client'

/**
 * پنل امنیت حساب
 * ---------------------------------------------------------------------------
 * دو بخش مستقل:
 *   ۱. تغییر رمز عبور (با تأیید رمز فعلی)
 *   ۲. فهرست دستگاه‌های واردشده و خروج از آن‌ها
 *
 * ⚠️ پس از تغییر رمز، سرور همه‌ی نشست‌های دیگر را می‌بندد. فهرست
 *    دستگاه‌ها باید بلافاصله تازه شود، وگرنه کاربر دستگاه‌هایی را
 *    می‌بیند که دیگر وجود ندارند و با کلیک روی «خروج» خطای ۴۰۴
 *    می‌گیرد.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import {
  Loader2, KeyRound, Monitor, Smartphone, LogOut, AlertCircle, ShieldCheck,
} from 'lucide-react'
import type { Locale } from '@/i18n/routing'
import * as profileApi from '@/lib/api/profile'
import { ApiError } from '@/lib/api/client'
import { FormField } from '@/components/auth/FormField'
import { formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { PasswordInput } from '@/types/user'

const SESSIONS_QUERY_KEY = ['profile', 'sessions'] as const

export function SecurityPanel() {
  return (
    <div className="space-y-4">
      <PasswordSection />
      <SessionsSection />
    </div>
  )
}

/* =========================================================================
 * بخش ۱ — تغییر رمز عبور
 * ======================================================================= */

function PasswordSection() {
  const t = useTranslations('security')
  const tStates = useTranslations('states')
  const queryClient = useQueryClient()

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const changeMutation = useMutation({
    mutationFn: (input: PasswordInput) => profileApi.updatePassword(input),

    onSuccess: () => {
      toast.success(t('passwordChanged'))

      /* فرم خالی می‌شود — رمز نباید در فیلد بماند */
      setCurrent('')
      setNext('')
      setConfirm('')
      setFieldErrors({})

      /* سرور نشست‌های دیگر را بست؛ فهرست باید تازه شود */
      queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY })
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

    changeMutation.mutate({
      current_password: current,
      password: next,
      password_confirmation: confirm,
    })
  }

  const errorFor = (field: string) => fieldErrors[field]?.[0]

  return (
    <section className="rounded-(--radius-lg) border border-border p-5">
      <div className="mb-4 flex items-start gap-3">
        <KeyRound className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div>
          <h2 className="text-base font-bold text-foreground">{t('passwordTitle')}</h2>
          <p className="mt-0.5 text-xs leading-6 text-muted-foreground">
            {t('passwordDesc')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 sm:max-w-md">
        <FormField
          label={t('currentPassword')}
          name="current_password"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          error={errorFor('current_password')}
          autoComplete="current-password"
        />

        <FormField
          label={t('newPassword')}
          name="password"
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          error={errorFor('password')}
          hint={t('passwordHint')}
          autoComplete="new-password"
        />

        <FormField
          label={t('confirmPassword')}
          name="password_confirmation"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errorFor('password_confirmation')}
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={changeMutation.isPending}
          aria-busy={changeMutation.isPending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-(--radius-md) bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        >
          {changeMutation.isPending
            ? <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            : <ShieldCheck className="size-4" aria-hidden="true" />}
          {changeMutation.isPending ? t('changing') : t('changePassword')}
        </button>
      </form>
    </section>
  )
}

/* =========================================================================
 * بخش ۲ — دستگاه‌های واردشده
 * ======================================================================= */

function SessionsSection() {
  const t = useTranslations('security')
  const tStates = useTranslations('states')
  const locale = useLocale() as Locale
  const queryClient = useQueryClient()

  const sessionsQuery = useQuery({
    queryKey: SESSIONS_QUERY_KEY,
    queryFn: profileApi.getSessions,
    staleTime: 30_000,
  })

  const revokeMutation = useMutation({
    mutationFn: (id: number) => profileApi.revokeSession(id),
    onSuccess: () => {
      toast.success(t('revoked'))
      queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY })
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : tStates('errorTitle'))
    },
  })

  const sessions = sessionsQuery.data ?? []
  /* نشست جاری همیشه اول — کاربر باید بداند کدام خودش است */
  const sorted = [...sessions].sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent))

  return (
    <section className="rounded-(--radius-lg) border border-border p-5">
      <div className="mb-4 flex items-start gap-3">
        <Monitor className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0">
          <h2 className="text-base font-bold text-foreground">{t('sessionsTitle')}</h2>
          <p className="mt-0.5 text-xs leading-6 text-muted-foreground">
            {t('sessionsDesc')}
          </p>
        </div>

        {sessions.length > 0 && (
          <span className="ms-auto shrink-0 text-xs text-muted-foreground">
            {t('sessionsCount', { count: sessions.length })}
          </span>
        )}
      </div>

      {sessionsQuery.isLoading ? (
        <ul className="space-y-2">
          {[0, 1].map((i) => (
            <li key={i} className="h-16 animate-pulse rounded-(--radius-md) bg-muted" />
          ))}
        </ul>
      ) : sessionsQuery.isError ? (
        <div className="flex flex-col items-center py-8 text-center">
          <AlertCircle className="size-8 text-warning" aria-hidden="true" />
          <p className="mt-2 text-sm text-muted-foreground">{tStates('errorDesc')}</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {sorted.map((session) => {
            const isBusy = revokeMutation.isPending && revokeMutation.variables === session.id

            return (
              <li
                key={session.id}
                className={cn(
                  'flex flex-wrap items-center gap-3 py-3 transition-opacity',
                  isBusy && 'opacity-50',
                )}
              >
                {/*
                  آیکون بر اساس نام دستگاه.
                  نام را خودِ کاربر هنگام ورود تعیین نمی‌کند؛ بک‌اند
                  آن را از هدر مرورگر می‌سازد، پس تشخیص تقریبی است.
                */}
                {/mobile|android|iphone/i.test(session.name)
                  ? <Smartphone className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  : <Monitor className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}

                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                    <span className="truncate">{session.name}</span>

                    {session.isCurrent && (
                      <span className="inline-flex shrink-0 rounded-(--radius-sm) bg-success/10 px-1.5 py-0.5 text-[11px] font-medium text-success">
                        {t('sessionCurrent')}
                      </span>
                    )}
                  </p>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {session.lastUsedAt
                      ? t('sessionLastUsed', { date: formatDate(session.lastUsedAt, locale) })
                      : t('sessionNever')}
                  </p>
                </div>

                {/*
                  نشست جاری دکمه‌ی خروج ندارد.
                  سرور هم آن را رد می‌کند، ولی نشان دادن دکمه‌ای که
                  همیشه خطا می‌دهد فقط کاربر را سردرگم می‌کند.
                */}
                {!session.isCurrent && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(t('revokeConfirm'))) revokeMutation.mutate(session.id)
                    }}
                    disabled={isBusy}
                    className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-(--radius-md) px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    {isBusy
                      ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                      : <LogOut className="size-3.5" aria-hidden="true" />}
                    {t('revoke')}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
