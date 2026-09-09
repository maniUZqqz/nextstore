/**
 * اسکریپت گرفتن اسکرین‌شات از صفحات کلیدی
 * ---------------------------------------------------------------------------
 * برای بازبینی چشمی رابط کاربری در ترکیب‌های مختلف:
 *   زبان (فارسی/انگلیسی) × تم (روشن/تاریک) × دستگاه (موبایل/دسکتاپ)
 *
 * اجرا:  node scripts/shots.mjs [نام-گروه]
 * خروجی: پوشه .shots/
 */

import { chromium } from 'playwright-core'
import { mkdirSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/*
 * آدرس پایه از متغیر محیطی خوانده می‌شود.
 *
 * ⚠️ روی این سیستم پورت ۳۰۰۰ در IPv6 توسط پروژه‌ی دیگری اشغال است و
 *    «localhost» به آن می‌رسد، نه به این پروژه. با SHOTS_BASE_URL
 *    می‌توان پورت را عوض کرد.
 */
const BASE = process.env.SHOTS_BASE_URL ?? 'http://127.0.0.1:3100'
const OUT = '.shots'

/**
 * مسیر مرورگر کش‌شده در سیستم را پیدا می‌کند.
 *
 * نام پوشه‌ی داخلی بین نسخه‌های Playwright فرق می‌کند
 * (chrome-win در نسخه‌های قدیمی، chrome-win64 در جدیدها)،
 * پس هر دو حالت بررسی می‌شود.
 */
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

  throw new Error(`فایل اجرایی chrome.exe در ${dir} پیدا نشد`)
}

/**
 * صفحاتی که از آن‌ها عکس گرفته می‌شود.
 *
 * فیلد `action` اجازه می‌دهد پیش از عکس‌برداری کاری روی صفحه انجام شود —
 * مثلاً باز کردن منو. بدون آن، حالت‌های تعاملی (که دقیقاً جایی بودند
 * که باگ داشتند) هرگز دیده نمی‌شدند.
 */
const PAGES = [
  { name: 'home',      path: '/fa' },
  { name: 'products',  path: '/fa/products' },
  { name: 'product',   path: '/fa/products/iphone-15-pro-max' },
  { name: 'cart',      path: '/fa/cart' },
  { name: 'login',     path: '/fa/login' },
  { name: 'home-en',   path: '/en' },

  /* --- صفحات ناوبری کاتالوگ (بخش ۶ رودمپ، صفحات ۴ تا ۸) --- */
  { name: 'categories',      path: '/fa/categories' },
  { name: 'category',        path: '/fa/categories/mobile-phones' },
  { name: 'brands',          path: '/fa/brands' },
  { name: 'brand',           path: '/fa/brands/apple' },
  { name: 'search-empty',    path: '/fa/search' },
  { name: 'search-results',  path: '/fa/search?q=' + encodeURIComponent('آیفون') },
  { name: 'search-no-hits',  path: '/fa/search?q=' + encodeURIComponent('زیردریایی') },
  { name: 'brands-en',       path: '/en/brands' },

  /* --- صفحات محتوایی (بخش ۶ رودمپ، صفحات ۱۴ تا ۱۹) --- */
  { name: 'about',        path: '/fa/about' },
  { name: 'contact',      path: '/fa/contact' },
  { name: 'faq',          path: '/fa/faq' },
  { name: 'terms',        path: '/fa/terms' },
  { name: 'shipping',     path: '/fa/shipping-info' },
  { name: 'careers',      path: '/fa/careers' },
  { name: 'about-en',     path: '/en/about' },

  /* جستجوی FAQ — حالتی که فقط با تعامل دیده می‌شود */
  {
    name: 'faq-search',
    path: '/fa/faq',
    async action(page) {
      await page.locator('main input[type="search"]').fill('مرجوع')
      await page.waitForTimeout(600)
    },
  },

  /* --- صفحات تازه (اعلان، بازیابی رمز، فاکتور) --- */
  /*
   * ⚠️ صفحه‌های پشت ورود اینجا نیستند.
   *
   *    `/account/notifications` و صفحه‌ی فاکتور با کاربر واردنشده به
   *    صفحه‌ی ورود تغییرمسیر می‌خورند، پس عکسشان فقط صفحه‌ی ورود را
   *    نشان می‌داد. تست‌های سرتاسری خودشان وارد می‌شوند و از آن‌ها عکس
   *    می‌گیرند (`e2e-contact`, `e2e-banners`).
   */
  { name: 'forgot-password', path: '/fa/forgot-password' },
  { name: 'reset-invalid',   path: '/fa/reset-password' },

  /* --- حالت‌های تعاملی --- */
  {
    name: 'menu-open',
    path: '/fa',
    viewportOnly: true,
    action: async (page) => {
      await page.getByRole('button', { name: 'باز کردن منو' }).click()
      await page.waitForTimeout(600)
    },
  },
  {
    name: 'filters-open',
    path: '/fa/products',
    viewportOnly: true,
    action: async (page) => {
      await page.getByRole('button', { name: /فیلترها/ }).first().click()
      await page.waitForTimeout(600)
    },
  },
]

