/**
 * تست سرتاسری مدیریت مشتریان — از داخل مرورگر واقعی
 * ---------------------------------------------------------------------------
 * چیزی که تست API نمی‌گیرد و اینجا گرفته می‌شود:
 *   - نشان‌های عددی تب‌ها با شمارش واقعی API می‌خوانند
 *   - تب «خریداران» واقعاً فیلتر می‌کند (نه همان فهرست کامل)
 *   - مرتب‌سازی «بیشترین خرید» ترتیب را عوض می‌کند
 *   - جستجو با ایمیل به یک ردیف می‌رسد
 *   - غیرفعال کردن حساب، وضعیت را در فهرست هم عوض می‌کند
 *   - رمز یا توکن در هیچ‌جای صفحه نشت نمی‌کند
 *
 * ⚠️ این تست وضعیت یک مشتری واقعی را عوض می‌کند و در پایان
 *    برمی‌گرداند. اگر وسط کار قطع شود، آن حساب غیرفعال می‌ماند —
 *    بخش پاکسازی همه‌ی حساب‌های غیرفعال را دوباره فعال می‌کند.
 *
 * پیش‌نیاز: هر دو سرور بالا و دیتابیس سیدشده.
 *
 * اجرا:
 *     node scripts/e2e-admin-customers.mjs
 */

import { chromium } from 'playwright-core'
import { existsSync, readdirSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { waitForCount, waitUntil } from './lib/wait.mjs'

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

/* ورود مقاوم — ۴۲۹ و بدنه‌ی خالی هر دو تلاش مجدد می‌شوند. */
async function apiLogin(email) {
  for (let attempt = 0; attempt < 8; attempt++) {
    let res
    try {
      res = await fetch(API + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, password: 'password' }),
      })
    } catch {
      await new Promise((r) => setTimeout(r, 2000))
      continue
    }
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 12000))
      continue
    }
    const text = await res.text()
    if (!text) {
      await new Promise((r) => setTimeout(r, 2000))
      continue
    }
    if (!res.ok) throw new Error('login ' + res.status + ': ' + text.slice(0, 120))
    return JSON.parse(text).data.token
  }
  throw new Error('login failed after retries')
}

const token = await apiLogin('admin@demo.dev')

const call = (path, options = {}) =>
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

const list = await (await call('/admin/customers?per_page=1')).json()
const counts = list.counts
console.log('counts from API:', JSON.stringify(counts))

/* مشتری آزمایشی: بیشترین خرید — پس حتماً سفارش و آدرس دارد */
const topBuyer = (await (await call('/admin/customers?sort=spent&per_page=1')).json()).data[0]
console.log('customer under test:', topBuyer.id, topBuyer.name)

/**
 * بازگرداندن هر مشتری‌ای که اجرای قبلی غیرفعال گذاشته.
 *
 * ⚠️ بدون این، یک اجرای شکسته تست را **برای همیشه** خراب می‌کند.
 *
 *    بخش ۶ روی دکمه‌ی «غیرفعال کردن» کلیک می‌کند. متن آن دکمه شرطی
 *    است: اگر مشتری از قبل غیرفعال باشد، دکمه «فعال‌سازی حساب»
 *    می‌گوید و انتظار برای متن اول با TimeoutError می‌میرد — خطایی که
 *    هیچ اشاره‌ای به علت واقعی ندارد.
 *
 *    دقیقاً همین اتفاق افتاد: یک اجرا وسط کار شکست، «رضا کریمی»
 *    غیرفعال ماند، و از آن به بعد هر اجرا با تایم‌اوت می‌مرد.
 */
