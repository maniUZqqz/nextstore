/**
 * تست سرتاسری بازیابی رمز عبور — از داخل مرورگر واقعی
 * ---------------------------------------------------------------------------
 * چیزی که تست API نمی‌گیرد و اینجا گرفته می‌شود:
 *   - لینک «فراموشی رمز» در صفحه‌ی ورود به جای زنده‌ای می‌رود (پیش‌تر ۴۰۴ بود)
 *   - ایمیل واقعاً فرستاده می‌شود و پیوندش به **فرانت‌اند** اشاره می‌کند
 *   - همان پیوند، رمز را عوض می‌کند و ورود با رمز تازه کار می‌کند
 *   - توکن یک‌بارمصرف است
 *   - پیوند بدون توکن، پیش از پر کردن فرم هشدار می‌دهد
 *   - ایمیل ناموجود همان پاسخ ایمیل موجود را می‌گیرد (شمارش کاربر ممکن نباشد)
 *
 * ⚠️ روی حساب **اختصاصی خودش** کار می‌کند، نه `user@demo.dev`.
 *
 *    نسخه‌ی اول رمز حساب نمونه را عوض می‌کرد و در انتها برمی‌گرداند.
 *    شدنی نبود: رمز آن حساب رشته‌ی «password» است که در فهرست رمزهای
 *    لو‌رفته قرار دارد، و قاعده‌ی `uncompromised()` هر اندپوینتی را —
 *    چه بازنشانی، چه تغییر رمز — از پذیرفتنش باز می‌دارد. سیدر آن را
 *    با `forceFill` و بدون اعتبارسنجی می‌گذارد.
 *
 *    یعنی تست می‌توانست رمز را خراب کند ولی هرگز نمی‌توانست درستش
 *    کند — و هر تست دیگری که با آن حساب وارد می‌شود از آن لحظه به
 *    بعد می‌شکست، بدون هیچ سرنخی از علت.
 *
 * ⚠️ حساب با ایمیل ثابت ساخته می‌شود، پس اجرای دوباره چیزی اضافه
 *    نمی‌کند. اگر از قبل باشد، ثبت‌نام ۴۲۲ می‌دهد و تست ادامه می‌دهد.
 *
 * ⚠️ به `MAIL_MAILER=log` تکیه می‌کند: پیوند از
 *    `nextstore-api/storage/logs/laravel.log` خوانده می‌شود. با
 *    سرویس ایمیل واقعی، این بخش باید عوض شود.
 *
 * اجرا:
 *     node scripts/e2e-password-reset.mjs
 */

