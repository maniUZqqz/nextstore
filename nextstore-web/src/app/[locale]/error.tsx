'use client'

/**
 * مرز خطای سطح زبان — تور ایمنی دوم
 * ---------------------------------------------------------------------------
 * این مرز چیزهایی را می‌گیرد که مرز `(shop)` نمی‌گیرد:
 *   - خطای رندر خودِ `(shop)/layout.tsx` (مرز پایین‌تر نمی‌تواند
 *     لایوت بالای سرش را بگیرد)
 *   - خطای مسیرهای `/admin`
 *
 * پوسته‌ی فروشگاه اینجا نمایش داده نمی‌شود — و این درست است: اگر خطا
 * از خود لایوت آمده باشد، رندر دوباره‌ی همان لایوت بلافاصله دوباره
 * می‌شکند. به‌جایش لینک‌های صریح بازگشت داده می‌شود.
 *
 * ترجمه‌ها همچنان در دسترس‌اند، چون `[locale]/layout.tsx` که
 * NextIntlClientProvider را می‌سازد بالاتر از این مرز است و سالم مانده.
 */

import { ErrorState } from '@/components/common/ErrorState'

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorState error={error} reset={reset} />
}
