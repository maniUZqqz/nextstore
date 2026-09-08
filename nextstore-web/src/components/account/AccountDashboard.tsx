'use client'

/**
 * داشبورد پنل کاربری
 * ---------------------------------------------------------------------------
 * نمای کلی حساب کاربر: خوش‌آمدگویی، آمار و میان‌بر به بخش‌های مختلف.
 *
 * پوشش حالت‌ها:
 *   loading → اسکلتون (چون اطلاعات کاربر با درخواست شبکه می‌آید)
 *   guest   → پیام و دکمه ورود (اگر توکن منقضی شده باشد)
 *   success → داشبورد کامل
 */

import { useTranslations, useLocale } from 'next-intl'
import {
  Package, MapPin, Heart, MessageSquare, User as UserIcon, Shield,
  LogOut, LayoutDashboard, ChevronLeft, Loader2, LifeBuoy,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { useAuth } from '@/hooks/useAuth'
import { useWishlist } from '@/hooks/useWishlist'
import { formatNumber, formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

export function AccountDashboard() {
  const t = useTranslations('account')
  const tAuth = useTranslations('auth')
  const locale = useLocale() as Locale

  const { user, isLoading, logout, isLoggingOut } = useAuth()
  /* شمارنده از هوک — برای کاربر واردشده از سرور خوانده می‌شود */
  const { count: wishlistCount } = useWishlist()

  /* --- حالت بارگذاری --- */
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-(--radius-lg) border border-border bg-muted" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-(--radius-lg) border border-border bg-muted" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-(--radius-lg) border border-border bg-muted" />
      </div>
    )
  }

  /* --- حالت مهمان: توکن منقضی شده یا نامعتبر است --- */
  if (!user) {
    return (
      <div className="flex flex-col items-center rounded-(--radius-lg) border border-border bg-card py-16 text-center">
        <UserIcon className="size-12 text-muted-foreground" aria-hidden="true" />
        <p className="mt-4 text-sm text-muted-foreground">
          {tAuth('login.subtitle')}
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex h-11 items-center rounded-(--radius-md) bg-primary px-6 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          {tAuth('login.submit')}
        </Link>
      </div>
    )
  }

  /** آمار خلاصه حساب. */
  const stats = [
    { key: 'orders', value: 0, Icon: Package },
    { key: 'wishlist', value: wishlistCount, Icon: Heart },
    { key: 'addresses', value: 0, Icon: MapPin },
  ] as const

  /**
   * بخش‌های پنل کاربری.
   *
   * ⚠️ فقط بخش‌هایی که صفحه‌شان ساخته شده اینجا هستند.
   *    لینکی که به ۴۰۴ می‌رسد از نبودِ لینک بدتر است: کاربر فکر
   *    می‌کند قابلیت خراب است، نه اینکه هنوز ساخته نشده.
   */
  const sections = [
    { href: '/account/orders', label: t('orders'), Icon: Package },
    { href: '/account/addresses', label: t('addresses'), Icon: MapPin },
    { href: '/account/wishlist', label: t('wishlist'), Icon: Heart },
    { href: '/account/reviews', label: t('reviewsTitle'), Icon: MessageSquare },
    { href: '/account/tickets', label: t('tickets'), Icon: LifeBuoy },
    { href: '/account/profile', label: t('profile'), Icon: UserIcon },
    { href: '/account/security', label: t('security'), Icon: Shield },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* ==========================================================
          کارت خوش‌آمدگویی
          ========================================================== */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-(--radius-lg) border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          {/* آواتار — حرف اول نام */}
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-black text-primary-foreground">
            {user.name.charAt(0)}
          </span>

          <div className="min-w-0">
            <h1 className="text-lg font-bold text-foreground">
              {t('welcome', { name: user.name })}
            </h1>
            <p className="mt-0.5 truncate text-sm text-muted-foreground" dir="ltr">
              {user.email}
            </p>

            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {/* برچسب نقش */}
              <span
                className={cn(
                  'rounded-(--radius-sm) px-2 py-0.5 text-[11px] font-medium',
                  user.isAdmin
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent text-accent-foreground',
                )}
              >
                {user.roleLabel}
              </span>

              {user.createdAt && (
                <span className="text-[11px] text-muted-foreground">
                  {t('memberSince')} {formatDate(user.createdAt, locale)}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => logout()}
          disabled={isLoggingOut}
          className="inline-flex h-10 items-center gap-2 rounded-(--radius-md) border border-border px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
        >
          {isLoggingOut ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <LogOut className="rtl-flip size-4" aria-hidden="true" />
          )}
          {t('logout')}
        </button>
      </section>

      {/* ==========================================================
          آمار خلاصه
          ========================================================== */}
      <ul className="grid grid-cols-3 gap-3">
        {stats.map(({ key, value, Icon }) => (
          <li
            key={key}
            className="flex flex-col items-center gap-1.5 rounded-(--radius-lg) border border-border bg-card p-4 text-center"
          >
            <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
            <span className="text-xl font-black text-foreground tabular-nums">
              {formatNumber(value, locale)}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {t(`stats.${key}`)}
            </span>
          </li>
        ))}
      </ul>

      {/* ==========================================================
          میان‌بر بخش‌های پنل
          ========================================================== */}
      <section className="rounded-(--radius-lg) border border-border bg-card">
        <h2 className="border-b border-border px-5 py-3.5 text-sm font-bold text-foreground">
          <span className="flex items-center gap-2">
            <LayoutDashboard className="size-4" aria-hidden="true" />
            {t('dashboard')}
          </span>
        </h2>

        <ul className="divide-y divide-border">
          {sections.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-3 px-5 py-4 text-sm transition-colors hover:bg-accent"
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="flex-1 font-medium text-foreground">{label}</span>
                {/* فلش در RTL خودکار آینه می‌شود */}
                <ChevronLeft className="rtl-flip size-4 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* دسترسی به پنل ادمین — فقط برای مدیران */}
      {user.isAdmin && (
        <Link
          href="/admin"
          className="flex items-center justify-between rounded-(--radius-lg) border border-primary bg-primary/5 p-4 transition-colors hover:bg-primary/10"
        >
          <span className="flex items-center gap-2.5 text-sm font-bold text-primary">
            <Shield className="size-4" aria-hidden="true" />
            {locale === 'fa' ? 'ورود به پنل مدیریت' : 'Go to admin panel'}
          </span>
          <ChevronLeft className="rtl-flip size-4 text-primary" aria-hidden="true" />
        </Link>
      )}

      <p className="text-center text-xs text-muted-foreground">
        {t('comingSoon')}
      </p>
    </div>
  )
}
