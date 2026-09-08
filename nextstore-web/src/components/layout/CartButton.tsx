'use client'

/**
 * دکمه سبد خرید در هدر
 * ---------------------------------------------------------------------------
 * نشانگر تعداد اقلام سبد را روی آیکون نمایش می‌دهد.
 *
 * تعداد اقلام از API سرور می‌آید و با TanStack Query کش می‌شود.
 *
 * چالش hydration: سرور در زمان رندر اولیه سبد کاربر را نمی‌داند
 * (چون با توکن مرورگر خوانده می‌شود). تا پیش از mount، نشانگر
 * رندر نمی‌شود تا خروجی سرور و کلاینت یکسان بماند.
 */

import { useTranslations, useLocale } from 'next-intl'
import { ShoppingCart } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { useCart } from '@/hooks/useCart'
import { formatNumber } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { useIsMounted } from '@/hooks/useIsMounted'

export function CartButton({ className }: { className?: string }) {
  const t = useTranslations('nav')
  const locale = useLocale() as Locale

  /*
   * تعداد اقلام از سرور خوانده می‌شود، نه از localStorage.
   * دلیل: سبد باید بین دستگاه‌های کاربر مشترک باشد و پس از
   * ورود به حساب، سبد مهمان با آن ادغام شود.
   */
  const { itemsCount } = useCart()

  /* تا mount نشده‌ایم نشانگر را نمایش نمی‌دهیم (جلوگیری از hydration mismatch) */
  const mounted = useIsMounted()

  return (
    <Link
      href="/cart"
      aria-label={t('cart')}
      className={cn(
        'relative inline-flex size-10 items-center justify-center rounded-(--radius-md)',
        'text-foreground transition-colors hover:bg-accent',
        className,
      )}
    >
      <ShoppingCart className="size-5" aria-hidden="true" />

      {/* نشانگر تعداد — دایره‌ی کوچک روی گوشه‌ی آیکون */}
      {mounted && itemsCount > 0 && (
        <span
          className={cn(
            'absolute -top-0.5 flex min-w-5 items-center justify-center',
            /* در RTL گوشه‌ی چپ، در LTR گوشه‌ی راست */
            '-end-0.5 rounded-full bg-primary px-1',
            'text-[11px] font-bold leading-5 text-primary-foreground',
          )}
          aria-live="polite"
        >
          {formatNumber(itemsCount, locale)}
        </span>
      )}
    </Link>
  )
}
