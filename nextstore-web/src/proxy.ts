/**
 * پروکسی برنامه — اولین کدی که برای هر درخواست اجرا می‌شود
 * ---------------------------------------------------------------------------
 * 📌 در Next.js 16 نام این فایل از «middleware» به «proxy» تغییر کرده است.
 *    کارکرد یکسان است: قبل از رسیدن درخواست به صفحه، اینجا پردازش می‌شود.
 *
 * مسئولیت‌ها:
 *   ۱. تشخیص زبان از روی مسیر URL و هدایت کاربر در صورت نبود پیشوند زبان
 *      مثال: کاربر «/products» می‌زند → به «/fa/products» هدایت می‌شود
 *   ۲. محافظت از مسیرهای خصوصی (پنل کاربری و پنل ادمین)
 *      کاربر بدون توکن → هدایت به صفحه ورود با حفظ مقصد اولیه
 *
 * ⚠️ نکته امنیتی: این بررسی فقط برای «تجربه کاربری» است، نه امنیت واقعی.
 *    امنیت واقعی در بک‌اند لاراول با Sanctum و Policy اعمال می‌شود.
 *    هرگز به بررسی سمت کلاینت به‌عنوان لایه امنیتی تکیه نکن.
 */

import createIntlMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

/** میدل‌ور آماده‌ی next-intl که کار تشخیص و هدایت زبان را انجام می‌دهد. */
const intlProxy = createIntlMiddleware(routing)

/**
 * مسیرهایی که فقط کاربر لاگین‌کرده اجازه‌ی دیدنشان را دارد.
 * مسیرها بدون پیشوند زبان نوشته می‌شوند چون قبل از مقایسه، پیشوند حذف می‌شود.
 */
const PROTECTED_PATHS = ['/account', '/checkout', '/admin']

/**
 * مسیرهایی که فقط کاربر مهمان باید ببیند.
 * کاربری که از قبل وارد شده، نباید صفحه‌ی ورود را ببیند.
 */
const GUEST_ONLY_PATHS = ['/login', '/register', '/forgot-password']

export default function proxy(request: NextRequest) {
  /* ---------------------------------------------------------------------
   * گام ۱: مدیریت زبان
   * اگر مسیر پیشوند زبان نداشته باشد، اینجا ریدایرکت تولید می‌شود.
   * ------------------------------------------------------------------- */
  const response = intlProxy(request)

  /* ---------------------------------------------------------------------
   * گام ۲: استخراج مسیر بدون پیشوند زبان
   * «/fa/account/orders» → «/account/orders»
   * ------------------------------------------------------------------- */
  const { pathname } = request.nextUrl
  const segments = pathname.split('/').filter(Boolean)
  const locale = routing.locales.includes(segments[0] as never)
    ? segments[0]
    : routing.defaultLocale
  const pathWithoutLocale = '/' + segments.slice(1).join('/')

  /* ---------------------------------------------------------------------
   * گام ۳: بررسی وضعیت ورود کاربر
   * توکن در کوکی نگهداری می‌شود تا میدل‌ور (که سمت سرور اجرا می‌شود)
   * بتواند آن را بخواند — localStorage در میدل‌ور در دسترس نیست.
   * ------------------------------------------------------------------- */
  const token = request.cookies.get('auth_token')?.value
  const isAuthenticated = Boolean(token)

  const isProtected = PROTECTED_PATHS.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(`${p}/`),
  )
  const isGuestOnly = GUEST_ONLY_PATHS.some((p) => pathWithoutLocale === p)

  /* کاربر مهمان که سراغ مسیر خصوصی رفته → صفحه ورود */
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL(`/${locale}/login`, request.url)
    // مقصد اولیه را نگه می‌داریم تا بعد از ورود، کاربر به همان‌جا برگردد
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  /* کاربر لاگین‌کرده که سراغ صفحه ورود رفته → داشبورد */
  if (isGuestOnly && isAuthenticated) {
    return NextResponse.redirect(new URL(`/${locale}/account`, request.url))
  }

  return response
}

/**
 * تعیین اینکه پروکسی روی چه مسیرهایی اجرا شود.
 * موارد زیر کنار گذاشته می‌شوند تا بی‌دلیل پردازش نشوند:
 *   api      → روت‌هندلرهای داخلی Next
 *   _next    → فایل‌های بیلد و بهینه‌سازی تصویر
 *   _vercel  → ابزارهای داخلی ورسل
 *   *.*      → فایل‌های استاتیک (png, svg, ico, woff2, ...)
 */
export const config = {
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
}
