'use client'

/**
 * پورتال — رندر محتوا بیرون از درخت DOM والد
 * ---------------------------------------------------------------------------
 * ⚠️ چرا این کامپوننت لازم شد؟ (باگ واقعی که در بازبینی چشمی پیدا شد)
 *
 *    هدر سایت این کلاس‌ها را دارد:
 *        <header className="sticky top-0 backdrop-blur-md">
 *
 *    ویژگی `backdrop-filter` (و همچنین `filter`، `transform` و
 *    `will-change`) یک **containing block** جدید می‌سازد. یعنی هر
 *    فرزندی که `position: fixed` باشد، به‌جای viewport نسبت به همان
 *    عنصر جای‌گذاری می‌شود.
 *
 *    نتیجه: کشوی منوی موبایل که `fixed inset-y-0` داشت، داخل کادر
 *    ۶۴ پیکسلی هدر حبس می‌شد — نه تمام‌قد بود، نه پس‌زمینه‌اش کل
 *    صفحه را می‌پوشاند. منو عملاً شکسته بود.
 *
 *    راه‌حل: کشو با createPortal مستقیم به <body> منتقل می‌شود، پس
 *    از containing block هدر خارج است و `fixed` دوباره نسبت به
 *    viewport معنا پیدا می‌کند.
 *
 * نکته SSR: در سرور، `document` وجود ندارد. تا mount شدن چیزی رندر
 * نمی‌شود تا خطای hydration رخ ندهد.
 */

import { createPortal } from 'react-dom'
import { useIsMounted } from '@/hooks/useIsMounted'

export function Portal({ children }: { children: React.ReactNode }) {
  const mounted = useIsMounted()

  if (!mounted) return null

  return createPortal(children, document.body)
}
