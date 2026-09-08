/**
 * تست سرتاسری پنل فیلتر محصولات
 * ---------------------------------------------------------------------------
 * این تست به‌طور خاص برای محافظت از یک بازنویسی نوشته شد: همگام‌سازی
 * فیلترها با URL که از `useEffect` به «تنظیم state حین رندر» منتقل شد.
 *
 * چیزی که فقط همین تست می‌گیرد:
 *   - انتخاب نیمه‌کاره‌ی کاربر با رندر دوباره‌ی والد ریست نمی‌شود
 *     (باگ قدیمی: وابستگی افکت یک آرایه با مرجع تازه در هر رندر بود)
 *   - دکمه‌ی بازگشت مرورگر، تیک‌ها را با URL هماهنگ می‌کند
 *   - «حذف فیلترها» هم URL و هم تیک‌ها را پاک می‌کند
 *
 * پیش‌نیاز: هر دو سرور بالا و دیتابیس سیدشده.
 *
 * اجرا:
 *     node scripts/e2e-filters.mjs
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
  /* عرض دسکتاپ تا سایدبار فیلتر بدون کشو دیده شود */
  viewport: { width: 1440, height: 1000 },
  locale: 'fa-IR',
})
const page = await context.newPage()

const consoleErrors = []
page.on('pageerror', (e) => consoleErrors.push(e.message))
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text())
})

/*
 * ⚠️ چک‌باکس‌ها `sr-only` هستند (ظاهر سفارشی دارند)، پس پلی‌رایت
 *    مستقیم رویشان کلیک نمی‌کند. کلیک روی `<label>` والد همان کاری
 *    را می‌کند که کاربر واقعی انجام می‌دهد.
 */

/** تیک‌خورده بودن چک‌باکس nاُم در بخش برند. */
const isChecked = (i) => page.locator('input[type="checkbox"]').nth(i).isChecked()

const applyButton = () => page.getByRole('button', { name: 'اعمال فیلتر', exact: false })

await page.goto(BASE + '/fa/products', { waitUntil: 'networkidle' })

/* ============ ۱. رندر اولیه ============ */
console.log('--- 1. initial render ---')
{
  const boxes = await page.locator('input[type="checkbox"]').count()
  check('filter checkboxes render', boxes > 0, `count=${boxes}`)

  const anyChecked = await page.locator('input[type="checkbox"]:checked').count()
  check('nothing checked on a clean URL', anyChecked === 0, `checked=${anyChecked}`)
}

/* ============ ۲. انتخاب نیمه‌کاره ریست نمی‌شود ============ */
/*
 * هسته‌ی این تست. نسخه‌ی قدیمی با useEffect، هر رندر والد را تغییر
 * فیلتر تفسیر می‌کرد و تیک کاربر را برمی‌داشت. اینجا با تیک زدن،
 * کمی صبر (تا هر رندر معلقی انجام شود) و اسکرول — که رندر دوباره
 * می‌سازد — بررسی می‌کنیم تیک سر جایش مانده باشد.
 */
console.log('--- 2. pending selection survives re-render ---')
{
  await page.locator('input[type="checkbox"]').first().locator('..').click()
  await page.waitForTimeout(300)
  check('checkbox got checked', await isChecked(0))

  /* چند رندر بی‌ربط ایجاد کن */
  await page.mouse.wheel(0, 600)
  await page.waitForTimeout(200)
  await page.mouse.wheel(0, -600)
  await page.waitForTimeout(1500)

  check('still checked after re-renders (the old bug)', await isChecked(0))
}

/* ============ ۳. اعمال، URL را عوض می‌کند ============ */
console.log('--- 3. apply writes to the URL ---')
{
  await applyButton().first().click()
  await page.waitForTimeout(2500)

  const url = page.url()
  check('URL carries the filter', /[?&]brand=/.test(url), url.replace(BASE, ''))
  check('checkbox stays checked after apply', await isChecked(0))

  await page.screenshot({ path: join(OUT, 'filters-applied--desktop-light.png'), fullPage: true })
}

/* ============ ۴. بازگشت مرورگر، تیک‌ها را همگام می‌کند ============ */
console.log('--- 4. browser back re-syncs the checkboxes ---')
{
  await page.goBack({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  const url = page.url()
  check('URL back to unfiltered', !/[?&]brand=/.test(url), url.replace(BASE, ''))

  /* همان چیزی که بازنویسی باید تضمین کند */
  check('checkbox unchecked to match URL', !(await isChecked(0)))
}

/* ============ ۵. جلو رفتن دوباره ============ */
console.log('--- 5. forward restores it ---')
{
  await page.goForward({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  check('URL filtered again', /[?&]brand=/.test(page.url()))
  check('checkbox checked again', await isChecked(0))
}

/* ============ ۶. حذف فیلترها ============ */
console.log('--- 6. clear all ---')
{
  const clear = page.getByRole('button', { name: 'حذف فیلترها' })
  if (await clear.count()) {
    await clear.first().click()
    await page.waitForTimeout(2500)

    check('URL cleared', !/[?&]brand=/.test(page.url()), page.url().replace(BASE, ''))
    check('checkbox cleared', !(await isChecked(0)))
  } else {
    check('clear button present', false, 'دکمه پیدا نشد')
  }
}

check('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '))

await browser.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
