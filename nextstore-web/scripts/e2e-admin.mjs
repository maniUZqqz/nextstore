/**
 * تست انتها‌به‌انتها پنل مدیریت
 * ---------------------------------------------------------------------------
 * بررسی می‌کند:
 *   ۱. کاربر عادی پیام «دسترسی ندارید» می‌بیند (نه صفحه خالی)
 *   ۲. مدیر داشبورد کامل با آمار و نمودار می‌بیند
 *   ۳. ناوبری پنل کار می‌کند
 *
 * اجرا: node scripts/e2e-admin.mjs
 */

import { chromium } from 'playwright-core'
import { readdirSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

/*
 * آدرس پایه از متغیر محیطی خوانده می‌شود.
 *
 * ⚠️ چرا قابل تنظیم شد؟ پورت ۳۰۰۰ ممکن است روی این سیستم توسط
 *    پروژه‌ی دیگری اشغال باشد. در ویندوز، «localhost» ابتدا به
 *    ::1 (IPv6) ترجمه می‌شود؛ اگر برنامه‌ی دیگری آنجا گوش بدهد،
 *    تست به اپلیکیشن اشتباه وصل می‌شود و شکست‌های گیج‌کننده
 *    می‌دهد. با E2E_BASE_URL می‌توان پورت را عوض کرد.
 */
const BASE = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3100'
const OUT = '.shots/admin'

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

const consoleErrors = []

/** ورود با ایمیل داده‌شده و بازگرداندن صفحه. */
async function loginAs(email, dark = false) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: 'fa-IR',
    colorScheme: dark ? 'dark' : 'light',
  })
  const page = await context.newPage()

  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text().slice(0, 120)))
  page.on('pageerror', (e) => consoleErrors.push(`PAGE: ${e.message.slice(0, 120)}`))

  await page.goto(`${BASE}/fa/login`, { waitUntil: 'networkidle' })

  /* سلکتور محدود به فرم ورود — هدر هم یک فرم جستجو دارد */
  const form = page.locator('main form')
  await form.locator('input[type="email"]').fill(email)
  await form.locator('input[type="password"]').fill('password')
  await form.locator('button[type="submit"]').click()
  await page.waitForURL(/\/fa\/account/, { timeout: 25000 })

  return { context, page }
}

try {
  /* ==========================================================
     ۱. کاربر عادی — نباید دسترسی داشته باشد
     ========================================================== */
  console.log('═══════ ۱. کاربر عادی ═══════')
  {
    const { context, page } = await loginAs('user@demo.dev')

    await page.goto(`${BASE}/fa/admin`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)

    const text = await page.textContent('body')
    check('پیام «دسترسی ندارید»', text?.includes('دسترسی ندارید') ?? false)
    check('توضیح روشن', text?.includes('فقط برای مدیران') ?? false)
    check('دکمه بازگشت به فروشگاه', text?.includes('بازگشت به فروشگاه') ?? false)

    /*
     * ⚠️ نشت داده را با *عنصر* می‌سنجیم نه با *رشته*.
     *
     *    نسخه‌ی قبلی چک می‌کرد «درآمد کل» در body نباشد و همیشه
     *    شکست می‌خورد. علتش نشت واقعی نبود: next-intl پیام‌های
     *    ترجمه را داخل یک تگ <script> جاسازی می‌کند و
     *    textContent('body') متن اسکریپت‌ها را هم شامل می‌شود.
     *    پس برچسبِ ترجمه پیدا می‌شد، بی‌آنکه چیزی رندر شده باشد.
     *
     *    حالا دو چیز واقعی بررسی می‌شود:
     *      الف) ریشه‌ی داشبورد اصلاً در DOM نیست
     *      ب) هیچ شماره سفارش واقعی در صفحه دیده نمی‌شود
     */
    const dashboardEls = await page.locator('[data-testid="admin-dashboard"]').count()
    check('داشبورد رندر نشده', dashboardEls === 0, `${dashboardEls} عنصر`)

    const rendered = await page.locator('body').innerText()
    check('شماره سفارش نشت نکرده', !/NS-d{6}-d{4}/.test(rendered))
    check('برچسب آمار رندر نشده', !rendered.includes('درآمد کل'))

    await page.screenshot({ path: `${OUT}/01-denied.png` })
    await context.close()
  }

  /* ==========================================================
     ۲. مدیر — داشبورد کامل
     ========================================================== */
  console.log('\n═══════ ۲. داشبورد مدیر ═══════')
  {
    const { context, page } = await loginAs('admin@demo.dev')

    await page.goto(`${BASE}/fa/admin`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    const text = await page.textContent('body')
    check('عنوان داشبورد', text?.includes('نمای کلی فروشگاه') ?? false)
    check('کارت درآمد کل', text?.includes('درآمد کل') ?? false)
    check('کارت سفارش‌ها', text?.includes('کل سفارش‌ها') ?? false)
    check('کارت مشتریان', text?.includes('مشتریان') ?? false)
    check('نمودار فروش', text?.includes('نمودار فروش') ?? false)
    check('پرفروش‌ترین محصولات', text?.includes('پرفروش‌ترین محصولات') ?? false)
    check('وضعیت سفارش‌ها', text?.includes('وضعیت سفارش‌ها') ?? false)
    check('آخرین سفارش‌ها', text?.includes('آخرین سفارش‌ها') ?? false)
    check('شماره سفارش واقعی', /NS-\d{6}-\d{4}/.test(text ?? ''))

    /* میله‌های نمودار واقعاً رندر شده‌اند؟ */
    const bars = await page.locator('[role="img"][aria-label*="-"]').count()
    check('میله‌های نمودار', bars >= 14, `${bars} میله`)

    /* ناوبری پنل */
    const navLinks = await page.locator('nav[aria-label="پنل مدیریت"] a').count()
    check('ناوبری پنل', navLinks >= 3, `${navLinks} لینک`)

    await page.screenshot({ path: `${OUT}/02-dashboard.png`, fullPage: true })

    /* --- حالت تاریک --- */
    await context.close()

    const dark = await loginAs('admin@demo.dev', true)
    await dark.page.goto(`${BASE}/fa/admin`, { waitUntil: 'networkidle' })
    await dark.page.waitForTimeout(3000)
    await dark.page.screenshot({ path: `${OUT}/03-dashboard-dark.png`, fullPage: true })
    check('داشبورد در تم تاریک', true)
    await dark.context.close()
  }

  /* ==========================================================
     ۳. نسخه انگلیسی
     ========================================================== */
  console.log('\n═══════ ۳. نسخه انگلیسی ═══════')
  {
    const { context, page } = await loginAs('admin@demo.dev')

    await page.goto(`${BASE}/en/admin`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    const text = await page.textContent('body')
    check('عنوان انگلیسی', text?.includes('Store overview') ?? false)
    check('Total revenue', text?.includes('Total revenue') ?? false)
    check('Best selling products', text?.includes('Best selling products') ?? false)

    await page.screenshot({ path: `${OUT}/04-dashboard-en.png`, fullPage: true })
    await context.close()
  }

} catch (error) {
  console.log(`\n❌ خطای اجرا: ${error.message.split('\n')[0]}`)
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
