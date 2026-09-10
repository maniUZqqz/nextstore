/**
 * تست سرتاسری «تماس با ما» — از داخل مرورگر واقعی
 * ---------------------------------------------------------------------------
 * چیزی که تست API نمی‌گیرد و اینجا گرفته می‌شود:
 *   - صفحه‌ی تماس اطلاعات را از **تنظیمات** می‌گیرد نه از فایل ترجمه
 *   - تلفن و ایمیل واقعاً لینک‌اند (tel: و mailto:)
 *   - رقم فارسی در `tel:` به لاتین تبدیل شده، وگرنه لینک بی‌اثر است
 *   - فرم واقعاً ارسال می‌کند (پیش‌تر فقط ادعا می‌کرد نمی‌کند)
 *   - خطای اعتبارسنجی زیر همان فیلد می‌نشیند
 *   - پیام در صندوق پنل مدیریت پیدا می‌شود
 *   - باز کردن پیام آن را خوانده‌شده می‌کند و شمارنده جابه‌جا می‌شود
 *   - حذف کار می‌کند (و تست بعد از خودش تمیز می‌کند)
 *
 * ⚠️ این تست **پیام واقعی می‌سازد**. پاکسازی در انتها اجباری است،
 *    وگرنه صندوق با هر اجرا یک قلم زباله بیشتر می‌گیرد — همان اشتباهی
 *    که در تست نظرات رخ داد و ۷ قلم یتیم به جا گذاشت.
 *
 * ⚠️ بک‌اند سقف ۳ پیام در دقیقه **و ۲۰ در ساعت** روی هر IP دارد، و
 *    این تست عمداً به سقف دقیقه‌ای می‌خورد تا پیامش را بسنجد.
 *
 *    سقف ساعتی یک ساعت زنده می‌ماند و بین اجراها پاک نمی‌شود: هر
 *    اجرا حدود شش پیام می‌سوزاند، پس اجرای سوم در همان ساعت از
 *    همان بخش «خطاهای اعتبارسنجی» می‌شکند — چون سرور ۴۲۹ می‌دهد
 *    نه ۴۲۲ و خطایی زیر فیلدها نمی‌نشیند. سه شکست که هیچ‌کدام باگ
 *    نیستند، و یک ساعت بعد خودبه‌خود سبز می‌شوند.
 *
 *    برای همین اجرا با صفر کردن شمارنده شروع می‌شود — سقف دست
 *    نمی‌خورد، فقط داده‌ی بازمانده‌ی اجرای قبلی پاک می‌شود.
 *
 * اجرا:
 *     node scripts/e2e-contact.mjs
 */

