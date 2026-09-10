/**
 * تست سرتاسری مدیریت دسته و برند — از داخل مرورگر واقعی
 * ---------------------------------------------------------------------------
 * چیزی که تست API نمی‌گیرد و اینجا گرفته می‌شود:
 *   - درخت دسته با تورفتگی درست رندر می‌شود
 *   - دکمه‌های جابه‌جایی در ابتدا/انتهای هر گروه غیرفعال‌اند
 *   - فرم دوزبانه هر دو زبان را هم‌زمان می‌فرستد
 *   - خطای ۴۰۹ سرور (دسته‌ی دارای محصول) با پیام خودِ سرور نشان
 *     داده می‌شود، نه پیام عمومی
 *   - جابه‌جایی ترتیب واقعاً ذخیره می‌شود
 *
 * پیش‌نیاز: هر دو سرور بالا.
 *
 * اجرا:
 *     node scripts/e2e-taxonomy.mjs
 */

import { chromium } from 'playwright-core'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.SHOTS_BASE_URL ?? 'http://127.0.0.1:3100'
const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:8100/api/v1'
const OUT = '.shots'

const STAMP = Date.now()

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
  for (const [path, key] of [['/admin/categories', 'categories'], ['/admin/brands', 'brands']]) {
    const body = await (await call(token, path)).json()
    const flat = (nodes) => nodes.flatMap((n) => [n, ...(n.children ?? [])])

    for (const item of flat(body.data ?? [])) {
      if (item.slug.startsWith('e2e-')) {
        await call(token, `${path}/${item.id}`, { method: 'DELETE' })
      }
    }
    void key
  }
}
await cleanup()

const browser = await chromium.launch({ executablePath: findChromium() })
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: 'fa-IR',
})
const page = await context.newPage()

/*
 * ۴۰۹ و ۴۲۲ مورد انتظارند: بخش‌های حذف محافظت‌شده و اعتبارسنجی
 * عمداً آن‌ها را می‌سازند و مرورگر هر پاسخ ۴xx را در کنسول ثبت می‌کند.
 */
const EXPECTED = /409 \(Conflict\)|422 \(Unprocessable/
const consoleErrors = []
page.on('pageerror', (e) => consoleErrors.push(e.message))
page.on('console', (m) => {
  if (m.type() === 'error' && !EXPECTED.test(m.text())) consoleErrors.push(m.text())
})

/* تزریق ورود مدیر */
await page.goto(BASE + '/fa', { waitUntil: 'domcontentloaded' })
await page.evaluate((value) => {
  localStorage.setItem('auth_token', value)
  document.cookie = 'auth_token=' + value + '; path=/; max-age=86400; SameSite=Lax'
}, token)

const goTo = async (path) => {
  await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 45000 })
  await page.waitForTimeout(1500)
}

/* ============ 1. درخت دسته‌ها ============ */
console.log('--- 1. category tree ---')
{
  await goTo('/fa/admin/categories')

  const rows = await page.locator('main ul > li').count()
  check('tree rows rendered', rows > 5, `count=${rows}`)

  /*
   * تورفتگی: زیردسته‌ها باید padding-inline-start بیشتری از
   * ریشه‌ها داشته باشند. این چیزی است که تست API نمی‌بیند.
   */
  const padOf = (depth) =>
    page.locator(`main li[data-depth="${depth}"] > div`).first().evaluate((e) =>
      parseFloat(getComputedStyle(e).paddingInlineStart),
    )
  const rootPad = await padOf(0)
  const childPad = await padOf(1)
  check('children are indented', childPad > rootPad, `root=${rootPad}px child=${childPad}px`)

  /* اولین ردیف نباید دکمه‌ی «بالا» فعال داشته باشد */
  const firstUp = page.locator('main li[data-depth="0"]').first().getByRole('button', { name: 'انتقال به بالا' })
  check('first row cannot move up', await firstUp.isDisabled())

  await page.screenshot({ path: OUT + '/taxonomy-categories.png', fullPage: true })
}

/* ============ 2. حذف محافظت‌شده ============ */
console.log('\n--- 2. protected delete ---')
{
  /*
   * دسته‌ای که محصول دارد باید ۴۰۹ بگیرد و پیام *سرور* نشان داده
   * شود — پیامی که تعداد محصولات را می‌گوید، نه یک «خطایی رخ داد».
   */
  const body = await (await call(token, '/admin/categories')).json()
  const flat = (nodes) => nodes.flatMap((n) => [n, ...(n.children ?? [])])
  const withProducts = flat(body.data ?? []).find((c) => c.productsCount > 0)

  const row = page.locator('main ul > li').filter({ hasText: withProducts.displayName }).first()

  page.once('dialog', (dialog) => dialog.accept())
  await row.getByRole('button', { name: 'حذف' }).click()
  await page.waitForTimeout(2500)

  const toast = await page.locator('[data-sonner-toast]').first().innerText().catch(() => '')
  check('server message shown', /محصول/.test(toast), toast.slice(0, 60))
  check('count included in message', /\d/.test(toast), toast.slice(0, 60))

  /* دسته باید هنوز آنجا باشد */
  const after = await (await call(token, '/admin/categories')).json()
  const stillThere = flat(after.data ?? []).some((c) => c.id === withProducts.id)
  check('category survived', stillThere)
}

