'use client'

/**
 * پنل خرید در صفحه محصول
 * ---------------------------------------------------------------------------
 * انتخابگر تعداد + دکمه افزودن به سبد + دکمه علاقه‌مندی را کنار هم می‌گذارد.
 *
 * چرا یک کامپوننت جدا و نه سه کامپوننت در صفحه؟
 *   تعداد انتخابی یک state مشترک بین انتخابگر و دکمه خرید است.
 *   اگر در صفحه (Server Component) بماند، باید کل صفحه کلاینتی شود.
 *   با این بسته‌بندی، فقط همین بخش کوچک جاوااسکریپت به مرورگر می‌رود.
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { Product } from '@/types/product'
import { QuantitySelector } from './QuantitySelector'
import { AddToCartButton } from './AddToCartButton'
import { WishlistButton } from './WishlistButton'

export function ProductPurchasePanel({ product }: { product: Product }) {
  const t = useTranslations('product')
  const [quantity, setQuantity] = useState(1)

  /* محصول ناموجود فقط دکمه غیرفعال نشان می‌دهد */
  if (!product.isInStock) {
    return (
      <div className="flex items-center gap-3">
        <AddToCartButton product={product} variant="full" className="flex-1" />
        <WishlistButton
          productId={product.id}
          className="size-12 border border-border"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{t('quantity')}</span>

        <QuantitySelector
          value={quantity}
          onChange={setQuantity}
          min={1}
          /* سقف: کمترینِ موجودی انبار و ۱۰ عدد (جلوگیری از سوءاستفاده) */
          max={Math.min(product.stock, 10)}
        />
      </div>

      <div className="flex items-center gap-3">
        <AddToCartButton
          product={product}
          variant="full"
          quantity={quantity}
          className="flex-1"
        />

        <WishlistButton
          productId={product.id}
          className="size-12 shrink-0 border border-border"
        />
      </div>
    </div>
  )
}
