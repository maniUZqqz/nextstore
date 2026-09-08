/**
 * تست سرتاسری مقایسه‌ی محصولات — از داخل مرورگر واقعی
 * ---------------------------------------------------------------------------
 * چیزی که تست API نمی‌گیرد و اینجا گرفته می‌شود:
 *   - دکمه‌ی مقایسه روی کارت، کاربر را به صفحه‌ی محصول نمی‌برد
 *   - نوار شناور فقط وقتی چیزی انتخاب شده دیده می‌شود
 *   - سقف چهار محصول واقعاً اعمال می‌شود و پیام هشدار می‌دهد
 *   - فهرست پس از رفرش صفحه حفظ می‌شود (localStorage)
 *   - جدول یک ستون به ازای هر محصول می‌سازد
 *   - حذف یک ستون، هم جدول و هم نوار را به‌روز می‌کند
 *
 * ⚠️ این تست به هیچ حسابی نیاز ندارد — مقایسه کاملاً مهمان‌پذیر است.
 *
 * اجرا:
 *     node scripts/e2e-compare.mjs
 */

import { chromium } from 'playwright-core'
import { existsSync, readdirSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.SHOTS_BASE_URL ?? 'http://127.0.0.1:3100'
const OUT = '.shots'

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

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ executablePath: findChromium() })
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: 'fa-IR',
})
const page = await context.newPage()

const consoleErrors = []
page.on('pageerror', (e) => consoleErrors.push(e.message))
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text())
})

/** دکمه‌های مقایسه روی کارت‌های فهرست محصولات. */
const compareButtons = () => page.getByRole('button', { name: 'افزودن به مقایسه' })

/* ============ ۱. نوار شناور پیش از انتخاب دیده نمی‌شود ============ */
console.log('--- 1. bar hidden when nothing selected ---')
{
  await page.goto(BASE + '/fa/products', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)

  /* شروع تمیز — بازمانده‌ی اجرای قبلی نباید تست را گمراه کند */
  await page.evaluate(() => localStorage.removeItem('nextstore-compare'))
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  check('compare buttons rendered', (await compareButtons().count()) > 0,
    `count=${await compareButtons().count()}`)
  check('floating bar hidden', (await page.getByRole('link', { name: 'مقایسه کن' }).count()) === 0)
}

/* ============ ۲. کلیک روی دکمه، به صفحه‌ی محصول نمی‌برد ============ */
/*
 * ⚠️ کل کارت یک لینک است. بدون preventDefault و stopPropagation در
 *    دکمه، هر کلیک کاربر را از فهرست بیرون می‌برد — باگی که قابلیت را
 *    عملاً غیرقابل استفاده می‌کند.
 */
console.log('--- 2. clicking does not navigate away ---')
{
  const before = page.url()

  await compareButtons().first().click()
  await page.waitForTimeout(1200)

  check('still on the products page', page.url() === before, page.url().replace(BASE, ''))
  check('floating bar appeared', (await page.getByRole('link', { name: 'مقایسه کن' }).count()) === 1)
}

/* ============ ۳. سقف چهار محصول ============ */
console.log('--- 3. four-product cap ---')
{
  /* سه تای دیگر — مجموع چهار */
  for (const index of [1, 2, 3]) {
    await compareButtons().nth(index).click()
    await page.waitForTimeout(700)
  }

  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('nextstore-compare') ?? '{}')?.state?.slugs ?? [],
  )
  check('four products stored', stored.length === 4, `stored=${stored.length}`)

  /* پنجمی باید رد شود */
  await compareButtons().nth(4).click()
  await page.waitForTimeout(1500)

  const after = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('nextstore-compare') ?? '{}')?.state?.slugs ?? [],
  )
  check('fifth rejected', after.length === 4, `stored=${after.length}`)

  /*
   * ⚠️ بین **همه‌ی** toast های روی صفحه می‌گردیم، نه فقط آخری.
   *
   *    sonner چند پیام را روی هم می‌چیند و ترتیب DOM شان به موقعیت
   *    (bottom-center) بستگی دارد. نسخه‌ی اول این تست `.last()` را
   *    می‌خواند و پیام موفقیتِ افزودن چهارم را می‌گرفت — شکستی که
   *    شبیه «هشدار نمایش داده نشد» بود، در حالی که سقف درست کار
   *    می‌کرد.
   */
  const toasts = await page.locator('[data-sonner-toast]').allInnerTexts()
  check('warning toast explains the cap',
    toasts.some((text) => text.includes('حداکثر')),
    toasts.map((text) => text.split(String.fromCharCode(10)).join(' ').slice(0, 30)).join(' | '))

  await page.screenshot({ path: join(OUT, 'compare-bar--desktop-light.png'), fullPage: false })
}

