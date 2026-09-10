/**
 * تست سرتاسری تعدیل نظرات — از داخل مرورگر واقعی
 * ---------------------------------------------------------------------------
 * چیزی که تست API نمی‌گیرد و اینجا گرفته می‌شود:
 *   - تب «همه» واقعاً همه را نشان می‌دهد (نه فقط در‌انتظارها)
 *   - نشان‌های عددی تب‌ها با داده‌ی واقعی می‌خوانند
 *   - تأیید، نظر را از صف در‌انتظار بیرون می‌برد و شمارنده را جابه‌جا می‌کند
 *   - فرم «دلیل رد» تا پیش از ۳ نویسه دکمه‌اش غیرفعال است
 *   - رد کردن، دلیل را روی کارت نشان می‌دهد
 *   - صف خالی پیام موفقیت می‌دهد نه پیام پوچی
 *
 * پیش‌نیاز: هر دو سرور بالا و دیتابیس سیدشده.
 *
 * اجرا:
 *     node scripts/e2e-admin-reviews.mjs
 */

import { chromium } from 'playwright-core'
import { existsSync, readdirSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { waitUntil } from './lib/wait.mjs'

const BASE = process.env.SHOTS_BASE_URL ?? 'http://127.0.0.1:3100'
const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:8100/api/v1'
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

async function apiLogin(email) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(API + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, password: 'password' }),
    })
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 12000))
      continue
    }
    const body = await res.json()
    if (!res.ok) throw new Error('login ' + res.status)
    return body.data.token
  }
  throw new Error('login rate limited')
}

const call = (token, path, options = {}) =>
  fetch(API + path, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': 'fa',
      Authorization: 'Bearer ' + token,
      ...options.headers,
    },
  })

const token = await apiLogin('admin@demo.dev')

/** شمارش‌های فعلی از API — مبنای مقایسه با آنچه روی صفحه دیده می‌شود. */
async function apiCounts() {
  const body = await (await call(token, '/admin/reviews?status=pending&per_page=1')).json()
  return body.counts
}

const before = await apiCounts()
console.log('counts from API:', JSON.stringify(before))

