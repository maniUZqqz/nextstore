/**
 * تولید لوگوی مونوگرام برندها
 * ---------------------------------------------------------------------------
 * چرا مونوگرام و نه لوگوی واقعی؟
 *   برندهای این فروشگاه نمونه (اپل، سونی، نایکی…) علامت تجاری ثبت‌شده
 *   دارند. گذاشتن لوگوی اصلی‌شان در یک نمونه‌کار هم مسئله‌ی حقوقی
 *   دارد و هم پروژه را به فایل‌های بیرونی وابسته می‌کند.
 *
 *   مونوگرامِ حرف اول، هویت بصری کافی برای کارت برند می‌سازد،
 *   بدون هیچ ادعای مالکیتی.
 *
 * ⚠️ نکته‌ی دوزبانه: حرف نمایش‌داده‌شده از نام **انگلیسی** گرفته
 *    می‌شود، نه فارسی. دلیل: مونوگرام یک عنصر گرافیکی ثابت است و
 *    نباید با تعویض زبان تغییر کند — کاربر لوگو را به‌عنوان شکل
 *    به خاطر می‌سپارد، نه به‌عنوان متن.
 *
 * اجرا:  node scripts/generate-brand-logos.mjs
 * خروجی: public/brands/<slug>.svg
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'public', 'brands')

/**
 * برندها با رنگ شاخص هرکدام.
 * قالب: [نامک، متن مونوگرام، رنگ پس‌زمینه، رنگ متن]
 *
 * رنگ‌ها کم‌اشباع انتخاب شده‌اند تا شبکه‌ی برندها یکدست بماند و
 * هیچ کارتی از بقیه فریاد نزند.
 */
const BRANDS = [
  ['apple', 'A', '#f1f5f9', '#0f172a'],
  ['samsung', 'S', '#e0f2fe', '#075985'],
  ['xiaomi', 'Mi', '#ffedd5', '#9a3412'],
  ['sony', 'SONY', '#f1f5f9', '#1e293b'],
  ['lg', 'LG', '#fce7f3', '#9d174d'],
  ['asus', 'ASUS', '#ede9fe', '#5b21b6'],
  ['lenovo', 'L', '#fee2e2', '#991b1b'],
  ['nike', 'N', '#f5f5f4', '#1c1917'],
  ['adidas', 'A', '#e2e8f0', '#0f172a'],
  ['bosch', 'B', '#dbeafe', '#1e40af'],
  ['philips', 'P', '#e0f2fe', '#0c4a6e'],
  ['jbl', 'JBL', '#fef3c7', '#92400e'],
]

/**
 * ساخت یک SVG مونوگرام.
 *
 * اندازه‌ی فونت بر اساس طول متن تنظیم می‌شود؛ بدون آن «SONY» از
 * کادر بیرون می‌زد در حالی که «A» در وسط گم می‌شد.
 */
function monogram(text, background, ink) {
  const fontSize = text.length === 1 ? 150 : text.length === 2 ? 110 : 74

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320" role="img" aria-label="${text}">
  <rect width="320" height="320" rx="64" fill="${background}"/>
  <text
    x="160" y="160"
    fill="${ink}"
    font-family="Segoe UI, Arial, Helvetica, sans-serif"
    font-size="${fontSize}"
    font-weight="700"
    letter-spacing="${text.length > 2 ? 2 : 0}"
    text-anchor="middle"
    dominant-baseline="central"
  >${text}</text>
</svg>
`
}

mkdirSync(OUT_DIR, { recursive: true })

for (const [slug, text, background, ink] of BRANDS) {
  writeFileSync(join(OUT_DIR, `${slug}.svg`), monogram(text, background, ink), 'utf8')
}

console.log(`${BRANDS.length} brand logos written to public/brands/`)
