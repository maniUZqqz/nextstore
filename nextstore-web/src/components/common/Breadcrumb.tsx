/**
 * مسیر راهنما (Breadcrumb)
 * ---------------------------------------------------------------------------
 * به کاربر نشان می‌دهد کجای ساختار سایت است و راه بازگشت به سطوح
 * بالاتر را می‌دهد. برای سئو هم مهم است: گوگل از آن برای نمایش
 * ساختار سایت در نتایج جستجو استفاده می‌کند.
 *
 * دسترسی‌پذیری:
 *   - داخل <nav> با aria-label قرار می‌گیرد
 *   - آخرین آیتم لینک نیست و aria-current="page" دارد
 *   - جداکننده‌ها با aria-hidden از صفحه‌خوان پنهان می‌شوند
 */

import { ChevronLeft } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils/cn'

export interface BreadcrumbItem {
  label: string
  /** مسیر مقصد؛ اگر نباشد یعنی آیتم فعلی است و لینک نمی‌شود */
  href?: string
}

export function Breadcrumb({
  items,
  className,
}: {
  items: BreadcrumbItem[]
  className?: string
}) {
  return (
    <nav aria-label="breadcrumb" className={cn('min-w-0', className)}>
      <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground sm:text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(isLast && 'font-medium text-foreground')}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}

              {/* جداکننده — بعد از آخرین آیتم نمی‌آید */}
              {!isLast && (
                <ChevronLeft
                  /* rtl-flip فلش را در حالت راست‌به‌چپ آینه می‌کند */
                  className="rtl-flip size-3.5 shrink-0 opacity-60"
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