/* ============ 3. ساخت دسته با فرم دوزبانه ============ */
console.log('\n--- 3. create category ---')
let categoryId = null
{
  await goTo('/fa/admin/categories')
  /*
   * ⚠️ exact لازم است: «دسته جدید» زیررشته‌ی «زیردسته جدید» است و
   *    بدون آن، دکمه‌ی افزودن زیردسته‌ی هر ردیف هم تطبیق می‌خورد.
   */
  await page.getByRole('button', { name: 'دسته جدید', exact: true }).click()
  await page.waitForSelector('main input[name="name_fa"]', { timeout: 10000 })

  /* ارسال بدون نام انگلیسی → خطا و باز شدن خودکار تب انگلیسی */
  await page.fill('main input[name="name_fa"]', 'دسته تست سرتاسری')
  await page.locator('main form button[type="submit"]').click()
  await page.waitForTimeout(2000)

  const selectedTab = await page.locator('[role="tab"][aria-selected="true"]').innerText()
  check('errored tab auto-opened', selectedTab.includes('English'), selectedTab)

  const alerts = await page.locator('main [role="alert"]').count()
  check('inline error shown', alerts > 0, `count=${alerts}`)

  /* حالا کامل می‌کنیم */
  await page.fill('main input[name="name_en"]', `E2E Category ${STAMP}`)
  await page.fill('main input[name="slug"]', `e2e-category-${STAMP}`)
  await page.locator('main form button[type="submit"]').click()
  await page.waitForTimeout(2500)

  const body = await (await call(token, '/admin/categories')).json()
  const flat = (nodes) => nodes.flatMap((n) => [n, ...(n.children ?? [])])
  const created = flat(body.data ?? []).find((c) => c.slug === `e2e-category-${STAMP}`)
  categoryId = created?.id

  check('category saved', Boolean(created), created?.slug)
  check('persian name stored', created?.name?.fa === 'دسته تست سرتاسری', created?.name?.fa)
  check('english name stored', created?.name?.en === `E2E Category ${STAMP}`, created?.name?.en)
}

/* ============ 4. ویرایش زبان دیگر را پاک نکند ============ */
console.log('\n--- 4. edit keeps the other language ---')
{
  await goTo('/fa/admin/categories')

  const row = page.locator('main ul > li').filter({ hasText: 'دسته تست سرتاسری' }).first()
  await row.getByRole('button', { name: 'ویرایش دسته' }).click()
  await page.waitForSelector('main input[name="name_fa"]', { timeout: 10000 })

  check('persian prefilled', (await page.inputValue('main input[name="name_fa"]')) === 'دسته تست سرتاسری')
  check('english prefilled', (await page.inputValue('main input[name="name_en"]')) === `E2E Category ${STAMP}`)

  /* فقط فارسی را عوض می‌کنیم */
  await page.fill('main input[name="name_fa"]', 'دسته ویرایش‌شده')
  await page.locator('main form button[type="submit"]').click()
  await page.waitForTimeout(2500)

  const detail = await (await call(token, `/admin/categories/${categoryId}`)).json()
  check('persian updated', detail.data?.name?.fa === 'دسته ویرایش‌شده', detail.data?.name?.fa)
  check('english NOT wiped', detail.data?.name?.en === `E2E Category ${STAMP}`, detail.data?.name?.en)
}

/**
 * متن ردیف اولِ ریشه‌ها را می‌خواند تا وقتی با مقدار پیشین فرق کند.
 *
 * اگر تا مهلت عوض نشد، همان مقدار پیشین برگردانده می‌شود تا بررسی
 * به‌درستی شکست بخورد — نه اینکه با استثنا کل سوئیت را بیندازد.
 */
async function firstRootUntilChanged(previous, timeout = 15000) {
  const deadline = Date.now() + timeout

  while (Date.now() < deadline) {
    const current = await page.locator('main li[data-depth="0"]').first().innerText()
    if (current !== previous) return current
    await page.waitForTimeout(250)
  }

  return previous
}

