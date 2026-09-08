'use client'

/**
 * کلید تعویض پوسته روشن/تاریک
 * ---------------------------------------------------------------------------
 * سه حالت را چرخه‌ای عوض می‌کند: روشن → تاریک → سیستم → روشن
 *
 * چالش فنی که اینجا حل شده (Hydration Mismatch):
 *   سرور نمی‌داند کاربر چه تمی انتخاب کرده (چون در localStorage مرورگر است).
 *   اگر مستقیم آیکون تم فعلی را رندر کنیم، خروجی سرور و کلاینت فرق می‌کند
 *   و React خطای hydration می‌دهد.
 *   راه‌حل: تا قبل از mount شدن، یک placeholder هم‌اندازه نمایش می‌دهیم.
 *   این همچنین از پرش چیدمان (Layout Shift) هم جلوگیری می‌کند.
 */

import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/**
 * تشخیص اینکه آیا کامپوننت روی مرورگر سوار شده است.
 *
 * ⚠️ چرا useSyncExternalStore و نه الگوی رایج useState + useEffect؟
 *
 *    الگوی `const [m, setM] = useState(false); useEffect(() => setM(true), [])`
 *    کار می‌کند ولی یک رندر اضافه‌ی اجباری دارد و ری‌اکت جدید هم
 *    صریحاً از آن پرهیز می‌دهد (قاعده‌ی set-state-in-effect).
 *
 *    useSyncExternalStore دقیقاً برای همین ساخته شده: دو «عکس»
 *    متفاوت برای سرور و کلاینت می‌گیرد. سرور همیشه false می‌بیند و
 *    کلاینت همیشه true — بدون افکت، بدون رندر اضافه، و بدون
 *    ناسازگاری hydration.
 *
 *    تابع subscribe عمداً کاری نمی‌کند: این مقدار هرگز پس از
 *    hydration تغییر نمی‌کند، پس اشتراکی لازم نیست.
 */
const subscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

function useIsMounted(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)
}

/** ترتیب چرخش بین حالت‌های تم. */
const THEME_CYCLE = ['light', 'dark', 'system'] as const
type ThemeName = (typeof THEME_CYCLE)[number]

interface ThemeToggleProps {
  /**
   * نمایش نام حالت کنار آیکون.
   *
   * ⚠️ چرا اضافه شد؟ در منوی موبایل، این دکمه تنها یک آیکون مانیتور
   *    بود (حالت «سیستم») که هیچ سرنخی نمی‌داد چه کاری می‌کند.
   *    در هدر دسکتاپ فضا کم است و فقط آیکون کافی است، اما در منو
   *    که فضا هست، برچسب متنی تجربه را روشن‌تر می‌کند.
   */
  showLabel?: boolean
  className?: string
}

export function ThemeToggle({ showLabel = false, className }: ThemeToggleProps) {
  const t = useTranslations('theme')
  const { theme, setTheme, resolvedTheme } = useTheme()

  /** تا زمانی که کامپوننت روی مرورگر سوار نشده، تم واقعی را نمی‌دانیم. */
  const mounted = useIsMounted()

  /** رفتن به حالت بعدی در چرخه‌ی تم. */
  const cycleTheme = () => {
    const current = (theme ?? 'system') as ThemeName
    const nextIndex = (THEME_CYCLE.indexOf(current) + 1) % THEME_CYCLE.length
    setTheme(THEME_CYCLE[nextIndex])
  }

  /* پیش از mount: قاب خالی هم‌اندازه تا چیدمان نپرد */
  if (!mounted) {
    return (
      <div
        className={cn(showLabel ? 'h-9 w-28' : 'size-9', 'rounded-md', className)}
        aria-hidden="true"
      />
    )
  }

  /**
   * آیکون: همیشه خورشید یا ماه — بر اساس تمی که کاربر *می‌بیند*.
   *
   * ⚠️ باگ تجربه‌ی کاربری که این خط رفع می‌کند:
   *    قبلاً در حالت «سیستم» یک آیکون مانیتور نشان داده می‌شد. چون
   *    سیستم حالت پیش‌فرض است، اکثر کاربران *همیشه* مانیتور می‌دیدند
   *    — و هیچ‌کس برای عوض کردن تم دنبال مانیتور نمی‌گردد. نتیجه:
   *    دکمه عملاً نامرئی بود و کاربر فکر می‌کرد دارک‌مود وجود ندارد.
   *
   *    حالا خورشید یا ماه دیده می‌شود که همه می‌شناسند، و حالت
   *    «سیستم» با یک نقطه‌ی کوچک کنار آیکون مشخص می‌شود.
   */
  const Icon = resolvedTheme === 'dark' ? Moon : Sun

  /** آیا در حالت خودکار (پیروی از سیستم) هستیم؟ */
  const isSystem = theme === 'system'

  /** نام حالت فعلی — برای نمایش کنار آیکون. */
  const currentName =
    theme === 'system' ? t('system') : resolvedTheme === 'dark' ? t('dark') : t('light')

  /** برچسب دسترسی‌پذیری — به صفحه‌خوان می‌گوید این دکمه چه می‌کند. */
  const label =
    theme === 'system'
      ? t('system')
      : resolvedTheme === 'dark'
        ? t('switchToLight')
        : t('switchToDark')

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-9 items-center justify-center gap-1.5 rounded-md',
        showLabel ? 'px-2.5' : 'w-9',
        'text-sm font-medium text-muted-foreground',
        'transition-colors duration-[var(--duration-fast)]',
        /* هاور فقط روی دستگاه‌هایی که واقعاً ماوس دارند */
        'hover:bg-accent hover:text-accent-foreground',
        'active:scale-95',
        className,
      )}
    >
      <span className="relative flex shrink-0">
        <Icon className="size-5" aria-hidden="true" />

        {/*
          نشانگر حالت خودکار.
          یک نقطه‌ی کوچک روی گوشه‌ی آیکون به‌جای عوض کردن کل آیکون —
          هم پیام «پیروی از سیستم» را می‌رساند و هم آیکون همچنان
          قابل تشخیص می‌ماند.
        */}
        {isSystem && (
          <span
            className="absolute -end-0.5 -top-0.5 size-1.5 rounded-full bg-primary ring-2 ring-background"
            aria-hidden="true"
          />
        )}
      </span>

      {showLabel && <span>{currentName}</span>}
    </button>
  )
}
