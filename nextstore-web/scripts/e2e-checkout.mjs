/**
 * تست انتها‌به‌انتها چرخه خرید با مرورگر واقعی
 * ---------------------------------------------------------------------------
 * مسیر کامل کاربر:
 *   ورود → افزودن به سبد → سبد → تسویه (۳ مرحله) → درگاه → نتیجه
 *
 * چرا این تست ارزشمندتر از تست API است؟
 *   تست API فقط قرارداد را بررسی می‌کند. این تست همان کاری را
 *   می‌کند که یک کاربر واقعی می‌کند و باگ‌های اتصال (کلیک نشدن،
 *   ریدایرکت اشتباه، وضعیت گم‌شده) را پیدا می‌کند.
 *
 * اجرا: node scripts/e2e-checkout.mjs
 */

import { chromium } from 'playwright-core'
import { readdirSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

/*
 * ⚠️ آدرس پایه باید از متغیر محیطی بیاید و هاردکد نباشد.
 *    پورت‌های ۳۰۰۰ و ۸۰۰۰ روی این سیستم اشغال‌اند و پروژه روی
 *    ۳۱۰۰/۸۱۰۰ اجرا می‌شود؛ آدرس ثابت یعنی این تست بدون هیچ
 *    توضیحی ERR_CONNECTION_REFUSED می‌دهد.
 */
const BASE = process.env.SHOTS_BASE_URL ?? process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3100'
const OUT = '.shots/e2e'

let pass = 0, fail = 0
const check = (label, ok, extra = '') => {
  console.log(`  ${ok ? '✅' : '❌'} ${label}${extra ? '  → ' + extra : ''}`)
  if (ok) pass++
  else fail++
}

/** مسیر مرورگر کش‌شده در سیستم. */
function findChromium() {
  const cacheDir = join(process.env.LOCALAPPDATA, 'ms-playwright')
  const dir = readdirSync(cacheDir).find(
    (d) => d.startsWith('chromium-') && !d.includes('headless'),
  )
  for (const inner of ['chrome-win64', 'chrome-win']) {
    const candidate = join(cacheDir, dir, inner, 'chrome.exe')
    if (existsSync(candidate)) return candidate
  }
  throw new Error('chrome.exe پیدا نشد')
}

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ executablePath: findChromium() })
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: 'fa-IR',
})
const page = await context.newPage()

/* ثبت خطاهای کنسول — کیفیت فنی هم بررسی می‌شود */
const consoleErrors = []
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text().slice(0, 120)))
page.on('pageerror', (e) => consoleErrors.push(`PAGE: ${e.message.slice(0, 120)}`))

const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false })

