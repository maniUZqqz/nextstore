/**
 * بررسی برابری کلیدهای ترجمه
 * ---------------------------------------------------------------------------
 * ⚠️ خطایی که این اسکریپت می‌گیرد، بی‌صداترین خطای این پروژه است.
 *
 *    `next-intl` کلید غایب را در حالت توسعه با **متن خودِ کلید** نشان
 *    می‌دهد («admin.banners.title» به‌جای «بنرهای صفحه‌ی اصلی»). یعنی
 *    اگر کسی کلیدی را فقط به `fa.json` اضافه کند، نسخه‌ی فارسی درست
 *    کار می‌کند و هیچ خطایی هم در کنسول نمی‌آید — تا وقتی کسی سایت را
 *    انگلیسی باز کند.
 *
 *    در تولید بدتر است: next-intl استثنا پرتاب می‌کند و کل صفحه
 *    می‌افتد.
 *
 * ⚠️ ساختار **تودرتو** مقایسه می‌شود نه فقط سطح اول.
 *
 *    نسخه‌ی اول این بررسی فقط کلیدهای ریشه را می‌شمرد و «۱۱۲۸ = ۱۱۲۸»
 *    می‌گفت در حالی که `contact.tooMany` فقط در فارسی بود.
 *
 * ⚠️ بررسی دوم: نشتِ فضای `admin` به مسیرهای فروشگاهی.
 *
 *    بسته‌ی پیام صفحه‌های فروشگاه عمداً فضای `admin` را ندارد
 *    (`withoutAdminMessages` در src/i18n/messages.ts) چون چند صد کلید
 *    پنل، بی‌دلیل به مرورگر هر بازدیدکننده می‌رفت. نتیجه‌اش این است که
 *    هر کامپوننتِ بیرون از پنل که `useTranslations('admin')` بزند، در
 *    تولید صفحه را با MISSING_MESSAGE می‌اندازد.
 *
 *    این واقعاً اتفاق افتاد: `AdminPagination` برای یک کلید («صفحه X
 *    از Y») به فضای admin وصل بود و در `components/account/` هم
 *    استفاده می‌شد. صفحه‌ی اعلان‌ها و تیکت‌های کاربر به‌محض رسیدن به
 *    صفحه‌ی دوم می‌افتادند — و چون صفحه‌بندی زیر یک صفحه اصلاً رندر
 *    نمی‌شود، با داده‌ی کم هیچ‌وقت دیده نمی‌شد.
 *
 * اجرا:
 *     node scripts/check-i18n.mjs
 *     pnpm check:i18n
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const LOCALES = ['fa', 'en']

/** همه‌ی مسیرهای کلید به‌صورت تخت: «admin.banners.title». */
function flatten(value, prefix = '') {
  const keys = new Set()

  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key
    keys.add(path)

    /*
     * ⚠️ آرایه‌ها باز نمی‌شوند.
     *
     *    next-intl آرایه را به‌عنوان یک مقدار می‌بیند، نه مجموعه‌ای از
     *    کلیدها. بازکردنشان یعنی دو زبان با تعداد عضو متفاوت به‌عنوان
     *    «کلید غایب» گزارش شوند، که ترجمه‌ی درست را خطا نشان می‌دهد.
     */
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      for (const nested of flatten(child, path)) keys.add(nested)
    }
  }

  return keys
}

const messages = {}
for (const locale of LOCALES) {
  try {
    messages[locale] = JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8'))
  } catch (error) {
    console.error(`✗ خواندن messages/${locale}.json ممکن نشد: ${error.message}`)
    process.exit(1)
  }
}

const keys = Object.fromEntries(
  LOCALES.map((locale) => [locale, flatten(messages[locale])]),
)

const [first, second] = LOCALES
const missingInSecond = [...keys[first]].filter((key) => !keys[second].has(key))
const missingInFirst = [...keys[second]].filter((key) => !keys[first].has(key))

for (const locale of LOCALES) {
  console.log(`  ${locale}: ${keys[locale].size} کلید`)
}

let failed = false

if (missingInSecond.length === 0 && missingInFirst.length === 0) {
  console.log('\n✓ هر دو زبان دقیقاً یک مجموعه کلید دارند')
} else {
  failed = true
  console.error('\n✗ کلیدها برابر نیستند\n')
}

/** چاپ فهرست غایب‌ها — با سقف، تا خروجی خوانا بماند. */
function report(label, list) {
  if (list.length === 0) return

  console.error(`  ${list.length} کلید در ${label} نیست:`)
  for (const key of list.slice(0, 25)) console.error(`    ${key}`)
  if (list.length > 25) console.error(`    … و ${list.length - 25} کلید دیگر`)
  console.error()
}

report(second, missingInSecond)
report(first, missingInFirst)

/* =========================================================================
 * بررسی دوم — فضای `admin` فقط در پنل
 * ====================================================================== */

/** مسیرهایی که اجازه‌ی استفاده از فضای `admin` را دارند. */
const ADMIN_ONLY_DIRS = [
  join('src', 'components', 'admin'),
  join('src', 'app', '[locale]', 'admin'),
]

/** همه‌ی فایل‌های ts/tsx زیر src. */
function sourceFiles(dir) {
  const found = []

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)

    if (entry.isDirectory()) {
      found.push(...sourceFiles(path))
    } else if (/\.tsx?$/.test(entry.name)) {
      found.push(path)
    }
  }

  return found
}

const ADMIN_NAMESPACE = /(?:use|get)Translations\(\s*['"`]admin(?:['"`.])/

const leaks = sourceFiles('src')
  .map((path) => relative('.', path))
  .filter((path) => !ADMIN_ONLY_DIRS.some((dir) => path.startsWith(dir + sep)))
  .filter((path) => ADMIN_NAMESPACE.test(readFileSync(path, 'utf8')))

if (leaks.length === 0) {
  console.log('✓ فضای admin فقط در پنل استفاده شده')
} else {
  failed = true
  console.error()
  console.error(
    `✗ ${leaks.length} فایل بیرون از پنل از فضای \`admin\` استفاده می‌کند:`,
  )
  console.error()
  for (const path of leaks) console.error(`    ${path}`)
  console.error()
  console.error(
    '  این فایل‌ها در مسیر فروشگاهی رندر می‌شوند و آنجا فضای admin وجود ندارد.',
  )
  console.error(
    '  کلید را به فضای `common` منتقل کن، نه اینکه فضا را باز بگذاری.',
  )
  console.error()
}

process.exit(failed ? 1 : 0)
