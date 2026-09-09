/**
 * تست سرتاسری بنرهای صفحه‌ی اصلی — از داخل مرورگر واقعی
 * ---------------------------------------------------------------------------
 * چیزی که تست API نمی‌گیرد و اینجا گرفته می‌شود:
 *   - اسلایدر و بنرهای میانی از **دیتابیس** می‌آیند نه از کد
 *   - بنری که مدیر می‌سازد واقعاً روی صفحه‌ی اصلی ظاهر می‌شود
 *   - خاموش کردن بنر، آن را از صفحه‌ی اصلی برمی‌دارد (باطل شدن کش نکست)
 *   - بنر زمان‌بندی‌شده‌ی آینده نمایش داده نمی‌شود ولی در پنل «زمان‌بندی‌شده» است
 *   - نشانی بیرونی در مقصد کلیک رد می‌شود (جلوگیری از هدایت به بیرون)
 *   - رنگ‌بندی واقعاً اعمال می‌شود (کلاس Tailwind از نگاشت ثابت می‌آید نه از دیتابیس)
 *
 * ⚠️ این تست **بنر واقعی می‌سازد**. پاکسازی در انتها اجباری است و با
 *    پیشوند مقصد انجام می‌شود تا بازمانده‌ی اجرای کرش‌کرده هم جمع شود.
 *
 * اجرا:
 *     node scripts/e2e-banners.mjs
 */

import { chromium } from 'playwright-core'
import { existsSync, readdirSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.SHOTS_BASE_URL ?? 'http://127.0.0.1:3100'
const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:8100'
const OUT = '.shots'

/**
 * نشانه‌ی این اجرا.
 *
 * ⚠️ داخل **مقصد** می‌نشیند نه در عنوان: پاکسازی باید بتواند بنر
 *    آزمایشی را قطعی تشخیص دهد، و مقصد تنها فیلدی است که هم یکتا
 *    می‌شود و هم بک‌اند بی‌قید و شرط ذخیره‌اش می‌کند.
 */
const STAMP = `e2e-${Date.now()}`
const TEST_HREF = `/products?e2e=${STAMP}`

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

const token = await adminToken()
const authed = (extra = {}) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/json',
  'Content-Type': 'application/json',
  ...extra,
})

/** حذف هر بنر آزمایشی — از این اجرا یا اجرای شکسته‌ی قبلی. */
async function purgeTestBanners() {
  const listing = await fetch(`${API}/api/v1/admin/banners`, { headers: authed() })
    .then((r) => r.json())

  let removed = 0
  for (const banner of listing.data ?? []) {
    if (!banner.href.includes('e2e=')) continue
    await fetch(`${API}/api/v1/admin/banners/${banner.id}`, {
      method: 'DELETE',
      headers: authed(),
    })
    removed++
  }
  return removed
}

mkdirSync(OUT, { recursive: true })

/* بازمانده‌ی اجرای قبلی نباید نتیجه را گمراه کند */
const stale = await purgeTestBanners()
if (stale > 0) console.log(`  (${stale} بنر بازمانده‌ی اجرای قبلی پاک شد)`)

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

/* ============ ۱. صفحه‌ی اصلی از دیتابیس تغذیه می‌شود ============ */
console.log('--- 1. the homepage is fed from the database ---')
{
  const api = await fetch(`${API}/api/v1/banners`, {
    headers: { Accept: 'application/json', 'Accept-Language': 'fa' },
  }).then((r) => r.json())

  const heroCount = api.data?.hero?.length ?? 0
  const promoCount = api.data?.promo?.length ?? 0

  check('the API returns hero banners', heroCount > 0, `hero=${heroCount}`)
  check('the API returns promo banners', promoCount > 0, `promo=${promoCount}`)

  await page.goto(BASE + '/fa', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)

  const carousel = page.locator('section[aria-roledescription="carousel"]')
  check('the carousel is rendered', (await carousel.count()) === 1)

  /* عنوان اسلاید اول باید همان چیزی باشد که API داد */
  const firstTitle = api.data.hero[0].title
  const heroText = await carousel.innerText()
  check('the first slide shows the title from the database',
    heroText.includes(firstTitle), firstTitle)

  /*
   * ⚠️ تعداد نقطه‌ها باید با تعداد بنرهای API یکی باشد.
   *
   *    اگر کامپوننت هنوز فهرست ثابت خودش را داشت، این عدد ثابت
   *    می‌ماند حتی وقتی مدیر بنری اضافه یا کم می‌کند — دقیقاً همان
   *    چیزی که این تغییر برای رفعش انجام شد.
   */
  const dots = await carousel.locator('button[aria-label^="slide"]').count()
  check('one navigation dot per banner', dots === heroCount, `dots=${dots} api=${heroCount}`)
}

