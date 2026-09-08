/**
 * اسکرین‌شات مدیریت مقالات مجله
 * ---------------------------------------------------------------------------
 * صفحه پشت ورود و نقش مدیر است، پس shots.mjs عمومی به آن نمی‌رسد.
 * حالت‌ها:
 *   list        — جدول کامل مقالات
 *   list-draft  — تب پیش‌نویس (معمولاً خالی)
 *   list-search — نتیجه‌ی جستجو
 *   list-empty  — فیلتری که چیزی برنمی‌گرداند
 *
 * اجرا:  node scripts/shots-admin-posts.mjs
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
  if (!res.ok) throw new Error('login ' + res.status)
  return body.data.token
}

const token = await apiLogin('admin@demo.dev')

const VARIANTS = [
  { id: 'desktop-light', width: 1440, height: 1000, dark: false },
  { id: 'desktop-dark', width: 1440, height: 1000, dark: true },
  { id: 'mobile-light', width: 390, height: 844, dark: false },
]

const CASES = [
  { name: 'admin-posts',        path: '/fa/admin/posts' },
  { name: 'admin-posts-draft',  path: '/fa/admin/posts?status=draft',  onlyVariant: 'desktop-light' },
  { name: 'admin-posts-search', path: '/fa/admin/posts?q=laptop',      onlyVariant: 'desktop-light' },
  { name: 'admin-posts-empty',  path: '/fa/admin/posts?q=zzzznothing', onlyVariant: 'desktop-light' },
  { name: 'admin-posts-en',     path: '/en/admin/posts',               onlyVariant: 'desktop-light' },
  { name: 'admin-post-new',     path: '/fa/admin/posts/new',           onlyVariant: 'desktop-light' },
  { name: 'admin-post-edit',    path: '/fa/admin/posts/1',             onlyVariant: 'desktop-light' },
  { name: 'admin-post-edit-dark', path: '/fa/admin/posts/1',           onlyVariant: 'desktop-dark' },
  { name: 'admin-post-new-mobile', path: '/fa/admin/posts/new',        onlyVariant: 'mobile-light' },
]

if (!existsSync(OUT)) mkdirSync(OUT)

const browser = await chromium.launch({ executablePath: findChromium() })
let problems = 0

for (const variant of VARIANTS) {
  for (const testCase of CASES) {
    if (testCase.onlyVariant && testCase.onlyVariant !== variant.id) continue

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
      /* توکن باید پیش از رفتن به مسیر محافظت‌شده در جای خودش بنشیند */
      await page.goto(BASE + '/fa', { waitUntil: 'domcontentloaded' })
      await page.evaluate((value) => {
        localStorage.setItem('auth_token', value)
        document.cookie = 'auth_token=' + value + '; path=/; max-age=86400; SameSite=Lax'
      }, token)

      await page.goto(BASE + testCase.path, { waitUntil: 'networkidle', timeout: 45000 })
      /* صبر تا کوئری جدول بنشیند و اسکلتون جای خود را بدهد */
      await page.waitForTimeout(2000)

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
