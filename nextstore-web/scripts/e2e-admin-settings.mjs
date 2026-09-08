/**
 * تست سرتاسری تنظیمات فروشگاه — از داخل مرورگر واقعی
 * ---------------------------------------------------------------------------
 * چیزی که تست API نمی‌گیرد و اینجا گرفته می‌شود:
 *   - فرم از شمای بک‌اند ساخته می‌شود (نه فهرست هاردکد در فرانت)
 *   - تنظیم دوزبانه دو ورودی می‌گیرد، تک‌زبانه یکی
 *   - دکمه‌ی ذخیره تا پیش از تغییر غیرفعال است
 *   - **تغییر تنظیم واقعاً در فوتر و نوار بالای سایت دیده می‌شود**
 *   - حذف آدرس یک شبکه‌ی اجتماعی، آیکونش را از فوتر برمی‌دارد
 *
 * ⚠️ این تست مقادیر واقعی را عوض می‌کند و در پایان برمی‌گرداند.
 *
 * پیش‌نیاز: هر دو سرور بالا و SettingSeeder اجرا شده.
 *
 * اجرا:
 *     node scripts/e2e-admin-settings.mjs
 */

import { chromium } from 'playwright-core'
import { existsSync, readdirSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.SHOTS_BASE_URL ?? 'http://127.0.0.1:3100'
const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:8100/api/v1'
const OUT = '.shots'

const TEST_PHONE = '۰۲۱-۹۹۹۹۹۹۹۹'

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

/* ورود مقاوم — ۴۲۹ و بدنه‌ی خالی هر دو تلاش مجدد می‌شوند. */
async function apiLogin(email) {
  for (let attempt = 0; attempt < 8; attempt++) {
    let res
    try {
      res = await fetch(API + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, password: 'password' }),
      })
    } catch {
      await new Promise((r) => setTimeout(r, 2000))
      continue
    }
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 12000))
      continue
    }
    const text = await res.text()
    if (!text) {
      await new Promise((r) => setTimeout(r, 2000))
      continue
    }
    if (!res.ok) throw new Error('login ' + res.status + ': ' + text.slice(0, 120))
    return JSON.parse(text).data.token
  }
  throw new Error('login failed after retries')
}

const token = await apiLogin('admin@demo.dev')

const call = (path, options = {}) =>
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

/** مقادیر اولیه — برای بازگرداندن در پایان. */
const original = (await (await call('/admin/settings')).json()).data
console.log('settings in schema:', original.length)

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ executablePath: findChromium() })
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  locale: 'fa-IR',
})
const page = await context.newPage()

const consoleErrors = []
page.on('pageerror', (e) => consoleErrors.push(e.message))
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text())
})

await page.goto(BASE + '/fa', { waitUntil: 'domcontentloaded' })
await page.evaluate((value) => {
  localStorage.setItem('auth_token', value)
  document.cookie = 'auth_token=' + value + '; path=/; max-age=86400; SameSite=Lax'
}, token)

