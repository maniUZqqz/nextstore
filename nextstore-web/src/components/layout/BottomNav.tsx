'use client'

/**
 * ناوبری پایین صفحه در موبایل
 * ---------------------------------------------------------------------------
 * الگوی استاندارد اپلیکیشن‌های فروشگاهی موبایل. دسترسی به مسیرهای اصلی
 * را در دسترس شست کاربر قرار می‌دهد، بدون نیاز به اسکرول تا بالای صفحه.
 *
 * جزئیات مهم:
 *   - فقط زیر بریک‌پوینت md نمایش داده می‌شود
 *   - مسیر فعال با رنگ برند مشخص می‌شود
 *   - نشانگر تعداد سبد خرید روی آیکون سبد
 *   - safe-area پایین برای گوشی‌های دارای نوار خانه (آیفون)
 */

import { useTranslations, useLocale } from 'next-intl'
import { Home, LayoutGrid, ShoppingCart, Heart, User } from 'lucide-react'
import { Link, usePathname } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { useCart } from '@/hooks/useCart'
import { useWishlist } from '@/hooks/useWishlist'
import { formatNumber } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { useIsMounted } from '@/hooks/useIsMounted'

export function BottomNav() {
  const t = useTranslations('nav')
  const locale = useLocale() as Locale
  const pathname = usePathname()

  const { itemsCount: cartCount } = useCart()
  /*
   * شمارنده از هوک می‌آید نه مستقیم از استور محلی.
   * تفاوت مهم: برای کاربر واردشده منبع، سرور است. خواندن مستقیم
   * از localStorage یعنی کاربری که علاقه‌مندی‌هایش روی سرور است
   * در این نوار عدد صفر می‌دید.
   */
  const { count: wishlistCount } = useWishlist()

  /* شمارنده‌ها از localStorage می‌آیند و سرور آن‌ها را نمی‌داند */
  const mounted = useIsMounted()

  /**
   * آیتم‌های ناوبری به‌همراه شمارنده اختیاری.
   *
   * ⚠️ برچسب‌ها عمداً کوتاه‌اند و از کلیدهای اصلی منو جدا شده‌اند.
   *    در بازبینی چشمی، «علاقه‌مندی‌ها» و «حساب کاربری» در نوار
   *    پنج‌ستونه روی هم می‌افتادند و به خط دوم می‌شکستند.
   *    در ناوبری پایین، فضا برای هر آیتم حدود ۷۰ پیکسل است —
   *    برچسب باید در همان جا شود.
   */
  const items = [
    { href: '/', label: t('bottom.home'), Icon: Home, badge: 0 },
    /*
     * برچسب این آیتم «دسته‌ها» است، پس باید به صفحه‌ی دسته‌بندی‌ها
     * برود نه فهرست کل محصولات. پیش‌تر چون صفحه‌ی /categories وجود
     * نداشت به /products اشاره می‌کرد و برچسب با مقصد نمی‌خواند.
     */
    { href: '/categories', label: t('bottom.categories'), Icon: LayoutGrid, badge: 0 },
    { href: '/cart', label: t('bottom.cart'), Icon: ShoppingCart, badge: cartCount },
    { href: '/account/wishlist', label: t('bottom.wishlist'), Icon: Heart, badge: wishlistCount },
    { href: '/login', label: t('bottom.account'), Icon: User, badge: 0 },
  ]

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background md:hidden',
        /* فضای امن پایین برای گوشی‌های بدون دکمه فیزیکی */
        'pb-[env(safe-area-inset-bottom)]',
      )}
      aria-label={t('menu')}
    >
      <ul className="flex h-16 items-stretch">
        {items.map(({ href, label, Icon, badge }) => {
          /*
           * تشخیص مسیر فعال.
           * برای صفحه اصلی تطابق دقیق لازم است، وگرنه همیشه فعال می‌ماند.
           */
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex h-full flex-col items-center justify-center gap-1',
                  'text-[11px] transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <span className="relative">
                  <Icon
                    className={cn('size-5', isActive && 'fill-primary/15')}
                    aria-hidden="true"
                  />

                  {/* نشانگر تعداد */}
                  {mounted && badge > 0 && (
                    <span className="absolute -end-2 -top-1.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground">
                      {formatNumber(badge, locale)}
                    </span>
                  )}
                </span>

                {/*
                  برچسب.
                  truncate + px تضمین می‌کند حتی اگر ترجمه‌ای بلندتر
                  اضافه شود، نوار به هم نریزد و متن به خط دوم نشکند.
                */}
                <span className="w-full truncate px-0.5 text-center leading-none">
                  {label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