/* ============ ۲. مقصد بیرونی رد می‌شود ============ */
/*
 * ⚠️ مهم‌ترین بررسی امنیتی این فایل.
 *
 *    بنر صفحه‌ی اصلی پربازدیدترین لینک سایت است. اگر مقصد بیرونی
 *    پذیرفته شود، کسی که به حساب مدیر رسیده می‌تواند همه‌ی
 *    بازدیدکننده‌ها را به جای دیگری بفرستد.
 */
console.log('--- 2. external destinations are rejected ---')
{
  for (const href of ['https://evil.example', '//evil.example', 'javascript:alert(1)']) {
    const response = await fetch(`${API}/api/v1/admin/banners`, {
      method: 'POST',
      headers: authed({ 'Accept-Language': 'fa' }),
      body: JSON.stringify({
        placement: 'hero',
        theme: 'primary',
        title: { fa: 'بنر مخرب', en: '' },
        href,
      }),
    })

    check(`"${href}" is rejected`, response.status === 422, `status=${response.status}`)
  }
}

/* ============ ۳. بنر تازه روی صفحه‌ی اصلی ظاهر می‌شود ============ */
console.log('--- 3. a new banner appears on the homepage ---')
let bannerId = null
{
  const created = await fetch(`${API}/api/v1/admin/banners`, {
    method: 'POST',
    headers: authed({ 'Accept-Language': 'fa' }),
    body: JSON.stringify({
      placement: 'promo',
      theme: 'warning',
      title: { fa: `بنر آزمایشی ${STAMP}`, en: `Test banner ${STAMP}` },
      subtitle: { fa: 'ساخته‌ی تست خودکار', en: 'Made by the automated test' },
      href: TEST_HREF,
      icon: 'gift',
      sort_order: 99,
      is_active: true,
    }),
  }).then((r) => r.json())

  bannerId = created.data?.id
  check('the banner was created', Boolean(bannerId), `id=${bannerId}`)
  check('it reports itself live', created.data?.state === 'live', created.data?.state)

  /*
   * ⚠️ بارگذاری با پارامتر یکتا، تا کش مرورگر دخالت نکند.
   *    کش سمت سرور را بک‌اند با flushBanners باطل کرده است.
   */
  await page.goto(`${BASE}/fa?cb=${Date.now()}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)

  const link = page.locator(`main a[href*="e2e=${STAMP}"]`)
  check('it shows up on the homepage', (await link.count()) === 1,
    `found=${await link.count()}`)

  const text = (await link.count()) > 0 ? await link.innerText() : ''
  check('with its title and subtitle',
    text.includes('بنر آزمایشی') && text.includes('ساخته‌ی تست'),
    text.replace(/\n/g, ' ').slice(0, 60))

  await page.screenshot({ path: join(OUT, 'banner-added--desktop-light.png'), fullPage: false })
}

/* ============ ۴. خاموش کردن، آن را از صفحه برمی‌دارد ============ */
/*
 * ⚠️ این بررسی یک باگ واقعی را نگه می‌دارد.
 *
 *    کش صفحه‌ی اصلی سمت سرور نکست است (نیم ساعت). اگر بک‌اند پس از
 *    تغییر، برچسب‌ها را باطل نکند، مدیر بنری را خاموش می‌کند، در
 *    پنل ناپدید می‌شود، و تا نیم ساعت هنوز روی سایت است — بدون هیچ
 *    توضیحی.
 */
console.log('--- 4. turning it off removes it from the homepage ---')
{
  const toggled = await fetch(`${API}/api/v1/admin/banners/${bannerId}/toggle`, {
    method: 'PATCH',
    headers: authed(),
  }).then((r) => r.json())

  check('the backend marks it disabled', toggled.data?.state === 'disabled', toggled.data?.state)

  await page.goto(`${BASE}/fa?cb=${Date.now()}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)

  const stillThere = await page.locator(`main a[href*="e2e=${STAMP}"]`).count()
  check('the homepage cache was invalidated', stillThere === 0, `found=${stillThere}`)
}

/* ============ ۵. بنر زمان‌بندی‌شده هنوز دیده نمی‌شود ============ */
console.log('--- 5. a scheduled banner stays hidden until its time ---')
{
  const future = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()

  const scheduled = await fetch(`${API}/api/v1/admin/banners/${bannerId}`, {
    method: 'PUT',
    headers: authed({ 'Accept-Language': 'fa' }),
    body: JSON.stringify({
      placement: 'promo',
      theme: 'warning',
      title: { fa: `بنر آینده ${STAMP}`, en: '' },
      href: TEST_HREF,
      is_active: true,
      starts_at: future,
    }),
  }).then((r) => r.json())

  check('the panel calls it scheduled', scheduled.data?.state === 'scheduled',
    scheduled.data?.state)

  const publicList = await fetch(`${API}/api/v1/banners`, {
    headers: { Accept: 'application/json' },
  }).then((r) => r.json())

  const leaked = [...publicList.data.hero, ...publicList.data.promo]
    .some((b) => b.href.includes(STAMP))
  check('it is absent from the public endpoint', !leaked)
}

