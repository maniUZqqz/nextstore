'use client'

/**
 * تب‌های صفحه محصول: توضیحات · مشخصات · نظرات
 * ---------------------------------------------------------------------------
 * پیاده‌سازی دستی الگوی Tabs مطابق استاندارد WAI-ARIA:
 *   - role="tablist" / "tab" / "tabpanel"
 *   - aria-selected و aria-controls برای اتصال تب به پنل
 *   - پیمایش با کلیدهای جهت‌دار و Home/End
 *   - فقط تب فعال در ترتیب Tab قرار می‌گیرد (roving tabindex)
 *
 * چرا دستی و نه از کتابخانه؟ برای نمونه‌کار، نشان دادن تسلط بر
 * الگوهای دسترسی‌پذیری ارزش بیشتری از نصب یک پکیج دارد.
 */

import { useState, useRef, type KeyboardEvent } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import type { Locale } from '@/i18n/routing'
import type { ProductDetail } from '@/types/product'
import { ProductReviews } from '@/components/product/ProductReviews'
import { formatNumber } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

type TabId = 'description' | 'specifications' | 'reviews'

export function ProductTabs({ product }: { product: ProductDetail }) {
  const t = useTranslations('product')
  const locale = useLocale() as Locale

  const [active, setActive] = useState<TabId>('description')
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
    description: null,
    specifications: null,
    reviews: null,
  })

  const tabs: { id: TabId; label: string }[] = [
    { id: 'description', label: t('description') },
    { id: 'specifications', label: t('specifications') },
    { id: 'reviews', label: t('reviews') },
  ]

  /**
   * پیمایش تب‌ها با کیبورد.
   * در RTL جهت کلیدهای چپ و راست باید معکوس شود، وگرنه کاربر فارسی
   * با فشردن «راست» به تب قبلی می‌رود که خلاف انتظار اوست.
   */
  const handleKeyDown = (e: KeyboardEvent) => {
    const isRtl = locale === 'fa'
    const currentIndex = tabs.findIndex((tab) => tab.id === active)
    let nextIndex: number | null = null

    if (e.key === 'ArrowRight') {
      nextIndex = isRtl ? currentIndex - 1 : currentIndex + 1
    } else if (e.key === 'ArrowLeft') {
      nextIndex = isRtl ? currentIndex + 1 : currentIndex - 1
    } else if (e.key === 'Home') {
      nextIndex = 0
    } else if (e.key === 'End') {
      nextIndex = tabs.length - 1
    }

    if (nextIndex === null) return

    e.preventDefault()

    /* چرخه‌ای: بعد از آخرین تب به اولی می‌رسیم */
    const wrapped = (nextIndex + tabs.length) % tabs.length
    const nextTab = tabs[wrapped].id

    setActive(nextTab)
    /* فوکوس هم باید منتقل شود، وگرنه صفحه‌خوان تغییر را اعلام نمی‌کند */
    tabRefs.current[nextTab]?.focus()
  }

  /** مشخصات فنی — از داده‌های موجود محصول ساخته می‌شود. */
  const specs = [
    { label: t('sku'), value: product.sku },
    product.brand && { label: locale === 'fa' ? 'برند' : 'Brand', value: product.brand.name },
    product.category && {
      label: locale === 'fa' ? 'دسته‌بندی' : 'Category',
      value: product.category.name,
    },
    product.weight && {
      label: locale === 'fa' ? 'وزن' : 'Weight',
      value: `${formatNumber(product.weight, locale)} ${locale === 'fa' ? 'گرم' : 'g'}`,
    },
    product.barcode && {
      label: locale === 'fa' ? 'بارکد' : 'Barcode',
      value: product.barcode,
    },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div className="rounded-(--radius-lg) border border-border bg-card">
      {/* --- نوار تب‌ها --- */}
      <div
        role="tablist"
        aria-label={t('description')}
        onKeyDown={handleKeyDown}
        className="flex overflow-x-auto border-b border-border"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[tab.id] = el
            }}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`panel-${tab.id}`}
            /* roving tabindex: فقط تب فعال با Tab قابل رسیدن است */
            tabIndex={active === tab.id ? 0 : -1}
            onClick={() => setActive(tab.id)}
            className={cn(
              'relative shrink-0 px-5 py-3.5 text-sm font-medium transition-colors',
              active === tab.id
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}

            {/* خط زیرین تب فعال */}
            {active === tab.id && (
              <span
                className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"
                aria-hidden="true"
              />
            )}
          </button>
        ))}
      </div>

      {/* ==========================================================
          پنل توضیحات
          ========================================================== */}
      <div
        role="tabpanel"
        id="panel-description"
        aria-labelledby="tab-description"
        hidden={active !== 'description'}
        className="p-5"
      >
        <p className="text-sm leading-8 text-muted-foreground">
          {product.description || product.shortDescription}
        </p>
      </div>

      {/* ==========================================================
          پنل مشخصات فنی
          ========================================================== */}
      <div
        role="tabpanel"
        id="panel-specifications"
        aria-labelledby="tab-specifications"
        hidden={active !== 'specifications'}
        className="p-5"
      >
        <dl className="divide-y divide-border">
          {specs.map((spec) => (
            <div
              key={spec.label}
              className="flex items-center justify-between gap-4 py-3 text-sm"
            >
              <dt className="text-muted-foreground">{spec.label}</dt>
              <dd className="font-medium text-foreground">{spec.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* ==========================================================
          پنل نظرات

          ⚠️ محتوا فقط وقتی رندر می‌شود که تب فعال باشد.
             hidden عنصر را از دید پنهان می‌کند ولی جلوی mount شدن
             را نمی‌گیرد؛ بدون این شرط، هر بازدید از صفحه‌ی محصول
             یک درخواست نظرات می‌زد حتی اگر کاربر هرگز روی این تب
             کلیک نکند.
          ========================================================== */}
      <div
        role="tabpanel"
        id="panel-reviews"
        aria-labelledby="tab-reviews"
        hidden={active !== 'reviews'}
        className="p-5"
      >
        {active === 'reviews' && <ProductReviews slug={product.slug} />}
      </div>
    </div>
  )
}
