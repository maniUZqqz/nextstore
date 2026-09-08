'use client'

/**
 * اسلایدر بنرهای تبلیغاتی صفحه اصلی
 * ---------------------------------------------------------------------------
 * جایگزین «هیروی شرکتی» با متن وسط‌چین. هر فروشگاه واقعی، بالای صفحه
 * اصلی‌اش بنرهای کمپین و تخفیف دارد، نه شعار سازمانی.
 *
 * قابلیت‌ها:
 *   - چرخش خودکار هر ۵ ثانیه
 *   - توقف چرخش هنگام هاور یا فوکوس (کاربر در حال خواندن است)
 *   - نقطه‌های ناوبری + دکمه قبلی/بعدی
 *   - پشتیبانی کامل RTL (جهت حرکت و آیکون‌ها معکوس می‌شوند)
 *   - احترام به prefers-reduced-motion: چرخش خودکار غیرفعال می‌شود
 */

import { useState, useEffect, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils/cn'

/** مدت نمایش هر اسلاید (میلی‌ثانیه). */
const AUTOPLAY_INTERVAL = 5000

/**
 * تعریف اسلایدها.
 * متن‌ها از فایل ترجمه می‌آیند؛ اینجا فقط کلید، مسیر و رنگ‌بندی است.
 */
const SLIDES = [
  {
    key: 'one',
    href: '/products?on_sale=1',
    /* گرادیان‌ها با توکن رنگ کار می‌کنند تا در هر دو تم درست باشند */
    gradient: 'from-primary/25 via-accent to-background',
    accent: 'text-primary',
  },
  {
    key: 'two',
    href: '/products?category=mobile-phones',
    gradient: 'from-info/20 via-accent to-background',
    accent: 'text-info',
  },
  {
    key: 'three',
    href: '/products',
    gradient: 'from-success/20 via-accent to-background',
    accent: 'text-success',
  },
] as const

export function HeroSlider() {
  const t = useTranslations('home.slides')
  const locale = useLocale()
  const isRtl = locale === 'fa'

  const [current, setCurrent] = useState(0)
  /** وقتی کاربر با اسلایدر تعامل دارد، چرخش خودکار متوقف می‌شود */
  const [isPaused, setIsPaused] = useState(false)

  /** رفتن به اسلاید بعدی (چرخه‌ای). */
  const next = useCallback(() => {
    setCurrent((i) => (i + 1) % SLIDES.length)
  }, [])

  /** رفتن به اسلاید قبلی (چرخه‌ای). */
  const prev = useCallback(() => {
    setCurrent((i) => (i - 1 + SLIDES.length) % SLIDES.length)
  }, [])

  /* چرخش خودکار — با احترام به تنظیم «کاهش حرکت» کاربر */
  useEffect(() => {
    if (isPaused) return

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (prefersReducedMotion) return

    const timer = setInterval(next, AUTOPLAY_INTERVAL)
    return () => clearInterval(timer)
  }, [isPaused, next])

  /*
   * در RTL جهت منطقی حرکت برعکس است:
   * دکمه‌ای که فلشش به سمت شروع خط است باید «بعدی» باشد.
   */
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft
  const NextIcon = isRtl ? ChevronLeft : ChevronRight

  return (
    <section
      className="relative overflow-hidden rounded-(--radius-xl) border border-border"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      aria-roledescription="carousel"
      aria-label={t('one.title')}
    >
      {/* --- اسلایدها --- */}
      <div className="relative h-56 sm:h-72 lg:h-96">
        {SLIDES.map((slide, index) => {
          const isActive = index === current

          return (
            <div
              key={slide.key}
              className={cn(
                'absolute inset-0 bg-gradient-to-bl',
                slide.gradient,
                'transition-opacity duration-[var(--duration-slow)] ease-[var(--ease-out)]',
                isActive ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
              aria-hidden={!isActive}
              role="group"
              aria-roledescription="slide"
            >
              {/*
                عنصر تزئینی پس‌زمینه.

                ⚠️ در بازبینی چشمی، نیمه‌ی خالیِ اسلاید یک مستطیل تخت و
                   بی‌روح بود. این دو دایره‌ی نرم عمق بصری می‌سازند بدون
                   اینکه با متن رقابت کنند یا خوانایی را کم کنند.
              */}
              <div
                className="pointer-events-none absolute inset-y-0 start-0 w-1/2 overflow-hidden"
                aria-hidden="true"
              >
                <span className="absolute -bottom-16 start-10 size-64 rounded-full bg-background/40 blur-xl" />
                <span className="absolute -top-10 start-40 size-40 rounded-full bg-background/30 blur-lg" />
              </div>

              <div className="relative mx-auto flex h-full max-w-(--container-content) items-center px-6 sm:px-10 lg:px-16">
                <div className="max-w-lg">
                  {/* برچسب کمپین */}
                  <span
                    className={cn(
                      'inline-block rounded-full bg-background/80 px-3 py-1 text-xs font-bold backdrop-blur-sm',
                      slide.accent,
                    )}
                  >
                    {t(`${slide.key}.badge`)}
                  </span>

                  <h2 className="mt-3 text-2xl font-black leading-tight text-foreground sm:text-3xl lg:text-4xl">
                    {t(`${slide.key}.title`)}
                  </h2>

                  <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                    {t(`${slide.key}.subtitle`)}
                  </p>

                  <Link
                    href={slide.href}
                    /* اسلاید غیرفعال نباید با Tab قابل رسیدن باشد */
                    tabIndex={isActive ? 0 : -1}
                    className="mt-5 inline-flex h-11 items-center rounded-(--radius-md) bg-primary px-6 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.98]"
                  >
                    {t(`${slide.key}.cta`)}
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* --- دکمه‌های قبلی و بعدی (فقط دسکتاپ) --- */}
      <button
        type="button"
        onClick={prev}
        aria-label="previous slide"
        className="absolute start-3 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm transition-colors hover:bg-background sm:flex"
      >
        <PrevIcon className="size-5" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={next}
        aria-label="next slide"
        className="absolute end-3 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm transition-colors hover:bg-background sm:flex"
      >
        <NextIcon className="size-5" aria-hidden="true" />
      </button>

      {/* --- نقطه‌های ناوبری --- */}
      <div className="absolute bottom-4 start-1/2 flex -translate-x-1/2 gap-2 rtl:translate-x-1/2">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.key}
            type="button"
            onClick={() => setCurrent(index)}
            aria-label={`slide ${index + 1}`}
            aria-current={index === current}
            className={cn(
              'h-2 rounded-full transition-all duration-[var(--duration-base)]',
              index === current
                ? 'w-6 bg-primary'
                : 'w-2 bg-foreground/30 hover:bg-foreground/50',
            )}
          />
        ))}
      </div>
    </section>
  )
}
