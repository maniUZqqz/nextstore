/**
 * بازبینی کنترل‌های هدر در عرض‌های مختلف
 * ---------------------------------------------------------------------------
 * سؤالی که این اسکریپت جواب می‌دهد: در هر عرض صفحه، آیا کاربر راهی
 * برای تغییر زبان و تم دارد؟
 *
 * دو کنترل در دو جا هستند:
 *   عرض ≥ ۱۰۲۴  → مستقیم در نوار هدر (hidden lg:flex)
 *   عرض < ۱۰۲۴  → داخل کشوی منو (دکمه‌ی همبرگر با lg:hidden)
 *
 * اسکریپت هر دو مسیر را می‌سنجد و می‌گوید در کدام عرض کدام‌یک
 * واقعاً *دیده* می‌شود — نه اینکه صرفاً در DOM باشد.
 *
 * اجرا:  node scripts/shots-header.mjs
 * خروجی: پوشه .shots/ و گزارش متنی
 */

import { chromium } from 'playwright-core'
import { mkdirSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.SHOTS_BASE_URL ?? 'http://127.0.0.1:3100'
const OUT = '.shots'

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

/** عرض‌های شاخص — دو طرف هر برک‌پوینت مهم. */
const WIDTHS = [
  { id: '1440-desktop', width: 1440 },
  { id: '1100-laptop', width: 1100 },
  { id: '1023-just-below-lg', width: 1023 },
  { id: '920-user-window', width: 920 },
  { id: '768-md-edge', width: 768 },
  { id: '767-just-below-md', width: 767 },
  { id: '820-tablet', width: 820 },
  { id: '390-mobile', width: 390 },
]

if (!existsSync(OUT)) mkdirSync(OUT)

const browser = await chromium.launch({ executablePath: findChromium() })
let problems = 0

console.log('عرض            زبان(هدر)  تم(هدر)  همبرگر  زبان(کشو)  تم(کشو)')
console.log('─'.repeat(70))

for (const { id, width } of WIDTHS) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    locale: 'fa-IR',
  })
  const page = await context.newPage()

  try {
    await page.goto(BASE + '/fa', { waitUntil: 'networkidle', timeout: 45000 })
    await page.waitForTimeout(1200)

    /*
     * isVisible و نه count: هر دو کنترل همیشه در DOM هستند و فقط با
     * کلاس‌های Tailwind پنهان می‌شوند. شمردن عناصر چیزی نمی‌گوید؛
     * سؤال این است که کاربر آن‌ها را *می‌بیند* یا نه.
     */
    const header = page.locator('header')
    const localeInHeader = await header.getByRole('button', { name: /English|فارسی/ }).first().isVisible().catch(() => false)
    const themeInHeader = await header.locator('button[title]').filter({ hasNotText: /.+/ }).first().isVisible().catch(() => false)

    /* دکمه‌ی همبرگر */
    const burger = header.locator('button.lg\\:hidden').first()
    const burgerVisible = await burger.isVisible().catch(() => false)

    let localeInDrawer = false
    let themeInDrawer = false

    if (burgerVisible) {
      await burger.click()
      await page.waitForTimeout(600)

      /* کشو یک عنصر ثابت روی صفحه است */
      const drawer = page.locator('aside, [role="dialog"], .fixed').filter({ hasText: /زبان|تم|روشن|تاریک|English/ }).first()
      localeInDrawer = await drawer.getByRole('button', { name: /English|فارسی/ }).first().isVisible().catch(() => false)
      themeInDrawer = await drawer.locator('button[title]').first().isVisible().catch(() => false)
    }

    const mark = (v) => (v ? '  ✓    ' : '  ✗    ')
    console.log(
      id.padEnd(22) +
      mark(localeInHeader) + mark(themeInHeader) + mark(burgerVisible) +
      mark(localeInDrawer) + mark(themeInDrawer),
    )

    /*
      شکست واقعی: در این عرض هیچ راهی برای تغییر زبان یا تم نیست.
      یعنی نه در هدر دیده می‌شود و نه در کشو.
    */
    const localeReachable = localeInHeader || localeInDrawer
    const themeReachable = themeInHeader || themeInDrawer
    if (!localeReachable || !themeReachable) {
      problems++
      console.log(`   ⚠ در عرض ${width}px: ${!localeReachable ? 'زبان ' : ''}${!themeReachable ? 'تم ' : ''}در دسترس نیست`)
    }

    const file = OUT + '/header--' + id + '.png'
    await page.screenshot({ path: file, clip: { x: 0, y: 0, width, height: 260 } })
  } catch (error) {
    problems++
    console.log(id.padEnd(22) + '  خطا: ' + error.message.split('\n')[0].slice(0, 60))
  }

  await context.close()
}

await browser.close()
console.log('\n' + (problems === 0 ? 'در همه‌ی عرض‌ها هر دو کنترل در دسترس‌اند ✅' : problems + ' عرض مشکل دارد ⚠'))
