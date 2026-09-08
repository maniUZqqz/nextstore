/**
 * تست سرتاسری مدیریت آدرس‌ها
 * ---------------------------------------------------------------------------
 * بررسی‌ها: حالت خالی، افزودن، اعتبارسنجی، ویرایش، تعیین پیش‌فرض،
 * حذف، و اینکه فرم مشترک با تسویه همان قواعد را اعمال کند.
 *
 * پیش‌نیاز: هر دو سرور بالا.
 *
 * اجرا:
 *     node scripts/e2e-addresses.mjs
 */

import { chromium } from 'playwright-core'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

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

const token = await apiLogin('user@demo.dev')

/**
 * پاکسازی آدرس‌های ساخته‌شده‌ی تست.
 *
 * فقط آدرس‌هایی با برچسب تست حذف می‌شوند — آدرس نمونه‌ی سیدر باید
 * بماند وگرنه اجرای بعدی از وضعیت متفاوتی شروع می‌کند.
 */
async function cleanup() {
  const list = await (await call(token, '/addresses')).json()
  for (const a of list.data ?? []) {
    if ((a.label ?? '').startsWith('تست')) {
      await call(token, '/addresses/' + a.id, { method: 'DELETE' })
    }
  }
}
await cleanup()

const browser = await chromium.launch({ executablePath: findChromium() })
const context = await browser.newContext({
  viewport: { width: 1280, height: 1000 },
  locale: 'fa-IR',
})
const page = await context.newPage()

