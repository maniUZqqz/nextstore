/**
 * تست سرتاسری نظرات — از داخل مرورگر واقعی
 * ---------------------------------------------------------------------------
 * چیزی که تست API نمی‌گیرد و اینجا گرفته می‌شود:
 *   - تب نظرات تنبل رندر می‌شود و درخواستش را می‌زند
 *   - دکمه «مفید بود» شمارنده را بلافاصله عوض می‌کند (خوش‌بینانه)
 *     و پس از رفرش هم همان مقدار می‌ماند (یعنی واقعاً ذخیره شده)
 *   - رأی دوم، رأی را برمی‌دارد
 *   - فرم بدون امتیاز خطا می‌دهد و ثبت نمی‌شود
 *   - فرم کامل ثبت می‌شود و پیام «پس از بررسی منتشر می‌شود» می‌آید
 *   - تغییر ترتیب فهرست را عوض می‌کند
 *
 * پیش‌نیاز: هر دو سرور بالا و دیتابیس سیدشده.
 *
 * اجرا:
 *     node scripts/e2e-reviews.mjs
 */

import { chromium } from 'playwright-core'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.SHOTS_BASE_URL ?? 'http://127.0.0.1:3100'
const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:8100/api/v1'

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

/**
 * محصولی که کاربر آزمایشی هنوز رویش نظر نداده.
 *
 * فرم ثبت نظر روی محصولی که کاربر قبلاً نظر داده ۴۰۹ می‌گیرد،
 * پس باید محصول تازه‌ای پیدا کنیم — وگرنه تست به‌جای سنجیدن
 * جریان ثبت، خطای تکراری را می‌سنجد.
 */
async function pickProducts(token) {
  const listRes = await fetch(API + '/products?per_page=50', {
    headers: { Accept: 'application/json', 'Accept-Language': 'fa' },
  })
  const products = (await listRes.json()).data ?? []

  const mineRes = await call(token, '/reviews?per_page=100')
  const reviewedSlugs = new Set(
    ((await mineRes.json()).data ?? []).map((r) => r.product?.slug),
  )

  const withReviews = products.find((p) => p.reviewsCount >= 3)
  const unreviewed = products.find(
    (p) => !reviewedSlugs.has(p.slug) && p.reviewsCount >= 1,
  )

  if (!withReviews) throw new Error('محصولی با نظر کافی یافت نشد')
  if (!unreviewed) throw new Error('محصول بدون نظرِ این کاربر یافت نشد')

  return { withReviews, unreviewed }
}

const token = await apiLogin('user@demo.dev')
const { withReviews, unreviewed } = await pickProducts(token)

console.log('محصول رأی‌دهی: ' + withReviews.slug)
console.log('محصول ثبت نظر: ' + unreviewed.slug + '\n')

const browser = await chromium.launch({ executablePath: findChromium() })
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: 'fa-IR',
})
const page = await context.newPage()

/*
 * ثبت خطاهای کنسول.
 *
 * ⚠️ خطاهای HTTP *مورد انتظار* فیلتر می‌شوند. بخش ۷ عمداً یک نظر
 *    تکراری می‌فرستد تا ببیند پیام ۴۰۹ درست نمایش داده می‌شود؛
 *    مرورگر هر پاسخ ۴xx را هم در کنسول خطا ثبت می‌کند. بدون این
 *    فیلتر، تستِ «بدون خطای کنسول» همیشه به‌خاطر رفتار درستِ خودِ
 *    تست شکست می‌خورد و عملاً بی‌معنا می‌شود.
 */
/* پرانتزها باید escape شوند — بدون آن یک گروه ثبت است و متن واقعی را نمی‌گیرد */
const EXPECTED_ERROR = /409 \(Conflict\)/
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
}, token)

/** باز کردن تب نظرات و صبر تا فهرست بنشیند. */
async function openReviews(slug) {
  await page.goto(BASE + '/fa/products/' + slug, { waitUntil: 'networkidle' })
  await page.click('#tab-reviews')
  await page.waitForSelector('[data-review]', { timeout: 15000 })
  await page.waitForTimeout(800)
}

