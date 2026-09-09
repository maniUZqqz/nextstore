'use client'

/**
 * ناوبری پنل مدیریت
 * ---------------------------------------------------------------------------
 * دسکتاپ → ستون کناری چسبان
 * موبایل  → نوار افقی اسکرول‌شونده بالای محتوا
 *
 * چرا در موبایل نوار افقی و نه کشو؟ در پنل مدیریت کاربر مدام بین
 * بخش‌ها جابه‌جا می‌شود؛ کشو یعنی دو کلیک برای هر جابه‌جایی.
 */

import { useTranslations } from 'next-intl'
import {
  LayoutDashboard, Package, ShoppingBag, Users, Tags, Settings, Store, FileText, Bookmark,
  MessageSquare, LifeBuoy, Ticket, Inbox,
} from 'lucide-react'
import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils/cn'

export function AdminSidebar() {
  const t = useTranslations('admin')
  const pathname = usePathname()

  /**
   * آیتم‌های ناوبری.
   *
   * ⚠️ پیش‌تر پرچم `disabled` وجود داشت تا بخش‌های ساخته‌نشده به‌صورت
   *    خاکستری دیده شوند و نقشه‌ی پنل روشن باشد. حالا همه‌ی بخش‌ها
   *    ساخته شده‌اند و آن شاخه حذف شد — کد مرده‌ای که فقط خواندن
   *    این فایل را سنگین می‌کرد.
   */
  const items = [
    { href: '/admin', label: t('nav.dashboard'), Icon: LayoutDashboard, exact: true },
    { href: '/admin/orders', label: t('nav.orders'), Icon: ShoppingBag },
    { href: '/admin/products', label: t('nav.products'), Icon: Package },
    { href: '/admin/posts', label: t('nav.posts'), Icon: FileText },
    { href: '/admin/categories', label: t('nav.categories'), Icon: Tags },
    { href: '/admin/brands', label: t('nav.brands'), Icon: Bookmark },
    { href: '/admin/reviews', label: t('nav.reviews'), Icon: MessageSquare },
    { href: '/admin/tickets', label: t('nav.tickets'), Icon: LifeBuoy },
    { href: '/admin/messages', label: t('nav.messages'), Icon: Inbox },
    { href: '/admin/customers', label: t('nav.customers'), Icon: Users },
    { href: '/admin/coupons', label: t('nav.coupons'), Icon: Ticket },
    { href: '/admin/settings', label: t('nav.settings'), Icon: Settings },
  ]

  /** آیا این مسیر فعال است؟ */
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <nav
      aria-label={t('title')}
      className={cn(
        'lg:sticky lg:top-24 lg:w-56 lg:shrink-0',
        'rounded-(--radius-lg) border border-border bg-card p-2',
      )}
    >
      {/*
        موبایل: ردیف افقی اسکرول‌شونده
        دسکتاپ: ستون عمودی
      */}
      <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {items.map(({ href, label, Icon, exact }) => {
          const active = isActive(href, exact)

          return (
            <li key={href} className="shrink-0 lg:shrink">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 whitespace-nowrap rounded-(--radius-md) px-3 py-2.5 text-sm transition-colors',
                  active
                    ? 'bg-primary font-semibold text-primary-foreground'
                    : 'text-foreground hover:bg-accent',
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>

      {/* بازگشت به فروشگاه — جداکننده فقط در دسکتاپ */}
      <div className="mt-1 border-border pt-1 lg:mt-2 lg:border-t lg:pt-2">
        <Link
          href="/"
          className="flex items-center gap-2.5 whitespace-nowrap rounded-(--radius-md) px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Store className="size-4 shrink-0" aria-hidden="true" />
          {t('backToShop')}
        </Link>
      </div>
    </nav>
  )
}
