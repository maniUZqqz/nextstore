/**
 * تست سرتاسری پروفایل و امنیت — از داخل مرورگر واقعی
 * ---------------------------------------------------------------------------
 * بررسی‌ها: نمایش و ویرایش پروفایل، نشان تأیید، خطای اعتبارسنجی
 * درون‌فیلدی، تغییر رمز با تأیید رمز فعلی، بسته شدن سایر نشست‌ها،
 * و اینکه نشست جاری دکمه‌ی خروج نداشته باشد.
 *
 * ⚠️ روی یک کاربر *یکبارمصرف* اجرا می‌شود، نه حساب نمایشی مشترک.
 *    همان دلیلِ تست API: رمز مستندشده‌ی «password» قاعده‌ی رمز را
 *    برآورده نمی‌کند و قابل بازگرداندن نیست.
 *
 * اجرا:
 *     node scripts/e2e-profile.mjs
 */

import { chromium } from 'playwright-core'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.SHOTS_BASE_URL ?? 'http://127.0.0.1:3100'
const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:8100/api/v1'
const OUT = '.shots'

/*
 * ⚠️ حساب آزمایشی **ثابت** است، نه یکتا در هر اجرا.
 *
 *    نسخه‌ی قبلی ایمیل را با Date.now() می‌ساخت و هیچ پاکسازی‌ای
 *    نداشت. چون حذف حساب مشتری از API عمداً ممکن نیست (به سفارش‌ها
 *    آبشار می‌کند)، هر اجرا یک حساب دائمی جا می‌گذاشت و فهرست
 *    مشتریان پنل پر از «کاربر تست فرانت» می‌شد.
 *
 *    حالا یک حساب بازیافت می‌شود: اگر نبود ساخته می‌شود، اگر بود
 *    رمزش به حالت اولیه برمی‌گردد.
 */
const TEST_EMAIL = 'e2e-profile@example.test'
const BASELINE_NAME = 'کاربر تست فرانت'
const FIRST_PASSWORD = 'Kp9-e2e-fixture-dR'
const SECOND_PASSWORD = 'Wm5-e2e-fixture-zQ'

/*
 * ستون `phone` در دیتابیس unique است، پس شماره هم مثل ایمیل باید
 * ثابت و کنارگذاشته باشد نه ساخته‌شده با Date.now(): قاعده‌ی
 * اعتبارسنجی همین حساب را ignore می‌کند، پس ذخیره‌ی دوباره‌ی همان
 * مقدار مشکلی ندارد. پیش‌شماره‌ی ۰۹۹۹ عمدی است — سیدرها ۰۹۱۲
 * می‌دهند و این‌طور هیچ‌وقت با داده‌ی نمونه برخورد نمی‌کند.
 */
const TEST_PHONE = '09990000001'

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

/** درخواست با تلاش مجدد — مسیرهای احراز هویت throttle دارند. */
async function authRequest(path, body) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(API + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'Accept-Language': 'fa' },
      body: JSON.stringify(body),
    })
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 12000))
      continue
    }
    return { status: res.status, body: await res.json() }
  }
  throw new Error('rate limited')
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

/**
 * آماده‌سازی حساب آزمایشی — ساخت در اولین اجرا، بازیافت در بقیه.
 *
 * سه حالت:
 *   ۱. حساب نیست         → ثبت‌نام
 *   ۲. هست با رمز اولیه  → همان توکن
 *   ۳. هست با رمز دوم    → اجرای قبلی رمز را عوض کرده و نیمه‌کاره
 *                           مانده؛ رمز بازنشانی می‌شود تا این اجرا
 *                           از نقطه‌ی درست شروع کند.
 */
/**
 * برگرداندن نام و شماره به حالت پایه.
 *
 * ⚠️ بدون این، سوئیت فقط **یک بار** سبز می‌شد.
 *
 *    بخش ۳ نام را به «نام ویرایش‌شده» تغییر می‌دهد و هیچ‌جا
 *    برنمی‌گرداند. اجرای بعدی در همان بررسی اول می‌شکست («نام از
 *    پیش پر شده») — شکستی که شبیه باگ صفحه‌ی پروفایل است، نه شبیه
 *    بازمانده‌ی اجرای قبلی.
 *
 *    `prepareFixture` فقط رمز را تضمین می‌کرد؛ نام و شماره هم
 *    بخشی از همان حالت پایه‌اند.
 */
async function resetProfileFields(authToken) {
  const response = await call(authToken, '/profile', {
    method: 'PUT',
    body: JSON.stringify({ name: BASELINE_NAME, email: TEST_EMAIL, phone: null }),
  })

  if (response.status !== 200) {
    throw new Error('بازنشانی پروفایل فیکسچر شکست خورد: ' + response.status)
  }
}