/* ============ ۴. ماندگاری پس از رفرش ============ */
console.log('--- 4. survives a reload ---')
{
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)

  check('bar still there after reload',
    (await page.getByRole('link', { name: 'مقایسه کن' }).count()) === 1)
}

/* ============ ۵. جدول مقایسه ============ */
console.log('--- 5. the compare table ---')
{
  await page.getByRole('link', { name: 'مقایسه کن' }).click()
  await page.waitForURL(/\/compare/, { timeout: 20000 })
  await page.waitForTimeout(2500)

  /* یک ستون خالی برای نام ویژگی + چهار ستون محصول */
  const headerCells = await page.locator('main table thead th').count()
  check('five header cells (label + 4 products)', headerCells === 5, `cells=${headerCells}`)

  const rows = await page.locator('main table tbody tr').count()
  check('eight comparison rows plus the action row', rows === 9, `rows=${rows}`)

  /*
   * ⚠️ نوار شناور نباید در خود صفحه‌ی مقایسه دیده شود — لینکی به
   *    صفحه‌ی جاری فقط فضا می‌گیرد.
   */
  check('floating bar hidden on the compare page',
    (await page.getByRole('link', { name: 'مقایسه کن' }).count()) === 0)

  await page.screenshot({ path: join(OUT, 'compare-table--desktop-light.png'), fullPage: true })
}

/* ============ ۶. حذف یک ستون ============ */
console.log('--- 6. removing a column ---')
{
  await page.locator('main table thead button').first().click()
  await page.waitForTimeout(1500)

  const headerCells = await page.locator('main table thead th').count()
  check('one column fewer', headerCells === 4, `cells=${headerCells}`)
}

/* ============ ۷. پاک کردن کامل ============ */
console.log('--- 7. clearing the list ---')
{
  await page.getByRole('button', { name: 'پاک کردن فهرست' }).click()
  await page.waitForTimeout(1500)

  const body = await page.locator('main').innerText()
  check('empty state shown', body.includes('خالی است'), body.slice(0, 50).replace(/\n/g, ' '))
  check('table gone', (await page.locator('main table').count()) === 0)

  await page.screenshot({ path: join(OUT, 'compare-empty--desktop-light.png'), fullPage: false })
}

/* ============ ۸. انگلیسی و موبایل ============ */
console.log('--- 8. english + mobile ---')
{
  await page.goto(`${BASE}/en/compare`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)

  check('english is LTR', (await page.locator('html').getAttribute('dir')) === 'ltr')

  const h1 = await page.locator('main h1').first().innerText()
  check('heading translated', /compare/i.test(h1), `"${h1}"`)

  /* یک محصول اضافه می‌کنیم تا جدول در موبایل دیده شود */
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/fa/products`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)

  await compareButtons().first().click()
  await page.waitForTimeout(1000)
  await compareButtons().nth(1).click()
  await page.waitForTimeout(1000)

  await page.goto(`${BASE}/fa/compare`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  check('no horizontal overflow on the page body', overflow <= 1, `overflow=${overflow}px`)

  await page.screenshot({ path: join(OUT, 'compare-table--mobile-light.png'), fullPage: true })
}

/* ============ پاکسازی ============ */
await page.evaluate(() => localStorage.removeItem('nextstore-compare'))
console.log('  cleanup: compare list cleared')

check('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '))

await browser.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
