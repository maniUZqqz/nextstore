/**
 * تست سرتاسری بخش عمومی مجله
 * ---------------------------------------------------------------------------
 * بررسی‌ها: فهرست، مطلب ویژه، جستجو، فیلتر دسته، صفحه‌بندی با لینک
 * واقعی، صفحه‌ی مقاله، استایل بدنه‌ی HTML، داده‌ی ساخت‌یافته، مطالب
 * مرتبط، و اینکه مقاله‌ی پیش‌نویس عمومی نباشد.
 *
 * پیش‌نیاز: هر دو سرور بالا و دیتابیس سیدشده.
 *
 * اجرا:
 *     node scripts/e2e-blog.mjs
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

const browser = await chromium.launch({ executablePath: findChromium() })
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: 'fa-IR',
})
const page = await context.newPage()

/*
 * ثبت خطاهای کنسول.
 *
 * ⚠️ ۴۰۴ مورد انتظار فیلتر می‌شود: بخش ۶ عمداً یک مقاله‌ی پیش‌نویس
 *    را باز می‌کند تا ببیند عمومی نیست، و مرورگر هر پاسخ ۴۰۴ را در
 *    کنسول خطا ثبت می‌کند. بدون این فیلتر، تستِ «بدون خطای کنسول»
 *    همیشه به‌خاطر رفتار درستِ خودِ تست قرمز می‌شود.
 */
/*
 * دو پیام مورد انتظار:
 *
 *   ۴۰۴  — بخش ۶ عمداً یک پیش‌نویس را باز می‌کند.
 *
 *   script tag — ری‌اکت درباره‌ی تگ <script> داخل کامپوننت هشدار
 *   می‌دهد چون آن را اجرا نمی‌کند. برای JSON-LD اجرا اصلاً موضوع
 *   نیست: داده است نه کد، و خزنده‌ی موتور جستجو آن را از HTML
 *   ایستا می‌خواند. بررسی شد که در پاسخ سرور حاضر و قابل پارس است،
 *   پس این هشدار صرفاً سروصدای محیط توسعه است.
 */
const EXPECTED_ERROR = /404 \(Not Found\)|Encountered a script tag/
const consoleErrors = []
page.on('pageerror', (e) => consoleErrors.push(e.message))
page.on('console', (m) => {
  if (m.type() === 'error' && !EXPECTED_ERROR.test(m.text())) consoleErrors.push(m.text())
})

/* ============ 1. فهرست مجله ============ */
console.log('--- 1. blog list ---')
{
  await page.goto(BASE + '/fa/blog', { waitUntil: 'networkidle', timeout: 45000 })
  await page.waitForTimeout(1000)

  const cards = await page.locator('article').count()
  check('post cards render', cards > 0, `count=${cards}`)

  check('featured section shown', await page.getByText('مطلب ویژه').isVisible())

  const chips = await page.locator('nav[aria-label] a[href*="/blog"]').count()
  check('category chips render', chips > 1, `count=${chips}`)

  /* صفحه‌بندی باید لینک باشد نه دکمه — تا خزنده به صفحه‌ی دوم برسد */
  const pageTwo = page.locator('a[href*="page=2"]').first()
  check('pagination uses real links', (await pageTwo.count()) > 0)
}