try {
  console.log('═══════ ۱. ورود ═══════')
  await page.goto(`${BASE}/fa/login`, { waitUntil: 'networkidle' })

  /*
   * ⚠️ سلکتور باید به فرم ورود محدود شود.
   *    صفحه دو فرم دارد: جستجوی هدر و فرم ورود. سلکتور عمومی
   *    button[type="submit"] اولین مورد در DOM را می‌زند که دکمه
   *    «جستجو کن» است — نتیجه: ارسال جستجوی خالی و رفتن به
   *    صفحه محصولات به‌جای ورود.
   */
  const loginForm = page.locator('main form')
  await loginForm.locator('input[type="email"]').fill('user@demo.dev')
  await loginForm.locator('input[type="password"]').fill('password')
  await loginForm.locator('button[type="submit"]').click()
  await page.waitForURL(/\/fa\/account/, { timeout: 25000 })
  check('ورود و هدایت به پنل', page.url().includes('/fa/account'))
  await shot('01-account')

  console.log('\n═══════ ۲. افزودن به سبد ═══════')
  await page.goto(`${BASE}/fa/products?in_stock=true`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  /* دکمه افزودن سریع روی اولین کارت */
  const addButtons = page.locator('button[aria-label*="افزودن این محصول"]')
  const count = await addButtons.count()
  check('دکمه افزودن روی کارت‌ها', count > 0, `${count} دکمه`)

  await addButtons.first().click()
  await page.waitForTimeout(1500)
  await addButtons.nth(1).click()
  await page.waitForTimeout(1500)

  /* نشانگر سبد در هدر */
  const badge = await page.locator('a[href$="/cart"] span').first().textContent()
  check('نشانگر سبد به‌روز شد', !!badge?.trim(), `تعداد=${badge?.trim()}`)
  await shot('02-added')

  console.log('\n═══════ ۳. صفحه سبد ═══════')
  await page.goto(`${BASE}/fa/cart`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)

  const cartRows = await page.locator('ul > li').filter({ has: page.locator('img') }).count()
  check('اقلام در سبد', cartRows >= 1, `${cartRows} قلم`)
  check('دکمه تکمیل خرید', await page.locator('a[href$="/checkout"]').isVisible())
  await shot('03-cart')

  console.log('\n═══════ ۴. تسویه — مرحله آدرس ═══════')
  await page.click('a[href$="/checkout"]')
  await page.waitForURL(/\/checkout/, { timeout: 20000 })
  /*
   * انتظار برای بارگذاری واقعی، نه یک تایم‌اوت ثابت.
   * صفحه تسویه سه کوئری موازی دارد (سبد، آدرس‌ها، درگاه‌ها) و تا
   * آمدن همه اسکلتون نشان می‌دهد. تایم‌اوت ثابت روی سرور کند
   * شکست می‌خورد و باگ کاذب می‌سازد.
   */
  await page.waitForSelector('input[name="address"]', { timeout: 25000 })

  check('صفحه تسویه باز شد', page.url().includes('/checkout'))
  const hasAddress = await page.locator('input[name="address"]').count()
  check('آدرس‌ها نمایش داده شدند', hasAddress > 0, `${hasAddress} آدرس`)
  await shot('04-checkout-address')

  await page.getByRole('button', { name: 'بعدی' }).click()
  await page.waitForTimeout(800)

  console.log('\n═══════ ۵. تسویه — مرحله ارسال ═══════')
  const shippingOptions = await page.locator('input[name="shipping"]').count()
  check('روش‌های ارسال', shippingOptions === 2, `${shippingOptions} گزینه`)

  await page.fill('#order-note', 'تست خودکار — لطفاً تماس بگیرید')
  await shot('05-checkout-shipping')

  await page.getByRole('button', { name: /ادامه و پرداخت/ }).click()
  await page.waitForTimeout(800)

  console.log('\n═══════ ۶. تسویه — مرحله پرداخت ═══════')
  const gateways = await page.locator('input[name="gateway"]').count()
  check('درگاه‌های پرداخت', gateways > 0, `${gateways} درگاه`)
  await shot('06-checkout-payment')

  console.log('\n═══════ ۷. ثبت سفارش و رفتن به درگاه ═══════')
  await page.getByRole('button', { name: /ثبت سفارش و پرداخت/ }).click()
  await page.waitForURL(/\/checkout\/gateway/, { timeout: 30000 })
  await page.waitForTimeout(1500)

  check('هدایت به درگاه', page.url().includes('/checkout/gateway'))
  check('پارامتر ref در آدرس', page.url().includes('ref=MOCK-'))

  const gatewayText = await page.textContent('body')
  check('مبلغ نمایش داده شد', /\d/.test(gatewayText ?? ''))
  check('شماره سفارش نمایش داده شد', /NS-\d{6}-\d{4}/.test(gatewayText ?? ''))
  await shot('07-gateway')

  console.log('\n═══════ ۸. پرداخت موفق ═══════')
  await page.getByRole('button', { name: /شبیه‌سازی پرداخت موفق/ }).click()
  await page.waitForTimeout(3000)

  const resultText = await page.textContent('body')
  check('پیام موفقیت', resultText?.includes('سفارش شما ثبت شد') ?? false)
  check('شماره پیگیری صادر شد', resultText?.includes('شماره پیگیری') ?? false)
  check('وضعیت «پرداخت شده»', resultText?.includes('پرداخت شده') ?? false)
  await shot('08-success')

  console.log('\n═══════ ۹. صفحه جزئیات سفارش ═══════')
  await page.getByRole('link', { name: /مشاهده سفارش/ }).click()
  await page.waitForURL(/\/account\/orders\//, { timeout: 20000 })
  await page.waitForTimeout(2500)

  const detailText = await page.textContent('body')
  check('صفحه جزئیات باز شد', page.url().includes('/account/orders/'))
  check('نوار پیشرفت سفارش', detailText?.includes('آماده‌سازی') ?? false)
  check('اقلام سفارش', detailText?.includes('اقلام سفارش') ?? false)
  check('آدرس تحویل', detailText?.includes('آدرس تحویل') ?? false)
  check('اطلاعات پرداخت', detailText?.includes('اطلاعات پرداخت') ?? false)
  check('یادداشت مشتری', detailText?.includes('تست خودکار') ?? false)
  await shot('10-order-detail')

  console.log('\n═══════ ۱۰. فهرست سفارش‌ها ═══════')
  await page.goto(`${BASE}/fa/account/orders`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  const listText = await page.textContent('body')
  check('فهرست سفارش‌ها', listText?.includes('سفارش‌های من') ?? false)
  check('شماره سفارش در فهرست', /NS-\d{6}-\d{4}/.test(listText ?? ''))
  await shot('11-orders-list')

  console.log('\n═══════ ۹. سبد پس از خرید ═══════')
  await page.goto(`${BASE}/fa/cart`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  const emptyText = await page.textContent('body')
  check('سبد خالی شد', emptyText?.includes('سبد خرید شما خالی است') ?? false)
  await shot('09-cart-empty')

} catch (error) {
  console.log(`\n❌ خطای اجرا: ${error.message.split('\n')[0]}`)
  await shot('99-error')
  fail++
}

console.log('\n═══════ خطاهای کنسول ═══════')
if (consoleErrors.length === 0) {
  console.log('  ✅ هیچ خطایی نبود')
} else {
  ;[...new Set(consoleErrors)].slice(0, 6).forEach((e) => console.log(`  ⚠ ${e}`))
}

console.log(`\n═══════ نتیجه: ${pass} موفق، ${fail} ناموفق ═══════`)
console.log(`اسکرین‌شات‌ها در ${OUT}/`)

await browser.close()
