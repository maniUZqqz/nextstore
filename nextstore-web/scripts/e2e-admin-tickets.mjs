/**
 * تست سرتاسری صف پشتیبانی — از داخل مرورگر واقعی
 * ---------------------------------------------------------------------------
 * این تست شکافی را می‌بندد که `e2e-tickets.mjs` نمی‌توانست پوشش دهد:
 * تولید و رندر پیام پشتیبانی (`isStaff: true`). مسیر مشتری عمداً
 * اجازه‌ی ساخت چنین پیامی نمی‌دهد.
 *
 * چیزی که اینجا گرفته می‌شود:
 *   - تب پیش‌فرض «نیازمند رسیدگی» است نه «همه»
 *   - نشان‌های عددی تب‌ها با شمارش واقعی API می‌خوانند
 *   - پاسخ پشتیبانی تیکت را از صف کاری بیرون می‌برد
 *   - حباب پشتیبانی و مشتری از هم تفکیک می‌شوند (وارونه‌ی نمای مشتری)
 *   - همان پاسخ در «تیکت‌های من» مشتری هم دیده می‌شود
 *   - جستجو با شماره‌ی تیکت کار می‌کند
 *   - بستن از سمت پشتیبانی فرم پاسخ را با بازگشایی جایگزین می‌کند
 *
 * پیش‌نیاز: هر دو سرور بالا و دیتابیس سیدشده.
 *
 * اجرا:
 *     node scripts/e2e-admin-tickets.mjs
 */

