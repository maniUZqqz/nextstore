/**
 * تولید تصویر شاخص مقالات مجله
 * ---------------------------------------------------------------------------
 * همان دلیل تصاویر محصول: عکس واقعی یعنی وابستگی به شبکه، حجم بالا و
 * ریسک حق تصویر. SVG تولیدشده هیچ‌کدام را ندارد.
 *
 * ⚠️ تفاوت با تصاویر محصول: کاور مقاله عریض است (نسبت ۱۶:۹) نه
 *    مربع، چون در کارت مقاله و بالای صفحه‌ی مقاله به‌صورت بنر
 *    نمایش داده می‌شود.
 *
 * اجرا:  node scripts/generate-post-covers.mjs
 * خروجی: public/posts/<slug>.svg
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'public', 'posts')

/**
 * کاور هر مقاله.
 * قالب: [نامک, رنگ روشن, رنگ تیره, رنگ خط, مسیر آیکون]
 *
 * رنگ‌ها با پالت دسته‌بندی مقاله هم‌خانواده‌اند تا فهرست مجله
 * یکدست دیده شود.
 */
const COVERS = [
  ['how-to-choose-a-phone', '#dbeafe', '#bfdbfe', '#1e40af',
    'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z M10 19h4'],
  ['laptop-buying-guide', '#e0e7ff', '#c7d2fe', '#3730a3',
    'M3 5h18v11H3z M2 20h20'],
  ['headphone-types', '#fce7f3', '#fbcfe8', '#9d174d',
    'M3 14v-3a9 9 0 0 1 18 0v3 M3 14a3 3 0 0 0 3 3h1v-6H6a3 3 0 0 0-3 3Z M21 14a3 3 0 0 1-3 3h-1v-6h1a3 3 0 0 1 3 3Z'],
  ['smartwatch-fitness', '#cffafe', '#a5f3fc', '#155e75',
    'M12 6v6l4 2 M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z'],
  ['kitchen-appliances-care', '#fef3c7', '#fde68a', '#92400e',
    'M5 3h14v18H5z M9 7h6 M9 12h6'],
  ['running-shoes-guide', '#ffedd5', '#fed7aa', '#9a3412',
    'M3 16h18v3H3z M3 16c0-4 3-5 5-7l2 2 3-2 2 3h6'],
  ['skincare-routine', '#fae8ff', '#f5d0fe', '#86198f',
    'M12 3c3 4 5 6 5 9a5 5 0 0 1-10 0c0-3 2-5 5-9Z'],
  ['reading-habit', '#dcfce7', '#bbf7d0', '#166534',
    'M4 4h7v16H4z M13 4h7v16h-7z'],
  ['safe-online-shopping', '#e0f2fe', '#bae6fd', '#0c4a6e',
    'M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Z M9 12l2 2 4-4'],
  ['gift-guide', '#fee2e2', '#fecaca', '#991b1b',
    'M3 10h18v11H3z M3 6h18v4H3z M12 6v15 M12 6C10 3 7 3 7 5s3 1 5 1Z M12 6c2-3 5-3 5-1s-3 1-5 1Z'],
]

/**
 * ساخت SVG کاور.
 *
 * الگوی نقطه‌چین + دایره‌ی نیمه‌شفاف + آیکون خطی وسط — همان زبان
 * بصری تصاویر محصول، تا مجله بخشی از همان سایت به نظر برسد.
 */
function cover(from, to, ink, icon) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675" role="img">
  <defs>
    <linearGradient id="bg" gradientTransform="rotate(160)">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <pattern id="dots" width="34" height="34" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.6" fill="${ink}" opacity="0.10"/>
    </pattern>
  </defs>

  <rect width="1200" height="675" fill="url(#bg)"/>
  <rect width="1200" height="675" fill="url(#dots)"/>

  <circle cx="600" cy="337" r="190" fill="#ffffff" opacity="0.42"/>

  <g transform="translate(516 253) scale(7)"
     fill="none" stroke="${ink}" stroke-width="1.5"
     stroke-linecap="round" stroke-linejoin="round" opacity="0.85">
    <path d="${icon}"/>
  </g>
</svg>
`
}

mkdirSync(OUT_DIR, { recursive: true })

for (const [slug, from, to, ink, icon] of COVERS) {
  writeFileSync(join(OUT_DIR, `${slug}.svg`), cover(from, to, ink, icon), 'utf8')
}

console.log(`${COVERS.length} post covers written to public/posts/`)