async function prepareFixture() {
  const first = await authRequest('/auth/login', { email: TEST_EMAIL, password: FIRST_PASSWORD })
  if (first.body?.data?.token) return first.body.data.token

  const second = await authRequest('/auth/login', { email: TEST_EMAIL, password: SECOND_PASSWORD })
  if (second.body?.data?.token) {
    const stale = second.body.data.token
    const reset = await call(stale, '/profile/password', {
      method: 'PUT',
      body: JSON.stringify({
        current_password: SECOND_PASSWORD,
        password: FIRST_PASSWORD,
        password_confirmation: FIRST_PASSWORD,
      }),
    })
    if (reset.status !== 200) {
      throw new Error('بازنشانی رمز فیکسچر شکست خورد: ' + reset.status)
    }
    /* تغییر رمز همه‌ی نشست‌ها را می‌بندد، پس توکن تازه لازم است */
    const again = await authRequest('/auth/login', { email: TEST_EMAIL, password: FIRST_PASSWORD })
    return again.body.data.token
  }

  const registered = await authRequest('/auth/register', {
    name: BASELINE_NAME,
    email: TEST_EMAIL,
    password: FIRST_PASSWORD,
    password_confirmation: FIRST_PASSWORD,
    accept_terms: true,
  })
  if (registered.status !== 201 && registered.status !== 200) {
    throw new Error('register ' + registered.status + ': ' + JSON.stringify(registered.body).slice(0, 200))
  }
  return registered.body.data.token
}

let token = await prepareFixture()
await resetProfileFields(token)
console.log(`کاربر آزمایشی: ${TEST_EMAIL}\n`)

const browser = await chromium.launch({ executablePath: findChromium() })
const context = await browser.newContext({
  viewport: { width: 1280, height: 1000 },
  locale: 'fa-IR',
})
const page = await context.newPage()

