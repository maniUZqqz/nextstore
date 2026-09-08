'use client'

/**
 * داشبورد پنل مدیریت
 * ---------------------------------------------------------------------------
 * چهار بخش:
 *   ۱. کارت‌های آمار (درآمد، سفارش، مشتری، محصول)
 *   ۲. نمودار میله‌ای فروش ۱۴ روز اخیر
 *   ۳. پرفروش‌ترین محصولات + توزیع وضعیت سفارش
 *   ۴. آخرین سفارش‌ها
 *
 * ⚠️ نمودار با SVG خالص کشیده می‌شود، بدون کتابخانه.
 *    دلیل: یک نمودار میله‌ای ساده حدود ۴۰ خط کد است، در حالی که
 *    Recharts حدود ۱۵۰ کیلوبایت به باندل اضافه می‌کند. برای این
 *    مورد، هزینه توجیه ندارد.
 */

import { useQuery } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import {
  TrendingUp, ShoppingBag, Users, Package,
  AlertTriangle, XCircle, Clock, CreditCard, AlertCircle,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getDashboard } from '@/lib/api/admin'
import type { SalesPoint } from '@/types/admin'
import { STATUS_CLASSES } from '@/components/account/OrdersList'
import { formatPrice, formatNumber, formatDate, currencyLabel } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

