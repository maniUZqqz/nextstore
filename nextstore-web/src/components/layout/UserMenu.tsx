'use client'

/**
 * منوی کاربر در هدر
 * ---------------------------------------------------------------------------
 * دو حالت:
 *   مهمان         → آیکون کاربر که به صفحه ورود می‌برد
 *   واردشده       → آواتار با حرف اول نام + منوی کشویی
 *
 * ⚠️ چالش hydration:
 *    وضعیت ورود از توکن در localStorage می‌آید و سرور آن را نمی‌داند.
 *    تا قبل از دریافت پاسخ /me، آیکون خنثی نمایش داده می‌شود تا
 *    خروجی سرور و کلاینت یکسان بماند.
 */

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  User as UserIcon, LogOut, Package, MapPin, Heart, Shield, ChevronDown,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils/cn'

export function UserMenu() {
  const t = useTranslations('nav')
  const tAccount = useTranslations('account')

  const { user, isLoading, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  /* بستن منو با کلیک بیرون از آن */
  useEffect(() => {
    if (!isOpen) return

    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [isOpen])

  /* بستن منو با کلید Escape */
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen])

  /* --- حالت بارگذاری یا مهمان: لینک ساده به صفحه ورود --- */
  if (isLoading || !user) {
    return (
      <Link
        href="/login"
        aria-label={t('account')}
        className="inline-flex size-10 items-center justify-center rounded-(--radius-md) text-foreground transition-colors hover:bg-accent"
      >
        <UserIcon className="size-5" aria-hidden="true" />
      </Link>
    )
  }

  /** آیتم‌های منوی کشویی. */
  const menuItems = [
    { href: '/account', label: tAccount('dashboard'), Icon: UserIcon },
    { href: '/account/orders', label: tAccount('orders'), Icon: Package },
    { href: '/account/addresses', label: tAccount('addresses'), Icon: MapPin },
    { href: '/account/wishlist', label: tAccount('wishlist'), Icon: Heart },
  ]

  return (
    <div ref={containerRef} className="relative">
      {/* --- دکمه آواتار --- */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={t('account')}
        className={cn(
          'inline-flex h-10 items-center gap-1.5 rounded-(--radius-md) px-1.5',
          'transition-colors hover:bg-accent',
          isOpen && 'bg-accent',
        )}
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {user.name.charAt(0)}
        </span>

        {/* نام فقط در دسکتاپ — در موبایل فضا کم است */}
        <span className="hidden max-w-24 truncate text-sm font-medium text-foreground lg:block">
          {user.name}
        </span>

        <ChevronDown
          className={cn(
            'hidden size-4 text-muted-foreground transition-transform duration-[var(--duration-fast)] lg:block',
            isOpen && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      {/* --- منوی کشویی --- */}
      {isOpen && (
        <div
          role="menu"
          className="absolute end-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-(--radius-lg) border border-border bg-popover shadow-[var(--shadow-lg)]"
        >
          {/* اطلاعات کاربر */}
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-medium text-popover-foreground">
              {user.name}
            </p>
            <p className="truncate text-xs text-muted-foreground" dir="ltr">
              {user.email}
            </p>
          </div>

          {/* لینک پنل ادمین — فقط برای مدیران */}
          {user.isAdmin && (
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 border-b border-border px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-accent"
            >
              <Shield className="size-4" aria-hidden="true" />
              {user.roleLabel}
            </Link>
          )}

          {/* آیتم‌های منو */}
          <ul className="py-1">
            {menuItems.map(({ href, label, Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-popover-foreground transition-colors hover:bg-accent"
                >
                  <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* خروج */}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false)
              logout()
            }}
            className="flex w-full items-center gap-2.5 border-t border-border px-4 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="rtl-flip size-4" aria-hidden="true" />
            {t('logout')}
          </button>
        </div>
      )}
    </div>
  )
}
