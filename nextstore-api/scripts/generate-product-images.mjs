/**
 * تولید تصاویر محصول
 * ---------------------------------------------------------------------------
 * چرا این اسکریپت لازم شد؟
 *   سیدر قبلاً از picsum.photos استفاده می‌کرد که عکس‌های تصادفی
 *   (جنگل، جاده، دریا) می‌داد. نتیجه: «آیفون ۱۵ پرو مکس» با عکس جنگل
 *   نمایش داده می‌شد و کل پروژه شبیه یک دموی ناتمام به نظر می‌رسید.
 *
 * راه‌حل: تصویر SVG اختصاصی برای هر دسته با
 *   - گرادیان رنگی متناسب با دسته
 *   - آیکون خطی محصول
 *   - الگوی ظریف پس‌زمینه
 *
 * مزیت نسبت به عکس واقعی: بدون وابستگی به شبکه، حجم بسیار کم،
 * و هماهنگ با هویت بصری فروشگاه.
 *
 * اجرا:  node scripts/generate-product-images.mjs
 * خروجی: public/products/<slug>-<n>.svg
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'public', 'products')

/**
 * پالت رنگ و آیکون هر دسته.
 * رنگ‌ها روشن و کم‌اشباع‌اند تا کارت محصول شلوغ نشود و
 * برچسب تخفیف روی آن‌ها خوانا بماند.
 */
const CATEGORIES = {
  'mobile-phones': {
    from: '#dbeafe', to: '#bfdbfe', ink: '#1e40af',
    // گوشی موبایل
    icon: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z M10 19h4',
  },
  laptops: {
    from: '#e0e7ff', to: '#c7d2fe', ink: '#3730a3',
    // لپ‌تاپ
    icon: 'M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v11H4V5Z M2 18h20l-1.5 2H3.5L2 18Z',
  },
  tablets: {
    from: '#ede9fe', to: '#ddd6fe', ink: '#5b21b6',
    // تبلت
    icon: 'M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z M11 18h2',
  },
  headphones: {
    from: '#fce7f3', to: '#fbcfe8', ink: '#9d174d',
    // هدفون
    icon: 'M4 14v-2a8 8 0 0 1 16 0v2 M4 14h3v6H5a1 1 0 0 1-1-1v-5Z M20 14h-3v6h2a1 1 0 0 0 1-1v-5Z',
  },
  smartwatches: {
    from: '#cffafe', to: '#a5f3fc', ink: '#155e75',
    // ساعت هوشمند
    icon: 'M8 6h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z M9 6V3h6v3 M9 18v3h6v-3',
  },
  kitchen: {
    from: '#fef3c7', to: '#fde68a', ink: '#92400e',
    // قابلمه
    icon: 'M4 9h16v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9Z M2 9h20 M8 6V4 M12 6V4 M16 6V4',
  },
  cleaning: {
    from: '#d1fae5', to: '#a7f3d0', ink: '#065f46',
    // جاروبرقی
    icon: 'M9 3h6l1 9H8l1-9Z M6 12h12v3a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4v-3Z M12 19v3',
  },
  climate: {
    from: '#e0f2fe', to: '#bae6fd', ink: '#075985',
    // کولر
    icon: 'M3 6h18v7H3V6Z M6 16v3 M12 16v4 M18 16v3 M6 9h12',
  },
  'mens-clothing': {
    from: '#ffe4e6', to: '#fecdd3', ink: '#9f1239',
    // تیشرت
    icon: 'M8 3 4 6l2 3 2-1v12h8V8l2 1 2-3-4-3-2 2h-4L8 3Z',
  },
  'womens-clothing': {
    from: '#fae8ff', to: '#f5d0fe', ink: '#86198f',
    // پیراهن
    icon: 'M9 3h6l3 4-3 2 1 12H8l1-12-3-2 3-4Z',
  },
  shoes: {
    from: '#ffedd5', to: '#fed7aa', ink: '#9a3412',
    // کفش
    icon: 'M2 16h20v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-3Z M2 16l3-8h4l2 3 4 1 5 2v2',
  },
  bags: {
    from: '#f5f5f4', to: '#e7e5e4', ink: '#44403c',
    // کیف
    icon: 'M4 8h16l-1 12H5L4 8Z M9 8V6a3 3 0 0 1 6 0v2',
  },
  skincare: {
    from: '#fce7f3', to: '#fbcfe8', ink: '#831843',
    // قطره
    icon: 'M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z',
  },
  haircare: {
    from: '#ecfdf5', to: '#d1fae5', ink: '#065f46',
    // قیچی
    icon: 'M6 4 18 18 M18 4 6 18 M6 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z M18 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z',
  },
  'books-literature': {
    from: '#fef9c3', to: '#fef08a', ink: '#854d0e',
    // کتاب باز
    icon: 'M12 6C10 4 7 4 4 5v14c3-1 6-1 8 1 2-2 5-2 8-1V5c-3-1-6-1-8 1Z M12 6v14',
  },
  stationery: {
    from: '#e0e7ff', to: '#c7d2fe', ink: '#3730a3',
    // مداد
    icon: 'M4 20l1-5L16 4l4 4L9 19l-5 1Z M14 6l4 4',
  },
  fitness: {
    from: '#fee2e2', to: '#fecaca', ink: '#991b1b',
    // دمبل
    icon: 'M4 9v6 M7 6v12 M17 6v12 M20 9v6 M7 12h10',
  },
  camping: {
    from: '#dcfce7', to: '#bbf7d0', ink: '#166534',
    // چادر
    icon: 'M12 4 2 20h20L12 4Z M12 4v16 M7 20l5-8 5 8',
  },
}

