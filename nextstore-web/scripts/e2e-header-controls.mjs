/**
 * تست کنترل‌های هدر: تعویض تم و زبان
 * ---------------------------------------------------------------------------
 * ⚠️ چرا این تست وجود دارد؟
 *
 *    هر دو کنترل از ابتدا در کد بودند، ولی زیر عرض ۱۰۲۴ پیکسل از
 *    هدر ناپدید می‌شدند و فقط داخل کشوی همبرگر می‌ماندند. چون
 *    پنجره‌ی مرورگر روی لپ‌تاپ معمولاً ۹۰۰ تا ۱۰۰۰ پیکسل است، عملاً
 *    بیشتر کاربران هیچ‌وقت آن‌ها را نمی‌دیدند و نتیجه می‌گرفتند که
 *    سایت دارک‌مود یا تعویض زبان ندارد.
 *
 *    مشکل دوم: آیکون تم در حالت «سیستم» یک مانیتور بود. سیستم حالت
 *    پیش‌فرض است، پس همه همیشه مانیتور می‌دیدند — و کسی برای عوض
 *    کردن تم دنبال مانیتور نمی‌گردد.
 *
 *    این تست هر دو را می‌سنجد: هم دیده شدن در عرض واقعی لپ‌تاپ، هم
 *    اینکه کلیک واقعاً کار کند.
 *
 * پیش‌نیاز: فرانت‌اند در حال اجرا.
 *
 * اجرا:
 *     node scripts/e2e-header-controls.mjs
 */

import { chromium } from 'playwright-core'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.SHOTS_BASE_URL ?? 'http://127.0.0.1:3100'

let pass = 0, fail = 0
const check = (label, ok, extra = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'} ${label}${extra ? '  -> ' + extra : ''}`)
  if (ok) pass++
  else fail++
}

function findChromium() {
  const cacheDir = join(process.env.LOCALAPPDATA, 'ms-playwright')
  const dir = readdirSync(cacheDir).find(
    (d) => d.startsWith('chromium-') && !d.includes('headless'),
  )
  if (!dir) throw new Error('مرورگر Chromium در کش پیدا نشد')
  for (const inner of ['chrome-win64', 'chrome-win']) {
    const candidate = join(cacheDir, dir, inner, 'chrome.exe')
    if (existsSync(candidate)) return candidate
  }
  throw new Error('chrome.exe در ' + dir + ' پیدا نشد')
}

const browser = await chromium.launch({ executablePath: findChromium() })

/*
 * عرض ۹۲۰ عمداً انتخاب شده: پنجره‌ی معمول یک لپ‌تاپ، و همان عرضی
 * که در آن باگ اصلی گزارش شد. اگر روزی برک‌پوینت دوباره بالا برود،
 * همین‌جا قرمز می‌شود.
 */
const context = await browser.newContext({
  viewport: { width: 920, height: 800 },
  locale: 'fa-IR',
  colorScheme: 'light',
})
const page = await context.newPage()

await page.goto(BASE + '/fa', { waitUntil: 'networkidle', timeout: 45000 })
await page.waitForTimeout(1500)

/** کلاس تم روی ریشه‌ی سند — چیزی که کاربر واقعاً می‌بیند. */
const rootClass = () => page.evaluate(() => document.documentElement.className)
/** حالت انتخاب‌شده — next-themes آن را در localStorage نگه می‌دارد. */
const storedTheme = () => page.evaluate(() => localStorage.getItem('theme'))

/* دکمه‌ی تم: تنها دکمه‌ی هدر با title که متن زبان ندارد */
const themeBtn = page.locator('header button[title]').filter({ hasNotText: /English|فارسی/ }).first()
const localeBtn = page.locator('header button').filter({ hasText: 'English' }).first()

/* ============ 1. دیده شدن در عرض لپ‌تاپ ============ */
console.log('--- 1. visible at laptop width (920px) ---')
{
  check('theme button in header', await themeBtn.isVisible())
  check('locale button in header', await localeBtn.isVisible())
}

/* ============ 2. آیکون قابل تشخیص ============ */
console.log('\n--- 2. recognisable icon ---')
{
  /*
    آیکون باید خورشید یا ماه باشد. lucide نام آیکون را در کلاس
    می‌گذارد (lucide-sun / lucide-moon)، پس می‌شود مستقیم سنجید.
  */
  const iconClass = await themeBtn.locator('svg').first().getAttribute('class')
  check(
    'icon is sun or moon, not a monitor',
    /lucide-sun|lucide-moon/.test(iconClass ?? ''),
    iconClass?.split(' ').find((c) => c.startsWith('lucide-')) ?? '',
  )
}

/* ============ 3. چرخه‌ی تم ============ */
console.log('\n--- 3. theme cycle ---')
{
  /*
    چرخه: سیستم → روشن → تاریک → سیستم
    کلیک اول لزوماً *ظاهر* را عوض نمی‌کند (اگر سیستم روی روشن باشد،
    «سیستم» و «روشن» یک نتیجه می‌دهند). پس حالت ذخیره‌شده سنجیده
    می‌شود، نه فقط کلاس ریشه.
  */
  const seenClasses = new Set([await rootClass()])
  const seenThemes = new Set([await storedTheme()])

  for (let i = 0; i < 3; i++) {
    await themeBtn.click()
    await page.waitForTimeout(450)
    seenClasses.add(await rootClass())
    seenThemes.add(await storedTheme())
  }

  check('stored theme changes on click', seenThemes.size >= 3, [...seenThemes].join(' → '))
  check('dark actually applied', [...seenClasses].some((c) => c.includes('dark')), [...seenClasses].join(' | '))
  check('light actually applied', [...seenClasses].some((c) => c.includes('light')), [...seenClasses].join(' | '))
}

/* ============ 4. تعویض زبان ============ */
console.log('\n--- 4. locale switch ---')
{
  await localeBtn.click()
  await page.waitForURL(/\/en/, { timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(1200)

  check('navigated to english', page.url().includes('/en'), new URL(page.url()).pathname)

  const dir = await page.evaluate(() => document.documentElement.dir)
  check('direction flipped to ltr', dir === 'ltr', dir)

  /* و برگشت */
  const backBtn = page.locator('header button').filter({ hasText: 'فارسی' }).first()
  check('reverse switch offered', await backBtn.isVisible())

  await backBtn.click()
  await page.waitForURL(/\/fa/, { timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(1200)

  const dirBack = await page.evaluate(() => document.documentElement.dir)
  check('direction back to rtl', dirBack === 'rtl', dirBack)
}

/* ============ 5. حفظ تم پس از رفرش ============ */
console.log('\n--- 5. theme survives reload ---')
{
  const themeBefore = await storedTheme()
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  const themeAfter = await storedTheme()
  check('theme persisted', themeAfter === themeBefore, `${themeBefore} → ${themeAfter}`)
}

await browser.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