import { chromium } from 'playwright-core'
import { existsSync, readdirSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { waitUntil } from './lib/wait.mjs'
import { execFileSync } from 'node:child_process'

const BASE = process.env.SHOTS_BASE_URL ?? 'http://127.0.0.1:3100'
const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:8100'
const OUT = '.shots'

/**
 * صفر کردن شمارنده‌ی سقف نرخ پیش از شروع.
 *
 * شکستش کشنده نیست: اگر PHP پرتابل جای دیگری باشد یا فرمان نباشد،
 * تست باید اجرا شود و حداکثر به همان شکست قابل‌تشخیص برسد — نه
 * اینکه پیش از هر بررسی‌ای بمیرد.
 */
function resetRateLimits() {
  const php = join('..', 'tools', 'php', 'php.exe')
  const api = join('..', 'nextstore-api')

  try {
    execFileSync(php, ['artisan', 'e2e:reset-limits'], { cwd: api, stdio: 'pipe' })
    console.log('  (شمارنده‌ی سقف نرخ صفر شد)')
  } catch (error) {
    console.log('  (صفر کردن سقف نرخ ممکن نشد — ' + String(error.message).slice(0, 90) + ')')
  }
}
resetRateLimits()

/** نشانه‌ای که فقط این اجرا می‌سازد — برای پیدا کردن و حذف پیام خودمان. */
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

/** توکن مدیر — برای پاکسازی و بررسی مستقیم API. */
async function adminToken() {
  /*
   * ⚠️ ۴۲۹ با «رمز اشتباه» یکی گرفته نمی‌شود.
   *
   *    مسیر ورود سقف ۵ تلاش در دقیقه روی هر ترکیب ایمیل و IP دارد و
   *    **۱۴ سوئیت** از همان حساب `admin@demo.dev` استفاده می‌کنند.
   *    وقتی `pnpm test:e2e` همه را پشت هم اجرا می‌کند، سوئیت‌های میانی
   *    به آن سقف می‌خورند.
   *
   *    نسخه‌ی اول هر پاسخ غیر ۲۰۰ را «ورود ناموفق» می‌خواند — پیامی که
   *    شبیه رمز اشتباه یا حساب حذف‌شده به نظر می‌رسد. اجرای تکیِ همان
   *    سوئیت بلافاصله سبز می‌شد و آدم دنبال باگی می‌گشت که وجود نداشت.
   *
   * ⚠️ سقف کم نشد و نباید بشود: ۵ تلاش در دقیقه محافظ واقعی در برابر
   *    حدس رمز است. تستی که برای راحتی خودش امنیت را ضعیف کند، همان
   *    چیزی را می‌شکند که قرار است بسنجد. راه درست این است که صبر کند.
   */
  for (let attempt = 0; attempt < 6; attempt++) {
    const response = await fetch(`${API}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: 'admin@demo.dev', password: 'password' }),
    })

    if (response.status === 429) {
      console.log('  (ورود به سقف نرخ خورد — صبر می‌کنیم)')
      await new Promise((resolve) => setTimeout(resolve, 12_000))
      continue
    }

    const payload = await response.json()

    if (payload?.data?.token) return payload.data.token

    throw new Error(`ورود مدیر ناموفق بود — کد ${response.status}`)
  }

  throw new Error('ورود مدیر پس از چند تلاش هم به سقف نرخ خورد')
}

mkdirSync(OUT, { recursive: true })

const token = await adminToken()

const browser = await chromium.launch({ executablePath: findChromium() })
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: 'fa-IR',
})
const page = await context.newPage()

/*
 * ⚠️ ۴۲۲ و ۴۲۹ اینجا **خطا نیستند** — همین تست عمداً می‌سازدشان تا
 *    اعتبارسنجی و سقف نرخ را بسنجد. مرورگر هر پاسخ ناموفق را در
 *    کنسول گزارش می‌کند، پس بدون این فیلتر، تستِ «هیچ خطای کنسولی
 *    نیست» همیشه به‌خاطر موفقیت خودش شکست می‌خورد.
 */
const EXPECTED = /status of (422|429)/

const consoleErrors = []
page.on('pageerror', (e) => consoleErrors.push(e.message))
page.on('console', (m) => {
  if (m.type() === 'error' && !EXPECTED.test(m.text())) consoleErrors.push(m.text())
})

/* ============ ۱. اطلاعات تماس از تنظیمات می‌آید ============ */
/*
 * ⚠️ این بخش یک باگ واقعی را نگه می‌دارد: ایمیل صفحه هاردکد بود و
 *    تلفن از فایل ترجمه می‌آمد، در حالی که هدر و فوتر همین‌ها را از
 *    `settings` می‌خواندند. مدیر شماره را عوض می‌کرد، فوتر عوض می‌شد
 *    و همین صفحه — که کاربر دقیقاً برای شماره بازش می‌کند — عدد
 *    قدیمی را نشان می‌داد.
 */
console.log('--- 1. contact details come from settings ---')
{
  const settings = await fetch(`${API}/api/v1/settings`, {
    headers: { Accept: 'application/json', 'Accept-Language': 'fa' },
  }).then((r) => r.json())

  const expectedPhone = settings?.data?.contactPhone
  const expectedEmail = settings?.data?.contactEmail

  await page.goto(BASE + '/fa/contact', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)

  const aside = await page.locator('main aside').innerText()

  check('settings expose a phone and an email',
    Boolean(expectedPhone && expectedEmail),
    `phone=${expectedPhone} email=${expectedEmail}`)

  if (expectedPhone) {
    check('the page shows the phone from settings',
      aside.includes(expectedPhone), aside.replace(/\n/g, ' | ').slice(0, 90))
  }
  if (expectedEmail) {
    check('the page shows the email from settings', aside.includes(expectedEmail))
  }

  /*
   * همان شماره‌ای که نوار بالای هدر نشان می‌دهد.
   *
   * ⚠️ فوتر شماره ندارد و این ایراد نیست: نوار بالای هدر جای اطلاعات
   *    تماس است و فوتر جای لینک‌ها و شبکه‌های اجتماعی. نسخه‌ی اول این
   *    تست فوتر را می‌خواند و شکست — شکستی که هیچ باگی پشتش نبود.
   */
  if (expectedPhone) {
    const topbar = await page.locator('header a[href^="tel:"]').first().getAttribute('href')
    check('the header topbar links to the same number',
      (topbar ?? '').includes(expectedPhone.replace(/[^۰-۹\d]/g, '')
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0))),
      String(topbar))
  }
}

/* ============ ۲. تلفن و ایمیل لینک‌اند ============ */
console.log('--- 2. phone and email are links ---')
{
  const telHref = await page.locator('main aside a[href^="tel:"]').first().getAttribute('href')
  const mailHref = await page.locator('main aside a[href^="mailto:"]').first().getAttribute('href')

  check('a tel: link exists', Boolean(telHref), String(telHref))
  check('a mailto: link exists', Boolean(mailHref), String(mailHref))

  /*
   * ⚠️ مهم‌ترین بررسی این بخش.
   *
   *    شماره روی صفحه با رقم فارسی نوشته می‌شود. اگر همان رشته داخل
   *    `tel:` برود، اندروید و iOS هیچ رقمی در آن نمی‌بینند و لینک
   *    بی‌صدا بی‌اثر می‌شود — نه خطایی، نه تماسی.
   */
  const digits = (telHref ?? '').replace('tel:', '')
  check('the tel: link contains only ASCII digits',
    /^[+\d]+$/.test(digits) && digits.length >= 4, digits)
}

/* ============ ۳. خطای اعتبارسنجی زیر فیلد می‌نشیند ============ */
console.log('--- 3. validation errors land under the field ---')
{
  /*
   * ⚠️ `required` مرورگر باید دور زده شود تا خطای *سرور* دیده شود.
   *    بدون آن، مرورگر جلوی ارسال را می‌گیرد و این بخش هرگز چیزی
   *    را نمی‌سنجد.
   */
  /*
   * ⚠️ `main form` و نه `form`.
   *
   *    اولین فرم صفحه، جست‌وجوی هدر است. نسخه‌ی اول این تست novalidate
   *    را روی آن می‌گذاشت، مرورگر جلوی ارسال فرم تماس را می‌گرفت
   *    (ایمیل نامعتبر + required) و بخش خطاها هرگز چیزی نمی‌سنجید —
   *    سه شکست که هیچ‌کدام باگ کد نبودند.
   */
  await page.evaluate(() => {
    document.querySelector('main form')?.setAttribute('novalidate', 'true')
  })

  await page.fill('#contact-name', 'ا')
  await page.fill('#contact-email', 'not-an-email')
  await page.fill('#contact-subject', 'x')
  await page.fill('#contact-message', 'کم')
  await page.getByRole('button', { name: /ارسال/ }).click()
  await page.waitForTimeout(2000)

  const nameError = await page.locator('#contact-name-error').count()
  const emailError = await page.locator('#contact-email-error').count()
  check('an error appears under the name field', nameError === 1)
  check('an error appears under the email field', emailError === 1)

  const invalid = await page.locator('#contact-email').getAttribute('aria-invalid')
  check('the field is marked invalid for screen readers', invalid === 'true', String(invalid))

  await page.screenshot({ path: join(OUT, 'contact-errors--desktop-light.png'), fullPage: false })
}

/* ============ ۴. ارسال واقعی ============ */
console.log('--- 4. the form actually sends ---')
{
  await page.fill('#contact-name', 'کاربر آزمایشی')
  await page.fill('#contact-email', `${STAMP}@example.test`)
  await page.fill('#contact-subject', `آزمون خودکار ${STAMP}`)
  await page.fill('#contact-message', 'این پیام را تست خودکار ساخته و خودش هم پاکش می‌کند.')
  await page.getByRole('button', { name: /ارسال/ }).click()
  await page.waitForTimeout(2500)

  const errorsLeft = await page.locator('[id$="-error"]').count()
  check('no field errors remain', errorsLeft === 0, `count=${errorsLeft}`)

  /* ⚠️ سونر خودش یک ناحیه‌ی aria-live دارد؛ بدون `main` انتخابگر دوتایی می‌شود */
  const live = await page.locator('main [aria-live="polite"]').first().innerText()
  check('a success line is announced', live.trim().length > 0, live.trim())

  /* پیام باید واقعاً در بک‌اند نشسته باشد */
  const inbox = await fetch(
    `${API}/api/v1/admin/contact-messages?status=all&q=${encodeURIComponent(STAMP)}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } },
  ).then((r) => r.json())

  check('the message reached the backend', inbox.data?.length === 1,
    `found=${inbox.data?.length}`)
  check('the persian text survived intact',
    inbox.data?.[0]?.name === 'کاربر آزمایشی', inbox.data?.[0]?.name)
  check('it arrives unread', inbox.data?.[0]?.isRead === false)
}

