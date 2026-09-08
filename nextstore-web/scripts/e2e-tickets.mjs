/**
 * تست سرتاسری تیکت پشتیبانی — از داخل مرورگر واقعی
 * ---------------------------------------------------------------------------
 * چیزی که تست API نمی‌گیرد و اینجا گرفته می‌شود:
 *   - گزینه‌های دپارتمان از `/tickets/meta` پر می‌شوند (نه فهرست هاردکد)
 *   - دکمه‌ی ثبت تا پیش از رسیدن به حداقل طول‌ها غیرفعال است
 *   - پس از ثبت، کاربر به گفتگو *replace* می‌شود (بازگشت مرورگر به فرم برنمی‌گردد)
 *   - حباب پیام پشتیبانی و مشتری از هم تفکیک می‌شوند
 *   - بستن تیکت فرم پاسخ را با دکمه‌ی بازگشایی جایگزین می‌کند
 *   - تیکت کاربر دیگر ۴۰۴ می‌دهد و پیام خنثی نشان داده می‌شود
 *
 * ⚠️ آنچه اینجا پوشش داده **نمی‌شود**: رندر حباب پاسخ پشتیبانی
 *    (`isStaff: true`). مسیر مشتری عمداً اجازه‌ی ساخت پیام پشتیبانی
 *    نمی‌دهد و پنل ادمین تیکت هنوز ساخته نشده، پس راهی برای تولید
 *    چنین پیامی از بیرون نیست. با ساخته‌شدن `/admin/tickets` باید
 *    اضافه شود.
 *
 * پیش‌نیاز: هر دو سرور بالا و دیتابیس سیدشده.
 *
 * اجرا:
 *     node scripts/e2e-tickets.mjs
 */

import { chromium } from 'playwright-core'
import { existsSync, readdirSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.SHOTS_BASE_URL ?? 'http://127.0.0.1:3100'
const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:8100/api/v1'
const OUT = '.shots'

/** موضوع نشان‌دار تا پاکسازی بتواند فقط ساخته‌های خودش را حذف کند. */
const STAMP = `e2e-${Date.now()}`

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

/*
 * ورود با تلاش مجدد.
 *
 * دو حالت گذرا اینجا مدیریت می‌شوند:
 *   ۴۲۹ → میدل‌ور throttle:auth فقط ۵ ورود در دقیقه می‌دهد و
 *          اجرای پشت‌سرهم سوئیت‌ها به آن می‌خورد.
 *   بدنه‌ی خالی → `php artisan serve` سرور توکار PHP است و تک‌رشته‌ای
 *          کار می‌کند. وقتی Next در حال کامپایل صفحه‌ای است و هم‌زمان
 *          درخواست می‌فرستد، این درخواست می‌تواند بدون بدنه بسته شود.
 *          بدون این شاخه، `res.json()` با «Unexpected end of JSON input»
 *          می‌ترکد و شبیه باگ کد به نظر می‌رسد.
 */
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

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ executablePath: findChromium() })
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: 'fa-IR',
})
const page = await context.newPage()

/*
 * بخش ۸ عمداً تیکتی را باز می‌کند که مال کاربر نیست و ۴۰۴ می‌گیرد —
 * دقیقاً همان رفتاری که آزموده می‌شود. بدون این استثنا، تست موفقِ
 * خودش را به‌عنوان «خطای کنسول» گزارش می‌کند.
 */
const EXPECTED_ERROR = /404 \(Not Found\)/

const consoleErrors = []
page.on('pageerror', (e) => consoleErrors.push(e.message))
page.on('console', (m) => {
  if (m.type() === 'error' && !EXPECTED_ERROR.test(m.text())) consoleErrors.push(m.text())
})

/* تزریق ورود */
await page.goto(BASE + '/fa', { waitUntil: 'domcontentloaded' })
await page.evaluate((value) => {
  localStorage.setItem('auth_token', value)
  document.cookie = 'auth_token=' + value + '; path=/; max-age=86400; SameSite=Lax'
}, userToken)

