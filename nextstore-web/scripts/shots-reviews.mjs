/**
 * اسکرین‌شات تب نظرات صفحه محصول
 * ---------------------------------------------------------------------------
 * تب نظرات فقط با کلیک باز می‌شود، پس shots.mjs عمومی هرگز آن را
 * نشان نمی‌دهد. این اسکریپت تب را باز می‌کند و حالت‌ها را می‌گیرد:
 *   guest      — مهمان: فهرست دیده می‌شود، دکمه رأی غیرفعال
 *   auth       — کاربر واردشده: دکمه رأی فعال، دکمه ثبت نظر
 *   form       — فرم ثبت نظر باز
 *   empty      — محصولی که هیچ نظری ندارد
 *   sorted     — پس از تغییر ترتیب به «مفیدترین»
 *
 * اجرا:  node scripts/shots-reviews.mjs
 * خروجی: پوشه .shots/
 */

import { chromium } from 'playwright-core'
import { mkdirSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.SHOTS_BASE_URL ?? 'http://127.0.0.1:3100'
const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:8100/api/v1'
const OUT = '.shots'

/** مسیر مرورگر کش‌شده — نام پوشه بین نسخه‌های Playwright فرق می‌کند. */
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

/** ورود مستقیم به API — سریع‌تر و پایدارتر از پر کردن فرم. */
async function apiLogin(email) {
  const res = await fetch(API + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password: 'password' }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error('login ' + res.status + ': ' + JSON.stringify(body).slice(0, 200))
  return body.data.token
}

/**
 * یافتن یک محصول دارای نظر و یک محصول بدون نظر.
 *
 * نامک‌ها هاردکد نمی‌شوند چون ReviewSeeder با هر migrate:fresh
 * توزیع متفاوتی می‌سازد و اسکریپتی که به نامک ثابت تکیه کند،
 * روزی بی‌صدا صفحه‌ی اشتباه را عکس می‌گیرد.
 */
async function pickProducts() {
  const res = await fetch(API + '/products?per_page=50', {
    headers: { Accept: 'application/json', 'Accept-Language': 'fa' },
  })
  const body = await res.json()
  const products = body.data ?? []

  const withReviews = products.find((p) => p.reviewsCount >= 5)
  const withoutReviews = products.find((p) => p.reviewsCount === 0)

  if (!withReviews) throw new Error('محصولی با نظر کافی یافت نشد — ابتدا ReviewSeeder را اجرا کنید')

  return { withReviews, withoutReviews }
}

const token = await apiLogin('user@demo.dev')
const { withReviews, withoutReviews } = await pickProducts()

console.log('محصول دارای نظر: ' + withReviews.slug + ' (' + withReviews.reviewsCount + ' نظر)')
console.log('محصول بدون نظر:  ' + (withoutReviews?.slug ?? '— یافت نشد') + '\n')

/** تزریق توکن به هر دو محل (localStorage برای API، کوکی برای proxy.ts). */
function injectAuth(page, t) {
  return page.evaluate((value) => {
    localStorage.setItem('auth_token', value)
    document.cookie = 'auth_token=' + value + '; path=/; max-age=86400; SameSite=Lax'
  }, t)
}

/** باز کردن تب نظرات و صبر تا داده بنشیند. */
async function openReviewsTab(page) {
  await page.click('#tab-reviews')
  /* تب محتوا را تنبل رندر می‌کند، پس باید منتظر پایان درخواست ماند */
  await page.waitForTimeout(2000)
}

const VARIANTS = [
  { id: 'desktop-light', width: 1440, height: 1000, dark: false },
  { id: 'desktop-dark', width: 1440, height: 1000, dark: true },
  { id: 'mobile-light', width: 390, height: 844, dark: false },
]

const CASES = [
  {
    name: 'reviews-guest',
    path: () => '/fa/products/' + withReviews.slug,
    async after(page) {
      await openReviewsTab(page)
    },
  },
  {
    name: 'reviews-auth',
    auth: true,
    path: () => '/fa/products/' + withReviews.slug,
    async after(page) {
      await openReviewsTab(page)
    },
  },
  {
    name: 'reviews-form',
    auth: true,
    path: () => '/fa/products/' + withReviews.slug,
    async after(page) {
      await openReviewsTab(page)
      /* دکمه «ثبت نظر» — با نقش و نام تا به متن دقیق وابسته نباشیم */
      const button = page.locator('#panel-reviews button', { hasText: 'ثبت نظر' }).first()
      if (await button.count()) {
        await button.click()
        await page.waitForTimeout(600)
      }
    },
    onlyVariant: 'desktop-light',
  },
  {
    name: 'reviews-sorted',
    auth: true,
    path: () => '/fa/products/' + withReviews.slug,
    async after(page) {
      await openReviewsTab(page)
      await page.selectOption('#review-sort', 'helpful')
      await page.waitForTimeout(1500)
    },
    onlyVariant: 'desktop-light',
  },
  {
    name: 'reviews-empty',
    auth: true,
    skip: () => !withoutReviews,
    path: () => '/fa/products/' + withoutReviews.slug,
    async after(page) {
      await openReviewsTab(page)
    },
    onlyVariant: 'desktop-light',
  },
  {
    name: 'reviews-en',
    auth: true,
    path: () => '/en/products/' + withReviews.slug,
    async after(page) {
      await openReviewsTab(page)
    },
    onlyVariant: 'desktop-light',
  },
]

if (!existsSync(OUT)) mkdirSync(OUT)

const browser = await chromium.launch({ executablePath: findChromium() })
let problems = 0

for (const variant of VARIANTS) {
  for (const testCase of CASES) {
    if (testCase.onlyVariant && testCase.onlyVariant !== variant.id) continue
    if (testCase.skip?.()) {
      console.log('- ' + testCase.name + ' رد شد (داده‌ی لازم موجود نیست)')
      continue
    }

    const context = await browser.newContext({
      viewport: { width: variant.width, height: variant.height },
      deviceScaleFactor: 1,
      colorScheme: variant.dark ? 'dark' : 'light',
      locale: testCase.name.endsWith('-en') ? 'en-US' : 'fa-IR',
    })

    const page = await context.newPage()

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        problems++
        console.log('   ⚠ کنسول: ' + msg.text().split('\n')[0].slice(0, 150))
      }
    })
    page.on('pageerror', (error) => {
      problems++
      console.log('   ⚠ خطای صفحه: ' + error.message.split('\n')[0].slice(0, 150))
    })
    page.on('response', (response) => {
      if (response.status() >= 400 && !response.url().includes('favicon')) {
        problems++
        console.log('   ⚠ ' + response.status() + ': ' + response.url().slice(0, 110))
      }
    })

    try {
      if (testCase.auth) {
        await page.goto(BASE + '/fa', { waitUntil: 'domcontentloaded' })
        await injectAuth(page, token)
      }

      await page.goto(BASE + testCase.path(), { waitUntil: 'networkidle', timeout: 45000 })
      await page.waitForTimeout(800)
      await testCase.after(page)

      const file = OUT + '/' + testCase.name + '--' + variant.id + '.png'
      await page.screenshot({ path: file, fullPage: true })
      console.log('✓ ' + file)
    } catch (error) {
      problems++
      console.log('✗ ' + testCase.name + ' (' + variant.id + '): ' + error.message.split('\n')[0])
    }

    await context.close()
  }
}

await browser.close()
console.log('\n' + (problems === 0 ? 'بدون خطای کنسول یا شبکه ✅' : problems + ' هشدار ثبت شد ⚠'))
