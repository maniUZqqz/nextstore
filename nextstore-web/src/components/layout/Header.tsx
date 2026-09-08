/**
 * هدر اصلی فروشگاه
 * ===========================================================================
 * ساختار سه‌لایه — همان الگویی که همه فروشگاه‌های بزرگ استفاده می‌کنند:
 *
 *   ┌─ نوار بالا  : تلفن، ارسال رایگان، پیگیری سفارش      (فقط دسکتاپ)
 *   ├─ نوار اصلی  : همبرگر · لوگو · جستجو · کاربر · سبد
 *   └─ نوار دسته  : همه دسته‌بندی‌ها + میان‌برها            (فقط دسکتاپ)
 *
 * این یک Server Component است و دسته‌بندی‌ها را خودش از API می‌گیرد،
 * پس هر صفحه‌ای که از این هدر استفاده می‌کند نیازی به پاس دادن داده ندارد.
 */

import { getTranslations } from 'next-intl/server'
import { getSiteSettings } from '@/lib/api/settings'
import { Phone, Truck, PackageSearch, Heart } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { getCategories } from '@/lib/api/catalog'
import type { Category } from '@/types/product'
import { SearchBar } from './SearchBar'
import { CartButton } from './CartButton'
import { UserMenu } from './UserMenu'
import { CategoryNav } from './CategoryNav'
import { MobileNav } from './MobileNav'
import { LocaleSwitcher } from './LocaleSwitcher'
import { ThemeToggle } from './ThemeToggle'

export async function Header({ locale }: { locale: string }) {
  const t = await getTranslations('nav')
  const tTop = await getTranslations('topbar')

  /*
   * دسته‌بندی‌ها برای مگامنو.
   * اگر API در دسترس نباشد، هدر بدون منوی دسته رندر می‌شود
   * و بقیه سایت سالم می‌ماند (تخریب تدریجی).
   */
  let categories: Category[] = []
  try {
    categories = (await getCategories(locale)).data
  } catch {
    categories = []
  }

  /*
   * تلفن و ساعت پشتیبانی از تنظیمات می‌آیند نه از فایل ترجمه.
   *
   * ⚠️ شماره‌ی تلفن یک *داده* است نه یک *ترجمه*. گذاشتنش در
   *    messages/fa.json یعنی عوض کردنش نیاز به دیپلوی دارد، و بدتر:
   *    باید در هر دو فایل زبان جدا نگه داشته شود و از هم دور می‌افتند.
   */
  const settings = await getSiteSettings(locale)

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md">
      {/* ==========================================================
          لایه ۱ — نوار بالا (فقط دسکتاپ)
          اطلاعات کم‌اهمیت ولی اطمینان‌بخش: تلفن، ارسال رایگان
          ========================================================== */}
      <div className="hidden border-b border-border bg-muted lg:block">
        <div className="mx-auto flex h-9 max-w-(--container-content) items-center justify-between px-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <div className="flex items-center gap-5">
            {/*
              تلفن یک لینک `tel:` است، نه متن ساده — روی موبایل با یک
              لمس تماس گرفته می‌شود و روی دسکتاپ هم قابل کپی می‌ماند.
            */}
            <a
              href={`tel:${settings.contactPhone ?? ''}`}
              className="flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Phone className="size-3.5" aria-hidden="true" />
              {settings.contactPhone ?? tTop('phone')}
            </a>
            <span>{settings.supportHours ?? tTop('support')}</span>
          </div>

          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5 font-medium text-success">
              <Truck className="size-3.5" aria-hidden="true" />
              {tTop('freeShipping')}
            </span>
            <Link href="/account/orders" className="flex items-center gap-1.5 hover:text-foreground">
              <PackageSearch className="size-3.5" aria-hidden="true" />
              {tTop('trackOrder')}
            </Link>
          </div>
        </div>
      </div>

      {/* ==========================================================
          لایه ۲ — نوار اصلی
          ========================================================== */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-(--container-content) px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-3">
            {/* همبرگر موبایل */}
            <MobileNav categories={categories} />

            {/*
              لوگو.
              ⚠️ متن برند قبلاً زیر بریک‌پوینت sm پنهان می‌شد و در موبایل
                 فقط یک مربع «N» می‌ماند که برند را منتقل نمی‌کرد.
                 حالا در همه‌ی اندازه‌ها دیده می‌شود؛ فضا کافی است چون
                 جستجو در موبایل به ردیف بعدی منتقل شده است.
            */}
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2"
              aria-label="NextStore"
            >
              <span className="flex size-9 items-center justify-center rounded-(--radius-md) bg-primary text-lg font-black text-primary-foreground">
                N
              </span>
              <span className="text-base font-bold text-foreground sm:text-lg">
                NextStore
              </span>
            </Link>

            {/*
              جستجو — بزرگ‌ترین عنصر هدر.
              در موبایل پنهان است و زیر هدر نمایش داده می‌شود تا
              فضای نوار اصلی برای آیکون‌ها بماند.
            */}
            <div className="mx-2 hidden flex-1 md:block lg:mx-6">
              <SearchBar />
            </div>

            {/* فاصله‌انداز در موبایل تا آیکون‌ها به انتها بچسبند */}
            <div className="flex-1 md:hidden" />

            {/* --- آیکون‌های سمت انتها --- */}
            <div className="flex shrink-0 items-center gap-0.5">
              {/*
                زبان و تم.

                ⚠️ برک‌پوینت md است نه lg.

                   قبلاً `hidden lg:flex` بود، یعنی زیر ۱۰۲۴ پیکسل هر
                   دو کنترل از هدر ناپدید می‌شدند و فقط داخل کشوی
                   همبرگر می‌ماندند. مشکل: پنجره‌ی مرورگر روی لپ‌تاپ
                   معمولاً حدود ۹۰۰ تا ۱۰۰۰ پیکسل است — یعنی دقیقاً
                   در همان بازه‌ای که هدر جای خالی فراوان دارد ولی
                   کاربر هیچ دکمه‌ی تم یا زبانی نمی‌بیند و نتیجه
                   می‌گیرد که این قابلیت‌ها وجود ندارند.

                   حالا از ۷۶۸ پیکسل به بالا در خود هدر دیده می‌شوند
                   و زیر آن همچنان در کشو هستند.
              */}
              <div className="hidden items-center md:flex">
                <LocaleSwitcher />
                <ThemeToggle />
              </div>

              {/* علاقه‌مندی‌ها */}
              <Link
                href="/account/wishlist"
                aria-label={t('wishlist')}
                className="hidden size-10 items-center justify-center rounded-(--radius-md) text-foreground transition-colors hover:bg-accent sm:inline-flex"
              >
                <Heart className="size-5" aria-hidden="true" />
              </Link>

              {/*
                منوی کاربر — دو حالت دارد:
                مهمان   → آیکون که به صفحه ورود می‌برد
                واردشده → آواتار با منوی کشویی
              */}
              <UserMenu />

              {/* جداکننده قبل از سبد خرید */}
              <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden="true" />

              <CartButton />
            </div>
          </div>

          {/* جستجوی موبایل — ردیف جدا زیر نوار اصلی */}
          <div className="pb-3 md:hidden">
            <SearchBar />
          </div>
        </div>
      </div>

      {/* ==========================================================
          لایه ۳ — نوار دسته‌بندی با مگامنو (فقط دسکتاپ)
          ========================================================== */}
      {categories.length > 0 && <CategoryNav categories={categories} />}
    </header>
  )
}