/* ============ 5. جابه‌جایی ترتیب ============ */
console.log('\n--- 5. reorder ---')
{
  await goTo('/fa/admin/categories')

  /*
   * ⚠️ فقط ریشه‌ها ([data-depth="0"]).
   *
   *    ریشه و زیردسته در DOM هر دو <li> برادرند، پس nth(1) روی
   *    فهرست کامل، *اولین فرزندِ* ریشه‌ی اول را می‌گیرد — که درست
   *    است که نتواند بالا برود چون میان هم‌نیاهایش اول است.
   *    نسخه‌ی اول همین را کلیک می‌کرد و روی دکمه‌ی غیرفعال گیر کرد.
   */
  const roots = page.locator('main li[data-depth="0"]')
  const before = await roots.first().innerText()

  /* دومین *ریشه* را یک پله بالا می‌بریم */
  await roots.nth(1).getByRole('button', { name: 'انتقال به بالا' }).click()

  /*
   * ⚠️ انتظار **شرطی**، نه زمان ثابت.
   *
   *    زنجیره‌ی «درخواست ذخیره → invalidate → واکشی دوباره → رندر»
   *    روی ماشین کند از ۲۵۰۰ms هم رد می‌شود. نسخه‌ی قبلی زمان ثابت
   *    می‌گذاشت و نتیجه‌اش شکستِ گمراه‌کننده‌ی «ردیف اول عوض نشد» بود
   *    در حالی که سرور ذخیره کرده بود — بررسی بعدی که رفرش می‌کرد
   *    ترتیب تازه را می‌دید و آن هم شکست می‌خورد، چون با مقدار کهنه
   *    مقایسه می‌شد. یک تأخیر، دو شکستِ دروغین.
   */
  const after = await firstRootUntilChanged(before)
  check('first row changed', after !== before, `${before.split('\n')[0]} → ${after.split('\n')[0]}`)

  /* و پس از رفرش هم باید همان بماند — یعنی واقعاً ذخیره شده */
  await goTo('/fa/admin/categories')
  const persisted = await page.locator('main li[data-depth="0"]').first().innerText()
  check('order persisted', persisted === after, persisted.split('\n')[0])
}

/* ============ 6. برندها ============ */
console.log('\n--- 6. brands ---')
{
  await goTo('/fa/admin/brands')

  const rows = await page.locator('main ul > li').count()
  check('brand rows rendered', rows > 0, `count=${rows}`)
  await page.screenshot({ path: OUT + '/taxonomy-brands.png', fullPage: true })

  /* فیلتر وضعیت */
  await page.selectOption('main select', 'inactive')
  await page.waitForTimeout(1800)
  const inactive = await page.locator('main ul > li').count()
  check('status filter applied', inactive <= rows, `all=${rows} inactive=${inactive}`)

  await page.selectOption('main select', '')
  await page.waitForTimeout(1500)

  /* ساخت برند با آدرس نامعتبر → خطای سروری */
  await page.getByRole('button', { name: 'برند جدید', exact: true }).click()
  await page.waitForSelector('main input[name="name_fa"]', { timeout: 10000 })

  await page.fill('main input[name="name_fa"]', 'برند تست')

  /*
   * ⚠️ تب انگلیسی باید صریح باز شود.
   *
   *    فیلدهای هر دو زبان همیشه در DOM هستند ولی تبِ غیرفعال با
   *    hidden پنهان است (عمدی: تعویض تب نباید مکان‌نما و ارتفاع
   *    textarea را از بین ببرد). Playwright روی عنصر نامرئی fill
   *    نمی‌کند — که رفتار درستی است، چون کاربر واقعی هم نمی‌تواند.
   *
   *    در بخش ۳ این کلیک لازم نبود چون خطای اعتبارسنجی خودش تب را
   *    باز کرده بود.
   */
  await page.getByRole('tab', { name: 'English' }).click()
  await page.waitForTimeout(300)
  await page.fill('main input[name="name_en"]', `E2E Brand ${STAMP}`)
  await page.fill('main input[name="slug"]', `e2e-brand-${STAMP}`)
  await page.fill('main input[name="country_code"]', 'ir')
  await page.locator('main form button[type="submit"]').click()
  await page.waitForTimeout(2500)

  const body = await (await call(token, `/admin/brands?q=e2e-brand-${STAMP}`)).json()
  const created = (body.data ?? [])[0]

  check('brand saved', Boolean(created), created?.slug)
  check('country code upper-cased', created?.countryCode === 'IR', created?.countryCode)
}

/* ============ پاکسازی ============ */
await cleanup()
check('no console errors', consoleErrors.length === 0, consoleErrors[0]?.slice(0, 90) ?? '')

await browser.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
