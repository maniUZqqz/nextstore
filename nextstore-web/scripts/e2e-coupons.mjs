/**
 * تست سرتاسری کد تخفیف — از داخل مرورگر واقعی
 * ---------------------------------------------------------------------------
 * چیزی که تست API نمی‌گیرد و اینجا گرفته می‌شود:
 *   - خطای سرور زیر همان ورودی نشان داده می‌شود (نه toast محوشونده)
 *   - پیام‌های مختلف از هم تفکیک می‌شوند: منقضی ≠ ظرفیت تکمیل ≠ نامعتبر
 *   - ردیف تخفیف فقط وقتی مبلغی هست ظاهر می‌شود
 *   - جمع کل روی صفحه با تخفیف می‌خواند
 *   - برداشتن کوپن، مبلغ را برمی‌گرداند
 *   - تخفیف تا صفحه‌ی تسویه و فاکتور سفارش منتقل می‌شود
 *
 * پیش‌نیاز: هر دو سرور بالا و دیتابیس سیدشده (CouponSeeder اجرا شده).
 *
 * اجرا:
 *     node scripts/e2e-coupons.mjs
 */

import { chromium } from 'playwright-core'
import { existsSync, readdirSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.SHOTS_BASE_URL ?? 'http://127.0.0.1:3100'
const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:8100/api/v1'
const OUT = '.shots'

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

const token = await apiLogin('user@demo.dev')

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

/* ============ کوپن آزمایشی ============ */

/** حداقل مبلغ سبد برای فعال‌شدن کوپن آزمایشی — به ریال. */
const MIN_FOR_COUPON = 50_000_000

/**
 * کد ثابت است، نه یکتا در هر اجرا.
 *
 * ⚠️ کوپنی که در سفارشی مصرف شده **حذف نمی‌شود** — API عمداً ۴۲۲
 *    می‌دهد، چون حذفش سفارش‌ها را یتیم می‌کند. بخش ۵ هر اجرا یک
 *    سفارش واقعی با همین کوپن ثبت می‌کند، پس از اجرای دوم به بعد
 *    پاک‌کردن و ساختن دوباره ناممکن است.
 *
 *    کد یکتا در هر اجرا این را دور می‌زد ولی هر اجرا یک ردیف
 *    غیرقابل‌حذف در فهرست کوپن‌ها جا می‌گذاشت — همان زباله‌ای که
 *    جای دیگر از آن پرهیز شده. پس یک کد ثابت می‌ماند و هر اجرا به
 *    حالت شناخته‌شده **به‌روزرسانی** می‌شود.
 */
const COUPON_CODE = 'E2E-DISCOUNT'

const adminToken = await apiLogin('admin@demo.dev')

const adminCall = (path, options = {}) =>
  fetch(API + path, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': 'fa',
      Authorization: 'Bearer ' + adminToken,
      ...options.headers,
    },
  })

/**
 * مقادیر کوپن — همان مقادیر BIGSPENDER سیدر، تا آنچه سنجیده می‌شود
 * عوض نشود: درصدی، سقف تخفیف، و حداقل سبد.
 *
 * `per_user_limit` بیشترین مقدار مجاز API است. چون هر اجرا یک
 * سفارش می‌سازد، یعنی حدود صد اجرا سهمیه دارد؛ بعد از آن اجرا با
 * پیام روشن متوقف می‌شود، نه با شکست گیج‌کننده.
 */
const COUPON_PAYLOAD = {
  code: COUPON_CODE,
  description: 'کوپن ثابت تست سرتاسری',
  type: 'percent',
  value: 20,
  max_discount: 10_000_000,
  min_order_total: MIN_FOR_COUPON,
  usage_limit: null,
  per_user_limit: 100,
  starts_at: null,
  expires_at: null,
  is_active: true,
}

/** کوپن آزمایشی موجود، یا تهی. پارامتر جستجو `q` است نه `search`. */
async function findTestCoupon() {
  const list = await (await adminCall(`/admin/coupons?q=${COUPON_CODE}`)).json()

  return (list.data ?? []).find((coupon) => coupon.code === COUPON_CODE) ?? null
}

