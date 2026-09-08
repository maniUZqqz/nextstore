'use client'

/**
 * دکمه علاقه‌مندی (قلب) روی کارت محصول
 * ---------------------------------------------------------------------------
 * با کلیک، محصول به فهرست علاقه‌مندی‌ها اضافه یا از آن حذف می‌شود.
 *
 * ⚠️ نکته مهم: این دکمه روی کارتی قرار دارد که کل سطحش یک لینک است.
 *    بدون preventDefault و stopPropagation، کلیک روی قلب کاربر را
 *    به صفحه محصول می‌برد — باگی که تجربه را خراب می‌کند.
 *
 * ذخیره‌سازی (localStorage برای مهمان، سرور برای کاربر واردشده) کاملاً
 * داخل useWishlist پنهان است؛ این کامپوننت تفاوتشان را نمی‌بیند.
 */

import { useTranslations } from 'next-intl'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { useWishlist } from '@/hooks/useWishlist'
import { cn } from '@/lib/utils/cn'
import { useIsMounted } from '@/hooks/useIsMounted'

interface WishlistButtonProps {
  productId: number
  className?: string
}

export function WishlistButton({ productId, className }: WishlistButtonProps) {
  const t = useTranslations('product')

  const { has, toggle } = useWishlist()

  /*
   * وضعیت مهمان از localStorage می‌آید و سرور آن را نمی‌داند.
   * پیش از mount قلب همیشه خالی رندر می‌شود تا HTML سرور و کلاینت
   * یکی باشند و hydration نشکند.
   */
  const mounted = useIsMounted()

  /** افزودن یا حذف با جلوگیری از فعال شدن لینک کارت. */
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const added = toggle(productId)
    toast.success(added ? t('addToWishlist') : t('removeFromWishlist'))
  }

  const isActive = mounted && has(productId)

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isActive ? t('removeFromWishlist') : t('addToWishlist')}
      aria-pressed={isActive}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-full',
        'bg-background/90 backdrop-blur-sm transition-all duration-[var(--duration-fast)]',
        'hover:scale-110 active:scale-95',
        isActive ? 'text-sale' : 'text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      <Heart
        className={cn('size-4', isActive && 'fill-current')}
        aria-hidden="true"
      />
    </button>
  )
}
