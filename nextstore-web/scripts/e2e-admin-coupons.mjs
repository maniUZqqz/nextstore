/**
 * تست سرتاسری مدیریت کدهای تخفیف — از داخل مرورگر واقعی
 * ---------------------------------------------------------------------------
 * چیزی که تست API نمی‌گیرد و اینجا گرفته می‌شود:
 *   - نشان‌های عددی تب‌ها با شمارش واقعی API می‌خوانند
 *   - تب «فعال» کوپنِ ظرفیت‌پرشده را نشان نمی‌دهد (تب و نشان یک چیز بگویند)
 *   - فیلد «سقف تخفیف» فقط برای نوع درصدی دیده می‌شود
 *   - مبالغ به تومان وارد می‌شوند و به ریال ذخیره می‌شوند
 *   - خطای ۴۲۲ سرور زیر همان فیلد می‌نشیند
 *   - کوپن مصرف‌شده حذف نمی‌شود و پیام راه‌حل می‌دهد
 *   - کد ساخته‌شده واقعاً در سبد مشتری کار می‌کند
 *
 * پیش‌نیاز: هر دو سرور بالا و دیتابیس سیدشده.
 *
 * اجرا:
 *     node scripts/e2e-admin-coupons.mjs
 */

import { chromium } from 'playwright-core'
import { existsSync, readdirSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.SHOTS_BASE_URL ?? 'http://127.0.0.1:3100'
const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:8100/api/v1'
const OUT = '.shots'

/** کد آزمایشی — نشان‌دار تا پاکسازی فقط ساخته‌های خودش را حذف کند. */
const TEST_CODE = `E2E-${Date.now().toString().slice(-8)}`

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

const adminToken = await apiLogin('admin@demo.dev')
const userToken = await apiLogin('user@demo.dev')

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

const counts = (await (await call(adminToken, '/admin/coupons?per_page=1')).json()).counts
console.log('counts from API:', JSON.stringify(counts))

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ executablePath: findChromium() })
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  locale: 'fa-IR',
})
const page = await context.newPage()