/* ۴۲۲ مورد انتظار است: بخش‌های اعتبارسنجی عمداً داده‌ی نامعتبر می‌فرستند */
const consoleErrors = []
page.on('pageerror', (e) => consoleErrors.push(e.message))
page.on('console', (m) => {
  if (m.type() === 'error' && !/422 \(Unprocessable/.test(m.text())) {
    consoleErrors.push(m.text())
  }
})

/** تزریق توکن جاری به مرورگر. */
async function injectAuth() {
  await page.goto(BASE + '/fa', { waitUntil: 'domcontentloaded' })
  await page.evaluate((value) => {
    localStorage.setItem('auth_token', value)
    document.cookie = 'auth_token=' + value + '; path=/; max-age=86400; SameSite=Lax'
  }, token)
}
await injectAuth()

/* ============ 1. صفحه پروفایل ============ */
console.log('--- 1. profile page ---')
{
  await page.goto(BASE + '/fa/account/profile', { waitUntil: 'networkidle', timeout: 45000 })
  await page.waitForSelector('main input[name="name"]', { timeout: 15000 })

  check('name prefilled', (await page.inputValue('main input[name="name"]')) === BASELINE_NAME)
  check('email prefilled', (await page.inputValue('main input[name="email"]')) === TEST_EMAIL)

  /* کاربر تازه ایمیل تأییدنشده دارد — نشان باید همین را بگوید */
  check('unverified badge shown', await page.getByText('تأیید نشده').first().isVisible())

  await page.screenshot({ path: OUT + '/profile-page.png', fullPage: true })
}

/* ============ 2. اعتبارسنجی پروفایل ============ */
console.log('\n--- 2. profile validation ---')
{
  /*
   * ⚠️ ایمیل نامعتبر اینجا آزمایش نمی‌شود.
   *
   *    فیلد ایمیل type="email" دارد و خودِ مرورگر پیش از ارسال
   *    فرم جلویش را می‌گیرد — یعنی درخواستی به سرور نمی‌رود و
   *    خطای درون‌فیلدیِ سروری هم ساخته نمی‌شود. نسخه‌ی اول همین
   *    را ادعا می‌کرد و شکست خورد.
   *
   *    اعتبارسنجی سمت سرورِ ایمیل در test-profile-api.mjs پوشش
   *    داده شده. اینجا شماره‌ی موبایل آزمایش می‌شود که type=tel
   *    است و مرورگر رهایش می‌کند.
   */
  await page.fill('main input[name="phone"]', '12345')
  await page.locator('main form button[type="submit"]').click()
  await page.waitForTimeout(2000)

  const phoneErrors = await page.locator('main form .text-destructive').count()
  check('invalid phone flagged', phoneErrors > 0, `count=${phoneErrors}`)
  await page.screenshot({ path: OUT + '/profile-invalid.png', fullPage: true })
}

/* ============ 3. ذخیره‌ی موفق ============ */
console.log('\n--- 3. profile save ---')
{
  await page.fill('main input[name="name"]', 'نام ویرایش‌شده')
  await page.fill('main input[name="email"]', TEST_EMAIL)
  await page.fill('main input[name="phone"]', TEST_PHONE)
  await page.locator('main form button[type="submit"]').click()
  await page.waitForTimeout(2500)

  const profile = await (await call(token, '/profile')).json()
  check('name saved', profile.data?.name === 'نام ویرایش‌شده', profile.data?.name)
  check('phone saved', profile.data?.phone === TEST_PHONE, profile.data?.phone)

  /*
   * نام در هدر هم باید عوض شده باشد — کش کاربر به‌روز می‌شود.
   * بدون آن، کاربر نام تازه را در فرم می‌بیند ولی منوی بالای صفحه
   * همچنان نام قدیمی را نشان می‌دهد.
   */
  const headerName = await page.locator('header').getByText('نام ویرایش‌شده').count()
  check('header shows the new name', headerName > 0, `count=${headerName}`)
}

/* ============ 4. صفحه امنیت ============ */
console.log('\n--- 4. security page ---')
{
  await page.goto(BASE + '/fa/account/security', { waitUntil: 'networkidle' })
  await page.waitForSelector('main input[name="current_password"]', { timeout: 15000 })

  check('password form rendered', await page.locator('main input[name="password"]').isVisible())
  check('sessions section rendered', await page.getByRole('heading', { name: 'دستگاه‌های واردشده' }).isVisible())

  /* نشست جاری نباید دکمه‌ی خروج داشته باشد */
  const currentRow = page.locator('main li').filter({ hasText: 'این دستگاه' }).first()
  check('current session marked', await currentRow.isVisible())
  check(
    'current session has no sign-out button',
    (await currentRow.getByRole('button', { name: /خروج/ }).count()) === 0,
  )

  await page.screenshot({ path: OUT + '/security-page.png', fullPage: true })
}

/* ============ 5. اعتبارسنجی رمز ============ */
console.log('\n--- 5. password validation ---')
{
  await page.fill('main input[name="current_password"]', 'wrong-password')
  await page.fill('main input[name="password"]', SECOND_PASSWORD)
  await page.fill('main input[name="password_confirmation"]', SECOND_PASSWORD)
  await page.locator('main form button[type="submit"]').first().click()
  await page.waitForTimeout(2500)

  const errors = await page.locator('main .text-destructive').count()
  check('wrong current password flagged', errors > 0, `count=${errors}`)

  /* رمز هنوز عوض نشده — ورود با رمز اول باید کار کند */
  const stillOld = await authRequest('/auth/login', { email: TEST_EMAIL, password: FIRST_PASSWORD })
  check('password unchanged', Boolean(stillOld.body.data?.token), String(stillOld.status))
}

/* ============ 6. تغییر رمز و بسته شدن نشست‌ها ============ */
console.log('\n--- 6. password change ---')
{
  /* یک نشست دیگر می‌سازیم تا ببینیم بسته می‌شود */
  const other = await authRequest('/auth/login', { email: TEST_EMAIL, password: FIRST_PASSWORD })
  const otherToken = other.body.data.token

  await page.fill('main input[name="current_password"]', FIRST_PASSWORD)
  await page.fill('main input[name="password"]', SECOND_PASSWORD)
  await page.fill('main input[name="password_confirmation"]', SECOND_PASSWORD)
  await page.locator('main form button[type="submit"]').first().click()
  await page.waitForTimeout(3000)

  /* فرم باید خالی شده باشد — رمز نباید در فیلد بماند */
  check(
    'form cleared after change',
    (await page.inputValue('main input[name="current_password"]')) === '',
  )

  const newLogin = await authRequest('/auth/login', { email: TEST_EMAIL, password: SECOND_PASSWORD })
  check('new password works', Boolean(newLogin.body.data?.token))

  const oldLogin = await authRequest('/auth/login', { email: TEST_EMAIL, password: FIRST_PASSWORD })
  check('old password rejected', !oldLogin.body.data?.token, String(oldLogin.status))

  /* نشست دیگر باید بسته شده باشد */
  const dead = await call(otherToken, '/profile')
  check('other session signed out', dead.status === 401, String(dead.status))

  /* توکن جاری باید هنوز کار کند */
  const alive = await call(token, '/profile')
  check('current session still valid', alive.status === 200, String(alive.status))
}

check('no console errors', consoleErrors.length === 0, consoleErrors[0]?.slice(0, 90) ?? '')

/* ============ بازگرداندن فیکسچر ============ */
/*
 * تست عمداً رمز را عوض می‌کند. بدون بازگرداندن، اجرای بعدی مجبور
 * است شاخه‌ی سوم prepareFixture را طی کند — که کار می‌کند ولی دو
 * ورود اضافه می‌خواهد و به سقف throttle:auth نزدیک‌تر می‌شود.
 */
{
  const current = await authRequest('/auth/login', { email: TEST_EMAIL, password: SECOND_PASSWORD })
  if (current.body?.data?.token) {
    await call(current.body.data.token, '/profile/password', {
      method: 'PUT',
      body: JSON.stringify({
        current_password: SECOND_PASSWORD,
        password: FIRST_PASSWORD,
        password_confirmation: FIRST_PASSWORD,
      }),
    })
    console.log('  fixture: رمز به حالت اولیه بازگردانده شد')
  }
}

await browser.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
