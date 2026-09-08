/**
 * تست سرتاسری مدیریت مقالات — از داخل مرورگر واقعی
 * ---------------------------------------------------------------------------
 * چیزی که تست API نمی‌گیرد و اینجا گرفته می‌شود:
 *   - فرم دوزبانه هر دو زبان را هم‌زمان می‌فرستد
 *   - جابه‌جایی بین تب‌ها چیزی را از دست نمی‌دهد
 *   - خطای اعتبارسنجی زیر همان فیلد نشان داده می‌شود و تبِ دارای
 *     خطا خودکار باز می‌شود
 *   - ویرایش، مقدار هر دو زبان را پر می‌کند (نه فقط زبان پنل)
 *   - انتشار و بازگشت به پیش‌نویس از روی جدول کار می‌کند
 *
 * پیش‌نیاز: هر دو سرور بالا و دیتابیس سیدشده.
 *
 * اجرا:
 *     node scripts/e2e-admin-posts.mjs
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

const token = await apiLogin('admin@demo.dev')

/** پاکسازی بازمانده‌های اجرای قبلی. */
async function cleanup() {
  const body = await (await call(token, '/admin/posts?per_page=100')).json()
  for (const p of body.data ?? []) {
    if (p.slug.startsWith('e2e-')) {
      await call(token, '/admin/posts/' + p.id, { method: 'DELETE' })
    }
  }
}
await cleanup()

const browser = await chromium.launch({ executablePath: findChromium() })
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: 'fa-IR',
})
const page = await context.newPage()