import { chromium } from 'playwright-core'
import { existsSync, readdirSync, readFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.SHOTS_BASE_URL ?? 'http://127.0.0.1:3100'
const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:8100'
const LOG = process.env.API_LOG ?? '../nextstore-api/storage/logs/laravel.log'
const OUT = '.shots'

/** حساب اختصاصی این تست — هرگز حساب مشترک نمونه نه. */
const ACCOUNT = 'e2e-reset@example.test'
const ORIGINAL = 'Origin4l7Pass'
const TEMPORARY = 'Reset9Temp7x'

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

/**
 * آخرین پیوند بازنشانی در لاگ.
 *
 * ⚠️ `&amp;` در متن ایمیل HTML-encode شده است و باید برگردانده شود،
 *    وگرنه پارامتر `email` به «amp;email» تبدیل می‌شود و توکن معتبر
 *    هم رد می‌شود — شکستی که شبیه «توکن خراب است» به نظر می‌رسد.
 */
function lastResetLink(forEmail = ACCOUNT) {
  if (!existsSync(LOG)) return null

  const text = readFileSync(LOG, 'utf8')
  const matches = text.match(/https?:\/\/[^\s"'<>]*\/reset-password\?[^\s"'<>]+/g)
  if (!matches?.length) return null

  /*
   * ⚠️ فیلتر بر اساس ایمیل، نه صرفاً «آخرین پیوند لاگ».
   *
   *    لاگ مشترک است: هر درخواست بازیابی دیگری — از تست دیگر یا از
   *    آزمون دستی — آخرین سطر را عوض می‌کند. بدون فیلتر، این تست
   *    توکن حساب دیگری را برمی‌داشت و «توکن نامعتبر» می‌گرفت؛ شکستی
   *    که به‌سراغ باگی می‌فرستد که وجود ندارد.
   */
  const encoded = encodeURIComponent(forEmail)
  const mine = matches.filter((url) => url.includes(encoded))
  if (!mine.length) return null

  return mine[mine.length - 1].replace(/&amp;/g, '&')
}

/**
 * ورود مستقیم از راه API — برای بررسی اینکه رمز واقعاً عوض شده.
 *
 * ⚠️ ۴۲۹ با «رمز غلط» یکی گرفته نمی‌شود.
 *
 *    مسیر ورود سقف ۵ در دقیقه روی هر ترکیب ایمیل و IP دارد و این
 *    تست در یک اجرا شش‌بار وارد می‌شود. نسخه‌ی اول هر پاسخ غیر ۲۰۰ را
 *    «رمز کار نکرد» می‌خواند، پس بررسی پایانی شکست می‌خورد در حالی
 *    که رمز کاملاً درست بود — شکستی که به‌سراغ باگی می‌فرستد که وجود
 *    ندارد.
 *
 *    در صورت ۴۲۹ یک بار صبر می‌کند و دوباره می‌آزماید.
 */
async function signIn(password) {
  const attempt = () =>
    fetch(`${API}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: ACCOUNT, password }),
    })

  let response = await attempt()

  if (response.status === 429) {
    console.log('  (login throttled — waiting out the window)')
    await new Promise((resolve) => setTimeout(resolve, 62_000))
    response = await attempt()
  }

  if (response.status !== 200) return null

  return (await response.json()).data.token
}

/** فقط «آیا این رمز کار می‌کند؟» — بدون نیاز به توکن. */
async function canSignIn(password) {
  return (await signIn(password)) !== null
}

/**
 * برگرداندن رمز حساب به حالت اولیه با اندپوینت تغییر رمز.
 *
 * ⚠️ بازنشانی تازه استفاده نمی‌شود: به سقف ۲-در-دقیقه‌ی درخواست پیوند
 *    می‌خورد و به لاگی وابسته است که ممکن است هنوز نوشته نشده باشد.
 */
async function restorePassword(from) {
  const token = await signIn(from)
  if (!token) return `sign-in with the temporary password failed`

  const response = await fetch(`${API}/api/v1/profile/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      current_password: from,
      password: ORIGINAL,
      password_confirmation: ORIGINAL,
    }),
  })

  return `change-password -> ${response.status}`
}

/**
 * ساخت حساب آزمایشی — یا اطمینان از اینکه رمزش همان چیزی است که
 * انتظار داریم.
 *
 * ⚠️ اگر حساب از اجرای قبلی مانده باشد، رمزش ممکن است `TEMPORARY`
 *    باشد (اجرا وسط کار شکسته). پس هر دو رمز آزموده می‌شوند و اگر
 *    لازم بود، با اندپوینت تغییر رمز به حالت اولیه برمی‌گردد.
 */
