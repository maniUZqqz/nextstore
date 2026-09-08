'use client'

/**
 * ترکیب‌کننده‌ی تمام Provider های برنامه
 * ---------------------------------------------------------------------------
 * به‌جای اینکه لایوت پر از Provider های تودرتو شود، همه را اینجا جمع می‌کنیم.
 *
 * ترتیب مهم است — از بیرون به داخل:
 *   ۱. ThemeProvider  → باید بیرونی‌ترین باشد تا کلاس تم روی <html> بنشیند
 *   ۲. QueryProvider  → مدیریت داده‌های سرور
 *   ۳. Toaster        → نمایش پیام‌های موفقیت و خطا (باید داخل تم باشد)
 */

import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { QueryProvider } from './QueryProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      /* کلاس .dark روی <html> گذاشته می‌شود (نه data-attribute) */
      attribute="class"
      /* پیش‌فرض: از تنظیمات سیستم‌عامل کاربر پیروی کن */
      defaultTheme="system"
      enableSystem
      /* غیرفعال کردن ترنزیشن هنگام تعویض تم — جلوگیری از فلاش رنگی */
      disableTransitionOnChange
      /* کلید ذخیره در localStorage — باید با اسکریپت داخل layout یکی باشد */
      storageKey="theme"
    >
      <QueryProvider>
        {children}

        {/*
          Toaster پیام‌های کوتاه (موفقیت افزودن به سبد، خطای شبکه و...) را
          نمایش می‌دهد. richColors رنگ‌های معنایی را فعال می‌کند و
          closeButton امکان بستن دستی می‌دهد.
        */}
        <Toaster
          position="bottom-center"
          richColors
          closeButton
          /* در RTL پیام‌ها هم باید راست‌چین باشند */
          dir="auto"
          toastOptions={{
            classNames: {
              toast: 'font-sans',
            },
          }}
        />
      </QueryProvider>
    </ThemeProvider>
  )
}