/* ============ 1. تب تنبل رندر می‌شود ============ */
console.log('--- 1. lazy tab render ---')
{
  await page.goto(BASE + '/fa/products/' + withReviews.slug, { waitUntil: 'networkidle' })

  /* پیش از کلیک، پنل نظرات نباید هیچ کارتی داشته باشد */
  const before = await page.locator('[data-review]').count()
  check('no reviews rendered before tab click', before === 0, `count=${before}`)

  await page.click('#tab-reviews')
  await page.waitForSelector('[data-review]', { timeout: 15000 })
  const after = await page.locator('[data-review]').count()
  check('reviews render after tab click', after > 0, `count=${after}`)
}

/* ============ 2. خلاصه امتیاز ============ */
console.log('\n--- 2. rating summary ---')
{
  const bars = await page.locator('[data-rating-bar]').count()
  check('five distribution bars', bars === 5, `count=${bars}`)
}

/* ============ 3. رأی «مفید بود» ============ */
console.log('\n--- 3. helpful vote ---')
{
  await openReviews(withReviews.slug)

  /*
   * نظری که کاربر جاری ننوشته — دکمه‌ی فعال.
   * :not([disabled]) لازم است چون نظر خودِ کاربر دکمه‌ی غیرفعال دارد.
   */
  const voteButton = page.locator('#panel-reviews button[aria-pressed]:not([disabled])').first()
  check('an enabled vote button exists', (await voteButton.count()) > 0)

  const pressedBefore = await voteButton.getAttribute('aria-pressed')
  await voteButton.click()
  await page.waitForTimeout(300)

  const pressedAfterClick = await voteButton.getAttribute('aria-pressed')
  check(
    'aria-pressed flips immediately (optimistic)',
    pressedAfterClick !== pressedBefore,
    `${pressedBefore} -> ${pressedAfterClick}`,
  )

  /* پس از رفرش باید همان حالت بماند — یعنی واقعاً روی سرور ذخیره شده */
  await page.waitForTimeout(1200)
  await openReviews(withReviews.slug)

  const persisted = await page
    .locator('#panel-reviews button[aria-pressed="true"]')
    .count()
  check('vote persisted after reload', persisted > 0, `pressed=${persisted}`)

  /* رأی دوم باید رأی را بردارد */
  const votedButton = page.locator('#panel-reviews button[aria-pressed="true"]').first()
  await votedButton.click()
  await page.waitForTimeout(1500)
  await openReviews(withReviews.slug)

  const afterUnvote = await page
    .locator('#panel-reviews button[aria-pressed="true"]')
    .count()
  check('second vote removes it', afterUnvote === 0, `pressed=${afterUnvote}`)
}

/* ============ 4. تغییر ترتیب ============ */
console.log('\n--- 4. sorting ---')
{
  await openReviews(withReviews.slug)
  const firstBefore = await page.locator('[data-review] h4, [data-review]').first().innerText()

  await page.selectOption('#review-sort', 'rating_low')
  await page.waitForTimeout(1800)

  const ratings = await page.locator('[data-review]').evaluateAll((items) =>
    items.map((li) => li.querySelectorAll('svg.fill-warning, svg[class*="fill-warning"]').length),
  )
  check('sort request completed', ratings.length > 0, `items=${ratings.length}`)

  const firstAfter = await page.locator('[data-review]').first().innerText()
  check('list changed after sorting', firstAfter !== firstBefore)
}

/* ============ 5. اعتبارسنجی فرم ============ */
console.log('\n--- 5. form validation ---')
{
  await openReviews(unreviewed.slug)

  await page.locator('#panel-reviews button', { hasText: 'ثبت نظر' }).first().click()
  await page.waitForSelector('#review-comment', { timeout: 5000 })
  check('form opened', await page.locator('#review-comment').isVisible())

  /* ثبت بدون امتیاز باید خطای درون‌فرمی بدهد، نه ارسال شود */
  await page.locator('#panel-reviews form button[type="submit"]').click()
  await page.waitForTimeout(500)

  const alert = page.locator('#panel-reviews [role="alert"]')
  check('rating required error shown', (await alert.count()) > 0, await alert.first().innerText().catch(() => ''))
  check('form still open', await page.locator('#review-comment').isVisible())
}