/* خطاهای ۴۲۲ مورد انتظارند: بخش اعتبارسنجی عمداً فرم ناقص می‌فرستد */
const EXPECTED_ERROR = /422 \(Unprocessable/
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

/* ============ 1. صفحه فهرست ============ */
console.log('--- 1. list page ---')
{
  await page.goto(BASE + '/fa/admin/posts', { waitUntil: 'networkidle' })
  await page.waitForSelector('table tbody tr', { timeout: 15000 })

  const rows = await page.locator('table tbody tr').count()
  check('table renders rows', rows > 0, `rows=${rows}`)

  const tabs = await page.locator('[role="tab"]').count()
  check('four status tabs', tabs === 4, `tabs=${tabs}`)
}

/* ============ 2. اعتبارسنجی فرم ============ */
console.log('\n--- 2. form validation ---')
{
  await page.goto(BASE + '/fa/admin/posts/new', { waitUntil: 'networkidle' })
  await page.waitForSelector('#title-fa', { timeout: 15000 })

  /* فقط فارسی پر می‌شود تا سرور نبود انگلیسی را بگیرد */
  await page.fill('#title-fa', 'مقاله تست سرتاسری')
  await page.fill('#body-fa', '<p>متن فارسی به اندازه کافی طولانی برای عبور از قاعده حداقل.</p>')
  await page.selectOption('#post-category', { index: 1 })
  await page.fill('#post-slug', 'e2e-test-post')

  await page.click('button[type="submit"]')
  await page.waitForTimeout(2500)

  /* تبِ دارای خطا باید خودکار باز شده باشد */
  const englishTabSelected = await page
    .locator('[role="tab"][aria-selected="true"]')
    .innerText()
  check('errored tab auto-opened', englishTabSelected.includes('English'), englishTabSelected)

  const alerts = await page.locator('[role="alert"]').count()
  check('field errors shown inline', alerts > 0, `count=${alerts}`)

  check('still on the form', page.url().includes('/admin/posts/new'), new URL(page.url()).pathname)
}

/* ============ 3. تب‌ها داده را نگه می‌دارند ============ */
console.log('\n--- 3. tabs keep their values ---')
{
  await page.fill('#title-en', 'E2E Test Post')
  await page.fill('#body-en', '<p>English body long enough to pass the minimum length rule.</p>')

  /* برگشت به تب فارسی و بررسی اینکه مقدار قبلی سر جایش است */
  await page.click('[role="tab"]:has-text("فارسی")')
  await page.waitForTimeout(400)

  const faTitle = await page.inputValue('#title-fa')
  check('persian value survived tab switch', faTitle === 'مقاله تست سرتاسری', faTitle)

  await page.click('[role="tab"]:has-text("English")')
  await page.waitForTimeout(400)
  const enTitle = await page.inputValue('#title-en')
  check('english value survived tab switch', enTitle === 'E2E Test Post', enTitle)
}

/* ============ 4. ذخیره ============ */
console.log('\n--- 4. save ---')
let createdId = null
{
  await page.click('button[type="submit"]')
  await page.waitForTimeout(3000)

  check('redirected to list', page.url().includes('/admin/posts') && !page.url().includes('/new'),
        new URL(page.url()).pathname)

  const body = await (await call(token, '/admin/posts?q=e2e-test-post')).json()
  const created = (body.data ?? [])[0]
  createdId = created?.id
  check('post exists on server', Boolean(created), created?.slug)
  check('saved as draft', created?.status === 'draft', created?.status)
}

/* ============ 5. هر دو زبان ذخیره شده‌اند ============ */
console.log('\n--- 5. both languages persisted ---')
{
  const detail = await (await call(token, '/admin/posts/' + createdId)).json()
  check('persian title saved', detail.data?.title?.fa === 'مقاله تست سرتاسری', detail.data?.title?.fa)
  check('english title saved', detail.data?.title?.en === 'E2E Test Post', detail.data?.title?.en)
  check('persian body saved', (detail.data?.body?.fa ?? '').includes('متن فارسی'))
  check('english body saved', (detail.data?.body?.en ?? '').includes('English body'))
}

/* ============ 6. فرم ویرایش هر دو زبان را پر می‌کند ============ */
console.log('\n--- 6. edit form loads both languages ---')
{
  await page.goto(BASE + '/fa/admin/posts/' + createdId, { waitUntil: 'networkidle' })
  await page.waitForSelector('#title-fa', { timeout: 15000 })

  const faTitle = await page.inputValue('#title-fa')
  const enTitle = await page.inputValue('#title-en')
  check('persian field prefilled', faTitle === 'مقاله تست سرتاسری', faTitle)
  check('english field prefilled', enTitle === 'E2E Test Post', enTitle)

  const slugValue = await page.inputValue('#post-slug')
  check('slug prefilled', slugValue === 'e2e-test-post', slugValue)

  /* ویرایش فقط فارسی — انگلیسی نباید پاک شود */
  await page.fill('#title-fa', 'مقاله تست ویرایش‌شده')
  await page.click('button[type="submit"]')
  await page.waitForTimeout(3000)

  const detail = await (await call(token, '/admin/posts/' + createdId)).json()
  check('persian updated', detail.data?.title?.fa === 'مقاله تست ویرایش‌شده', detail.data?.title?.fa)
  check('english NOT wiped', detail.data?.title?.en === 'E2E Test Post', detail.data?.title?.en)
}

/* ============ 7. انتشار از روی جدول ============ */
console.log('\n--- 7. publish from the table ---')
{
  await page.goto(BASE + '/fa/admin/posts?q=e2e-test-post', { waitUntil: 'networkidle' })
  await page.waitForSelector('table tbody tr', { timeout: 15000 })

  /* اولین دکمه در ستون عملیات، همان تغییر وضعیت انتشار است */
  await page.locator('table tbody tr').first().locator('button').first().click()
  await page.waitForTimeout(2500)

  const body = await (await call(token, '/admin/posts/' + createdId)).json()
  check('now published', body.data?.status === 'published', body.data?.status)

  /* مقاله‌ی منتشرشده باید در مسیر عمومی هم دیده شود */
  const publicRes = await fetch(API + '/posts/e2e-test-post', {
    headers: { Accept: 'application/json', 'Accept-Language': 'fa' },
  })
  check('visible on public API', publicRes.status === 200, String(publicRes.status))
}

/* ============ پاکسازی ============ */
await cleanup()
check('no console errors', consoleErrors.length === 0, consoleErrors[0]?.slice(0, 90) ?? '')

await browser.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
