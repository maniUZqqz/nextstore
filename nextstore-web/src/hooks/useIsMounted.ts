'use client'

/**
 * هوک تشخیص «آیا روی مرورگر هستیم؟»
 * ---------------------------------------------------------------------------
 * چند کامپوننت این پروژه چیزی را نشان می‌دهند که سرور از آن خبر ندارد:
 * شمارنده‌ی سبد و علاقه‌مندی (از localStorage)، پورتال (به `document`
 * نیاز دارد)، و شمارش معکوس (به `Date.now()` وابسته است). اگر همان
 * لحظه‌ی اول رندر شوند، HTML سرور با HTML کلاینت فرق می‌کند و
 * hydration می‌شکند.
 *
 * ⚠️ الگوی رایج برای این کار **غلط** است:
 *
 *        const [mounted, setMounted] = useState(false)
 *        useEffect(() => setMounted(true), [])
 *
 *    این کد کار می‌کند ولی یک رندر اضافه تحمیل می‌کند: React یک‌بار
 *    با `false` رندر می‌کند، افکت اجرا می‌شود، state عوض می‌شود و
 *    دوباره رندر می‌کند. قانون `react-hooks/set-state-in-effect`
 *    دقیقاً همین رندرهای آبشاری را می‌گیرد و `pnpm lint` را می‌شکند.
 *
 * راه درست `useSyncExternalStore` است — همان API‌ای که React برای
 * «مقداری که در سرور و کلاینت فرق دارد» ساخته:
 *
 *   - snapshot سرور همیشه `false` است  → HTML سرور بدون شمارنده
 *   - snapshot کلاینت همیشه `true` است → پس از hydration با شمارنده
 *
 * چون هرگز تغییر نمی‌کنند، `subscribe` هیچ‌وقت چیزی را خبر نمی‌دهد و
 * تابع لغو اشتراکش کاری ندارد.
 */

import { useSyncExternalStore } from 'react'

/**
 * اشتراک تهی.
 *
 * ⚠️ بیرون از هوک تعریف شده و نه داخلش. اگر هر بار یک تابع تازه ساخته
 *    شود، `useSyncExternalStore` آن را تغییر منبع تفسیر می‌کند و در
 *    هر رندر دوباره مشترک می‌شود.
 */
const subscribe = () => () => {}

const getClientSnapshot = () => true
const getServerSnapshot = () => false

/**
 * تا پایان hydration `false` و پس از آن `true` برمی‌گرداند.
 *
 * @example
 * const mounted = useIsMounted()
 * if (!mounted) return null
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)
}
