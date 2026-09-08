'use client'

/**
 * منوی کشویی موبایل
 * ---------------------------------------------------------------------------
 * با دکمه همبرگری باز می‌شود و از کنار صفحه می‌آید.
 *
 * ⚠️ باگی که در بازبینی چشمی پیدا و رفع شد:
 *    کشو مستقیم داخل <header> رندر می‌شد. چون هدر `backdrop-blur`
 *    دارد و این ویژگی یک containing block می‌سازد، کشوی `fixed`
 *    داخل کادر ۶۴ پیکسلی هدر حبس می‌شد — نه تمام‌قد می‌شد و نه
 *    پس‌زمینه‌اش کل صفحه را می‌پوشاند.
 *    حالا با <Portal> مستقیم به <body> منتقل می‌شود.
 *
 * جزئیات دیگر:
 *   - جهت ورود با زبان هماهنگ است: فارسی از راست، انگلیسی از چپ
 *   - هنگام باز بودن، اسکرول صفحه قفل می‌شود
 *   - با Escape و کلیک روی پس‌زمینه بسته می‌شود
 *   - دسته‌ها آکاردئونی باز می‌شوند تا لیست طولانی نشود
 */

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import {
  Menu, X, ChevronDown, Flame, TrendingUp, Sparkles, User, ChevronLeft,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Category } from '@/types/product'
import { Portal } from '@/components/common/Portal'
import { LocaleSwitcher } from './LocaleSwitcher'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/lib/utils/cn'

export function MobileNav({ categories }: { categories: Category[] }) {
  const t = useTranslations('nav')
  const locale = useLocale()

  const [isOpen, setIsOpen] = useState(false)
  /** دسته‌ای که آکاردئونش باز است */
  const [expandedId, setExpandedId] = useState<number | null>(null)

  /* قفل کردن اسکرول بدنه هنگام باز بودن کشو */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  /* بستن با کلید Escape */
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false)
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

  /** کشو در فارسی از راست می‌آید و در انگلیسی از چپ. */
  const isRtl = locale === 'fa'

  /** میان‌برهای بالای منو. */
  const shortcuts = [
    { href: '/products?on_sale=1', label: t('amazingOffers'), Icon: Flame, accent: true },
    { href: '/products?sort=popular', label: t('bestSellers'), Icon: TrendingUp },
    { href: '/products?sort=newest', label: t('newest'), Icon: Sparkles },
  ]

  return (
    <>
      {/* --- دکمه همبرگری — فقط زیر بریک‌پوینت lg --- */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={t('openMenu')}
        aria-expanded={isOpen}
        className="inline-flex size-10 items-center justify-center rounded-(--radius-md) text-foreground transition-colors hover:bg-accent lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      {/*
        کشو و پس‌زمینه از طریق Portal به <body> منتقل می‌شوند تا از
        containing block هدر خارج بمانند.
      */}
      <Portal>
        {/* --- پس‌زمینه تیره --- */}
        <div
          className={cn(
            'fixed inset-0 z-[60] bg-black/60 lg:hidden',
            'transition-opacity duration-[var(--duration-base)]',
            isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />

        {/* --- کشوی منو --- */}
        <div
          className={cn(
            'fixed inset-y-0 z-[70] flex w-[86%] max-w-sm flex-col',
            'bg-background shadow-[var(--shadow-lg)] lg:hidden',
            'transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out)]',
            isRtl ? 'right-0' : 'left-0',
            /* وقتی بسته است، بیرون از صفحه پارک می‌شود */
            isOpen ? 'translate-x-0' : isRtl ? 'translate-x-full' : '-translate-x-full',
          )}
          role="dialog"
          aria-modal="true"
          aria-label={t('menu')}
          /*
            عنصر پنهان نباید با Tab قابل رسیدن باشد.
            React 19 ویژگی inert را به‌صورت بولین پشتیبانی می‌کند —
            پاس دادن رشته‌ی خالی هشدار «empty string for a boolean
            attribute» تولید می‌کرد و عملاً غیرفعال می‌ماند.
          */
          inert={!isOpen}
        >
          {/* ==========================================================
              سرصفحه کشو — لوگو با همان نشان هدر
              ========================================================== */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2"
            >
              {/*
                نشان لوگو.
                ⚠️ قبلاً فقط متن «NextStore» بود و نشان «N» نداشت، پس
                   برندینگ بین هدر و منو ناهماهنگ به نظر می‌رسید.
              */}
              <span className="flex size-8 items-center justify-center rounded-(--radius-md) bg-primary text-base font-black text-primary-foreground">
                N
              </span>
              <span className="text-base font-bold text-foreground">NextStore</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label={t('closeMenu')}
              className="inline-flex size-9 items-center justify-center rounded-(--radius-md) text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          {/* ==========================================================
              بدنه اسکرول‌شونده
              ========================================================== */}
          <nav className="flex-1 overflow-y-auto overscroll-contain p-4">
            {/* --- ورود / ثبت‌نام --- */}
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="mb-5 flex items-center gap-3 rounded-(--radius-lg) border border-border bg-card p-3.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <User className="size-4" aria-hidden="true" />
              </span>
              <span className="flex-1">{t('loginRegister')}</span>
              <ChevronLeft className="rtl-flip size-4 text-muted-foreground" aria-hidden="true" />
            </Link>

            {/* --- میان‌برها --- */}
            <ul className="mb-5 space-y-1">
              {shortcuts.map(({ href, label, Icon, accent }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-(--radius-md) px-3 py-3 text-sm transition-colors hover:bg-accent',
                      accent ? 'font-semibold text-sale' : 'text-foreground',
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* --- دسته‌بندی‌های آکاردئونی --- */}
            <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {t('categories')}
            </p>

            <ul className="space-y-0.5">
              {categories.map((category) => {
                const isExpanded = expandedId === category.id
                const hasChildren = category.children.length > 0

                return (
                  <li key={category.id}>
                    <div className="flex items-center">
                      <Link
                        href={`/products?category=${category.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="flex-1 rounded-(--radius-md) px-3 py-3 text-sm text-foreground transition-colors hover:bg-accent"
                      >
                        {category.name}
                      </Link>

                      {hasChildren && (
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : category.id)}
                          aria-expanded={isExpanded}
                          aria-label={category.name}
                          className="inline-flex size-10 shrink-0 items-center justify-center rounded-(--radius-md) text-muted-foreground transition-colors hover:bg-accent"
                        >
                          <ChevronDown
                            className={cn(
                              'size-4 transition-transform duration-[var(--duration-fast)]',
                              isExpanded && 'rotate-180',
                            )}
                            aria-hidden="true"
                          />
                        </button>
                      )}
                    </div>

                    {/* زیردسته‌ها */}
                    {isExpanded && hasChildren && (
                      <ul className="ms-4 border-s border-border ps-3">
                        {category.children.map((child) => (
                          <li key={child.id}>
                            <Link
                              href={`/products?category=${child.slug}`}
                              onClick={() => setIsOpen(false)}
                              className="block rounded-(--radius-md) px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* ==========================================================
              پاصفحه کشو — زبان و تم با برچسب متنی
              ========================================================== */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border bg-muted px-3 py-3">
            <LocaleSwitcher />
            <ThemeToggle showLabel />
          </div>
        </div>
      </Portal>
    </>
  )
}
