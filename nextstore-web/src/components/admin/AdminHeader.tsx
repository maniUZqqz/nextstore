'use client'

/**
 * نوار بالای پنل مدیریت
 * ---------------------------------------------------------------------------
 * جایگزین هدر فروشگاه در مسیرهای /admin.
 *
 * ⚠️ چرا هدر فروشگاه اینجا مناسب نبود؟
 *    هدر فروشگاه شامل نوار تبلیغاتی «ارسال رایگان»، جستجوی محصول،
 *    منوی مگای دسته‌بندی‌ها، سبد خرید و علاقه‌مندی‌هاست. هیچ‌کدام
 *    برای ادمینی که در حال رسیدگی به سفارش است کاربردی ندارند و
 *    فقط ارتفاع مفید صفحه را می‌خورند.
 *
 * این نوار فقط چهار چیز دارد:
 *   نشان پنل · نام کاربر · تعویض زبان · تعویض تم
 * به‌علاوه‌ی خروج، که در منوی کاربر است.
 */

import { useTranslations } from 'next-intl'
import { ShieldCheck, Store, LogOut } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { useAuth } from '@/hooks/useAuth'

export function AdminHeader() {
  const t = useTranslations('admin')
  const tAccount = useTranslations('account')
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-(--container-admin) items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* نشان پنل — کلیک روی آن به داشبورد می‌برد */}
        <Link
          href="/admin"
          className="flex items-center gap-2 text-sm font-bold text-foreground"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-(--radius-md) bg-primary text-primary-foreground">
            <ShieldCheck className="size-4" aria-hidden="true" />
          </span>
          <span className="hidden sm:inline">{t('title')}</span>
        </Link>

        {/* نام مدیر — در موبایل جا نمی‌شود، پنهان می‌ماند */}
        {user && (
          <span className="hidden truncate text-xs text-muted-foreground md:inline">
            {user.name}
          </span>
        )}

        {/* فاصله‌انداز تا بقیه به انتهای نوار بچسبند */}
        <div className="flex-1" />

        {/* بازگشت به فروشگاه — در دسکتاپ متن دارد، در موبایل فقط آیکون */}
        <Link
          href="/"
          className="inline-flex h-9 items-center gap-2 rounded-(--radius-md) border border-border px-3 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Store className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t('backToShop')}</span>
        </Link>

        <LocaleSwitcher />
        <ThemeToggle />

        <button
          type="button"
          onClick={() => logout()}
          aria-label={tAccount('logout')}
          title={tAccount('logout')}
          className="flex size-9 items-center justify-center rounded-(--radius-md) border border-border text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="size-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