/** ساخت کوپن، یا برگرداندنش به حالت شناخته‌شده اگر از قبل هست. */
async function ensureTestCoupon() {
  const existing = await findTestCoupon()

  const response = existing
    ? await adminCall(`/admin/coupons/${existing.id}`, {
        method: 'PUT',
        body: JSON.stringify(COUPON_PAYLOAD),
      })
    : await adminCall('/admin/coupons', {
        method: 'POST',
        body: JSON.stringify(COUPON_PAYLOAD),
      })

  if (!response.ok) {
    console.error()
    console.error(`❌ آماده‌سازی کوپن آزمایشی ناموفق بود — کد ${response.status}`)
    console.error(await response.text())
    console.error()
    process.exit(1)
  }
}

/**
 * سنجش اینکه کوپن هنوز برای این کاربر قابل استفاده است.
 *
 * ⚠️ اعمال کوپن روی سبد چیزی مصرف نمی‌کند — فقط ثبت سفارش مصرف
 *    می‌کند. پس این بررسی بی‌هزینه است و ارزشش این است که وقتی
 *    سهمیه‌ی صدتایی تمام شود، پیامِ روشن می‌دهد به‌جای اینکه بخش ۳
 *    با «تخفیف اعمال نشد» بیفتد و شبیه باگ محاسبه به نظر برسد.
 */
async function assertCouponUsable() {
  const response = await call('/cart/coupon', {
    method: 'POST',
    body: JSON.stringify({ code: COUPON_CODE }),
  })

  if (!response.ok) {
    console.error()
    console.error(`❌ کوپن آزمایشی برای این کاربر پذیرفته نشد — کد ${response.status}`)
    console.error('   ' + (await response.text()).slice(0, 200))
    console.error()
    console.error('  اگر پیام از سهمیه می‌گوید، یعنی صد اجرای این سوئیت')
    console.error('  سهمیه‌ی کوپن را تمام کرده. دیتابیس را تازه کن:')
    console.error('      cd nextstore-api')
    console.error('      ../tools/php/php.exe artisan migrate:fresh --seed')
    console.error()
    process.exit(1)
  }

  /* برداشته می‌شود تا بخش ۱ سبدِ بی‌تخفیف ببیند */
  await call('/cart/coupon', { method: 'DELETE' })
}

/**
 * ساخت سبدی که به حداقل کوپن آزمایشی برسد.
 *
 * ⚠️ کوپن **ساخته می‌شود**، از سیدر برداشته نمی‌شود.
 *
 *    نسخه‌ی قبلی از BIGSPENDER استفاده می‌کرد چون سقفش سه‌تایی بود و
 *    «برای تکرار مناسب‌تر» به نظر می‌رسید. ولی بخش ۵ هر اجرا یک سفارش
 *    واقعی ثبت می‌کند و هر سفارش یکی از آن سه را می‌سوزاند: اجرای
 *    چهارم به بعد، کوپن برای همان کاربر رد می‌شد و بخش ۳ با «تخفیف
 *    اعمال نشد» شکست می‌خورد — که شبیه باگ محاسبه‌ی تخفیف است، نه
 *    شبیه تمام‌شدن سهمیه.
 *
 *    حالا هر اجرا کوپن خودش را می‌سازد و آخر کار پاک می‌کند، پس
 *    شمارنده‌اش همیشه از صفر شروع می‌شود. کوپن‌های سیدشده دست‌نخورده
 *    می‌مانند و بخش ۲ همچنان پیام‌های خطای واقعی‌شان را می‌سنجد.
 *
 * ⚠️ محصول باید **موجود** باشد و انتخابش نباید به یک ردیف خاص وابسته
 *    بماند: نسخه‌ی اول این تست همیشه گران‌ترین محصول را برمی‌داشت و
 *    چون بخش ۵ یک سفارش واقعی ثبت می‌کند، پس از چند اجرا موجودی همان
 *    محصول صفر شد. تست ادامه داد، سبد خالی ماند، و شکست در بخش ۶ به
 *    شکل «placeholder انگلیسی پیدا نشد» گزارش شد — علتی که هیچ ربطی
 *    به علت واقعی نداشت.
 *
 *    حالا فقط بین محصولات موجود می‌گردد و اگر هیچ‌کدام کافی نبود،
 *    **صریحاً شکست می‌خورد** به‌جای اینکه بی‌صدا ادامه دهد.
 */
await ensureTestCoupon()
await call('/cart', { method: 'DELETE' })

