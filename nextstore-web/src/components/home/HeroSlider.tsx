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
 *
 * ⚠️ اسلایدها **از پنل مدیریت** می‌آیند، نه از کد.
 *
 *    پیش‌تر سه اسلاید در همین فایل ثابت بودند و متنشان در فایل ترجمه.
 *    یعنی عوض کردن یک کمپین — کاری که در فروشگاه واقعی هفتگی است —
 *    به ویرایش کد و دیپلوی دوباره نیاز داشت، و کمپین نوروز نمی‌توانست
 *    خودش سر تاریخ ظاهر و ناپدید شود.
 *
 * ⚠️ این کامپوننت داده را خودش نمی‌گیرد؛ صفحه‌ی اصلی (سرور-کامپوننت)
 *    آن را می‌دهد. بنرها در همان درخواستی که بقیه‌ی صفحه را می‌سازد
 *    گرفته می‌شوند و کاربر هیچ پرشی نمی‌بیند.
 */

import { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils/cn'
import { HERO_THEME } from '@/lib/utils/banner-theme'
import type { Banner } from '@/types/banner'

/** مدت نمایش هر اسلاید (میلی‌ثانیه). */
const AUTOPLAY_INTERVAL = 5000

export function HeroSlider({ slides }: { slides: Banner[] }) {
  const locale = useLocale()
  const isRtl = locale === 'fa'

  const [current, setCurrent] = useState(0)
  /** وقتی کاربر با اسلایدر تعامل دارد، چرخش خودکار متوقف می‌شود */
  const [isPaused, setIsPaused] = useState(false)

  const count = slides.length

  /** رفتن به اسلاید بعدی (چرخه‌ای). */
  const next = useCallback(() => {
    setCurrent((i) => (count === 0 ? 0 : (i + 1) % count))
  }, [count])

  /** رفتن به اسلاید قبلی (چرخه‌ای). */
  const prev = useCallback(() => {
    setCurrent((i) => (count === 0 ? 0 : (i - 1 + count) % count))
  }, [count])

  /* چرخش خودکار — با احترام به تنظیم «کاهش حرکت» کاربر */
  useEffect(() => {
    /*
     * ⚠️ با یک اسلاید هم تایمر لازم نیست.
     *
     *    بدون این شرط، مدیری که فقط یک بنر فعال دارد هر پنج ثانیه یک
     *    رندر بی‌فایده می‌گرفت که همان اسلاید را دوباره می‌گذاشت.
     */
    if (isPaused || count < 2) return

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (prefersReducedMotion) return

    const timer = setInterval(next, AUTOPLAY_INTERVAL)
    return () => clearInterval(timer)
  }, [isPaused, next, count])

  /*
   * ⚠️ بدون بنر فعال، اصلاً چیزی رندر نمی‌شود.
   *
   *    نه اسکلت خاکستری و نه کادر خالی: صفحه‌ی اصلی باید طبیعی به نظر
   *    برسد، نه اینکه جای خالیِ چیزی را نشان دهد که مدیر عمداً خاموشش
   *    کرده.
   */
  if (count === 0) return null

  /*
   * ⚠️ اگر مدیر بنری را حذف کند و شاخص جاری از فهرست بیرون بزند،
   *    `slides[current]` تعریف‌نشده می‌شود. محدودکردنش اینجا ارزان‌تر
   *    از یک useEffect همگام‌ساز است.
   */
  const activeIndex = Math.min(current, count - 1)

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
      aria-label={slides[0].title}
    >
      {/* --- اسلایدها --- */}
      <div className="relative h-56 sm:h-72 lg:h-96">
        {slides.map((slide, index) => {
          const isActive = index === activeIndex
          const theme = HERO_THEME[slide.theme] ?? HERO_THEME.primary

          return (
            <div
              key={slide.id}
              className={cn(
                'absolute inset-0 bg-gradient-to-bl',
                theme.gradient,
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
                  {/*
                    برچسب کمپین — اختیاری.
                    بنری بدون برچسب نباید یک کادر خالی بگیرد.
                  */}
                  {slide.badge && (
                    <span
                      className={cn(
                        'inline-block rounded-full bg-background/80 px-3 py-1 text-xs font-bold backdrop-blur-sm',
                        theme.accent,
                      )}
                    >
                      {slide.badge}
                    </span>
                  )}

                  <h2 className="mt-3 text-2xl font-black leading-tight text-foreground sm:text-3xl lg:text-4xl">
                    {slide.title}
                  </h2>

                  {slide.subtitle && (
                    <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                      {slide.subtitle}
                    </p>
                  )}

                  {slide.ctaLabel && (
                    <Link
                      href={slide.href}
                      /* اسلاید غیرفعال نباید با Tab قابل رسیدن باشد */
                      tabIndex={isActive ? 0 : -1}
                      className="mt-5 inline-flex h-11 items-center rounded-(--radius-md) bg-primary px-6 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.98]"
                    >
                      {slide.ctaLabel}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/*
        --- دکمه‌های قبلی و بعدی (فقط دسکتاپ) ---

        ⚠️ با یک اسلاید پنهان می‌شوند: دکمه‌ای که به همان جای فعلی
           می‌برد فقط کاربر را گیج می‌کند.
      */}
      {count > 1 && (
        <>
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
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCurrent(index)}
                aria-label={`slide ${index + 1}`}
                aria-current={index === activeIndex}
                className={cn(
                  'h-2 rounded-full transition-all duration-[var(--duration-base)]',
                  index === activeIndex
                    ? 'w-6 bg-primary'
                    : 'w-2 bg-foreground/30 hover:bg-foreground/50',
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
