'use client'

/**
 * گالری تصاویر محصول
 * ---------------------------------------------------------------------------
 * تصویر بزرگ + نوار بندانگشتی، با قابلیت زوم روی تصویر اصلی.
 *
 * قابلیت‌ها:
 *   - انتخاب تصویر با کلیک روی بندانگشتی یا کلیدهای جهت‌دار
 *   - زوم با حرکت ماوس روی تصویر (فقط دسکتاپ — روی لمسی معنا ندارد)
 *   - نوار بندانگشتی: افقی در موبایل، عمودی در دسکتاپ
 *
 * دسترسی‌پذیری:
 *   بندانگشتی‌ها به‌صورت tablist پیاده شده‌اند تا با کیبورد قابل
 *   پیمایش باشند و صفحه‌خوان بفهمد کدام تصویر فعال است.
 */

import { useState, useRef, type KeyboardEvent } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { ZoomIn } from 'lucide-react'
import type { ProductImage } from '@/types/product'
import { cn } from '@/lib/utils/cn'

interface ProductGalleryProps {
  images: ProductImage[]
  /** نام محصول — وقتی تصویری وجود ندارد نمایش داده می‌شود */
  productName: string
  /** برچسب تخفیف روی تصویر اصلی */
  discountBadge?: string | null
}

export function ProductGallery({
  images,
  productName,
  discountBadge,
}: ProductGalleryProps) {
  const t = useTranslations('product')

  const [activeIndex, setActiveIndex] = useState(0)
  /** آیا ماوس روی تصویر است؟ (فعال بودن زوم) */
  const [isZooming, setIsZooming] = useState(false)
  /** مختصات مرکز زوم به‌صورت درصد */
  const [origin, setOrigin] = useState({ x: 50, y: 50 })

  const mainRef = useRef<HTMLDivElement>(null)

  /* حالت بدون تصویر */
  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-(--radius-lg) border border-border bg-muted p-6 text-center">
        <span className="text-sm text-muted-foreground">{productName}</span>
      </div>
    )
  }

  const activeImage = images[activeIndex]

  /**
   * محاسبه مرکز زوم بر اساس موقعیت ماوس.
   * transform-origin روی همان نقطه تنظیم می‌شود تا کاربر حس کند
   * ذره‌بین را روی همان‌جا گرفته است.
   */
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainRef.current) return

    const rect = mainRef.current.getBoundingClientRect()
    setOrigin({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  /** پیمایش بندانگشتی‌ها با کلیدهای جهت‌دار. */
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % images.length)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + images.length) % images.length)
    }
  }

  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row">
      {/* ==========================================================
          نوار بندانگشتی
          موبایل: ردیف افقی زیر تصویر | دسکتاپ: ستون عمودی کنار تصویر
          ========================================================== */}
      {images.length > 1 && (
        <div
          role="tablist"
          aria-label={t('description')}
          onKeyDown={handleKeyDown}
          className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible"
        >
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`${productName} ${index + 1}`}
              tabIndex={index === activeIndex ? 0 : -1}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'relative size-16 shrink-0 overflow-hidden rounded-(--radius-md) border-2 transition-colors sm:size-20',
                index === activeIndex
                  ? 'border-primary'
                  : 'border-border hover:border-muted-foreground',
              )}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* ==========================================================
          تصویر اصلی با زوم
          ========================================================== */}
      <div
        ref={mainRef}
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onMouseMove={handleMouseMove}
        className="relative aspect-square flex-1 overflow-hidden rounded-(--radius-lg) border border-border bg-muted"
      >
        <Image
          key={activeImage.id}
          src={activeImage.url}
          alt={activeImage.alt}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          /* تصویر اصلی محصول معیار LCP صفحه است، پس اولویت می‌گیرد */
          priority
          className={cn(
            'object-cover transition-transform duration-[var(--duration-base)]',
            isZooming && 'scale-[1.8]',
          )}
          style={{ transformOrigin: `${origin.x}% ${origin.y}%` }}
        />

        {/* برچسب تخفیف */}
        {discountBadge && (
          <span className="absolute start-3 top-3 rounded-(--radius-sm) bg-sale px-2.5 py-1 text-sm font-bold text-sale-foreground shadow-sm">
            {discountBadge}
          </span>
        )}

        {/* راهنمای زوم — فقط روی دسکتاپ و وقتی ماوس روی تصویر نیست */}
        <span
          className={cn(
            'absolute end-3 top-3 hidden items-center gap-1 rounded-full bg-background/80 px-2.5 py-1',
            'text-xs text-muted-foreground backdrop-blur-sm transition-opacity lg:flex',
            isZooming && 'opacity-0',
          )}
          aria-hidden="true"
        >
          <ZoomIn className="size-3.5" />
        </span>
      </div>
    </div>
  )
}