/* ۴۲۲ در بخش اعتبارسنجی مورد انتظار است */
const EXPECTED_ERROR = /422 \(Unprocessable/
const consoleErrors = []
page.on('pageerror', (e) => consoleErrors.push(e.message))
page.on('console', (m) => {
  if (m.type() === 'error' && !EXPECTED_ERROR.test(m.text())) consoleErrors.push(m.text())
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
}, adminToken)

/* ============ ۱. فهرست ============ */
console.log('--- 1. list page ---')
{
  await page.goto(BASE + '/fa/admin/coupons', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)

  const tabs = await page.locator('[role="tab"]').count()
  check('six state tabs', tabs === 6, `tabs=${tabs}`)

  check('all badge matches API', (await tabCount(0)) === counts.all,
    `ui=${await tabCount(0)} api=${counts.all}`)

  const rows = await page.locator('table tbody tr').count()
  check('table renders rows', rows > 0, `rows=${rows}`)

  await page.screenshot({ path: join(OUT, 'admin-coupons--desktop-light.png'), fullPage: true })
}

/* ============ ۲. تب فعال، کوپن ظرفیت‌پرشده را نشان نمی‌دهد ============ */
/*
 * هسته‌ی یک باگ واقعی: scopeUsable مدل ظرفیت را بررسی نمی‌کند، پس تب
 * «فعال» کوپن SOLDOUT را نشان می‌داد در حالی که نشان کنارش «ظرفیت
 * تکمیل» می‌گفت.
 */
console.log('--- 2. active tab excludes exhausted ---')
{
  await page.locator('[role="tab"]').nth(1).click()
  await page.waitForTimeout(2000)

  const body = await page.locator('table').innerText()
  check('SOLDOUT not in the active tab', !body.includes('SOLDOUT'))
  check('active badge matches API', (await tabCount(1)) === counts.active,
    `ui=${await tabCount(1)} api=${counts.active}`)
}

/* ============ ۳. فرم — سقف تخفیف فقط برای درصدی ============ */
console.log('--- 3. cap field only for percentage ---')
{
  await page.locator('[role="tab"]').first().click()
  await page.waitForTimeout(1200)

  await page.getByRole('button', { name: 'کد جدید' }).click()
  await page.waitForTimeout(1000)

  check('cap field visible for percent', (await page.locator('#coupon-max').count()) === 1)

  await page.selectOption('#coupon-type', 'fixed')
  await page.waitForTimeout(600)
  check('cap field hidden for fixed', (await page.locator('#coupon-max').count()) === 0)

  await page.selectOption('#coupon-type', 'percent')
  await page.waitForTimeout(600)
  check('cap field back for percent', (await page.locator('#coupon-max').count()) === 1)
}

/* ============ ۴. اعتبارسنجی سرور زیر همان فیلد ============ */
console.log('--- 4. server validation lands on the field ---')
{
  await page.fill('#coupon-code', 'BAD CODE!')
  await page.fill('#coupon-value', '150')
  await page.getByRole('button', { name: 'ذخیره' }).click()
  await page.waitForTimeout(2200)

  /*
   * ⚠️ پیام خطا **همتای خودِ ورودی** است، نه همتای والدش:
   *      <div>  <label/>  <input/>  <p>error</p>  </div>
   *    نسخه‌ی اول این تست از والد بالا می‌رفت و هیچ‌وقت پیدایش نمی‌کرد —
   *    شکستی که شبیه «خطا نمایش داده نشد» بود، نه «انتخابگر غلط است».
   */
  const codeField = page.locator('#coupon-code').locator('..')
  const codeError = await codeField.locator('p.text-destructive').first()
    .innerText().catch(() => '')
  check('code format error shown', codeError.includes('انگلیسی'), codeError.slice(0, 40))

  /* خطا باید کنار فیلد درست بنشیند، نه هر جای فرم */
  const valueField = page.locator('#coupon-value').locator('..')
  const valueError = await valueField.locator('p.text-destructive').first()
    .innerText().catch(() => '')
  check('percent range error on its own field', valueError.includes('۱۰۰'), valueError.slice(0, 40))

  await page.screenshot({ path: join(OUT, 'admin-coupons-form-error--desktop-light.png'), fullPage: true })
}

/* ============ ۵. ساخت کوپن ============ */
console.log('--- 5. create a coupon ---')
{
  await page.fill('#coupon-code', TEST_CODE)
  await page.fill('#coupon-value', '30')
  /* مبالغ به تومان وارد می‌شوند */
  await page.fill('#coupon-max', '400000')
  await page.fill('#coupon-min', '100000')
  await page.fill('#coupon-per-user', '5')
  await page.getByRole('button', { name: 'ذخیره' }).click()
  await page.waitForTimeout(2800)

  const created = await (await call(adminToken, `/admin/coupons?q=${TEST_CODE}`)).json()
  const coupon = created.data?.[0]

  check('coupon exists via API', Boolean(coupon), coupon?.code)
  /* تومان → ریال: ۴۰۰,۰۰۰ تومان = ۴,۰۰۰,۰۰۰ ریال */
  check('toman converted to rials', coupon?.maxDiscount === 4_000_000, String(coupon?.maxDiscount))
  check('min total converted', coupon?.minOrderTotal === 1_000_000, String(coupon?.minOrderTotal))
  check('percentage stored raw', coupon?.value === 30, String(coupon?.value))
  check('state is active', coupon?.state === 'active', coupon?.state)

  await page.screenshot({ path: join(OUT, 'admin-coupons-created--desktop-light.png'), fullPage: true })
}

/* ============ ۶. کد ساخته‌شده در سبد مشتری کار می‌کند ============ */
/*
 * مهم‌ترین بررسی: کوپنی که مدیر از پنل ساخته، واقعاً در مسیر خرید
 * پذیرفته می‌شود. بدون این، پنل می‌توانست کوپن‌هایی بسازد که هیچ‌وقت
 * کار نمی‌کنند و کسی متوجه نمی‌شد.
 */
console.log('--- 6. the new code actually works in the cart ---')
{
  await call(userToken, '/cart', { method: 'DELETE' })

  const products = await (await fetch(API + '/products?in_stock=1&sort=price_desc&per_page=1',
    { headers: { Accept: 'application/json' } })).json()

  await call(userToken, '/cart/items', {
    method: 'POST',
    body: JSON.stringify({ product_id: products.data[0].id, quantity: 1 }),
  })

  const applied = await (await call(userToken, '/cart/coupon', {
    method: 'POST',
    body: JSON.stringify({ code: TEST_CODE }),
  })).json()

  check('customer can apply it', applied.data?.coupon?.code === TEST_CODE,
    applied.message ?? JSON.stringify(applied).slice(0, 60))
  /* ۳۰٪ ولی با سقف ۴۰۰ هزار تومان = ۴ میلیون ریال */
  check('cap is enforced', applied.data?.coupon?.discountAmount === 4_000_000,
    String(applied.data?.coupon?.discountAmount))

  await call(userToken, '/cart', { method: 'DELETE' })
}

/* ============ ۷. کوپن مصرف‌شده حذف نمی‌شود ============ */
console.log('--- 7. a used coupon cannot be deleted ---')
{
  const used = await (await call(adminToken, '/admin/coupons?q=WELCOME10')).json()
  const target = used.data?.[0]

  const res = await call(adminToken, `/admin/coupons/${target.id}`, { method: 'DELETE' })
  const body = await res.json()

  check('rejected with 422', res.status === 422, String(res.status))
  check('error code is explicit', body.error?.code === 'COUPON_HAS_USAGE', body.error?.code)
  check('message suggests disabling', body.message?.includes('غیرفعال'), body.message?.slice(0, 50))
}

/* ============ ۸. انگلیسی و موبایل ============ */
console.log('--- 8. english + mobile ---')
{
  await page.goto(`${BASE}/en/admin/coupons`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)

  check('english is LTR', (await page.locator('html').getAttribute('dir')) === 'ltr')

  const h1 = await page.locator('h1').first().innerText()
  check('heading translated', /coupon/i.test(h1), `"${h1}"`)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/fa/admin/coupons`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  check('no horizontal overflow', overflow <= 1, `overflow=${overflow}px`)
  await page.screenshot({ path: join(OUT, 'admin-coupons--mobile-light.png'), fullPage: true })
}

/* ============ پاکسازی ============ */
/*
 * ⚠️ همه‌ی صفحات پیموده می‌شوند، نه فقط اولی — درسِ باگ پاکسازی
 *    تک‌صفحه‌ای در e2e-reviews.
 *
 * ⚠️ فقط کوپن‌های بدون مصرف حذف می‌شوند؛ بقیه بی‌صدا رد می‌شوند چون
 *    بک‌اند عمداً اجازه‌ی حذفشان را نمی‌دهد.
 */
{
  let removed = 0
  for (let p = 1; ; p++) {
    const body = await (await call(adminToken, `/admin/coupons?q=E2E-&per_page=50&page=${p}`)).json()
    for (const coupon of body.data ?? []) {
      if (coupon.code.startsWith('E2E-') && coupon.usedCount === 0) {
        await call(adminToken, `/admin/coupons/${coupon.id}`, { method: 'DELETE' })
        removed++
      }
    }
    if (!body.meta || p >= body.meta.last_page) break
  }
  console.log(`  cleanup: removed ${removed} test coupon(s)`)
}

check('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '))

await browser.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
