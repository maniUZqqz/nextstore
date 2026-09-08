'use client'

/**
 * محتوای صفحه سبد خرید
 * ---------------------------------------------------------------------------
 * ⚠️ منبع حقیقت سبد، سرور است — نه localStorage.
 *    تمام محاسبات مالی (جمع، ارسال، تخفیف) در بک‌اند انجام و از
 *    همان‌جا خوانده می‌شود. دلیل: کاربر نباید بتواند با دستکاری
 *    سمت کلاینت مبلغ نهایی را تغییر دهد.
 *
 * چیدمان:
 *   دسکتاپ → دو ستونه: فهرست اقلام + خلاصه سفارش چسبان
 *   موبایل  → تک‌ستونه
 *
 * پوشش حالت‌ها: loading · empty · error · success
 */

import Image from 'next/image'
import { useTranslations, useLocale } from 'next-intl'
import {
  Trash2, ShoppingBag, Minus, Plus, ShieldCheck, AlertCircle, AlertTriangle,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { useCart } from '@/hooks/useCart'
import { formatPrice, formatNumber, currencyLabel } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { CouponForm } from '@/components/cart/CouponForm'

export function CartContent() {
  const t = useTranslations('cart')
  const tCommon = useTranslations('common')
  const tStates = useTranslations('states')
  const locale = useLocale() as Locale

  const { cart, isLoading, isError, updateItem, removeItem } = useCart()

  /* --- حالت بارگذاری --- */
  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-(--radius-lg) border border-border bg-muted"
            />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-(--radius-lg) border border-border bg-muted" />
      </div>
    )
  }

  /* --- حالت خطا --- */
  if (isError || !cart) {
    return (
      <div className="flex flex-col items-center rounded-(--radius-lg) border border-border bg-card py-16 text-center">
        <AlertCircle className="size-12 text-warning" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-bold text-foreground">{tStates('errorTitle')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{tStates('errorDesc')}</p>
      </div>
    )
  }

  /* --- حالت خالی --- */
  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-(--radius-lg) border border-border bg-card py-20 text-center">
        <ShoppingBag className="size-14 text-muted-foreground" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-bold text-foreground">{t('empty')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t('emptyDesc')}</p>

        <Link
          href="/products"
          className="mt-6 inline-flex h-11 items-center rounded-(--radius-md) bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t('startShopping')}
        </Link>
      </div>
    )
  }

  const { summary } = cart

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
      {/* ==========================================================
          ستون فهرست اقلام
          ========================================================== */}
      <ul className="space-y-3">
        {cart.items.map((item) => (
          <li
            key={item.id}
            className="flex gap-3 rounded-(--radius-lg) border border-border bg-card p-3 sm:gap-4 sm:p-4"
          >
            {/* تصویر محصول */}
            <Link
              href={`/products/${item.product.slug}`}
              className="relative size-20 shrink-0 overflow-hidden rounded-(--radius-md) bg-muted sm:size-24"
            >
              {item.product.image ? (
                <Image
                  src={item.product.image}
                  alt={item.product.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full items-center justify-center p-1 text-center text-[10px] text-muted-foreground">
                  {item.product.name}
                </span>
              )}
            </Link>

            {/* اطلاعات و کنترل‌ها */}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  {item.product.brand && (
                    <span className="block text-[11px] text-muted-foreground">
                      {item.product.brand}
                    </span>
                  )}

                  <Link
                    href={`/products/${item.product.slug}`}
                    className="line-clamp-2 text-sm font-medium text-foreground hover:text-primary"
                  >
                    {item.product.name}
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  aria-label={`${tCommon('delete')} ${item.product.name}`}
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-(--radius-md) text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>

              {/*
                هشدار تغییر قیمت.
                بک‌اند قیمت لحظه‌ی افزودن را نگه می‌دارد و با قیمت
                فعلی مقایسه می‌کند. اطلاع دادن به کاربر پیش از پرداخت،
                از شکایت پس از خرید جلوگیری می‌کند.
              */}
              {item.priceChanged && (
                <p className="flex items-center gap-1.5 text-[11px] text-warning">
                  <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
                  {t('priceChanged')}
                </p>
              )}

              <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                {/* انتخابگر تعداد */}
                <div className="inline-flex h-9 items-center rounded-(--radius-md) border border-border">
                  <button
                    type="button"
                    onClick={() => updateItem({ itemId: item.id, quantity: item.quantity - 1 })}
                    aria-label={tCommon('previous')}
                    className="inline-flex size-8 items-center justify-center text-foreground transition-colors hover:bg-accent"
                  >
                    <Minus className="size-3.5" aria-hidden="true" />
                  </button>

                  <span
                    className="min-w-8 text-center text-sm font-semibold tabular-nums"
                    aria-live="polite"
                  >
                    {formatNumber(item.quantity, locale)}
                  </span>

                  <button
                    type="button"
                    onClick={() => updateItem({ itemId: item.id, quantity: item.quantity + 1 })}
                    disabled={item.quantity >= item.maxQuantity}
                    aria-label={tCommon('next')}
                    className="inline-flex size-8 items-center justify-center text-foreground transition-colors hover:bg-accent disabled:opacity-40"
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                  </button>
                </div>

                {/* جمع این قلم */}
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-foreground" data-price>
                    {formatPrice(item.lineTotal, locale)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {currencyLabel(locale)}
                  </span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* ==========================================================
          ستون خلاصه سفارش — در دسکتاپ چسبان
          ========================================================== */}
      <aside className="rounded-(--radius-lg) border border-border bg-card p-4 lg:sticky lg:top-24">
        <h2 className="mb-4 text-base font-bold text-foreground">{t('title')}</h2>

        {/* نوار پیشرفت ارسال رایگان — همه اعداد از سرور می‌آیند */}
        {summary.remainingForFreeShipping > 0 ? (
          <div className="mb-4 rounded-(--radius-md) bg-muted p-3">
            <p className="text-xs text-muted-foreground">
              {locale === 'fa'
                ? `${formatPrice(summary.remainingForFreeShipping, locale)} تومان تا ارسال رایگان`
                : `${formatPrice(summary.remainingForFreeShipping, locale)} away from free shipping`}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary transition-all duration-[var(--duration-slow)]"
                style={{
                  width: `${Math.min(
                    (summary.subtotal / summary.freeShippingThreshold) * 100,
                    100,
                  )}%`,
                }}
              />
            </div>
          </div>
        ) : (
          <p className="mb-4 rounded-(--radius-md) bg-success/10 p-3 text-xs font-medium text-success">
            {locale === 'fa' ? '✓ ارسال این سفارش رایگان است' : '✓ This order ships free'}
          </p>
        )}

        {/*
          فرم کد تخفیف — بالای ریز مبالغ.

          ⚠️ عمداً *پیش از* جمع کل است، نه بعدش: کاربر باید کد را
             ببیند و بزند پیش از آنکه به مبلغ نهایی نگاه کند، وگرنه
             تصمیم خرید را با عددی می‌گیرد که هنوز کامل نیست.
        */}
        <CouponForm coupon={cart.coupon} />

        {/* ریز مبالغ */}
        <dl className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">{t('subtotal')}</dt>
            <dd className="font-medium text-foreground" data-price>
              {formatPrice(summary.subtotal, locale)}
            </dd>
          </div>

          {/*
            ردیف تخفیف فقط وقتی مبلغی هست نشان داده می‌شود.
            نمایش «تخفیف: ۰» در هر سبدی، یک ردیف بی‌معنا به خلاصه
            اضافه می‌کرد و توجه را از مبلغ‌های واقعی می‌گرفت.
          */}
          {summary.discount > 0 && (
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">{t('discount')}</dt>
              <dd className="font-medium text-success" data-price>
                −{formatPrice(summary.discount, locale)}
              </dd>
            </div>
          )}

          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">{t('shipping')}</dt>
            <dd
              className={cn(
                'font-medium',
                summary.shipping === 0 ? 'text-success' : 'text-foreground',
              )}
              data-price
            >
              {summary.shipping === 0 ? tCommon('free') : formatPrice(summary.shipping, locale)}
            </dd>
          </div>

          <hr className="border-border" />

          <div className="flex items-baseline justify-between">
            <dt className="font-bold text-foreground">{t('total')}</dt>
            <dd className="flex items-baseline gap-1">
              <span className="text-lg font-black text-foreground" data-price>
                {formatPrice(summary.total, locale)}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {currencyLabel(locale)}
              </span>
            </dd>
          </div>
        </dl>

        <Link
          href="/checkout"
          className="mt-5 flex h-12 w-full items-center justify-center rounded-(--radius-md) bg-primary text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.98]"
        >
          {t('checkout')}
        </Link>

        <Link
          href="/products"
          className="mt-2 flex h-10 w-full items-center justify-center rounded-(--radius-md) text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {t('continueShopping')}
        </Link>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-3.5 text-success" aria-hidden="true" />
          {locale === 'fa' ? 'پرداخت امن و رمزنگاری‌شده' : 'Secure encrypted payment'}
        </p>
      </aside>
    </div>
  )
}