/* ============ ۶. تاریخ پایان پیش از شروع رد می‌شود ============ */
console.log('--- 6. an end date before the start is rejected ---')
{
  const response = await fetch(`${API}/api/v1/admin/banners/${bannerId}`, {
    method: 'PUT',
    headers: authed({ 'Accept-Language': 'fa' }),
    body: JSON.stringify({
      placement: 'promo',
      theme: 'warning',
      title: { fa: 'بنر', en: '' },
      href: TEST_HREF,
      starts_at: '2027-01-10T00:00:00Z',
      ends_at: '2027-01-01T00:00:00Z',
    }),
  })

  check('rejected with a validation error', response.status === 422, `status=${response.status}`)

  const body = await response.json()
  check('the message is localized, not a framework fallback',
    !/(more error|The .* field)/.test(body.message ?? ''), body.message)
}

/* ============ ۷. صفحه‌ی پنل ============ */
console.log('--- 7. the admin page ---')
{
  await page.goto(BASE + '/fa/login', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await page.fill('#email', 'admin@demo.dev')
  await page.fill('#password', 'password')
  await page.getByRole('button', { name: /ورود/ }).first().click()
  await page.waitForTimeout(3000)

  await page.goto(BASE + '/fa/admin/banners', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)

  const body = await page.locator('main').innerText()
  check('the banners page renders', body.includes('بنرهای صفحه'),
    body.slice(0, 50).replace(/\n/g, ' '))

  check('the sidebar links to it',
    (await page.locator('a[href$="/admin/banners"]').count()) > 0)

  /* تب هیرو پیش‌فرض است و باید سه بنر سیدشده را نشان دهد */
  const rows = await page.locator('main ul > li').count()
  check('the hero tab lists the seeded banners', rows >= 3, `rows=${rows}`)

  /*
   * ⚠️ نشان وضعیت مهم‌ترین چیز این صفحه است: بدون آن، مدیر بنری با
   *    تیک «فعال» می‌دید که در سایت نبود و هیچ سرنخی نداشت.
   */
  check('each row shows a state badge',
    (await page.locator('main ul > li span:has-text("روی سایت")').count()) > 0)

  await page.screenshot({ path: join(OUT, 'admin-banners--desktop-light.png'), fullPage: true })

  /* فرم باید باز شود و فیلدهای دوزبانه داشته باشد */
  await page.getByRole('button', { name: 'بنر تازه' }).click()
  await page.waitForTimeout(1200)

  check('the form opens', (await page.locator('#title-fa').count()) === 1)
  check('the destination field is present', (await page.locator('#banner-href').count()) === 1)

  /* تب انگلیسی باید ورودی انگلیسی را نشان دهد */
  await page.getByRole('tab', { name: 'English' }).click()
  await page.waitForTimeout(600)

  const enVisible = await page.locator('#title-en').isVisible()
  check('switching to English reveals the english input', enVisible)

  await page.screenshot({ path: join(OUT, 'admin-banner-form--desktop-light.png'), fullPage: true })
}

/* ============ ۸. موبایل و انگلیسی ============ */
console.log('--- 8. english + mobile ---')
{
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/en?cb=${Date.now()}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)

  const carousel = page.locator('section[aria-roledescription="carousel"]')
  const text = await carousel.innerText()
  check('the english slide text comes through', /[A-Za-z]{4,}/.test(text),
    text.replace(/\n/g, ' ').slice(0, 60))

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  check('no horizontal overflow', overflow <= 1, `overflow=${overflow}px`)

  await page.screenshot({ path: join(OUT, 'banners--mobile-en.png'), fullPage: false })
}

/* ============ پاکسازی ============ */
{
  const removed = await purgeTestBanners()
  console.log(`  cleanup: ${removed} test banner(s) removed`)

  const leftover = await fetch(`${API}/api/v1/admin/banners`, { headers: authed() })
    .then((r) => r.json())
  const remaining = (leftover.data ?? []).filter((b) => b.href.includes('e2e=')).length
  check('nothing left behind', remaining === 0, `leftover=${remaining}`)

  /* بنرهای سیدشده باید دست‌نخورده مانده باشند */
  check('the seeded banners survived', (leftover.data ?? []).length >= 3,
    `total=${leftover.data?.length}`)
}

check('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '))

await browser.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