/** پالت پیش‌فرض برای دسته‌های تعریف‌نشده. */
const FALLBACK = {
  from: '#f1f5f9', to: '#e2e8f0', ink: '#475569',
  icon: 'M4 7l8-4 8 4v10l-8 4-8-4V7Z M4 7l8 4 8-4 M12 11v10',
}

/**
 * ساخت SVG یک تصویر محصول.
 *
 * @param {object} palette  رنگ و آیکون دسته
 * @param {number} variant  شماره تصویر در گالری (۰ تا ۲) — زاویه و مقیاس را تغییر می‌دهد
 */
function buildSvg(palette, variant) {
  /* هر تصویر گالری کمی متفاوت است تا گالری یکنواخت به نظر نرسد */
  const angles = [135, 160, 110]
  const scales = [1, 0.82, 1.15]
  const angle = angles[variant % angles.length]
  const scale = scales[variant % scales.length]

  /* آیکون روی بوم ۲۴×۲۴ طراحی شده — به مرکز ۸۰۰×۸۰۰ منتقل و بزرگ می‌شود */
  const iconScale = (800 / 24) * 0.34 * scale
  const offset = 400 - (24 * iconScale) / 2

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" role="img">
  <defs>
    <linearGradient id="bg" gradientTransform="rotate(${angle})">
      <stop offset="0%" stop-color="${palette.from}"/>
      <stop offset="100%" stop-color="${palette.to}"/>
    </linearGradient>
    <pattern id="dots" width="34" height="34" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.6" fill="${palette.ink}" opacity="0.10"/>
    </pattern>
  </defs>

  <rect width="800" height="800" fill="url(#bg)"/>
  <rect width="800" height="800" fill="url(#dots)"/>

  <circle cx="400" cy="400" r="235" fill="#ffffff" opacity="0.42"/>

  <g transform="translate(${offset} ${offset}) scale(${iconScale})"
     fill="none" stroke="${palette.ink}" stroke-width="1.5"
     stroke-linecap="round" stroke-linejoin="round" opacity="0.85">
    <path d="${palette.icon}"/>
  </g>
</svg>
`
}

/* --------------------------------------------------------------------------
 * تولید فایل‌ها
 * ------------------------------------------------------------------------ */

mkdirSync(OUT_DIR, { recursive: true })

let count = 0

for (const [slug, palette] of Object.entries(CATEGORIES)) {
  for (let variant = 0; variant < 3; variant++) {
    writeFileSync(join(OUT_DIR, `${slug}-${variant}.svg`), buildSvg(palette, variant), 'utf8')
    count++
  }
}

/* تصویر پیش‌فرض برای دسته‌های بدون پالت اختصاصی */
for (let variant = 0; variant < 3; variant++) {
  writeFileSync(join(OUT_DIR, `default-${variant}.svg`), buildSvg(FALLBACK, variant), 'utf8')
  count++
}

console.log(`${count} تصویر SVG در public/products/ ساخته شد`)
