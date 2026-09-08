/**
 * اسکرین‌شات صفحه علاقه‌مندی در همه حالت‌ها
 * ---------------------------------------------------------------------------
 * صفحه‌ی /account/wishlist پشت ورود است، پس shots.mjs عمومی به آن
 * نمی‌رسد. این اسکریپت ابتدا وارد می‌شود و سپس هر حالت را می‌سازد
 * و عکس می‌گیرد:
 *   guest  — مهمان با فهرست محلی (باید به صفحه ورود هدایت شود)
 *   empty  — کاربر واردشده با فهرست خالی
 *   filled — کاربر واردشده با چند محصول
 *   synced — انتقال خودکار فهرست مهمان به سرور پس از ورود
 *
 * اجرا:  node scripts/shots-wishlist.mjs
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

/** ورود مستقیم به API — سریع‌تر و پایدارتر از پر کردن فرم ورود. */
async function apiLogin() {
  const res = await fetch(API + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email: 'user@demo.dev', password: 'password' }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error('login ' + res.status + ': ' + JSON.stringify(body).slice(0, 200))
  return body.data.token
}

/** فراخوانی API با توکن. */
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

/** خالی کردن فهرست سرور تا هر اجرا از وضعیت مشخصی شروع شود. */
async function clearServerWishlist(token) {
  const body = await (await call(token, '/wishlist')).json()
  for (const p of body.data ?? []) {
    await call(token, '/wishlist/' + p.id, { method: 'DELETE' })
  }
}

const token = await apiLogin()

/**
 * تزریق وضعیت ورود به مرورگر.
 *
 * توکن هم در localStorage (برای کلاینت API) و هم در کوکی (برای
 * proxy.ts سمت سرور) لازم است — دقیقاً همان دو جایی که تابع
 * واقعی storeToken می‌نویسد. اگر فقط یکی را بگذاریم، یا صفحه
 * ریدایرکت می‌شود یا درخواست‌ها ۴۰۱ می‌گیرند.
 */
function injectAuth(page, t) {
  return page.evaluate((value) => {
    localStorage.setItem('auth_token', value)
    document.cookie = 'auth_token=' + value + '; path=/; max-age=86400; SameSite=Lax'
  }, t)
}

/** نوشتن فهرست مهمان در قالبی که استور Zustand انتظار دارد. */
function injectGuestList(page, ids) {
  return page.evaluate((value) => {
    localStorage.setItem(
      'nextstore-wishlist',
      JSON.stringify({ state: { productIds: value }, version: 0 }),
    )
  }, ids)
}

const VARIANTS = [
  { id: 'desktop-light', width: 1440, height: 1000, dark: false },
  { id: 'desktop-dark', width: 1440, height: 1000, dark: true },
  { id: 'mobile-light', width: 390, height: 844, dark: false },
]

/** حالت‌هایی که از آن‌ها عکس گرفته می‌شود. */
const CASES = [
  {
    name: 'wishlist-guest',
    /*
     * مهمان با فهرست محلی. proxy.ts او را به صفحه ورود می‌فرستد،
     * پس عکس، مسیر واقعی کاربر مهمان را ثبت می‌کند نه یک صفحه‌ی
     * فرضی. اگر روزی ریدایرکت بشکند، در همین عکس دیده می‌شود.
     */
    async setup(page) {
      await page.goto(BASE + '/fa', { waitUntil: 'domcontentloaded' })
      await injectGuestList(page, [1, 2, 3])
    },
    path: '/fa/account/wishlist',
  },
  {
    name: 'wishlist-empty',
    async setup(page) {
      await clearServerWishlist(token)
      await page.goto(BASE + '/fa', { waitUntil: 'domcontentloaded' })
      await injectAuth(page, token)
      await page.evaluate(() => localStorage.removeItem('nextstore-wishlist'))
    },
    path: '/fa/account/wishlist',
  },
  {
    name: 'wishlist-filled',
    async setup(page) {
      await clearServerWishlist(token)
      for (const id of [1, 3, 5, 7, 9]) {
        await call(token, '/wishlist', {
          method: 'POST',
          body: JSON.stringify({ productId: id }),
        })
      }
      await page.goto(BASE + '/fa', { waitUntil: 'domcontentloaded' })
      await injectAuth(page, token)
      await page.evaluate(() => localStorage.removeItem('nextstore-wishlist'))
    },
    path: '/fa/account/wishlist',
  },
  {
    name: 'wishlist-filled-en',
    async setup(page) {
      await page.goto(BASE + '/en', { waitUntil: 'domcontentloaded' })
      await injectAuth(page, token)
    },
    path: '/en/account/wishlist',
    onlyVariant: 'desktop-light',
  },
  {
    name: 'wishlist-synced',
    /* فهرست مهمان + توکن → هوک باید خودکار به سرور منتقلش کند */
    async setup(page) {
      await clearServerWishlist(token)
      await page.goto(BASE + '/fa', { waitUntil: 'domcontentloaded' })
      await injectAuth(page, token)
      await injectGuestList(page, [2, 4, 6])
    },
    path: '/fa/account/wishlist',
    onlyVariant: 'desktop-light',
  },
]

if (!existsSync(OUT)) mkdirSync(OUT)

const browser = await chromium.launch({ executablePath: findChromium() })
let problems = 0

for (const variant of VARIANTS) {
  for (const testCase of CASES) {
    if (testCase.onlyVariant && testCase.onlyVariant !== variant.id) continue

    /* هر حالت context تازه می‌گیرد تا localStorage از حالت قبلی نشت نکند */
    const context = await browser.newContext({
      viewport: { width: variant.width, height: variant.height },
      deviceScaleFactor: 1,
      colorScheme: variant.dark ? 'dark' : 'light',
      locale: testCase.name.endsWith('-en') ? 'en-US' : 'fa-IR',
    })

    const page = await context.newPage()

    /*
     * ثبت خطاهای کنسول و شبکه.
     * اسکرین‌شات فقط ظاهر را نشان می‌دهد؛ خطای hydration یا درخواست
     * ۴۰۱ در تصویر دیده نمی‌شود ولی کیفیت واقعی را پایین می‌آورد.
     */
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
      await testCase.setup(page)
      await page.goto(BASE + testCase.path, { waitUntil: 'networkidle', timeout: 45000 })
      /* صبر تا کوئری علاقه‌مندی بنشیند و اسکلتون جای خود را بدهد */
      await page.waitForTimeout(1800)

      const file = OUT + '/' + testCase.name + '--' + variant.id + '.png'
      await page.screenshot({ path: file, fullPage: true })
      console.log('✓ ' + file + '   (URL: ' + new URL(page.url()).pathname + ')')
    } catch (error) {
      problems++
      console.log('✗ ' + testCase.name + ' (' + variant.id + '): ' + error.message.split('\n')[0])
    }

    await context.close()
  }
}

await browser.close()
console.log('\n' + (problems === 0 ? 'بدون خطای کنسول یا شبکه ✅' : problems + ' هشدار ثبت شد ⚠'))