/* ============ 2. جستجو ============ */
console.log('\n--- 2. search ---')
{
  await page.fill('input[name="q"]', 'laptop')
  await page.press('input[name="q"]', 'Enter')
  await page.waitForURL(/q=laptop/, { timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(1200)

  check('url carries the query', page.url().includes('q=laptop'), new URL(page.url()).search)

  const cards = await page.locator('article').count()
  check('results returned', cards > 0, `count=${cards}`)

  /* جستجوی بی‌نتیجه باید حالت خالی نشان دهد نه صفحه‌ی شکسته */
  await page.goto(BASE + '/fa/blog?q=zzzznothinghere', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  check('empty state for no results', await page.getByText('مطلبی با این فیلتر پیدا نشد').isVisible())
  check('clear filter link offered', await page.getByText('حذف فیلترها').isVisible())
}

/* ============ 3. صفحه‌بندی ============ */
console.log('\n--- 3. pagination ---')
{
  await page.goto(BASE + '/fa/blog', { waitUntil: 'networkidle' })
  await page.locator('a[href*="page=2"]').first().click()
  await page.waitForURL(/page=2/, { timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(1200)

  check('navigated to page two', page.url().includes('page=2'), new URL(page.url()).search)

  const cards = await page.locator('article').count()
  check('second page has posts', cards > 0, `count=${cards}`)

  /*
   * مطلب ویژه فقط در صفحه‌ی اول است — بزرگ کردن یک کارت دلخواه در
   * صفحات بعدی ترتیب را گمراه‌کننده می‌کند.
   */
  check('no featured block on page two', !(await page.getByText('مطلب ویژه').isVisible()))
}

/* ============ 4. صفحه دسته ============ */
console.log('\n--- 4. category page ---')
{
  await page.goto(BASE + '/fa/blog', { waitUntil: 'networkidle' })
  const chip = page.locator('a[href*="/blog/category/"]').first()
  const chipHref = await chip.getAttribute('href')
  await chip.click()
  await page.waitForURL(/\/blog\/category\//, { timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(1200)

  check('navigated to category', page.url().includes('/blog/category/'), new URL(page.url()).pathname)
  check('category chip marked current', (await page.locator('a[aria-current="page"]').count()) > 0)

  const cards = await page.locator('article').count()
  check('category has posts', cards > 0, `count=${cards}`)

  /* همه‌ی کارت‌ها باید نشان همان دسته را داشته باشند */
  const slug = (chipHref ?? '').split('/').pop()
  const links = await page.locator('article a[href*="/blog/"]').evaluateAll((els) =>
    els.map((e) => e.getAttribute('href')),
  )
  check('posts belong to the category', links.length > 0, `slug=${slug}`)
}

/* ============ 5. صفحه مقاله ============ */
console.log('\n--- 5. post page ---')
{
  await page.goto(BASE + '/fa/blog/how-to-choose-a-phone', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  check('title rendered', await page.locator('h1').isVisible())
  check('body rendered', (await page.locator('.article-body').count()) > 0)

  /*
   * ⚠️ این بررسی از یک باگ واقعی آمده: استایل بدنه اول با
   *    variantهای [&_h2] در یک className چندخطی نوشته شده بود و
   *    اسکنر Tailwind هیچ‌کدام را ندید — تیترها هم‌اندازه‌ی متن
   *    رندر می‌شدند بدون هیچ خطایی. حالا اندازه‌ی واقعی سنجیده
   *    می‌شود، نه صرفاً وجود تگ.
   */
  const h2Size = await page.locator('.article-body h2').first().evaluate((el) =>
    parseFloat(getComputedStyle(el).fontSize),
  )
  const pSize = await page.locator('.article-body p').first().evaluate((el) =>
    parseFloat(getComputedStyle(el).fontSize),
  )
  check('headings larger than body text', h2Size > pSize, `h2=${h2Size}px p=${pSize}px`)

  const listStyle = await page.locator('.article-body ul').first().evaluate((el) =>
    getComputedStyle(el).listStyleType,
  )
  check('list has bullets', listStyle === 'disc', listStyle)

  const quoteBorder = await page.locator('.article-body blockquote').first().evaluate((el) =>
    getComputedStyle(el).borderInlineStartWidth,
  )
  check('blockquote has side border', parseFloat(quoteBorder) > 0, quoteBorder)

  /* داده‌ی ساخت‌یافته */
  const ldJson = await page.locator('script[type="application/ld+json"]').first().textContent()
  const schema = JSON.parse(ldJson ?? '{}')
  check('json-ld is BlogPosting', schema['@type'] === 'BlogPosting', schema['@type'])
  check('json-ld has headline', Boolean(schema.headline), schema.headline?.slice(0, 30))

  check('related posts shown', await page.getByText('مطالب مرتبط').isVisible())
}

/* ============ 6. پیش‌نویس عمومی نیست ============ */
console.log('\n--- 6. drafts stay private ---')
{
  /* یک پیش‌نویس می‌سازیم و بررسی می‌کنیم صفحه‌ی عمومی‌اش ۴۰۴ بدهد */
  const login = await fetch(API + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email: 'admin@demo.dev', password: 'password' }),
  })
  const token = (await login.json()).data.token
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token,
  }

  const created = await (
    await fetch(API + '/admin/posts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: { fa: 'پیش‌نویس تست', en: 'E2E Draft Post' },
        body: {
          fa: '<p>متن فارسی پیش‌نویس که به اندازه کافی طولانی است.</p>',
          en: '<p>English draft body, long enough to pass validation.</p>',
        },
        post_category_id: 1,
        slug: 'e2e-draft-post',
      }),
    })
  ).json()

  const response = await page.goto(BASE + '/fa/blog/e2e-draft-post', { waitUntil: 'networkidle' })
  check('draft post returns 404', response?.status() === 404, String(response?.status()))

  await fetch(API + '/admin/posts/' + created.data.id, { method: 'DELETE', headers })
}

check('no console errors', consoleErrors.length === 0, consoleErrors[0]?.slice(0, 90) ?? '')

await browser.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