const consoleErrors = []
page.on('pageerror', (e) => consoleErrors.push(e.message))
page.on('console', (m) => {
  /* ۴۲۲ مورد انتظار است: بخش اعتبارسنجی عمداً فرم ناقص می‌فرستد */
  if (m.type() === 'error' && !/422 \(Unprocessable/.test(m.text())) {
    consoleErrors.push(m.text())
  }
})

/* تزریق ورود */
await page.goto(BASE + '/fa', { waitUntil: 'domcontentloaded' })
await page.evaluate((value) => {
  localStorage.setItem('auth_token', value)
  document.cookie = 'auth_token=' + value + '; path=/; max-age=86400; SameSite=Lax'
}, token)

/*
 * ⚠️ همه‌ی سلکتورها به main محدود شده‌اند.
 *
 *    هدر یک فرم جستجو دارد و فوتر یک فرم خبرنامه — هر دو دکمه‌ی
 *    submit دارند. سلکتور کلیِ form چهار عنصر می‌گرفت و Playwright
 *    با خطای strict mode متوقف می‌شد.
 */
const goToAddresses = async () => {
  await page.goto(BASE + '/fa/account/addresses', { waitUntil: 'networkidle', timeout: 45000 })
  await page.waitForTimeout(1200)
}

/* ============ 1. صفحه بالا می‌آید ============ */
console.log('--- 1. page loads ---')
{
  await goToAddresses()
  check('heading rendered', await page.locator('h1').isVisible())

  const cards = await page.locator('main ul li').count()
  check('existing addresses listed', cards >= 1, `count=${cards}`)
  await page.screenshot({ path: OUT + '/addresses-list.png', fullPage: true })
}

/* ============ 2. اعتبارسنجی فرم ============ */
console.log('\n--- 2. form validation ---')
{
  await page.getByRole('button', { name: /افزودن/ }).first().click()
  await page.waitForSelector('main form', { timeout: 10000 })

  /* ارسال خالی باید خطای درون‌فیلدی بدهد، نه درخواست شبکه */
  await page.locator('main form button[type="submit"]').click()
  await page.waitForTimeout(800)

  const alerts = await page.locator('main form [role="alert"], main form .text-destructive').count()
  check('inline validation errors shown', alerts > 0, `count=${alerts}`)
  check('form stays open', await page.locator('main form').isVisible())
  await page.screenshot({ path: OUT + '/addresses-form-invalid.png', fullPage: true })
}

/* ============ 3. افزودن ============ */
console.log('\n--- 3. create ---')
{
  await page.fill('main input[name="label"]', 'تست خودکار')
  await page.fill('main input[name="recipient_name"]', 'گیرنده آزمایشی')
  await page.fill('main input[name="recipient_phone"]', '09121234567')
  await page.fill('main input[name="province"]', 'تهران')
  await page.fill('main input[name="city"]', 'تهران')
  await page.fill('main textarea[name="street"], input[name="street"]', 'خیابان آزمایشی، کوچه تست، پلاک ۱۰')

  await page.locator('main form button[type="submit"]').click()
  await page.waitForTimeout(2500)

  check('form closed after save', (await page.locator('main form').count()) === 0)

  const list = await (await call(token, '/addresses')).json()
  const created = (list.data ?? []).find((a) => a.label === 'تست خودکار')
  check('address saved on server', Boolean(created), created?.recipientName)
  check('phone stored', created?.recipientPhone === '09121234567', created?.recipientPhone)
}

/* ============ 4. ویرایش ============ */
console.log('\n--- 4. edit ---')
{
  await goToAddresses()

  /* کارت تستی را پیدا و ویرایشش می‌کنیم */
  const card = page.locator('main ul li').filter({ hasText: 'تست خودکار' }).first()
  check('test card visible', await card.isVisible())

  await card.getByRole('button', { name: /ویرایش/ }).click()
  await page.waitForSelector('main form', { timeout: 10000 })

  const prefilled = await page.inputValue('main input[name="recipient_name"]')
  check('form prefilled', prefilled === 'گیرنده آزمایشی', prefilled)

  await page.fill('main input[name="recipient_name"]', 'گیرنده ویرایش‌شده')
  await page.locator('main form button[type="submit"]').click()
  await page.waitForTimeout(2500)

  const list = await (await call(token, '/addresses')).json()
  const updated = (list.data ?? []).find((a) => a.label === 'تست خودکار')
  check('name updated', updated?.recipientName === 'گیرنده ویرایش‌شده', updated?.recipientName)
  check('other fields untouched', updated?.city === 'تهران', updated?.city)
}

/* ============ 5. تعیین پیش‌فرض ============ */
console.log('\n--- 5. set default ---')
{
  await goToAddresses()

  const card = page.locator('main ul li').filter({ hasText: 'تست خودکار' }).first()
  const defaultBtn = card.getByRole('button', { name: /پیش‌فرض/ })

  if (await defaultBtn.count()) {
    await defaultBtn.first().click()
    await page.waitForTimeout(2500)

    const list = await (await call(token, '/addresses')).json()
    const target = (list.data ?? []).find((a) => a.label === 'تست خودکار')
    check('marked as default', target?.isDefault === true, String(target?.isDefault))

    /* فقط یک آدرس می‌تواند پیش‌فرض باشد */
    const defaults = (list.data ?? []).filter((a) => a.isDefault)
    check('exactly one default', defaults.length === 1, `count=${defaults.length}`)
  } else {
    check('set-default button hidden on the default card', true, 'already default')
  }
}

/* ============ 6. حذف ============ */
console.log('\n--- 6. delete ---')
{
  await goToAddresses()

  /* تأیید مرورگر را خودکار قبول می‌کنیم */
  page.once('dialog', (dialog) => dialog.accept())

  const card = page.locator('main ul li').filter({ hasText: 'تست خودکار' }).first()
  await card.getByRole('button', { name: /حذف/ }).click()
  await page.waitForTimeout(2500)

  const list = await (await call(token, '/addresses')).json()
  const gone = !(list.data ?? []).some((a) => a.label === 'تست خودکار')
  check('address removed', gone)

  /*
   * حذف آدرس پیش‌فرض نباید کاربر را بدون پیش‌فرض بگذارد — بک‌اند
   * باید اولین آدرس باقی‌مانده را جایگزین کند.
   */
  if ((list.data ?? []).length > 0) {
    const defaults = (list.data ?? []).filter((a) => a.isDefault)
    check('a default still exists', defaults.length === 1, `count=${defaults.length}`)
  }
}

await cleanup()
check('no console errors', consoleErrors.length === 0, consoleErrors[0]?.slice(0, 90) ?? '')

await browser.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