const candidates = await (await fetch(
  API + '/products?in_stock=1&sort=price_desc&per_page=10',
  { headers: { Accept: 'application/json' } },
)).json()

let productId = null
let quantity = 1

for (const product of candidates.data ?? []) {
  const price = product.finalPrice ?? product.price
  /* سقف تعداد در هر قلم سبد ۱۰ است و بیش از موجودی هم نمی‌شود */
  const maxQty = Math.min(product.stock ?? 0, 10)
  const needed = Math.ceil((MIN_FOR_COUPON + 1) / price)

  if (needed <= maxQty) {
    productId = product.id
    quantity = needed
    break
  }
}

if (productId === null) {
  console.error('\n❌ هیچ محصول موجودی برای رسیدن به حداقل کوپن پیدا نشد.')
  console.error('   احتمالاً موجودی‌ها با اجراهای قبلی تمام شده‌اند. اجرا کن:')
  console.error('   ../tools/php/php.exe artisan migrate:fresh --seed\n')
  process.exit(1)
}

await call('/cart/items', {
  method: 'POST',
  body: JSON.stringify({ product_id: productId, quantity }),
})

const cartBefore = (await (await call('/cart')).json()).data

if (cartBefore.summary.subtotal < MIN_FOR_COUPON) {
  console.error('\n❌ سبد آزمایشی به حداقل کوپن نرسید — تست بی‌معنا می‌شد.')
  process.exit(1)
}

console.log(`cart: product ${productId} × ${quantity} = ${cartBefore.summary.subtotal.toLocaleString()}`)

/* حالا که سبد به حداقل رسیده، سهمیه‌ی کوپن سنجیده می‌شود */
await assertCouponUsable()

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ executablePath: findChromium() })
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: 'fa-IR',
})
const page = await context.newPage()

