'use client'

/**
 * دکمه «افزودن به سبد خرید»
 * ---------------------------------------------------------------------------
 * دو حالت نمایشی:
 *   compact → روی کارت محصول (دکمه دایره‌ای کوچک)
 *   full    → در صفحه محصول (تمام‌عرض با متن)
 *
 * ⚠️ اکنون به API سرور وصل است، نه استور محلی.
 *    دلیل: بررسی موجودی و قیمت باید سمت سرور انجام شود، وگرنه
 *    کاربر می‌تواند کالای ناموجود را به سبد اضافه کند.
 *
 * ⚠️ روی کارت محصول، این دکمه داخل یک لینک سراسری قرار دارد؛
 *    بدون preventDefault کلیک روی آن کاربر را به صفحه محصول می‌برد.
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ShoppingCart, Check, Plus, Loader2 } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import type { Product } from '@/types/product'
import { cn } from '@/lib/utils/cn'

interface AddToCartButtonProps {
  product: Product
  /** compact برای کارت محصول، full برای صفحه محصول */
  variant?: 'compact' | 'full'
  /** تعداد افزودنی — در صفحه محصول از انتخابگر تعداد می‌آید */
  quantity?: number
  className?: string
}

export function AddToCartButton({
  product,
  variant = 'compact',
  quantity = 1,
  className,
}: AddToCartButtonProps) {
  const t = useTranslations('product')
  const { addItem, isAdding } = useCart()

  const [justAdded, setJustAdded] = useState(false)

  /** افزودن محصول به سبد و نمایش بازخورد بصری. */
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!product.isInStock) return

    addItem(
      { productId: product.id, quantity },
      {
        onSuccess: () => {
          setJustAdded(true)
          /* تیک موفقیت پس از دو ثانیه محو می‌شود */
          setTimeout(() => setJustAdded(false), 2000)
        },
      },
    )
  }

  const isDisabled = !product.isInStock || isAdding

  /* ---------------- حالت فشرده: روی کارت محصول ---------------- */
  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        aria-label={t('addToCartAria')}
        title={t('addToCart')}
        className={cn(
          'inline-flex size-9 shrink-0 items-center justify-center rounded-full',
          'transition-all duration-[var(--duration-fast)] active:scale-90',
          justAdded
            ? 'bg-success text-success-foreground'
            : cn(
                'bg-primary/10 text-primary',
                'hover:bg-primary hover:text-primary-foreground',
              ),
          'disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground/50',
          className,
        )}
      >
        {isAdding ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : justAdded ? (
          <Check className="size-4" strokeWidth={2.5} aria-hidden="true" />
        ) : (
          <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
        )}
      </button>
    )
  }

  /* ---------------- حالت کامل: صفحه محصول ---------------- */
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={t('addToCartAria')}
      aria-busy={isAdding}
      className={cn(
        'inline-flex h-12 items-center justify-center gap-2 rounded-(--radius-md) px-6',
        'font-medium transition-all duration-[var(--duration-fast)] active:scale-[0.98]',
        justAdded
          ? 'bg-success text-success-foreground'
          : 'bg-primary text-primary-foreground hover:opacity-90',
        'disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground',
        className,
      )}
    >
      {isAdding ? (
        <>
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          {t('addToCart')}
        </>
      ) : justAdded ? (
        <>
          <Check className="size-5" aria-hidden="true" />
          {t('addedToCart')}
        </>
      ) : (
        <>
          <ShoppingCart className="size-5" aria-hidden="true" />
          {product.isInStock ? t('addToCart') : t('outOfStock')}
        </>
      )}
    </button>
  )
}
