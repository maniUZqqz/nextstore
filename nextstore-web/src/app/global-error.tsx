'use client'

/**
 * مرز خطای سراسری — آخرین تور ایمنی
 * ---------------------------------------------------------------------------
 * فقط وقتی اجرا می‌شود که خودِ `[locale]/layout.tsx` هنگام رندر بشکند:
 * مثلاً زبان نامعتبر باشد یا بارگذاری فایل ترجمه شکست بخورد.
 *
 * ⚠️ سه محدودیت که این فایل را با بقیه‌ی صفحات متفاوت می‌کند:
 *
 *    ۱. باید خودش <html> و <body> بسازد. لایوتی که این تگ‌ها را
 *       می‌ساخت همان چیزی است که شکسته، پس چیزی بالای این کامپوننت
 *       باقی نمانده.
 *
 *    ۲. `useTranslations` در دسترس نیست — NextIntlClientProvider هم
 *       داخل همان لایوت شکسته بود. پس متن **هاردکد و دوزبانه** است،
 *       دقیقاً مثل صفحه‌ی ۴۰۴. این تنها استثنای قاعده‌ی i18n پروژه است.
 *
 *    ۳. جهت نوشتار هم معلوم نیست (زبان از params می‌آمد). با `dir="rtl"`
 *       پیش‌فرض فارسی گرفته می‌شود و متن انگلیسی داخل span با dir خودش
 *       تنظیم می‌شود.
 *
 * ⚠️ کلاس‌های Tailwind اینجا کار می‌کنند چون globals.css در بیلد به
 *    کل برنامه تزریق می‌شود، ولی متغیرهای تم (که اسکریپت ضدپرش روی
 *    <html> می‌گذاشت) وجود ندارند. برای همین رنگ‌ها با مقدار مستقیم
 *    نوشته شده‌اند نه با توکن — وگرنه ممکن بود متن روی پس‌زمینه‌ی
 *    هم‌رنگ خودش نامرئی شود.
 */

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[global error boundary]', error)
  }, [error])

  return (
    <html lang="fa" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#fafafa',
          color: '#18181b',
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '28rem' }}>
          <p style={{ fontSize: '48px', margin: 0 }} aria-hidden="true">
            ⚠️
          </p>

          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '16px 0 0' }}>
            مشکلی پیش آمد
            <span style={{ margin: '0 8px', opacity: 0.5 }} aria-hidden="true">
              ·
            </span>
            <span dir="ltr">Something went wrong</span>
          </h1>

          <p style={{ fontSize: '14px', lineHeight: 1.8, opacity: 0.7, margin: '12px 0 0' }}>
            برنامه به مشکل غیرمنتظره‌ای خورد. لطفاً دوباره تلاش کنید.
            <br />
            <span dir="ltr">The application hit an unexpected error. Please try again.</span>
          </p>

          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '28px',
              height: '44px',
              padding: '0 28px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#fff',
              background: '#4f46e5',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            تلاش دوباره · Try again
          </button>

          {error.digest && (
            <p style={{ marginTop: '28px', fontSize: '12px', opacity: 0.55 }}>
              کد خطا · Error ref:{' '}
              <code dir="ltr" style={{ fontFamily: 'monospace' }}>
                {error.digest}
              </code>
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
