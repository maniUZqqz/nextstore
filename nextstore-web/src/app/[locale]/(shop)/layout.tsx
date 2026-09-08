/**
 * لایوت مسیرهای فروشگاه
 * ---------------------------------------------------------------------------
 * (shop) یک «گروه مسیر» است: پرانتز باعث می‌شود این پوشه در آدرس
 * ظاهر **نشود**. یعنی /fa/products همان /fa/products می‌ماند و هیچ
 * لینکی نمی‌شکند — فقط یک لایه‌ی لایوت اضافه می‌شود.
 *
 * ⚠️ چرا این گروه ساخته شد؟
 *    هدر و فوتر پیش‌تر در لایوت [locale] بودند و روی همه‌ی مسیرها
 *    اعمال می‌شدند، از جمله /admin. نتیجه: پنل مدیریت نوار تبلیغاتی
 *    فروشگاه، منوی مگا و فرم عضویت در خبرنامه را نشان می‌داد.
 *
 *    حالا مرز روشن است:
 *        (shop)/  → پوسته‌ی فروشگاه (هدر، فوتر، ناوبری پایین)
 *        admin/   → پوسته‌ی مینیمال پنل مدیریت
 */

import { setRequestLocale } from 'next-intl/server'
import { ShopChrome } from '@/components/layout/ShopChrome'

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <ShopChrome locale={locale}>{children}</ShopChrome>
}