/* ============ ۱. فرم از شمای بک‌اند ساخته می‌شود ============ */
console.log('--- 1. form is built from the backend schema ---')
{
  await page.goto(BASE + '/fa/admin/settings', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  const sections = await page.locator('form section').count()
  check('three groups rendered', sections === 3, `sections=${sections}`)

  /*
   * تنظیم دوزبانه دو ورودی می‌گیرد. `site_name` دوزبانه است، پس هر دو
   * `setting-site_name-fa` و `-en` باید وجود داشته باشند.
   */
  check('bilingual setting has two inputs',
    (await page.locator('#setting-site_name-fa').count()) === 1 &&
    (await page.locator('#setting-site_name-en').count()) === 1)

  /* تنظیم تک‌زبانه فقط یک ورودی دارد */
  check('single-value setting has one input',
    (await page.locator('#setting-contact_phone').count()) === 1 &&
    (await page.locator('#setting-contact_phone-fa').count()) === 0)

  const save = page.getByRole('button', { name: 'ذخیره تنظیمات' })
  check('save disabled before any change', await save.isDisabled())

  await page.screenshot({ path: join(OUT, 'admin-settings--desktop-light.png'), fullPage: true })
}

/* ============ ۲. تغییر و ذخیره ============ */
console.log('--- 2. change and save ---')
{
  await page.fill('#setting-contact_phone', TEST_PHONE)
  await page.waitForTimeout(400)

  const save = page.getByRole('button', { name: 'ذخیره تنظیمات' })
  check('save enabled after a change', await save.isEnabled())
  check('unsaved hint shown', (await page.getByText('تغییرات ذخیره‌نشده دارید').count()) > 0)

  await save.click()
  await page.waitForTimeout(2500)

  const stored = (await (await call('/admin/settings')).json()).data
  const phone = stored.find((s) => s.key === 'contact_phone')
  check('value persisted', phone?.value === TEST_PHONE, phone?.value)

  check('save disabled again after saving', await save.isDisabled())
}

/* ============ ۳. تغییر واقعاً در سایت دیده می‌شود ============ */
/*
 * هسته‌ی این تست. بدون آن، پنل می‌توانست مقادیری ذخیره کند که هیچ‌جای
 * سایت نمایش داده نمی‌شوند و کسی متوجه نمی‌شد.
 */
console.log('--- 3. the change shows up on the storefront ---')
{
  await page.goto(`${BASE}/fa?_=${Date.now()}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  const header = await page.locator('header').innerText()
  check('new phone visible in the top bar', header.includes(TEST_PHONE),
    header.split('\n')[0]?.slice(0, 40))
}

/* ============ ۴. حذف یک شبکه‌ی اجتماعی، آیکونش را برمی‌دارد ============ */
console.log('--- 4. clearing a social URL removes its icon ---')
{
  const beforeIcons = await page.locator('footer a[aria-label]').count()

  /* آدرس لینکدین را خالی می‌کنیم */
  const payload = original.map((s) => ({
    key: s.key,
    value: s.key === 'social_linkedin' ? '' : s.value,
  }))
  payload.find((s) => s.key === 'contact_phone').value = TEST_PHONE

  await call('/admin/settings', { method: 'PUT', body: JSON.stringify({ settings: payload }) })

  await page.goto(`${BASE}/fa?_=${Date.now()}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  const afterIcons = await page.locator('footer a[aria-label]').count()
  check('one fewer social icon', afterIcons === beforeIcons - 1,
    `${beforeIcons} -> ${afterIcons}`)

  const linkedin = await page.locator('footer a[aria-label="LinkedIn"]').count()
  check('LinkedIn icon is gone', linkedin === 0)

  await page.screenshot({ path: join(OUT, 'settings-footer--desktop-light.png'), fullPage: false })
}

/* ============ ۵. انگلیسی و موبایل ============ */
console.log('--- 5. english + mobile ---')
{
  await page.goto(`${BASE}/en/admin/settings`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)

  check('english is LTR', (await page.locator('html').getAttribute('dir')) === 'ltr')

  const h1 = await page.locator('h1').first().innerText()
  check('heading translated', /setting/i.test(h1), `"${h1}"`)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/fa/admin/settings`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  check('no horizontal overflow', overflow <= 1, `overflow=${overflow}px`)
  await page.screenshot({ path: join(OUT, 'admin-settings--mobile-light.png'), fullPage: true })
}

/* ============ بازگرداندن ============ */
/*
 * ⚠️ الزامی است: این تست شماره‌ی تلفن واقعی فروشگاه را عوض کرده و
 *    لینک لینکدین را پاک کرده. بدون بازگرداندن، دمو با شماره‌ی
 *    آزمایشی می‌ماند.
 */
{
  await call('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify({ settings: original.map((s) => ({ key: s.key, value: s.value })) }),
  })

  const restored = (await (await call('/admin/settings')).json()).data
  const phone = restored.find((s) => s.key === 'contact_phone')
  const originalPhone = original.find((s) => s.key === 'contact_phone')

  check('settings restored', phone?.value === originalPhone?.value, phone?.value)
}

check('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '))

await browser.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