import { chromium } from 'playwright-core'
import { existsSync, readdirSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.SHOTS_BASE_URL ?? 'http://127.0.0.1:3100'
const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:8100/api/v1'
const OUT = '.shots'

const STAMP = `e2e-${Date.now()}`
const STAFF_REPLY = 'بررسی کردیم؛ مرسوله فردا از انبار خارج می‌شود.'

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

const userToken = await apiLogin('user@demo.dev')
const adminToken = await apiLogin('admin@demo.dev')

/**
 * ساخت تیکت آزمایشی از سمت *مشتری*.
 *
 * از API انجام می‌شود و نه از مرورگر: این تست درباره‌ی پنل پشتیبانی
 * است و مسیر ثبت تیکت را `e2e-tickets.mjs` جداگانه می‌آزماید.
 */
const created = await (
  await call(userToken, '/tickets', {
    method: 'POST',
    body: JSON.stringify({
      subject: `${STAMP} مرسوله من هنوز ارسال نشده`,
      department: 'orders',
      priority: 'high',
      body: 'سه روز از ثبت سفارش گذشته و وضعیت هنوز «در حال پردازش» است.',
    }),
  })
).json()

const TICKET = created.data.ticketNumber
console.log('ticket under test:', TICKET)

/** شمارش‌های فعلی از API — مبنای مقایسه با آنچه روی صفحه دیده می‌شود. */
const apiCounts = async () =>
  (await (await call(adminToken, '/admin/tickets?per_page=1')).json()).counts

const before = await apiCounts()
console.log('counts from API:', JSON.stringify(before))

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

/** جایگزینی هویت مرورگر — این تست بین ادمین و مشتری جابه‌جا می‌شود. */
const signInAs = async (token) => {
  await page.goto(BASE + '/fa', { waitUntil: 'domcontentloaded' })
  await page.evaluate((value) => {
    localStorage.setItem('auth_token', value)
    document.cookie = 'auth_token=' + value + '; path=/; max-age=86400; SameSite=Lax'
  }, token)
}

/** عدد نشان کنار تب nاُم، با تبدیل رقم فارسی به لاتین. */
const tabCount = async (index) => {
  const text = await page.locator('[role="tab"]').nth(index).innerText()
  const latin = text.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
  const m = latin.match(/\d+/)
  return m ? Number(m[0]) : null
}

await signInAs(adminToken)

/* ============ ۱. صف پشتیبانی ============ */
console.log('--- 1. queue page ---')
{
  await page.goto(BASE + '/fa/admin/tickets', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  const tabs = await page.locator('[role="tab"]').count()
  check('four status tabs', tabs === 4, `tabs=${tabs}`)

  const selected = await page.locator('[role="tab"]').first().getAttribute('aria-selected')
  check('needs-attention is the default tab', selected === 'true', `aria-selected=${selected}`)

  const badge = await tabCount(0)
  check('badge matches API needs_attention', badge === before.needs_attention,
    `ui=${badge} api=${before.needs_attention}`)

  const rows = await page.locator('table tbody tr').count()
  check('queue lists the new ticket', rows > 0, `rows=${rows}`)

  const body = await page.locator('table').innerText()
  check('customer name column filled', body.includes('نام آزمایشی'))

  await page.screenshot({ path: join(OUT, 'admin-tickets--desktop-light.png'), fullPage: true })
}

/* ============ ۲. جستجو ============ */
console.log('--- 2. search by ticket number ---')
{
  await page.locator('[role="tab"]').nth(3).click()
  await page.waitForTimeout(1200)

  await page.fill('input[type="search"]', TICKET)
  await page.getByRole('button', { name: 'جستجو' }).first().click()
  await page.waitForTimeout(2000)

  const rows = await page.locator('table tbody tr').count()
  check('search narrows to one row', rows === 1, `rows=${rows}`)
}

/* ============ ۳. پاسخ پشتیبانی ============ */
console.log('--- 3. staff reply ---')
{
  await page.goto(`${BASE}/fa/admin/tickets/${TICKET}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  const email = await page.locator('main').innerText()
  check('customer email shown to staff', email.includes('user@demo.dev'))

  await page.fill('#admin-ticket-reply', STAFF_REPLY)
  await page.getByRole('button', { name: 'ارسال پاسخ' }).click()
  await page.waitForTimeout(2500)

  const bubbles = await page.locator('main ol > li').count()
  check('staff bubble added', bubbles === 2, `bubbles=${bubbles}`)

  /* حباب دوم باید برچسب «پشتیبانی» داشته باشد — همان چیزی که isStaff می‌سازد */
  const second = await page.locator('main ol > li').nth(1).innerText()
  check('second bubble is labelled as support', second.includes('پشتیبانی'),
    second.split('\n')[0])

  /*
   * `before` پس از ساخت تیکت گرفته شده، پس تیکت آزمایشی داخلش هست.
   * پاسخ پشتیبانی باید دقیقاً یکی از صف کم کند.
   */
  const after = await apiCounts()
  check('left the needs-attention queue', after.needs_attention === before.needs_attention - 1,
    `${before.needs_attention} -> ${after.needs_attention}`)
  check('counted as answered', after.answered === before.answered + 1,
    `${before.answered} -> ${after.answered}`)

  await page.screenshot({ path: join(OUT, 'admin-ticket-detail--desktop-light.png'), fullPage: true })
}

/* ============ ۴. مشتری همان پاسخ را می‌بیند ============ */
/*
 * هسته‌ی این تست: تأیید اینکه دو نما یک گفتگوی واحد را نشان می‌دهند
 * و پیام پشتیبانی در سمت مشتری هم درست برچسب می‌خورد.
 */
console.log('--- 4. the customer sees the same reply ---')
{
  await signInAs(userToken)
  await page.goto(`${BASE}/fa/account/tickets/${TICKET}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)

  const bubbles = await page.locator('main ol > li').count()
  check('customer sees both messages', bubbles === 2, `bubbles=${bubbles}`)

  const text = await page.locator('main ol > li').nth(1).innerText()
  check('staff reply body visible', text.includes('مرسوله فردا'))
  check('labelled as support on the customer side', text.includes('پشتیبانی'))

  const status = await page.locator('main').innerText()
  check('status now reads answered', status.includes('پاسخ داده شده'))
}

/* ============ ۵. بستن از سمت پشتیبانی ============ */
console.log('--- 5. staff closes the ticket ---')
{
  await signInAs(adminToken)
  await page.goto(`${BASE}/fa/admin/tickets/${TICKET}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  page.once('dialog', (d) => d.accept())
  await page.getByRole('button', { name: 'بستن تیکت' }).click()
  await page.waitForTimeout(2500)

  check('reply form replaced by reopen', await page.locator('#admin-ticket-reply').count() === 0)
  check('reopen button shown', await page.getByRole('button', { name: 'بازگشایی تیکت' }).count() > 0)
}

/* ============ ۶. انگلیسی و موبایل ============ */
console.log('--- 6. english + mobile ---')
{
  await page.goto(`${BASE}/en/admin/tickets`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  const dir = await page.locator('html').getAttribute('dir')
  check('english is LTR', dir === 'ltr', `dir=${dir}`)

  const h1 = await page.locator('h1').first().innerText()
  check('heading translated', /support|queue/i.test(h1), `"${h1}"`)
  await page.screenshot({ path: join(OUT, 'admin-tickets-en--desktop-light.png'), fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/fa/admin/tickets`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  check('no horizontal overflow', overflow <= 1, `overflow=${overflow}px`)
  await page.screenshot({ path: join(OUT, 'admin-tickets--mobile-light.png'), fullPage: true })
}

/* ============ پاکسازی ============ */
/*
 * تیکت آزمایشی همین حالا بسته شده، پس از صف کاری بیرون است. برای
 * اطمینان همه‌ی صفحات پیموده می‌شوند تا بازمانده‌ی اجراهای قبلی هم
 * بسته شود — درسِ باگ پاکسازیِ تک‌صفحه‌ای در e2e-reviews.
 */
{
  let closed = 0
  for (let p = 1; ; p++) {
    const body = await (await call(adminToken, `/admin/tickets?status=all&per_page=50&page=${p}`)).json()
    for (const ticket of body.data ?? []) {
      if (ticket.subject.startsWith('e2e-') && ticket.acceptsReply) {
        await call(adminToken, `/admin/tickets/${ticket.ticketNumber}/close`, { method: 'PATCH' })
        closed++
      }
    }
    if (!body.meta || p >= body.meta.last_page) break
  }
  console.log(`  cleanup: closed ${closed} test ticket(s)`)
}

check('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '))

await browser.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