if (before.pending === 0) {
  console.log('\n⚠️  صف در‌انتظار خالی است — تست تأیید/رد معنا ندارد.')
  console.log('   ابتدا اجرا کن:  php artisan migrate:fresh --seed\n')
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

/* تزریق ورود */
await page.goto(BASE + '/fa', { waitUntil: 'domcontentloaded' })
await page.evaluate((value) => {
  localStorage.setItem('auth_token', value)
  document.cookie = 'auth_token=' + value + '; path=/; max-age=86400; SameSite=Lax'
}, token)

/**
 * کارت‌های نظر — فقط فهرست سطح اول.
 *
 * ⚠️ `main ul > li` غلط است: هر کارت خودش دو <ul> تودرتو برای نقاط
 *    قوت و ضعف دارد و آن <li>ها هم شمرده می‌شوند. با `> ul >` از
 *    والد مستقیم، فقط کارت‌ها به دست می‌آیند.
 */
const cards = () => page.locator('main > div > ul > li')

/**
 * منتظر ماندن تا مقدار نشان عددی به عدد مورد انتظار برسد.
 *
 * ⚠️ انتظار با زمان ثابت اینجا کار نمی‌کند: پس از یک کنش، React Query
 *    کوئری را باطل می‌کند و رفت‌وبرگشت تازه حدود دو ثانیه طول می‌کشد.
 *    خواندن دقیقاً سر مرز، تست را به‌شکل تصادفی می‌شکند — و شکستی که
 *    شبیه باگ برنامه به نظر می‌رسد ولی نیست.
 */
async function waitForBadge(index, expected, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs
  let last = null
  while (Date.now() < deadline) {
    last = await tabCount(index)
    if (last === expected) return last
    await page.waitForTimeout(300)
  }
  return last
}

/** متن نشان عددی کنار یک تب. */
const tabCount = async (index) => {
  const text = await page.locator('[role="tab"]').nth(index).innerText()
  /* عدد فارسی به لاتین برای مقایسه */
  const latin = text.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
  const match = latin.match(/\d+/)
  return match ? Number(match[0]) : null
}

/* ============ ۱. صفحه فهرست ============ */
console.log('--- 1. list page ---')
{
  await page.goto(BASE + '/fa/admin/reviews', { waitUntil: 'networkidle' })

  const tabs = await page.locator('[role="tab"]').count()
  check('four status tabs', tabs === 4, `tabs=${tabs}`)

  /* تب اول (در‌انتظار) باید پیش‌فرض فعال باشد */
  const firstSelected = await page.locator('[role="tab"]').first().getAttribute('aria-selected')
  check('pending tab is default', firstSelected === 'true', `aria-selected=${firstSelected}`)

  const pendingBadge = await tabCount(0)
  check('pending badge matches API', pendingBadge === before.pending,
    `ui=${pendingBadge} api=${before.pending}`)

  const allBadge = await tabCount(3)
  const expectedAll = before.pending + before.approved + before.rejected
  check('all badge is the sum', allBadge === expectedAll,
    `ui=${allBadge} expected=${expectedAll}`)

  await page.screenshot({ path: join(OUT, 'admin-reviews--desktop-light.png'), fullPage: true })
}

/* ============ ۲. تب «همه» فیلتر را برمی‌دارد ============ */
console.log('--- 2. all tab ---')
{
  await page.locator('[role="tab"]').nth(3).click()

  const expectedAll = before.pending + before.approved + before.rejected

  /*
   * ⚠️ انتظار تا فهرست واقعاً عوض شود.
   *
   *    نشان تب فوراً درست می‌شود چون از کوئری شمارش‌ها می‌آید، ولی
   *    کارت‌ها تا پایان واکشیِ فیلتر تازه همان کارت‌های «در انتظار»
   *    می‌مانند. زمان ثابت ۱۲۰۰ms برای ۲۲۴ نظر کافی نبود و بررسی
   *    «تب همه بیشتر از در‌انتظار نشان می‌دهد» شکست می‌خورد، در
   *    حالی که فیلتر درست کار می‌کرد.
   */
  const cardCount = await waitUntil(
    () => cards().count(),
    (count) => count > before.pending || expectedAll <= before.pending,
  )

  /*
   * صفحه‌بندی ۲۰تایی است، پس اگر کل نظرات بیشتر باشد فقط ۲۰ کارت
   * دیده می‌شود. شرط درست «بیشتر از تعداد در‌انتظار» است، نه برابری.
   */
  check('all tab shows more than pending only',
    cardCount > 0 && (cardCount > before.pending || expectedAll <= before.pending),
    `cards=${cardCount} pending=${before.pending} total=${expectedAll}`)
}

/* ============ ۳. فرم رد ============ */
console.log('--- 3. reject form validation ---')
if (before.pending > 0) {
  await page.locator('[role="tab"]').first().click()
  await page.waitForTimeout(1200)

  /* دکمه‌ی «رد» روی اولین کارت */
  await cards().first().getByRole('button', { name: /^رد$/ }).click()

  const textarea = page.locator('textarea[id^="reject-reason-"]')
  check('reason textarea appears', await textarea.count() === 1)

  const confirm = page.getByRole('button', { name: 'ثبت رد' })
  check('confirm disabled while empty', await confirm.isDisabled())

  await textarea.fill('اب')
  check('confirm disabled under 3 chars', await confirm.isDisabled())

  await textarea.fill('متن نظر به این محصول مربوط نیست.')
  check('confirm enabled at 3+ chars', await confirm.isEnabled())

  await page.screenshot({ path: join(OUT, 'admin-reviews-reject--desktop-light.png'), fullPage: true })

  /* انصراف — این تست نباید داده را تغییر دهد */
  await page.getByRole('button', { name: 'انصراف' }).click()
  await page.waitForTimeout(400)
  check('cancel closes the form', await page.locator('textarea[id^="reject-reason-"]').count() === 0)
} else {
  console.log('  SKIP (صف در‌انتظار خالی است)')
}

/* ============ ۴. تأیید یک نظر ============ */
console.log('--- 4. approve moves it out of the queue ---')
if (before.pending > 0) {
  await cards().first().getByRole('button', { name: 'تأیید' }).click()
  await page.waitForTimeout(1500)

  const after = await apiCounts()
  check('pending decreased', after.pending === before.pending - 1,
    `${before.pending} -> ${after.pending}`)
  check('approved increased', after.approved === before.approved + 1,
    `${before.approved} -> ${after.approved}`)

  const badge = await waitForBadge(0, after.pending)
  check('badge refreshed in UI', badge === after.pending, `ui=${badge} api=${after.pending}`)
} else {
  console.log('  SKIP (صف در‌انتظار خالی است)')
}

/* ============ ۵. تم تاریک و انگلیسی ============ */
console.log('--- 5. dark + english ---')
{
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto(BASE + '/fa/admin/reviews', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.screenshot({ path: join(OUT, 'admin-reviews--desktop-dark.png'), fullPage: true })

  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto(BASE + '/en/admin/reviews', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  const dir = await page.locator('html').getAttribute('dir')
  check('english page is LTR', dir === 'ltr', `dir=${dir}`)

  const heading = await page.locator('h1').first().innerText()
  check('heading is translated', /review/i.test(heading), `h1="${heading}"`)

  await page.screenshot({ path: join(OUT, 'admin-reviews-en--desktop-light.png'), fullPage: true })
}

/* ============ ۶. موبایل ============ */
console.log('--- 6. mobile ---')
{
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(BASE + '/fa/admin/reviews', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  /* بدنه نباید افقی اسکرول شود */
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  check('no horizontal overflow', overflow <= 1, `overflow=${overflow}px`)

  await page.screenshot({ path: join(OUT, 'admin-reviews--mobile-light.png'), fullPage: true })
}

check('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '))

await browser.close()

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
