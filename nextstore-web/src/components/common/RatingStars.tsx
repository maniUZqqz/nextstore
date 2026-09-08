/**
 * نمایش امتیاز ستاره‌ای
 * ---------------------------------------------------------------------------
 * امتیاز اعشاری (مثلاً ۴.۳) را به‌صورت ستاره‌های پرشده نمایش می‌دهد،
 * از جمله ستاره‌ی نیمه‌پر.
 *
 * روش پیاده‌سازی: دو لایه ستاره روی هم.
 *   لایه پایین → پنج ستاره خاکستری
 *   لایه بالا  → پنج ستاره زرد که با عرض درصدی برش می‌خورند
 * این روش از محاسبه‌ی جداگانه‌ی «نیم‌ستاره» ساده‌تر و دقیق‌تر است.
 *
 * دسترسی‌پذیری: امتیاز به‌صورت متن برای صفحه‌خوان اعلام می‌شود،
 * چون ستاره‌های تصویری برای کاربر نابینا معنایی ندارند.
 */

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface RatingStarsProps {
  /** امتیاز بین ۰ تا ۵ */
  value: number
  /** اندازه ستاره‌ها */
  size?: 'sm' | 'md' | 'lg'
  /** متن جایگزین برای صفحه‌خوان */
  label?: string
  className?: string
}

const SIZE_CLASS = {
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-5',
} as const

export function RatingStars({
  value,
  size = 'md',
  label,
  className,
}: RatingStarsProps) {
  /* محدود کردن مقدار به بازه معتبر تا داده خراب چیدمان را نشکند */
  const clamped = Math.min(Math.max(value, 0), 5)
  const percentage = (clamped / 5) * 100

  const starClass = SIZE_CLASS[size]

  return (
    <span
      className={cn('relative inline-flex shrink-0', className)}
      role="img"
      aria-label={label ?? `${clamped} / 5`}
    >
      {/* لایه پایین: ستاره‌های خالی */}
      <span className="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={cn(starClass, 'text-border')} />
        ))}
      </span>

      {/*
        لایه بالا: ستاره‌های پر، برش‌خورده به اندازه درصد امتیاز.
        در RTL برش باید از سمت راست شروع شود، پس از start استفاده
        می‌کنیم که خودکار جهت را رعایت می‌کند.
      */}
      <span
        className="absolute inset-0 flex gap-0.5 overflow-hidden"
        style={{ width: `${percentage}%` }}
        aria-hidden="true"
      >
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={cn(starClass, 'shrink-0 fill-rating text-rating')} />
        ))}
      </span>
    </span>
  )
}