/* شماره‌ی تیکتی که این اجرا می‌سازد — برای پاکسازی پایانی */
let createdNumber = null

/* ============ ۱. فهرست خالی ============ */
console.log('--- 1. list page ---')
{
  await page.goto(BASE + '/fa/account/tickets', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)

  const tabs = await page.locator('[role="tab"]').count()
  check('three status tabs', tabs === 3, `tabs=${tabs}`)

  const newLink = page.getByRole('link', { name: 'تیکت جدید' })
  check('new-ticket link present', await newLink.count() > 0)

  await page.screenshot({ path: join(OUT, 'tickets-list--desktop-light.png'), fullPage: true })
}

/* ============ ۲. فرم — گزینه‌ها از meta می‌آیند ============ */
console.log('--- 2. form options come from the API ---')
{
  await page.goto(BASE + '/fa/account/tickets/new', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  /*
   * چهار دپارتمان در enum بک‌اند هست به‌علاوه‌ی گزینه‌ی راهنمای غیرفعال.
   * اگر فرم فهرست خودش را داشت، این عدد با تغییر enum از هم دور می‌شد.
   */
  const depts = await page.locator('#ticket-department option').count()
  check('departments loaded from /tickets/meta', depts === 5, `options=${depts} (4 + placeholder)`)

  const prios = await page.locator('#ticket-priority option').count()
  check('priorities loaded', prios === 3, `options=${prios}`)

  const firstDept = await page.locator('#ticket-department option').nth(1).innerText()
  check('department label is localised', firstDept === 'مشکل فنی', `"${firstDept}"`)
}

/* ============ ۳. اعتبارسنجی سمت کلاینت ============ */
console.log('--- 3. submit stays disabled until valid ---')
{
  const submit = page.getByRole('button', { name: 'ثبت تیکت' })
  check('disabled on empty form', await submit.isDisabled())

  await page.fill('#ticket-subject', 'کوتاه')
  await page.fill('#ticket-body', 'خیلی کوتاه')
  check('still disabled below minimums', await submit.isDisabled())

  await page.fill('#ticket-subject', `${STAMP} سفارش من نرسیده است`)
  await page.selectOption('#ticket-department', 'orders')
  await page.selectOption('#ticket-priority', 'high')
  await page.fill(
    '#ticket-body',
    'سه روز از ثبت سفارش گذشته و هنوز ارسال نشده است. لطفاً وضعیت را بررسی کنید.',
  )
  check('enabled once all minimums met', await submit.isEnabled())

  await page.screenshot({ path: join(OUT, 'tickets-form--desktop-light.png'), fullPage: true })
}

/* ============ ۴. ثبت و هدایت ============ */
console.log('--- 4. create redirects to the conversation ---')
{
  await page.getByRole('button', { name: 'ثبت تیکت' }).click()
  await page.waitForURL(/\/account\/tickets\/TK-/, { timeout: 20000 })
  await page.waitForTimeout(1500)

  const url = page.url()
  createdNumber = url.split('/').pop()
  check('navigated to the new ticket', /TK-\d+/.test(createdNumber ?? ''), createdNumber)

  const bubbles = await page.locator('main ol > li').count()
  check('first message rendered', bubbles === 1, `bubbles=${bubbles}`)

  const status = await page.locator('main h1').first().innerText()
  check('subject shown as heading', status.includes(STAMP), status.slice(0, 40))
}

/* ============ ۵. بازگشت مرورگر به فرم برنمی‌گردد ============ */
/*
 * فرم با router.replace هدایت می‌کند نه push. بدون آن، کاربر با یک
 * کلیکِ «بازگشت» به فرمِ پرشده می‌رسید و به‌سادگی تیکت دوم می‌ساخت.
 */
console.log('--- 5. back does not return to the filled form ---')
{
  await page.goBack({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  check('back leaves the form behind', !/\/account\/tickets\/new/.test(page.url()),
    page.url().replace(BASE, ''))
}

/* ============ ۶. پاسخ کاربر ============ */
console.log('--- 6. reply ---')
{
  await page.goto(`${BASE}/fa/account/tickets/${createdNumber}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)

  await page.fill('#ticket-reply', 'یک نکته‌ی دیگر: شماره تماس من عوض شده است.')
  await page.getByRole('button', { name: 'ارسال پاسخ' }).click()
  await page.waitForTimeout(2500)

  const bubbles = await page.locator('main ol > li').count()
  check('second bubble appeared', bubbles === 2, `bubbles=${bubbles}`)

  const cleared = await page.locator('#ticket-reply').inputValue()
  check('textarea cleared after send', cleared === '', `"${cleared}"`)
}

/* ============ ۷. بستن و بازگشایی ============ */
console.log('--- 7. close then reopen ---')
{
  await page.goto(`${BASE}/fa/account/tickets/${createdNumber}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)

  page.once('dialog', (d) => d.accept())
  await page.getByRole('button', { name: 'بستن تیکت' }).click()
  await page.waitForTimeout(2500)

  check('reply form replaced by reopen', await page.locator('#ticket-reply').count() === 0)
  const reopen = page.getByRole('button', { name: 'بازگشایی تیکت' })
  check('reopen button shown', await reopen.count() > 0)

  await page.screenshot({ path: join(OUT, 'tickets-closed--desktop-light.png'), fullPage: true })

  await reopen.click()
  await page.waitForTimeout(2500)
  check('reply form is back', await page.locator('#ticket-reply').count() === 1)
}

/* ============ ۸. تیکت دیگران ۴۰۴ می‌دهد ============ */
console.log('--- 8. someone else\'s ticket is a neutral 404 ---')
{
  await page.goto(`${BASE}/fa/account/tickets/TK-000001`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  const body = await page.locator('main').innerText()
  check('neutral not-found message', body.includes('پیدا نشد'), body.slice(0, 60).replace(/\n/g, ' '))
}

/* ============ ۹. انگلیسی و موبایل ============ */
console.log('--- 9. english + mobile ---')
{
  await page.goto(`${BASE}/en/account/tickets`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)

  const dir = await page.locator('html').getAttribute('dir')
  check('english is LTR', dir === 'ltr', `dir=${dir}`)

  const h1 = await page.locator('main h1').first().innerText()
  check('heading translated', /support|ticket/i.test(h1), `"${h1}"`)
  await page.screenshot({ path: join(OUT, 'tickets-list-en--desktop-light.png'), fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/fa/account/tickets/${createdNumber}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  check('no horizontal overflow', overflow <= 1, `overflow=${overflow}px`)
  await page.screenshot({ path: join(OUT, 'tickets-detail--mobile-light.png'), fullPage: true })
}

/* ============ پاکسازی ============ */
/*
 * ⚠️ همه‌ی صفحات پیموده می‌شوند، نه فقط اولی. درسِ e2e-reviews:
 *    پاکسازی تک‌صفحه‌ای وقتی داده زیاد شود بی‌صدا از کار می‌افتد و
 *    زباله‌ی هر اجرا در فهرست تلنبار می‌شود.
 *
 * ⚠️ مسیر مشتری اندپوینت حذف ندارد (عمدی: کاربر نباید سابقه‌ی
 *    پشتیبانی را پاک کند). پس تیکت تست بسته می‌شود تا از تب «باز»
 *    بیرون برود و دموی بعدی را شلوغ نکند.
 */
{
  let closed = 0
  for (let p = 1; ; p++) {
    const body = await (await call(userToken, `/tickets?per_page=50&page=${p}`)).json()
    for (const ticket of body.data ?? []) {
      if (ticket.subject.startsWith('e2e-') && ticket.acceptsReply) {
        await call(userToken, `/tickets/${ticket.ticketNumber}/close`, { method: 'PATCH' })
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