async function ensureAccount() {
  const registered = await fetch(`${API}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      name: 'حساب آزمون بازیابی',
      email: ACCOUNT,
      password: ORIGINAL,
      password_confirmation: ORIGINAL,
      accept_terms: true,
    }),
  })

  if (registered.status === 201 || registered.status === 200) return 'created'

  /* از قبل هست — رمز اولیه کار می‌کند؟ */
  if (await canSignIn(ORIGINAL)) return 'reused'

  /* اجرای قبلی وسط کار شکسته و رمز موقت مانده — برش گردان */
  const outcome = await restorePassword(TEMPORARY)

  if (!(await canSignIn(ORIGINAL))) {
    throw new Error(`حساب آزمون قابل بازیابی نیست (${outcome})`)
  }

  return `repaired (${outcome})`
}

mkdirSync(OUT, { recursive: true })

console.log(`  fixture: ${await ensureAccount()}`)

const browser = await chromium.launch({ executablePath: findChromium() })
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: 'fa-IR',
})
const page = await context.newPage()

const consoleErrors = []
page.on('pageerror', (e) => consoleErrors.push(e.message))
page.on('console', (m) => {
  /* ۴۲۲ و ۴۲۹ را این تست عمداً می‌سازد */
  if (m.type() === 'error' && !/status of (422|429)/.test(m.text())) {
    consoleErrors.push(m.text())
  }
})

/* ============ ۱. لینک صفحه‌ی ورود دیگر مرده نیست ============ */
/*
 * ⚠️ این بررسی یک باگ واقعی را نگه می‌دارد: `LoginForm` از روز اول به
 *    «/forgot-password» لینک می‌داد، `robots.ts` فهرستش کرده بود و
 *    صفحه‌ی سؤالات متداول هم به مشتری می‌گفت از آن استفاده کند — ولی
 *    صفحه‌اش وجود نداشت و کاربر به ۴۰۴ می‌رسید.
 */
console.log('--- 1. the login page link is no longer dead ---')
{
  await page.goto(BASE + '/fa/login', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  const link = page.locator('a[href$="/forgot-password"]')
  check('the login page links to it', (await link.count()) === 1)

  await link.first().click()
  await page.waitForURL(/forgot-password/, { timeout: 15000 })
  await page.waitForTimeout(1500)

  const body = await page.locator('main').innerText()
  check('it lands on a real page, not a 404',
    !/۴۰۴|404|پیدا نشد/.test(body), body.slice(0, 60).replace(/\n/g, ' '))
  check('the email field is there', (await page.locator('#email').count()) === 1)
}

/* ============ ۲. ایمیل ناموجود همان پاسخ را می‌گیرد ============ */
/*
 * ⚠️ اگر پاسخ فرق کند، این اندپوینت به ابزار شمارش کاربر تبدیل
 *    می‌شود: کسی با فهرستی از ایمیل‌ها می‌فهمد کدام‌ها اینجا حساب
 *    دارند و همان فهرست را برای فیشینگ هدفمند به کار می‌برد.
 */
console.log('--- 2. an unknown email gets the same answer ---')
{
  /*
   * ⚠️ اینجا عمداً **حساب دیگری** آزموده می‌شود، نه حساب این تست.
   *
   *    سقف درخواست پیوند ۲ در دقیقه روی هر ایمیل است. نسخه‌ی اول
   *    همین‌جا سطل حساب آزمون را مصرف می‌کرد و مرحله‌ی بعد — که فرم
   *    واقعی را می‌فرستد — ۴۲۹ می‌گرفت. چهار شکست که هیچ‌کدام باگ کد
   *    نبودند.
   *
   *    خاصیت امنیتیِ سنجیده‌شده همان است: پاسخِ ایمیل شناخته‌شده باید
   *    با پاسخِ ایمیل ناشناخته یکی باشد.
   */
  const known = await fetch(`${API}/api/v1/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'Accept-Language': 'fa' },
    body: JSON.stringify({ email: 'admin@demo.dev' }),
  })
  const knownBody = await known.json()

  const unknown = await fetch(`${API}/api/v1/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'Accept-Language': 'fa' },
    body: JSON.stringify({ email: 'definitely-not-here@nowhere.test' }),
  })
  const unknownBody = await unknown.json()

  check('same status code', known.status === unknown.status,
    `${known.status} vs ${unknown.status}`)
  check('same message', knownBody.message === unknownBody.message,
    knownBody.message?.slice(0, 45))
}

/* ============ ۳. فرم واقعاً ایمیل می‌فرستد ============ */
console.log('--- 3. the form actually sends an email ---')
{
  const before = lastResetLink()

  await page.fill('#email', ACCOUNT)
  await page.getByRole('button', { name: /ارسال/ }).click()
  await page.waitForTimeout(3000)

  const body = await page.locator('main').innerText()
  check('a confirmation replaces the form', body.includes('فرستاده شد'),
    body.slice(0, 60).replace(/\n/g, ' '))
  check('the typed address is echoed back', body.includes(ACCOUNT))

  /*
   * ⚠️ فرم پس از ارسال دیگر نشان داده نمی‌شود.
   *
   *    اگر بماند، کاربری که ایمیل را فوری نمی‌بیند دکمه را چند بار
   *    می‌زند، به سقف نرخ می‌خورد و فکر می‌کند سامانه خراب است.
   */
  check('the form itself is gone', (await page.locator('#email').count()) === 0)

  await page.screenshot({ path: join(OUT, 'forgot-password--desktop-light.png'), fullPage: false })

  const after = lastResetLink()
  check('a reset link reached the mail log', Boolean(after) && after !== before,
    after ? after.slice(0, 70) + '…' : '(هیچ)')

  /* پیوند باید به فرانت اشاره کند، نه به خود لاراول */
  check('the link points at the frontend, not the API',
    Boolean(after?.includes('/reset-password?token=')) && !after?.includes(':8100'),
    after?.split('?')[0])
}

/* ============ ۴. پیوند ناقص پیش از پر کردن فرم هشدار می‌دهد ============ */
console.log('--- 4. an incomplete link warns before the form ---')
{
  await page.goto(BASE + '/fa/reset-password', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  const body = await page.locator('main').innerText()
  check('it says the link is incomplete', body.includes('ناقص'),
    body.slice(0, 60).replace(/\n/g, ' '))
  check('no password fields are shown', (await page.locator('#password').count()) === 0)
  check('it offers a way to request a new link',
    (await page.locator('a[href$="/forgot-password"]').count()) > 0)
}

/* ============ ۵. بازنشانی واقعی ============ */
console.log('--- 5. the real reset ---')
let usedLink = null
{
  usedLink = lastResetLink()
  if (!usedLink) throw new Error('پیوند بازنشانی در لاگ پیدا نشد')

  /* پیوند از لاگ با نشانی مطلق می‌آید؛ همان را باز می‌کنیم */
  await page.goto(usedLink, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  const body = await page.locator('main').innerText()
  check('the account email is shown but not editable', body.includes(ACCOUNT))
  check('the email is not an input',
    (await page.locator('input[value="' + ACCOUNT + '"]').count()) === 0)

  await page.fill('#password', TEMPORARY)
  await page.fill('#password_confirmation', TEMPORARY)
  await page.getByRole('button', { name: /ذخیره/ }).click()
  await page.waitForTimeout(3500)

  const after = await page.locator('main').innerText()
  check('a success panel appears', after.includes('عوض شد'),
    after.slice(0, 60).replace(/\n/g, ' '))

  await page.screenshot({ path: join(OUT, 'reset-password-done--desktop-light.png'), fullPage: false })

  check('the new password works', await canSignIn(TEMPORARY))
  check('the old password no longer works', !(await canSignIn(ORIGINAL)))
}

/* ============ ۶. توکن یک‌بارمصرف است ============ */
/*
 * ⚠️ بدون این، کسی که یک بار به ایمیل قربانی دسترسی پیدا کرده،
 *    می‌توانست ماه‌ها بعد هم با همان پیوند رمز را دوباره عوض کند.
 */
console.log('--- 6. the token is single-use ---')
{
  await page.goto(usedLink, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  await page.fill('#password', 'SomethingElse9x')
  await page.fill('#password_confirmation', 'SomethingElse9x')
  await page.getByRole('button', { name: /ذخیره/ }).click()
  await page.waitForTimeout(3000)

  const body = await page.locator('main').innerText()
  check('reusing it is refused', body.includes('معتبر نیست') || body.includes('منقضی'),
    body.slice(0, 80).replace(/\n/g, ' '))

  check('the password from step 5 still stands', await canSignIn(TEMPORARY))
}

/* ============ ۷. انگلیسی و موبایل ============ */
console.log('--- 7. english + mobile ---')
{
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/en/forgot-password`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)

  check('english is LTR', (await page.locator('html').getAttribute('dir')) === 'ltr')

  const heading = await page.locator('main h1').first().innerText()
  check('heading translated', /reset|password/i.test(heading), `"${heading}"`)

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  check('no horizontal overflow', overflow <= 1, `overflow=${overflow}px`)

  await page.screenshot({ path: join(OUT, 'forgot-password--mobile-en.png'), fullPage: false })
}

/* ============ پاکسازی ============ */
/*
 * رمز حساب آزمون به حالت اولیه برمی‌گردد.
 *
 * ⚠️ با اندپوینت **تغییر رمز** انجام می‌شود، نه با یک بازنشانی تازه.
 *
 *    نسخه‌ی اول پیوند دیگری می‌گرفت و با آن رمز را برمی‌گرداند. دو
 *    ایراد داشت: به سقف ۲-در-دقیقه‌ی درخواست پیوند می‌خورد، و اگر
 *    لاگ هنوز نوشته نشده بود توکن کهنه می‌گرفت. تغییر رمز هیچ‌کدام را
 *    ندارد و مستقیم است.
 *
 * ⚠️ اگر این بخش شکست بخورد، اجرای بعدی خودش ترمیم می‌کند
 *    (`ensureAccount` هر دو رمز را می‌آزماید) — پس یک شکست موقت،
 *    تست را برای همیشه خراب نمی‌کند.
 */
{
  console.log(`  cleanup: ${await restorePassword(TEMPORARY)}`)

  check('the test account password is back to its baseline', await canSignIn(ORIGINAL))
}

check('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '))

await browser.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
