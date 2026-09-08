'use client'

/**
 * نوار جستجوی محصولات
 * ---------------------------------------------------------------------------
 * قلب تجربه‌ی هر فروشگاه اینترنتی. در دیجی‌کالا و آمازون بزرگ‌ترین
 * عنصر هدر است، چون بیشترین ترافیک از همین‌جا می‌آید.
 *
 * رفتار:
 *   - ارسال فرم → هدایت به /products?q=...
 *   - نمایش دکمه پاک‌کردن وقتی متنی وارد شده
 *   - در موبایل تمام‌عرض زیر لوگو، در دسکتاپ وسط هدر
 */

import { useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Search, X } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils/cn'

interface SearchBarProps {
  /** مقدار اولیه — وقتی کاربر در صفحه نتایج جستجوست */
  defaultValue?: string
  className?: string
}

export function SearchBar({ defaultValue = '', className }: SearchBarProps) {
  const t = useTranslations('search')
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)

  /**
   * ارسال فرم و هدایت به صفحه نتایج.
   *
   * ⚠️ مقصد از `/products?q=` به `/search?q=` تغییر کرد.
   *    صفحه‌ی محصولات یک فهرست فیلترشده است و در حالت بدون نتیجه
   *    فقط می‌گوید «چیزی یافت نشد». صفحه‌ی جستجو حالت‌های خاص خودش
   *    را دارد: راهنمای اصلاح عبارت، پیشنهاد دسته‌بندی و راه خروج
   *    از بن‌بست. ضمناً صفحه‌ی جستجو با robots=noindex علامت خورده
   *    تا ترکیب‌های بی‌پایان عبارت‌ها وارد ایندکس گوگل نشوند.
   */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const term = value.trim()

    /* جستجوی خالی معنی ندارد — کاربر را به فهرست کامل می‌بریم */
    router.push(term ? `/search?q=${encodeURIComponent(term)}` : '/products')
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={cn('relative flex w-full items-center', className)}
    >
      {/*
        آیکون ذره‌بین.
        از start استفاده می‌کنیم نه left، تا در فارسی سمت راست بنشیند.
      */}
      <Search
        className="pointer-events-none absolute start-3 size-5 text-muted-foreground"
        aria-hidden="true"
      />

      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t('placeholder')}
        aria-label={t('submit')}
        className={cn(
          'h-11 w-full rounded-(--radius-md) border border-input bg-muted',
          'ps-11 pe-20 text-sm text-foreground placeholder:text-muted-foreground',
          'transition-colors outline-none',
          'focus:border-primary focus:bg-background',
          /* حذف آیکون ضربدر پیش‌فرض مرورگر — خودمان دکمه داریم */
          '[&::-webkit-search-cancel-button]:hidden',
        )}
      />

      {/* دکمه پاک کردن — فقط وقتی متنی هست */}
      {value && (
        <button
          type="button"
          onClick={() => setValue('')}
          aria-label={t('clear')}
          className="absolute end-[4.5rem] flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}

      {/*
        دکمه جستجو.
        ⚠️ در بازبینی چشمی، نسخه‌ی قبلی (px-4 با متن «جستجو کن») بلوک
           آبی بزرگی داخل فیلد می‌ساخت که با placeholder رقابت می‌کرد.
           حالا فشرده‌تر است و وزن بصری کمتری دارد.
      */}
      <button
        type="submit"
        className="absolute end-1.5 h-8 rounded-(--radius-sm) bg-primary px-3 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 active:scale-95"
      >
        {t('submit')}
      </button>
    </form>
  )
}