/* ============ 6. ثبت موفق ============ */
console.log('\n--- 6. successful submit ---')
{
  /* انتخاب چهار ستاره */
  await page.locator('#panel-reviews fieldset button[aria-label="4"]').click()

  await page.fill('#review-title', 'تست خودکار')
  await page.fill(
    '#review-comment',
    'این نظر توسط تست خودکار ثبت شده و برای بررسی جریان ثبت است.',
  )

  /* پر کردن اولین فیلد نقاط قوت */
  const prosInput = page.locator('#panel-reviews fieldset input[type="text"]').first()
  await prosInput.fill('کیفیت مناسب')

  await page.locator('#panel-reviews form button[type="submit"]').click()

  /* پیام موفقیت با sonner نمایش داده می‌شود */
  await page.waitForTimeout(2500)
  const toast = await page.locator('[data-sonner-toast]').innerText().catch(() => '')
  check('success toast shown', toast.includes('بررسی') || toast.includes('ثبت'), toast.slice(0, 60))

  check('form closed after submit', (await page.locator('#review-comment').count()) === 0)

  /* نظر تازه تأییدنشده است، پس نباید در فهرست عمومی باشد */
  const titles = await page.locator('[data-review] h4').allInnerTexts()
  check('unapproved review not in public list', !titles.includes('تست خودکار'))
}

/* ============ 7. تلاش دوم روی همان محصول ============ */
console.log('\n--- 7. duplicate submit ---')
{
  await openReviews(unreviewed.slug)
  await page.locator('#panel-reviews button', { hasText: 'ثبت نظر' }).first().click()
  await page.waitForSelector('#review-comment', { timeout: 5000 })

  await page.locator('#panel-reviews fieldset button[aria-label="5"]').click()
  await page.locator('#panel-reviews form button[type="submit"]').click()
  await page.waitForTimeout(2500)

  const toast = await page.locator('[data-sonner-toast]').last().innerText().catch(() => '')
  check('duplicate warning shown', toast.includes('قبلاً'), toast.slice(0, 60))
  check('form stays open on error', await page.locator('#review-comment').isVisible())
}

/* ============ پاکسازی ============ */
/*
 * ⚠️ باید *همه‌ی* صفحات پیموده شوند، نه فقط صفحه‌ی اول.
 *
 *    فهرست پنل «قدیمی‌ترین اول» مرتب می‌شود (تا نظری که بیشتر منتظر
 *    مانده زودتر رسیدگی شود). یعنی نظراتی که همین تست ساخته —
 *    جدیدترین‌ها — در آخرین صفحه‌اند. خواندن یک صفحه‌ی ۱۰۰تایی از
 *    دیتابیسی با صدها نظر، هیچ‌وقت به آن‌ها نمی‌رسد و پاکسازی بی‌صدا
 *    هیچ کاری نمی‌کند: زباله‌ی هر اجرا در صف تعدیل تلنبار می‌شود.
 */
{
  const admin = await apiLogin('admin@demo.dev')
  let removed = 0

  for (let page = 1; ; page++) {
    const body = await (
      await call(admin, `/admin/reviews?status=all&per_page=100&page=${page}`)
    ).json()

    for (const r of body.data ?? []) {
      if (r.title === 'تست خودکار') {
        await call(admin, '/admin/reviews/' + r.id, { method: 'DELETE' })
        removed++
      }
    }

    if (!body.meta || page >= body.meta.last_page) break
  }

  console.log(`  cleanup: removed ${removed} test review(s)`)
}

check('no console errors', consoleErrors.length === 0, consoleErrors[0]?.slice(0, 90) ?? '')

await browser.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