async function restoreDisabledCustomers() {
  const response = await call('/admin/customers?status=inactive&per_page=100')
  const rows = (await response.json()).data ?? []

  for (const customer of rows) {
    await call(`/admin/customers/${customer.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: true }),
    })
  }

  if (rows.length > 0) {
    console.log(`  (${rows.length} مشتری بازمانده‌ی اجرای قبلی فعال شد)`)
  }
}

await restoreDisabledCustomers()

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

/** عدد نشان کنار تب nاُم، با تبدیل رقم فارسی به لاتین. */
const tabCount = async (index) => {
  const text = await page.locator('[role="tab"]').nth(index).innerText()
  const latin = text.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
  const m = latin.match(/\d+/)
  return m ? Number(m[0]) : null
}

await page.goto(BASE + '/fa', { waitUntil: 'domcontentloaded' })
await page.evaluate((value) => {
  localStorage.setItem('auth_token', value)
  document.cookie = 'auth_token=' + value + '; path=/; max-age=86400; SameSite=Lax'
}, token)

/* ============ ۱. فهرست ============ */
console.log('--- 1. list page ---')
{
  await page.goto(BASE + '/fa/admin/customers', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)

  const tabs = await page.locator('[role="tab"]').count()
  check('four status tabs', tabs === 4, `tabs=${tabs}`)

  check('all badge matches API', (await tabCount(0)) === counts.all,
    `ui=${await tabCount(0)} api=${counts.all}`)
  check('buyers badge matches API', (await tabCount(1)) === counts.buyers,
    `ui=${await tabCount(1)} api=${counts.buyers}`)

  const rows = await page.locator('table tbody tr').count()
  check('table renders rows', rows > 0, `rows=${rows}`)

  await page.screenshot({ path: join(OUT, 'admin-customers--desktop-light.png'), fullPage: true })
}

/* ============ ۲. تب خریداران واقعاً فیلتر می‌کند ============ */
console.log('--- 2. buyers tab filters ---')
{
  await page.locator('[role="tab"]').nth(1).click()

  /*
   * ⚠️ انتظار تا خودِ جدول فیلتر شود، نه یک زمان ثابت.
   *
   *    نشان تب بی‌درنگ عدد درست را نشان می‌دهد (از کوئری شمارش‌ها
   *    می‌آید) ولی ردیف‌های جدول تا پایان واکشی دوم همان ۲۰ ردیف
   *    قبلی‌اند. با انتظار ثابت، بررسی گاهی مقدار کهنه را می‌خواند
   *    و «فیلتر کار نمی‌کند» گزارش می‌دهد — که درست نیست.
   */
  const expected = Math.min(counts.buyers, 20)
  const rows = await waitForCount(page, 'table tbody tr', expected)
  check('buyers list is smaller than all', rows === expected,
    `rows=${rows} buyers=${counts.buyers}`)
}

/* ============ ۳. مرتب‌سازی ============ */
console.log('--- 3. sort by highest spend ---')
{
  await page.locator('[role="tab"]').first().click()
  await page.waitForTimeout(1500)

  const firstBefore = await page.locator('table tbody tr').first().innerText()

  await page.selectOption('select', 'spent')

  const firstAfter = await waitUntil(
    () => page.locator('table tbody tr').first().innerText(),
    (text) => text !== firstBefore,
  )
  check('sorting changes the first row', firstBefore !== firstAfter)
  check('top spender is first', firstAfter.includes(topBuyer.name),
    firstAfter.split('\n')[0])
}

/* ============ ۴. جستجو ============ */
console.log('--- 4. search by email ---')
{
  await page.fill('input[type="search"]', topBuyer.email)
  await page.getByRole('button', { name: 'جستجو' }).first().click()

  const rows = await waitForCount(page, 'table tbody tr', 1)
  check('search narrows to one row', rows === 1, `rows=${rows}`)
}

/* ============ ۵. پروفایل مشتری ============ */
console.log('--- 5. customer profile ---')
{
  await page.goto(`${BASE}/fa/admin/customers/${topBuyer.id}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  const body = await page.locator('main').innerText()
  check('name shown', body.includes(topBuyer.name))
  check('email shown', body.includes(topBuyer.email))
  check('five stat cards', (await page.locator('main .grid > div').count()) >= 5)

  const orders = await page.locator('main section').first().locator('li').count()
  check('recent orders listed', orders > 0, `orders=${orders}`)

  /*
   * ⚠️ مهم‌ترین بررسی امنیتی این تست.
   *    Resource جدید بر پایه‌ی مدل User ساخته شده و یک اشتباه ساده
   *    (مثلاً برگرداندن کل مدل به‌جای فیلدهای انتخابی) هش رمز را
   *    مستقیم روی صفحه می‌آورد.
   */
  const html = await page.content()
  check('no password hash leaked', !html.includes('$2y$'))
  check('no remember token leaked', !/remember_token/i.test(html))

  await page.screenshot({ path: join(OUT, 'admin-customer-detail--desktop-light.png'), fullPage: true })
}

/* ============ ۶. غیرفعال و فعال کردن ============ */
console.log('--- 6. disable then enable ---')
{
  page.once('dialog', (d) => d.accept())
  await page.getByRole('button', { name: 'غیرفعال کردن' }).click()
  await page.waitForTimeout(2500)

  const afterDisable = await (await call(`/admin/customers/${topBuyer.id}`)).json()
  check('API reports disabled', afterDisable.data.isActive === false)

  const enableButton = page.getByRole('button', { name: 'فعال‌سازی حساب' })
  check('button flipped to enable', (await enableButton.count()) > 0)

  await enableButton.click()
  await page.waitForTimeout(2500)

  const afterEnable = await (await call(`/admin/customers/${topBuyer.id}`)).json()
  check('API reports active again', afterEnable.data.isActive === true)
}

/* ============ ۷. انگلیسی و موبایل ============ */
console.log('--- 7. english + mobile ---')
{
  await page.goto(`${BASE}/en/admin/customers`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)

  check('english is LTR', (await page.locator('html').getAttribute('dir')) === 'ltr')

  const h1 = await page.locator('h1').first().innerText()
  check('heading translated', /customer/i.test(h1), `"${h1}"`)
  await page.screenshot({ path: join(OUT, 'admin-customers-en--desktop-light.png'), fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/fa/admin/customers/${topBuyer.id}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  check('no horizontal overflow', overflow <= 1, `overflow=${overflow}px`)
  await page.screenshot({ path: join(OUT, 'admin-customer-detail--mobile-light.png'), fullPage: true })
}

/* ============ پاکسازی ============ */
/*
 * ⚠️ اگر تست وسط بخش ۶ قطع شود، یک مشتری غیرفعال باقی می‌ماند و
 *    نمی‌تواند وارد شود. اینجا همه‌ی حساب‌های غیرفعال دوباره فعال
 *    می‌شوند — سیدر هیچ حساب غیرفعالی نمی‌سازد، پس هر کدام که
 *    باشد کار همین تست بوده.
 */
{
  let restored = 0
  for (let p = 1; ; p++) {
    const body = await (await call(`/admin/customers?status=inactive&per_page=50&page=${p}`)).json()
    for (const c of body.data ?? []) {
      await call(`/admin/customers/${c.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: true }),
      })
      restored++
    }
    if (!body.meta || p >= body.meta.last_page) break
  }
  console.log(`  cleanup: re-enabled ${restored} account(s)`)
}

check('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '))

await browser.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
