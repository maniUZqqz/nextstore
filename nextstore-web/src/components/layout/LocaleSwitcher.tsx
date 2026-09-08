'use client'

/**
 * کلید تعویض زبان (فارسی ⇄ انگلیسی)
 * ---------------------------------------------------------------------------
 * کاربر را به همان صفحه‌ی فعلی اما با زبان دیگر می‌برد.
 * مثال: /fa/products/laptop  →  /en/products/laptop
 *
 * نکات کلیدی پیاده‌سازی:
 *   ۱. از usePathname خود next-intl استفاده می‌کنیم که مسیر را بدون
 *      پیشوند زبان برمی‌گرداند — پس نیازی به دستکاری رشته‌ای نداریم.
 *   ۲. پارامترهای Query (مثل فیلترهای محصول) حفظ می‌شوند تا کاربر
 *      با تعویض زبان فیلترهایش را از دست ندهد.
 *   ۳. از useTransition استفاده می‌کنیم تا هنگام ناوبری، رابط کاربری
 *      قفل نشود و بتوانیم وضعیت «در حال تغییر» را نشان دهیم.
 *
 * ⚠️ چرا از useSearchParams استفاده نشده؟
 *    آن هوک کل صفحه را از رندر ایستا خارج می‌کند و Suspense لازم دارد.
 *    چون فقط لحظه‌ی کلیک به Query نیاز داریم، مستقیم از window می‌خوانیم
 *    و صفحه ایستا باقی می‌ماند — سریع‌تر و بهتر برای سئو.
 */

import { useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Languages } from 'lucide-react'
import { usePathname, useRouter } from '@/i18n/navigation'
import { LOCALES } from '@/i18n/routing'
import { cn } from '@/lib/utils/cn'

export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations('locale')
  const currentLocale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  /** isPending وقتی true است که ناوبری در جریان باشد. */
  const [isPending, startTransition] = useTransition()

  /** زبان بعدی در چرخه (چون فقط دو زبان داریم، یعنی زبان دیگر). */
  const nextLocale =
    LOCALES.find((l) => l.code !== currentLocale) ?? LOCALES[0]

  /**
   * رفتن به همان صفحه با زبان دیگر، همراه با حفظ پارامترهای جستجو.
   */
  const switchLocale = () => {
    /* رشته‌ی Query را لحظه‌ی کلیک از آدرس فعلی مرورگر می‌خوانیم */
    const query = typeof window !== 'undefined' ? window.location.search : ''
    const target = `${pathname}${query}`

    startTransition(() => {
      router.replace(target, { locale: nextLocale.code })
    })
  }

  return (
    <button
      type="button"
      onClick={switchLocale}
      disabled={isPending}
      aria-label={`${t('switch')} — ${nextLocale.label}`}
      title={`${t('switch')} — ${nextLocale.label}`}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-md px-2.5',
        'text-sm font-medium text-muted-foreground',
        'transition-colors duration-[var(--duration-fast)]',
        'hover:bg-accent hover:text-accent-foreground',
        'active:scale-95',
        'disabled:opacity-50',
        className,
      )}
    >
      <Languages className="size-4" aria-hidden="true" />
      {/*
        نام زبان مقصد نمایش داده می‌شود، نه زبان فعلی.
        دلیل: کاربر می‌خواهد بداند با کلیک چه اتفاقی می‌افتد.
      */}
      <span>{nextLocale.label}</span>
    </button>
  )
}