export function AdminDashboard() {
  const t = useTranslations('admin.dashboard')
  const tOrder = useTranslations('order')
  const tStates = useTranslations('states')
  const locale = useLocale() as Locale

  const dashboardQuery = useQuery({
    queryKey: ['admin', 'dashboard', locale],
    queryFn: () => getDashboard(locale),
    /* آمار داشبورد نباید هر بار از نو گرفته شود */
    staleTime: 60_000,
  })

  /* --- حالت بارگذاری --- */
  if (dashboardQuery.isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-(--radius-lg) border border-border bg-muted" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-(--radius-lg) border border-border bg-muted" />
        <div className="h-64 animate-pulse rounded-(--radius-lg) border border-border bg-muted" />
      </div>
    )
  }

  /* --- حالت خطا --- */
  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <div className="flex flex-col items-center rounded-(--radius-lg) border border-border bg-card py-16 text-center">
        <AlertCircle className="size-12 text-warning" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-bold text-foreground">{tStates('errorTitle')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{tStates('errorDesc')}</p>
      </div>
    )
  }

  const { summary, salesChart, topProducts, ordersByStatus, recentOrders } =
    dashboardQuery.data

  /**
   * کارت‌های آمار اصلی.
   *
   * ⚠️ تایپ صریح لازم است: با `as const` تنها، TypeScript آرایه را
   *    به اتحاد چهار نوع متفاوت تبدیل می‌کند و چون `suffix` فقط در
   *    عضو اول هست، دسترسی به آن خطای کامپایل می‌دهد.
   */
  const stats: Array<{
    label: string
    value: string
    /** واحد پول — فقط برای کارت‌های مالی */
    suffix?: string
    hint: string
    Icon: typeof TrendingUp
    tone: 'success' | 'info' | 'primary' | 'warning'
  }> = [
    {
      label: t('revenueTotal'),
      value: formatPrice(summary.revenueTotal, locale),
      suffix: currencyLabel(locale),
      hint: `${t('revenueToday')}: ${formatPrice(summary.revenueToday, locale)}`,
      Icon: TrendingUp,
      tone: 'success',
    },
    {
      label: t('ordersTotal'),
      value: formatNumber(summary.ordersTotal, locale),
      hint: `${t('ordersToday')}: ${formatNumber(summary.ordersToday, locale)}`,
      Icon: ShoppingBag,
      tone: 'info',
    },
    {
      label: t('customersTotal'),
      value: formatNumber(summary.customersTotal, locale),
      hint: `${t('customersToday')}: ${formatNumber(summary.customersToday, locale)}`,
      Icon: Users,
      tone: 'primary',
    },
    {
      label: t('productsTotal'),
      value: formatNumber(summary.productsTotal, locale),
      hint: `${t('productsOutOfStock')}: ${formatNumber(summary.productsOutOfStock, locale)}`,
      Icon: Package,
      tone: 'warning',
    },
  ]

  /** هشدارهایی که نیاز به اقدام ادمین دارند. */
  const alerts = [
    {
      key: 'pending',
      count: summary.ordersPending,
      label: t('ordersPending'),
      Icon: Clock,
      href: '/admin/orders?status=paid',
      tone: 'info',
    },
    {
      key: 'awaiting',
      count: summary.ordersAwaitingPayment,
      label: t('ordersAwaitingPayment'),
      Icon: CreditCard,
      href: '/admin/orders?status=pending',
      tone: 'warning',
    },
    {
      key: 'lowStock',
      count: summary.productsLowStock,
      label: t('productsLowStock'),
      Icon: AlertTriangle,
      href: '/admin/products?low_stock=1',
      tone: 'warning',
    },
    {
      key: 'outOfStock',
      count: summary.productsOutOfStock,
      label: t('productsOutOfStock'),
      Icon: XCircle,
      href: '/admin/products?status=active',
      tone: 'destructive',
    },
  ].filter((a) => a.count > 0)

  return (
    /*
     * data-testid برای تست نشت داده استفاده می‌شود.
     * تست بررسی می‌کند کاربر بی‌دسترسی این عنصر را *نبیند*.
     * پیش‌تر تست دنبال رشته‌ی «درآمد کل» در body می‌گشت که مثبت
     * کاذب می‌داد: next-intl کل فایل ترجمه را داخل <script> صفحه
     * جاسازی می‌کند و textContent محتوای script را هم برمی‌گرداند.
     */
    <div data-testid="admin-dashboard" className="flex flex-col gap-5">
      {/* ==========================================================
          ۱. کارت‌های آمار
          ========================================================== */}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, suffix, hint, Icon, tone }) => (
          <li
            key={label}
            className="rounded-(--radius-lg) border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full',
                  tone === 'success' && 'bg-success/10 text-success',
                  tone === 'info' && 'bg-info/10 text-info',
                  tone === 'primary' && 'bg-primary/10 text-primary',
                  tone === 'warning' && 'bg-warning/15 text-warning',
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
            </div>

            <p className="mt-2 flex items-baseline gap-1">
              <span className="text-xl font-black text-foreground tabular-nums" data-price>
                {value}
              </span>
              {suffix && (
                <span className="text-[11px] text-muted-foreground">{suffix}</span>
              )}
            </p>

            <p className="mt-1 truncate text-[11px] text-muted-foreground">{hint}</p>
          </li>
        ))}
      </ul>

      {/* ==========================================================
          هشدارهای نیازمند اقدام
          ========================================================== */}
      {alerts.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {alerts.map(({ key, count, label, Icon, href, tone }) => (
            <li key={key}>
              <Link
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-(--radius-md) border p-3 transition-colors',
                  tone === 'info' && 'border-info/25 bg-info/5 hover:bg-info/10',
                  tone === 'warning' && 'border-warning/25 bg-warning/5 hover:bg-warning/10',
                  tone === 'destructive' &&
                    'border-destructive/25 bg-destructive/5 hover:bg-destructive/10',
                )}
              >
                <Icon
                  className={cn(
                    'size-5 shrink-0',
                    tone === 'info' && 'text-info',
                    tone === 'warning' && 'text-warning',
                    tone === 'destructive' && 'text-destructive',
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-black text-foreground tabular-nums">
                    {formatNumber(count, locale)}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {label}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* ==========================================================
          ۲. نمودار فروش
          ========================================================== */}
      <section className="rounded-(--radius-lg) border border-border bg-card p-4 sm:p-5">
        <h2 className="mb-4 text-sm font-bold text-foreground">{t('salesChart')}</h2>
        <SalesChart data={salesChart} locale={locale} emptyLabel={t('noData')} />
      </section>

      {/* ==========================================================
          ۳. پرفروش‌ترین‌ها + توزیع وضعیت
          ========================================================== */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* --- پرفروش‌ترین محصولات --- */}
        <section className="rounded-(--radius-lg) border border-border bg-card p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-bold text-foreground">{t('topProducts')}</h2>

          {topProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('noData')}</p>
          ) : (
            <ol className="space-y-2.5">
              {topProducts.map((product, index) => (
                <li key={`${product.productId}-${index}`} className="flex items-center gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {formatNumber(index + 1, locale)}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm text-foreground">
                      {product.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatNumber(product.sold, locale)} {t('sold')}
                    </span>
                  </span>

                  <span className="shrink-0 text-sm font-bold text-foreground" data-price>
                    {formatPrice(product.revenue, locale)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* --- توزیع وضعیت سفارش --- */}
        <section className="rounded-(--radius-lg) border border-border bg-card p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-bold text-foreground">{t('ordersByStatus')}</h2>

          {ordersByStatus.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('noData')}</p>
          ) : (
            <ul className="space-y-2.5">
              {ordersByStatus.map((row) => {
                const total = ordersByStatus.reduce((sum, x) => sum + x.count, 0)
                const percent = total > 0 ? (row.count / total) * 100 : 0

                return (
                  <li key={row.status}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-foreground">{row.label}</span>
                      <span className="font-bold text-foreground tabular-nums">
                        {formatNumber(row.count, locale)}
                      </span>
                    </div>

                    {/* نوار نسبت */}
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          row.color === 'success' && 'bg-success',
                          row.color === 'warning' && 'bg-warning',
                          row.color === 'info' && 'bg-info',
                          row.color === 'destructive' && 'bg-destructive',
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      {/* ==========================================================
          ۴. آخرین سفارش‌ها
          ========================================================== */}
      <section className="rounded-(--radius-lg) border border-border bg-card">
        <h2 className="border-b border-border px-4 py-3.5 text-sm font-bold text-foreground sm:px-5">
          {t('recentOrders')}
        </h2>

        {recentOrders.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{t('noData')}</p>
        ) : (
          <ul className="divide-y divide-border">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.orderNumber}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-accent sm:px-5"
                >
                  <span className="min-w-0">
                    <span className="block font-mono text-sm font-medium text-foreground" dir="ltr">
                      {order.orderNumber}
                    </span>
                    {order.createdAt && (
                      <span className="text-[11px] text-muted-foreground">
                        {formatDate(order.createdAt, locale)}
                      </span>
                    )}
                  </span>

                  <span className="flex items-center gap-3">
                    <span
                      className={cn(
                        'rounded-(--radius-sm) px-2 py-0.5 text-[11px] font-semibold',
                        STATUS_CLASSES[order.statusColor],
                      )}
                    >
                      {order.statusLabel}
                    </span>

                    <span className="text-sm font-bold text-foreground" data-price>
                      {formatPrice(order.total, locale)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/admin/orders"
          className="block border-t border-border py-3 text-center text-xs font-medium text-primary hover:underline"
        >
          {tOrder('title')}
        </Link>
      </section>
    </div>
  )
}

/* =========================================================================
 * نمودار میله‌ای فروش — SVG خالص، بدون کتابخانه
 * ======================================================================= */

/**
 * نمودار میله‌ای ساده.
 *
 * چرا SVG دستی و نه Recharts؟
 *   یک نمودار میله‌ای با tooltip حدود ۴۰ خط کد است، در حالی که
 *   Recharts حدود ۱۵۰ کیلوبایت به باندل اضافه می‌کند. برای همین
 *   یک نمودار، هزینه توجیه ندارد.
 *
 * ارتفاع میله‌ها نسبت به بیشترین مقدار محاسبه می‌شود تا نمودار
 * همیشه از فضای موجود کامل استفاده کند.
 */
function SalesChart({
  data,
  locale,
  emptyLabel,
}: {
  data: SalesPoint[]
  locale: Locale
  emptyLabel: string
}) {
  const max = Math.max(...data.map((d) => d.revenue), 1)
  const hasData = data.some((d) => d.revenue > 0)

  if (!hasData) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">{emptyLabel}</p>
    )
  }

  return (
    <div className="flex h-56 items-end gap-1 sm:gap-2">
      {data.map((point) => {
        /* حداقل ۲٪ ارتفاع تا روزهای صفر هم دیده شوند */
        const heightPercent = Math.max((point.revenue / max) * 100, point.revenue > 0 ? 4 : 2)

        /* روز و ماه برای برچسب محور افقی */
        const [, month, day] = point.date.split('-')

        return (
          <div
            key={point.date}
            className="group flex flex-1 flex-col items-center justify-end gap-1"
          >
            {/* راهنمای شناور — با هاور ظاهر می‌شود */}
            <span
              className={cn(
                'pointer-events-none rounded-(--radius-sm) bg-popover px-1.5 py-0.5',
                'text-[10px] font-medium text-popover-foreground opacity-0 shadow-[var(--shadow-md)]',
                'transition-opacity group-hover:opacity-100',
              )}
              data-price
            >
              {formatPrice(point.revenue, locale)}
            </span>

            {/* میله */}
            <div
              className={cn(
                'w-full rounded-t-sm transition-colors',
                point.revenue > 0
                  ? 'bg-primary/70 group-hover:bg-primary'
                  : 'bg-muted',
              )}
              style={{ height: `${heightPercent}%` }}
              role="img"
              aria-label={`${point.date}: ${point.revenue}`}
            />

            {/* برچسب محور — در موبایل یک‌درمیان نمایش داده می‌شود */}
            <span className="text-[9px] text-muted-foreground tabular-nums">
              {formatNumber(Number(day), locale)}/{formatNumber(Number(month), locale)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