/* ۴۲۲ برای کدهای نامعتبر مورد انتظار است — بخش ۲ عمداً آن‌ها را می‌فرستد */
const EXPECTED_ERROR = /422 \(Unprocessable/
const consoleErrors = []
page.on('pageerror', (e) => consoleErrors.push(e.message))
page.on('console', (m) => {
  if (m.type() === 'error' && !EXPECTED_ERROR.test(m.text())) consoleErrors.push(m.text())
})

await page.goto(BASE + '/fa', { waitUntil: 'domcontentloaded' })
await page.evaluate((value) => {
  localStorage.setItem('auth_token', value)
  document.cookie = 'auth_token=' + value + '; path=/; max-age=86400; SameSite=Lax'
}, token)

/** متن خلاصه‌ی مبالغ، با ارقام لاتین‌شده برای مقایسه. */
const summaryText = async () => {
  const raw = await page.locator('main dl').first().innerText()
  return raw.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
}

/* ============ ۱. فرم کوپن روی صفحه‌ی سبد ============ */
console.log('--- 1. coupon form on the cart page ---')
{
  await page.goto(BASE + '/fa/cart', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)

  const input = page.locator('input[placeholder="کد تخفیف"]')
  check('coupon input present', (await input.count()) === 1)

  const apply = page.getByRole('button', { name: 'اعمال' })
  check('apply disabled while empty', await apply.isDisabled())

  /* ردیف تخفیف نباید پیش از اعمال دیده شود */
  check('no discount row yet', !(await summaryText()).includes('تخفیف'))

  await page.screenshot({ path: join(OUT, 'cart-coupon-empty--desktop-light.png'), fullPage: true })
}

/* ============ ۲. پیام‌های خطا از هم تفکیک می‌شوند ============ */
console.log('--- 2. distinct error messages ---')
{
  const cases = [
    ['NOPETHISISWRONG', 'معتبر نیست'],
    ['EXPIRED2025', 'مهلت'],
    ['SOLDOUT', 'ظرفیت'],
    ['NOWRUZ', 'فعال نشده'],
  ]

  for (const [code, expected] of cases) {
    await page.fill('input[placeholder="کد تخفیف"]', code)
    await page.getByRole('button', { name: 'اعمال' }).click()
    await page.waitForTimeout(1800)

    const error = await page.locator('[role="alert"]').first().innerText().catch(() => '')
    check(`${code} shows its own message`, error.includes(expected), error.slice(0, 45))
  }

  await page.screenshot({ path: join(OUT, 'cart-coupon-error--desktop-light.png'), fullPage: true })
}

/* ============ ۳. اعمال موفق ============ */
console.log('--- 3. successful apply ---')
{
  await page.fill('input[placeholder="کد تخفیف"]', COUPON_CODE)
  await page.getByRole('button', { name: 'اعمال' }).click()
  await page.waitForTimeout(2500)

  check('input replaced by applied state', (await page.locator('input[placeholder="کد تخفیف"]').count()) === 0)

  const body = await page.locator('main').innerText()
  check('code shown', body.includes(COUPON_CODE))

  const summary = await summaryText()
  check('discount row appeared', summary.includes('تخفیف'))

  /* مقایسه با محاسبه‌ی سرور — نه با عددی که خودمان حساب کنیم */
  const cart = (await (await call('/cart')).json()).data
  check('server applied the discount', cart.summary.discount > 0,
    cart.summary.discount.toLocaleString())
  check('total reflects the discount',
    cart.summary.total === cart.summary.subtotal - cart.summary.discount + cart.summary.shipping,
    `${cart.summary.subtotal} - ${cart.summary.discount} + ${cart.summary.shipping} = ${cart.summary.total}`)

  await page.screenshot({ path: join(OUT, 'cart-coupon-applied--desktop-light.png'), fullPage: true })
}

/* ============ ۴. برداشتن کوپن ============ */
console.log('--- 4. remove coupon ---')
{
  await page.getByRole('button', { name: 'برداشتن کد تخفیف' }).click()
  await page.waitForTimeout(2500)

  check('input is back', (await page.locator('input[placeholder="کد تخفیف"]').count()) === 1)

  const cart = (await (await call('/cart')).json()).data
  check('server cleared the coupon', cart.coupon === null)
  check('discount back to zero', cart.summary.discount === 0)
}

/* ============ ۵. تخفیف تا فاکتور سفارش می‌رسد ============ */
console.log('--- 5. discount survives to the order ---')
{
  await call('/cart/coupon', { method: 'POST', body: JSON.stringify({ code: COUPON_CODE }) })
  const cart = (await (await call('/cart')).json()).data

  const addresses = (await (await call('/addresses')).json()).data
  const order = (await (await call('/orders', {
    method: 'POST',
    body: JSON.stringify({ address_id: addresses[0].id, shipping_method: 'standard' }),
  })).json()).data

  check('order carries the discount', order.discount === cart.summary.discount,
    `order=${order.discount} cart=${cart.summary.discount}`)
  check('order total is correct',
    order.total === order.subtotal - order.discount + order.shippingCost,
    `${order.subtotal} - ${order.discount} + ${order.shippingCost} = ${order.total}`)

  /*
   * ⚠️ سبد باید کوپن را هم از دست بدهد، نه فقط اقلام را.
   *    وگرنه خرید بعدی بی‌آنکه کاربر کد بزند تخفیف می‌گرفت.
   */
  const after = (await (await call('/cart')).json()).data
  check('cart coupon cleared after checkout', after.coupon === null)
  check('cart is empty', after.items.length === 0)
}

/* ============ ۶. انگلیسی و موبایل ============ */
console.log('--- 6. english + mobile ---')
{
  await call('/cart/items', {
    method: 'POST',
    body: JSON.stringify({ product_id: productId, quantity }),
  })

  await page.goto(`${BASE}/en/cart`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)

  check('english is LTR', (await page.locator('html').getAttribute('dir')) === 'ltr')
  check('english placeholder', (await page.locator('input[placeholder="Coupon code"]').count()) === 1)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/fa/cart`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  check('no horizontal overflow', overflow <= 1, `overflow=${overflow}px`)
  await page.screenshot({ path: join(OUT, 'cart-coupon--mobile-light.png'), fullPage: true })
}

/* ============ پاکسازی ============ */
await call('/cart', { method: 'DELETE' })
await call('/cart/coupon', { method: 'DELETE' })
console.log('  cleanup: cart emptied')

/*
 * کوپن آزمایشی عمداً باقی می‌ماند: بخش ۵ با آن سفارش ثبت کرده و
 * API حذف کوپنِ مصرف‌شده را رد می‌کند. اجرای بعدی همان ردیف را به
 * حالت شناخته‌شده برمی‌گرداند، پس چیزی انباشته نمی‌شود.
 */

check('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '))

await browser.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