/* ============ ۵. سقف نرخ پیام مخصوص خودش را دارد ============ */
/*
 * ⚠️ چرا این مهم است: بدون پیام جدا، کاربری که دو بار پشت هم فرستاده
 *    خطای عمومی می‌بیند و فکر می‌کند متنش ایراد دارد — همان متن را
 *    بارها بازنویسی می‌کند در حالی که فقط باید یک دقیقه صبر کند.
 */
console.log('--- 5. the rate limit has its own message ---')
{
  let hit429 = false

  /* سقف ۳ در دقیقه است و یکی را همین حالا مصرف کردیم */
  for (let attempt = 0; attempt < 4 && !hit429; attempt++) {
    await page.fill('#contact-subject', `flood ${attempt} ${STAMP}`)
    await page.fill('#contact-message', 'پیام تکراری برای سنجش سقف نرخ درخواست.')
    await page.getByRole('button', { name: /ارسال/ }).click()
    await page.waitForTimeout(1800)

    const toasts = await page.locator('[data-sonner-toast]').allInnerTexts()
    hit429 = toasts.some((text) => text.includes('صبر'))
  }

  check('hitting the cap says to wait, not that the text is wrong', hit429)
}

/* ============ ۶. صندوق پنل مدیریت ============ */
console.log('--- 6. the admin inbox ---')
{
  /* ورود مدیر از راه رابط، تا نشست مرورگر هم ساخته شود */
  await page.goto(BASE + '/fa/login', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await page.fill('#email', 'admin@demo.dev')
  await page.fill('#password', 'password')
  await page.getByRole('button', { name: /ورود/ }).first().click()
  await page.waitForTimeout(3000)

  await page.goto(BASE + '/fa/admin/messages', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)

  const body = await page.locator('main').innerText()
  check('the inbox page renders', body.includes('پیام‌های تماس'), body.slice(0, 60).replace(/\n/g, ' '))

  /* سایدبار باید راهی به اینجا داشته باشد — وگرنه صفحه‌ای است که کسی پیدایش نمی‌کند */
  check('the sidebar links to the inbox',
    (await page.locator('a[href$="/admin/messages"]').count()) > 0)

  /* پیام خودمان را پیدا کن */
  await page.fill('input[type="search"]', STAMP)
  await page.getByRole('button', { name: 'جستجو' }).click().catch(() => {})
  await page.keyboard.press('Enter')
  await page.waitForTimeout(2500)

  const cards = page.locator('main ul > li')
  const found = await cards.count()
  check('the search finds our messages', found > 0, `count=${found}`)

  await page.screenshot({ path: join(OUT, 'admin-messages--desktop-light.png'), fullPage: true })
}

/* ============ ۷. باز کردن، پیام را خوانده‌شده می‌کند ============ */
console.log('--- 7. opening marks it read ---')
{
  await page.locator('main ul > li button[aria-expanded]').first().click()

  /*
   * ⚠️ انتظار تا **بدنه** برسد، نه یک زمان ثابت.
   *
   *    باز شدن کارت فوری است ولی متن پیام با یک درخواست دوم
   *    می‌آید و تا رسیدنش اسکلتون نشان داده می‌شود. با زمان ثابت،
   *    بررسی گاهی همان اسکلتون را می‌خواند و «متن پیام نیست»
   *    گزارش می‌دهد — در حالی که یک ثانیه بعد آنجاست.
   *
   *    لینک mailto فقط کنار بدنه رندر می‌شود، پس نشانه‌ی خوبی
   *    برای «رسید» است.
   */
  await waitUntil(
    () => page.locator('main a[href^="mailto:"]').count(),
    (count) => count > 0,
  )

  const expanded = await page
    .locator('main ul > li button[aria-expanded="true"]')
    .count()
  check('the card expands', expanded === 1, `expanded=${expanded}`)

  const detail = await page.locator('main ul > li').first().innerText()
  check('the full message body is shown', detail.includes('تست خودکار') || detail.includes('تکراری'),
    detail.slice(0, 80).replace(/\n/g, ' '))

  check('a reply-by-email link is offered',
    (await page.locator('main a[href^="mailto:"]').count()) > 0)

  /* و در بک‌اند هم واقعاً خوانده شده باشد */
  const after = await fetch(
    `${API}/api/v1/admin/contact-messages?status=read&q=${encodeURIComponent(STAMP)}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } },
  ).then((r) => r.json())

  check('the backend recorded it as read', (after.data?.length ?? 0) >= 1,
    `read=${after.data?.length}`)
}

/* ============ ۸. موبایل و انگلیسی ============ */
console.log('--- 8. english + mobile ---')
{
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/en/contact`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)

  check('english is LTR', (await page.locator('html').getAttribute('dir')) === 'ltr')

  const heading = await page.locator('main h1').first().innerText()
  check('heading translated', /contact/i.test(heading), `"${heading}"`)

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  check('no horizontal overflow', overflow <= 1, `overflow=${overflow}px`)

  await page.screenshot({ path: join(OUT, 'contact--mobile-en.png'), fullPage: true })
}

/* ============ پاکسازی ============ */
/*
 * ⚠️ اجباری. بدون این، هر اجرا چند پیام زباله در صندوق می‌گذارد و
 *    شمارنده‌ی «خوانده‌نشده» برای همیشه غلط می‌ماند.
 *
 * ⚠️ همه‌ی صفحه‌ها پیمایش می‌شوند، نه فقط اولی — همان اشتباهی که در
 *    تست نظرات ۷ قلم یتیم به جا گذاشت، چون فرض شده بود نتیجه در یک
 *    صفحه جا می‌شود.
 *
 * ⚠️ با پیشوند `e2e-` پاک می‌شود، نه با نشانه‌ی همین اجرا.
 *
 *    اجرایی که وسط کار می‌شکند (چون یک بررسی استثنا پرتاب کرد یا
 *    مرورگر بست) هرگز به اینجا نمی‌رسد و پیامش برای همیشه در صندوق
 *    می‌ماند. اولین بار همین اتفاق افتاد و یک قلم یتیم به جا ماند.
 *    حالا هر اجرا بازمانده‌ی اجراهای شکسته‌ی قبلی را هم جمع می‌کند.
 */
{
  let removed = 0
  for (let guard = 0; guard < 20; guard++) {
    const listing = await fetch(
      `${API}/api/v1/admin/contact-messages?status=all&per_page=100&q=e2e-`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } },
    ).then((r) => r.json())

    const rows = listing.data ?? []
    if (rows.length === 0) break

    for (const row of rows) {
      await fetch(`${API}/api/v1/admin/contact-messages/${row.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      removed++
    }
  }

  const leftover = await fetch(
    `${API}/api/v1/admin/contact-messages?status=all&per_page=100&q=e2e-`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } },
  ).then((r) => r.json())

  console.log(`  cleanup: ${removed} test message(s) removed`)
  check('nothing left behind', (leftover.data?.length ?? 0) === 0,
    `leftover=${leftover.data?.length}`)
}

check('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '))

await browser.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
