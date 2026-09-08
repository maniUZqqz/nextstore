'use client'

/**
 * نوار دسته‌بندی با منوی کشویی (Mega Menu)
 * ---------------------------------------------------------------------------
 * ویژگی امضایی هر فروشگاه بزرگ: با هاور روی «همه دسته‌بندی‌ها» یک پنل
 * دو ستونه باز می‌شود که دسته‌های اصلی و زیردسته‌هایشان را نشان می‌دهد.
 *
 * دسترسی‌پذیری:
 *   - با ماوس: hover
 *   - با کیبورد: Tab برای فوکوس، Enter/Space برای باز و بسته کردن، Escape برای بستن
 *   این ترکیب باعث می‌شود منو هم برای کاربر ماوس روان باشد و هم برای
 *   کاربر کیبورد و صفحه‌خوان قابل استفاده.
 */

import { useState, useRef, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ChevronDown, Menu, Flame, TrendingUp, Sparkles } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import type { Category } from '@/types/product'
import { formatNumber } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

export function CategoryNav({ categories }: { categories: Category[] }) {
  const t = useTranslations('nav')
  const locale = useLocale() as Locale

  const [isOpen, setIsOpen] = useState(false)
  /** دسته‌ای که ماوس رویش است — ستون سمت راست را پر می‌کند */
  const [activeId, setActiveId] = useState<number | null>(categories[0]?.id ?? null)

  const containerRef = useRef<HTMLDivElement>(null)

  /* بستن منو با کلید Escape */
  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

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

  const activeCategory = categories.find((c) => c.id === activeId)

  /** میان‌برهای ثابت کنار دکمه دسته‌بندی. */
  const shortcuts = [
    { href: '/products?on_sale=1', label: t('amazingOffers'), Icon: Flame, accent: true },
    { href: '/products?sort=popular', label: t('bestSellers'), Icon: TrendingUp },
    { href: '/products?sort=newest', label: t('newest'), Icon: Sparkles },
  ]

  return (
    <div
      ref={containerRef}
      className="relative hidden border-t border-border lg:block"
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className="mx-auto flex max-w-(--container-content) items-center gap-1 px-4 sm:px-6 lg:px-8">
        {/* --- دکمه باز کننده مگامنو --- */}
        <button
          type="button"
          onMouseEnter={() => setIsOpen(true)}
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          className={cn(
            'flex h-11 items-center gap-2 rounded-(--radius-md) px-3',
            'text-sm font-medium text-foreground transition-colors hover:bg-accent',
            isOpen && 'bg-accent',
          )}
        >
          <Menu className="size-4" aria-hidden="true" />
          {t('allCategories')}
          <ChevronDown
            className={cn(
              'size-4 transition-transform duration-[var(--duration-fast)]',
              isOpen && 'rotate-180',
            )}
            aria-hidden="true"
          />
        </button>

        {/* جداکننده عمودی */}
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />

        {/* --- میان‌برهای ثابت --- */}
        {shortcuts.map(({ href, label, Icon, accent }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex h-11 items-center gap-1.5 rounded-(--radius-md) px-3 text-sm transition-colors hover:bg-accent',
              accent ? 'font-semibold text-sale' : 'text-muted-foreground',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </div>

      {/* ==============================================================
          پنل مگامنو
          ستون راست: دسته‌های اصلی | ستون چپ: زیردسته‌های دسته فعال
          ============================================================== */}
      {isOpen && (
        <div
          className="absolute inset-x-0 top-full z-50 border-b border-border bg-popover shadow-[var(--shadow-lg)]"
          onMouseEnter={() => setIsOpen(true)}
        >
          <div className="mx-auto grid max-w-(--container-content) grid-cols-[240px_1fr] gap-6 px-4 py-5 sm:px-6 lg:px-8">
            {/* --- ستون دسته‌های اصلی --- */}
            <ul className="border-e border-border pe-4">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/products?category=${category.slug}`}
                    onMouseEnter={() => setActiveId(category.id)}
                    onFocus={() => setActiveId(category.id)}
                    className={cn(
                      'flex items-center justify-between rounded-(--radius-sm) px-3 py-2.5 text-sm transition-colors',
                      activeId === category.id
                        ? 'bg-accent font-medium text-accent-foreground'
                        : 'text-foreground hover:bg-accent',
                    )}
                  >
                    <span>{category.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatNumber(category.productsCount, locale)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* --- ستون زیردسته‌های دسته فعال --- */}
            <div>
              {activeCategory && (
                <>
                  <Link
                    href={`/products?category=${activeCategory.slug}`}
                    className="mb-3 inline-block text-sm font-bold text-primary hover:underline"
                  >
                    {activeCategory.name}
                  </Link>

                  <ul className="grid grid-cols-3 gap-x-6 gap-y-1">
                    {activeCategory.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`/products?category=${child.slug}`}
                          className="block rounded-(--radius-sm) px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
