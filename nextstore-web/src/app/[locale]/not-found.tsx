/**
 * صفحه ۴۰۴ — یافت نشد
 * ---------------------------------------------------------------------------
 * وقتی مسیری وجود ندارد یا notFound() صدا زده شود، این صفحه نمایش می‌آید.
 *
 * ⚠️ نکته: این کامپوننت نمی‌تواند از params زبان استفاده کند، چون
 *    Next.js آن را بیرون از context مسیر رندر می‌کند. برای همین از
 *    useTranslations در سطح کلاینت استفاده نمی‌کنیم و متن دو زبان را
 *    مستقیم قرار می‌دهیم — این تنها جایی است که چنین استثنایی داریم.
 */

import { SearchX } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { ShopChrome } from '@/components/layout/ShopChrome'
import { routing } from '@/i18n/routing'

export default function NotFound() {
  /*
   * ⚠️ این فایل عمداً در سطح [locale] مانده و به (shop) منتقل نشده،
   *    چون باید آدرس‌های کاملاً نامعتبر را هم بگیرد — آدرسی که با
   *    هیچ مسیری مطابقت ندارد، به لایوت گروه (shop) نمی‌رسد.
   *
   *    اما همچنان به هدر و فوتر نیاز دارد تا کاربر گم‌شده راه
   *    برگشت داشته باشد؛ پس پوسته را مستقیم فرا می‌خواند.
   *
   *    زبان از routing خوانده می‌شود نه از params، چون Next این
   *    کامپوننت را بیرون از context مسیر رندر می‌کند.
   */
  return (
    <ShopChrome locale={routing.defaultLocale}>
    <main
      id="main-content"
      className="mx-auto flex max-w-(--container-content) flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8"
    >
      <SearchX className="size-16 text-muted-foreground" aria-hidden="true" />

      <p className="mt-6 text-5xl font-black text-primary tabular-nums">404</p>

      <h1 className="mt-3 text-xl font-bold text-foreground sm:text-2xl">
        صفحه یافت نشد
        <span className="mx-2 text-muted-foreground" aria-hidden="true">·</span>
        Page not found
      </h1>

      <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
        صفحه‌ای که دنبال آن بودید وجود ندارد یا حذف شده است.
        <br />
        The page you were looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-(--radius-md) bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          بازگشت به خانه · Back home
        </Link>

        <Link
          href="/products"
          className="inline-flex h-11 items-center justify-center rounded-(--radius-md) border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          مشاهده محصولات · Browse products
        </Link>
      </div>
    </main>
    </ShopChrome>
  )
}