/** ترکیب‌های نمایشی — زبان × تم × دستگاه. */
const VARIANTS = [
  { id: 'desktop-light', width: 1440, height: 1000, dark: false },
  { id: 'desktop-dark',  width: 1440, height: 1000, dark: true  },
  { id: 'mobile-light',  width: 390,  height: 844,  dark: false },
  { id: 'mobile-dark',   width: 390,  height: 844,  dark: true  },
]

const only = process.argv[2]

if (!existsSync(OUT)) mkdirSync(OUT)

const browser = await chromium.launch({ executablePath: findChromium() })

for (const variant of VARIANTS) {
  const context = await browser.newContext({
    viewport: { width: variant.width, height: variant.height },
    deviceScaleFactor: 1,
    /* تم با ترجیح سیستم اعمال می‌شود — همان مسیری که کاربر واقعی طی می‌کند */
    colorScheme: variant.dark ? 'dark' : 'light',
    locale: 'fa-IR',
  })

  const page = await context.newPage()

  /*
   * ثبت خطاهای کنسول و درخواست‌های شکست‌خورده.
   *
   * ⚠️ چرا لازم است؟ اسکرین‌شات فقط ظاهر را نشان می‌دهد. خطای
   *    hydration، تصویر ۴۰۴ یا هشدار React در تصویر دیده نمی‌شود
   *    ولی کیفیت واقعی را پایین می‌آورد. با این، هر بار عکس‌برداری
   *    یک بازبینی فنی هم هست.
   */
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`   ⚠ کنسول: ${msg.text().split('\n')[0].slice(0, 150)}`)
    }
  })

  page.on('pageerror', (error) => {
    console.log(`   ⚠ خطای صفحه: ${error.message.split('\n')[0].slice(0, 150)}`)
  })

  page.on('requestfailed', (request) => {
    console.log(`   ⚠ درخواست ناموفق: ${request.url().slice(0, 110)}`)
  })

  page.on('response', (response) => {
    if (response.status() >= 400) {
      console.log(`   ⚠ ${response.status()}: ${response.url().slice(0, 110)}`)
    }
  })

  for (const target of PAGES) {
    if (only && target.name !== only) continue

    /* حالت‌های تعاملی منو و فیلتر فقط در موبایل معنا دارند */
    const isMobile = variant.id.startsWith('mobile')
    if (target.action && !isMobile) continue

    /* موبایل فقط برای چند صفحه کلیدی */
    if (isMobile && !['home', 'products', 'product', 'menu-open', 'filters-open'].includes(target.name)) {
      continue
    }

    try {
      await page.goto(`${BASE}${target.path}`, { waitUntil: 'networkidle', timeout: 45000 })
      /* کمی صبر تا تصاویر و انیمیشن‌ها بنشینند */
      await page.waitForTimeout(1200)

      /* اجرای تعامل اختیاری (باز کردن منو، فیلتر و…) */
      if (target.action) await target.action(page)

      const file = `${OUT}/${target.name}--${variant.id}.png`
      await page.screenshot({
        path: file,
        /* حالت‌های تعاملی باید در اندازه‌ی واقعی صفحه دیده شوند،
           نه fullPage — وگرنه عناصر fixed جای اشتباه می‌افتند */
        fullPage: !target.viewportOnly,
      })
      console.log(`✓ ${file}`)
    } catch (error) {
      console.log(`✗ ${target.name} (${variant.id}): ${error.message.split('\n')[0]}`)
    }
  }

  await context.close()
}

await browser.close()
console.log('\nتمام شد.')
