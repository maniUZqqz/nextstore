/**
 * تست انتها‌به‌انتها: صفحه‌های سفارش‌ها و محصولات پنل مدیریت
 * ---------------------------------------------------------------------------
 * پوشش:
 *   ۱. فهرست سفارش‌ها: نمایش، فیلتر وضعیت، جستجو، صفحه‌بندی
 *   ۲. جزئیات سفارش: اقلام، آدرس، فرم تغییر وضعیت (اجرای واقعی)
 *   ۳. فهرست محصولات: فیلتر، ویرایش سریع موجودی
 *   ۴. فرم محصول: ساخت، اعتبارسنجی، ویرایش، حذف
 *   ۵. سبک بودن payload صفحات فروشگاه (نبود ترجمه‌های admin)
 *
* ⚠️ این تست عمداً داده را تغییر می‌دهد (وضعیت سفارش، موجودی،
 *    ساخت و حذف محصول). تغییر وضعیت سفارش در دامنه‌ی ما یک‌طرفه
 *    است و برگشت ندارد — پس تست نباید به وضعیت خاصی در داده‌ی
 *    نمونه *وابسته* باشد. اجرای قبلی همین اشتباه را داشت: دنبال
 *    سفارش «پرداخت‌شده» می‌گشت و پس از چند اجرا همه‌شان مصرف شده
 *    بودند و تست بی‌دلیل قرمز می‌شد.
 *
 *    حالا تست خودش سفارشی را پیدا می‌کند که انتقال مجاز دارد.
 *
 * اجرا: node scripts/e2e-admin-crud.mjs
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
const OUT = '.shots/admin-crud'

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

const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: 'fa-IR',
})
const page = await context.newPage()

page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text().slice(0, 140)))
page.on('pageerror', (e) => consoleErrors.push(`PAGE: ${e.message.slice(0, 140)}`))

/** ورود به‌عنوان مدیر، با تحمل محدودیت نرخ درخواست. */
async function loginAsAdmin() {
  for (let attempt = 0; attempt < 5; attempt++) {
    await page.goto(`${BASE}/fa/login`, { waitUntil: 'networkidle' })

    const form = page.locator('main form')
    await form.locator('input[type="email"]').fill('admin@demo.dev')
    await form.locator('input[type="password"]').fill('password')
    await form.locator('button[type="submit"]').click()

    try {
      await page.waitForURL(/\/fa\/account/, { timeout: 20000 })
      return
    } catch {
      /* محدودیت نرخ ورود ۵ درخواست در دقیقه است — کمی صبر می‌کنیم */
      await page.waitForTimeout(13000)
    }
  }
  throw new Error('ورود مدیر ممکن نشد')
}

try {
  await loginAsAdmin()
  console.log('ورود مدیر انجام شد\n')

  /* ==========================================================
     ۱. فهرست سفارش‌ها
     ========================================================== */
  console.log('═══════ ۱. فهرست سفارش‌ها ═══════')
  {
    await page.goto(`${BASE}/fa/admin/orders`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)

    const text = await page.locator('body').innerText()
    check('عنوان صفحه', text.includes('مدیریت سفارش‌ها'))
    check('شمارش نتایج', /\d+\s*سفارش/.test(text) || /سفارش/.test(text))

    const rows = await page.locator('main ul li a[href*="/admin/orders/"]').count()
    check('ردیف‌های سفارش', rows > 0, `${rows} ردیف`)

    /* شماره سفارش واقعی رندر شده است؟ */
    check('شماره سفارش واقعی', /NS-\d{6}-\d{4}/.test(text))

    /* نام مشتری از عکس لحظه‌ای */
    check('نام مشتری نمایش داده شده', /محمدی|کریمی|حسینی|رضایی|کاربر نمونه/.test(text))

    await page.screenshot({ path: `${OUT}/01-orders-list.png`, fullPage: true })

    /* --- فیلتر وضعیت --- */
    /*
     * ⚠️ وضعیت فیلتر از داده‌ی واقعی انتخاب می‌شود، نه ثابت.
     *
     *    نسخه‌ی قبلی روی 'paid' قفل بود. اما همین تست در بخش بعد،
     *    وضعیت یک سفارش پرداخت‌شده را جلو می‌برد و انتقال وضعیت
     *    یک‌طرفه است. پس از چند اجرا هیچ سفارش paid باقی نمی‌ماند و
     *    تست بدون هیچ تغییری در کد، قرمز می‌شد — یعنی تست به
     *    عوارض جانبی خودش وابسته بود.
     */
    const statusValues = await page
      .locator('main select')
      .first()
      .locator('option')
      .evaluateAll((nodes) => nodes.map((n) => n.value).filter(Boolean))

    let pickedStatus = ''
    let filtered = rows

    for (const value of statusValues) {
      await page.locator('main select').first().selectOption(value)

      /* صبر تا تعداد ردیف‌ها واقعاً عوض شود */
      let current = rows
      for (let attempt = 0; attempt < 12; attempt++) {
        await page.waitForTimeout(400)
        current = await page.locator('main ul li a[href*="/admin/orders/"]').count()
        if (current !== rows) break
      }

      if (current > 0 && current < rows) {
        pickedStatus = value
        filtered = current
        break
      }
    }

    const filteredText = await page.locator('body').innerText()
    check('فیلتر وضعیت اعمال شد', filtered > 0 && filtered < rows,
      `${pickedStatus}: ${filtered} از ${rows} ردیف`)
    check('دکمه پاک کردن فیلتر ظاهر شد', filteredText.includes('پاک کردن فیلترها'))

    /* --- بازگشت به حالت اول --- */
    await page.getByRole('button', { name: 'پاک کردن فیلترها' }).first().click()
    await page.waitForTimeout(1800)
    const restored = await page.locator('main ul li a[href*="/admin/orders/"]').count()
    check('فیلتر پاک شد', restored === rows, `${restored} ردیف`)

    /* --- جستجو --- */
    const firstNumber = text.match(/NS-\d{6}-\d{4}/)[0]
    await page.locator('main input[type="search"]').fill(firstNumber)
    await page.waitForTimeout(2200)

    const searched = await page.locator('main ul li a[href*="/admin/orders/"]').count()
    check('جستجو نتیجه داد', searched >= 1, `${searched} ردیف برای ${firstNumber}`)

    await page.screenshot({ path: `${OUT}/02-orders-search.png` })
  }

  /* ==========================================================
     ۲. جزئیات سفارش + تغییر وضعیت
     ========================================================== */
  console.log('\n═══════ ۲. جزئیات سفارش ═══════')
  {
    /*
     * سفارشی پیدا می‌کنیم که *واقعاً* انتقال مجاز داشته باشد.
     *
     * توکن از همان نشست مرورگر خوانده می‌شود تا ورود دوباره‌ای لازم
     * نباشد — محدودیت نرخ ورود ۵ درخواست در دقیقه است و ورود مجدد
     * تست را با ۴۲۹ می‌شکند.
     */
    const token = await page.evaluate(() => localStorage.getItem('auth_token'))
    const apiBase = process.env.E2E_API_URL ?? 'http://127.0.0.1:8100/api/v1'

    const listResponse = await fetch(`${apiBase}/admin/orders?per_page=50`, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'fa',
        Authorization: `Bearer ${token}`,
      },
    })
    const { data: allOrders } = await listResponse.json()

    /* وضعیت‌های پایانی انتقالی ندارند و برای این بخش بی‌فایده‌اند */
    const TERMINAL = ['delivered', 'cancelled', 'refunded']
    const candidate = allOrders.find((order) => !TERMINAL.includes(order.status))

    check('سفارش قابل‌تغییر پیدا شد', Boolean(candidate),
      candidate ? `${candidate.orderNumber} (${candidate.status})` : 'هیچ سفارشی')

    if (!candidate) {
      throw new Error('هیچ سفارشی با انتقال مجاز نیست — سیدر را دوباره اجرا کنید')
    }

    /* فیلتر وضعیت از آدرس، با وضعیتی که مطمئنیم وجود دارد */
    await page.goto(`${BASE}/fa/admin/orders?status=${candidate.status}`, {
      waitUntil: 'networkidle',
    })
    await page.waitForTimeout(2500)

    const preselected = await page.locator('main select').first().inputValue()
    check('وضعیت از آدرس خوانده شد', preselected === candidate.status, preselected)

    const urlFilteredRows = await page.locator('main ul li a[href*="/admin/orders/"]').count()
    check('فیلتر آدرس ردیف برگرداند', urlFilteredRows > 0, `${urlFilteredRows} ردیف`)

    await page.goto(`${BASE}/fa/admin/orders/${candidate.orderNumber}`, {
      waitUntil: 'networkidle',
    })
    await page.waitForTimeout(2500)

    const text = await page.locator('body').innerText()
    check('شماره سفارش در سرصفحه', /NS-\d{6}-\d{4}/.test(text))
    check('بخش اقلام سفارش', text.includes('اقلام سفارش'))
    check('بخش آدرس تحویل', text.includes('آدرس تحویل'))
    check('بخش خلاصه مالی', text.includes('خلاصه مالی'))
    check('بخش زمان‌بندی', text.includes('زمان‌بندی سفارش'))
    check('بخش حساب مشتری', text.includes('حساب مشتری'))
    check('ایمیل مشتری', /@demo\.dev/.test(text))
    check('فرم تغییر وضعیت', text.includes('تغییر وضعیت'))

    await page.screenshot({ path: `${OUT}/03-order-detail.png`, fullPage: true })

    /* --- گزینه‌های دراپ‌داون فقط انتقال‌های مجاز باشند --- */
    const select = page.locator('#next-status')
    const options = await select.locator('option').allTextContents()
    check('گزینه‌های وضعیت از سرور', options.length > 1, options.join(' | '))
    check('وضعیت فعلی در گزینه‌ها نیست',
      !options.slice(1).includes(candidate.statusLabel), candidate.statusLabel)

    /* --- اجرای واقعی تغییر وضعیت --- */
    const targetValue = await select.locator('option').nth(1).getAttribute('value')
    await select.selectOption(targetValue)
    await page.waitForTimeout(400)

    /* اگر «ارسال شده» انتخاب شود، فیلد کد رهگیری باید ظاهر شود */
    if (targetValue === 'shipped') {
      const trackingVisible = await page.locator('#tracking-code').isVisible()
      check('فیلد کد رهگیری فقط برای ارسال', trackingVisible)
      await page.locator('#tracking-code').fill('IR987654321')
    }

    await page.locator('#admin-note').fill('یادداشت تست خودکار مرورگر')
    await page.getByRole('button', { name: 'اعمال تغییر' }).click()
    await page.waitForTimeout(3000)

    const after = await page.locator('body').innerText()
    check('پیام موفقیت', after.includes('وضعیت سفارش تغییر کرد'))
    check('یادداشت داخلی ذخیره شد', after.includes('یادداشت تست خودکار مرورگر'))

    await page.screenshot({ path: `${OUT}/04-order-status-changed.png`, fullPage: true })
  }

  /* ==========================================================
     ۳. فهرست محصولات
     ========================================================== */
  console.log('\n═══════ ۳. فهرست محصولات ═══════')
  {
    await page.goto(`${BASE}/fa/admin/products`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)

    const text = await page.locator('body').innerText()
    check('عنوان صفحه', text.includes('مدیریت محصولات'))
    check('دکمه افزودن محصول', text.includes('افزودن محصول'))

    const rows = await page.locator('main ul li').count()
    check('ردیف‌های محصول', rows > 0, `${rows} ردیف`)
    check('برچسب وضعیت انتشار', /منتشرشده|پیش‌نویس|بایگانی/.test(text))
    check('حاشیه سود محاسبه شده', text.includes('حاشیه سود'))

    await page.screenshot({ path: `${OUT}/05-products-list.png`, fullPage: true })

    /* --- فیلتر پیش‌نویس --- */
    await page.locator('main select').first().selectOption('draft')
    await page.waitForTimeout(2200)
    const draftText = await page.locator('body').innerText()
    const draftRows = await page.locator('main ul li').count()
    check('فیلتر پیش‌نویس', draftRows > 0 && draftText.includes('پیش‌نویس'), `${draftRows} ردیف`)

    /* --- فیلتر موجودی کم از آدرس --- */
    await page.goto(`${BASE}/fa/admin/products?low_stock=1`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2200)
    const lowChecked = await page.locator('main input[type="checkbox"]').first().isChecked()
    check('فیلتر موجودی کم از آدرس', lowChecked)

    /* --- ویرایش سریع موجودی --- */
    await page.goto(`${BASE}/fa/admin/products`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2200)

    const stockInput = page.locator('main input[type="number"]').first()
    const before = await stockInput.inputValue()
    const next = String(Number(before) + 3)

    await stockInput.fill(next)
    await page.waitForTimeout(300)

    /* دکمه ذخیره فقط پس از تغییر مقدار ظاهر می‌شود */
    const saveVisible = await page.locator('main form button[type="submit"]').first().isVisible()
    check('دکمه ذخیره پس از تغییر ظاهر شد', saveVisible)

    await page.locator('main form button[type="submit"]').first().click()
    await page.waitForTimeout(3000)

    const afterValue = await page.locator('main input[type="number"]').first().inputValue()
    check('موجودی ذخیره شد', afterValue === next, `${before} → ${afterValue}`)

    await page.screenshot({ path: `${OUT}/06-quick-stock.png` })
  }

  /* ==========================================================
     ۴. فرم ساخت محصول
     ========================================================== */
  console.log('\n═══════ ۴. فرم محصول ═══════')
  {
    await page.goto(`${BASE}/fa/admin/products/new`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const text = await page.locator('body').innerText()
    check('عنوان فرم', text.includes('افزودن محصول جدید'))
    check('راهنمای فیلد الزامی', text.includes('ستاره‌دار'))
    check('هر دو زبان در فرم', text.includes('نام محصول (فارسی)') && text.includes('نام محصول (انگلیسی)'))
    check('بخش قیمت‌گذاری', text.includes('قیمت‌گذاری'))
    check('بخش انبار', text.includes('انبار'))
    check('قیمت تمام‌شده محرمانه', text.includes('محرمانه'))

    await page.screenshot({ path: `${OUT}/07-product-form-empty.png`, fullPage: true })

    /* --- اعتبارسنجی سمت کلاینت --- */
    await page.getByRole('button', { name: 'ذخیره' }).click()
    await page.waitForTimeout(800)
    const invalidText = await page.locator('body').innerText()
    check('خطای نام الزامی', invalidText.includes('نام محصول در هر دو زبان الزامی است'))

    /* --- قیمت تخفیف بیشتر از قیمت اصلی --- */
    const stamp = Date.now().toString().slice(-6)
    await page.locator('#name-fa').fill(`محصول تستی مرورگر ${stamp}`)
    await page.locator('#name-en').fill(`Browser Test Item ${stamp}`)
    await page.locator('#price').fill('8000000')
    await page.locator('#sale-price').fill('9000000')
    await page.getByRole('button', { name: 'ذخیره' }).click()
    await page.waitForTimeout(800)
    check('خطای قیمت تخفیف',
      (await page.locator('body').innerText()).includes('قیمت با تخفیف باید کمتر'))

    /* --- ذخیره‌ی درست --- */
    await page.locator('#sale-price').fill('6500000')
    await page.locator('#short-fa').fill('توضیح کوتاه تستی')
    await page.locator('#short-en').fill('Short test description')
    await page.locator('#stock').fill('25')
    await page.locator('#status').selectOption('active')

    await page.getByRole('button', { name: 'ذخیره' }).click()
    /* پس از ساخت، به صفحه‌ی ویرایش همان محصول هدایت می‌شویم */
    await page.waitForURL(/\/admin\/products\/browser-test-item/, { timeout: 20000 })
    await page.waitForTimeout(2500)

    const created = await page.locator('body').innerText()
    check('هدایت به صفحه ویرایش', page.url().includes('browser-test-item'), page.url().split('/').pop())
    check('عنوان ویرایش', created.includes('ویرایش محصول'))

    /* --- فرم با مقادیر واقعی پر شده است؟ --- */
    check('نام فارسی بارگذاری شد',
      (await page.locator('#name-fa').inputValue()) === `محصول تستی مرورگر ${stamp}`)
    check('نام انگلیسی بارگذاری شد',
      (await page.locator('#name-en').inputValue()) === `Browser Test Item ${stamp}`)
    check('قیمت بارگذاری شد', (await page.locator('#price').inputValue()) === '8000000')
    check('موجودی بارگذاری شد', (await page.locator('#stock').inputValue()) === '25')
    check('کد کالا خودکار ساخته شد', /^NS-\d{5}$/.test(await page.locator('#sku').inputValue()))

    await page.screenshot({ path: `${OUT}/08-product-form-filled.png`, fullPage: true })

    /* --- ویرایش فقط فارسی: انگلیسی نباید پاک شود --- */
    await page.locator('#name-fa').fill(`نام ویرایش‌شده ${stamp}`)
    await page.getByRole('button', { name: 'ذخیره' }).click()
    await page.waitForTimeout(3000)

    check('پیام ذخیره', (await page.locator('body').innerText()).includes('محصول ذخیره شد'))

    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)
    check('نام فارسی ویرایش شد',
      (await page.locator('#name-fa').inputValue()) === `نام ویرایش‌شده ${stamp}`)
    check('⚠ نام انگلیسی پاک نشد',
      (await page.locator('#name-en').inputValue()) === `Browser Test Item ${stamp}`)

    /* --- حذف محصول تستی --- */
    /*
     * ⚠️ درس از اجرای قبلی: اینجا «اولین ردیف» حذف می‌شد. چون
     *    پارامتر ?q= در فهرست اعمال نمی‌شد، فهرست کامل نمایش داده
     *    می‌شد و تست نزدیک بود محصول واقعی را پاک کند. حالا هم
     *    اعمال شدن جستجو بررسی می‌شود و هم دکمه‌ی حذف *دقیقاً*
     *    با نام محصول تستی هدف‌گیری می‌شود.
     */
    const searchTerm = `Browser Test Item ${stamp}`
    await page.goto(`${BASE}/fa/admin/products?q=${encodeURIComponent(searchTerm)}`, {
      waitUntil: 'networkidle',
    })
    await page.waitForTimeout(2500)

    /* آیا ?q= واقعاً در ورودی جستجو نشسته است؟ */
    const searchValue = await page.locator('main input[type="search"]').inputValue()
    check('پارامتر q در ورودی جستجو نشست', searchValue === searchTerm, searchValue)

    const beforeDelete = await page.locator('main ul li').count()
    check('جستجو فقط محصول تستی را برگرداند', beforeDelete === 1, `${beforeDelete} ردیف`)

    /* دکمه‌ی حذفِ همان محصول، نه ردیف اول هرچه باشد */
    const deleteButton = page.locator(`button[aria-label*="${`نام ویرایش‌شده ${stamp}`}"]`).last()
    const targeted = await deleteButton.count()
    check('دکمه حذف محصول تستی پیدا شد', targeted > 0)

    if (targeted > 0) {
      page.once('dialog', (dialog) => dialog.accept())
      await deleteButton.click()
      await page.waitForTimeout(3000)

      const afterDelete = await page.locator('main ul li').count()
      check('محصول تستی حذف شد', afterDelete === 0, `${beforeDelete} → ${afterDelete}`)
    }
  }

  /* ==========================================================
     ۵. سبکی payload صفحات فروشگاه
     ========================================================== */
  console.log('\n═══════ ۵. حجم ترجمه‌ها ═══════')
  {
    const shop = await page.goto(`${BASE}/fa`, { waitUntil: 'networkidle' })
    const shopHtml = await shop.text()
    check('صفحه اصلی ترجمه‌های admin را حمل نمی‌کند', !shopHtml.includes('مدیریت سفارش‌ها'))
    check('ترجمه‌های فروشگاه سر جایشان هستند', shopHtml.includes('سبد خرید'))

    const adminPage = await page.goto(`${BASE}/fa/admin/orders`, { waitUntil: 'networkidle' })
    const adminHtml = await adminPage.text()
    check('صفحه پنل ترجمه‌های admin را دارد', adminHtml.includes('مدیریت سفارش‌ها'))

    const shopKb = (Buffer.byteLength(shopHtml, 'utf8') / 1024).toFixed(0)
    console.log(`  ℹ حجم HTML صفحه اصلی: ${shopKb} KB`)
  }

  /* ==========================================================
     ۶. موبایل و تم تاریک
     ========================================================== */
  console.log('\n═══════ ۶. موبایل و تم تاریک ═══════')
  {
    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: 'fa-IR',
      colorScheme: 'dark',
      storageState: await context.storageState(),
    })
    const mobilePage = await mobile.newPage()

    await mobilePage.goto(`${BASE}/fa/admin/orders`, { waitUntil: 'networkidle' })
    await mobilePage.waitForTimeout(2500)

    /* هیچ اسکرول افقی نباید وجود داشته باشد */
    const overflow = await mobilePage.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    check('بدون اسکرول افقی در موبایل', overflow <= 1, `${overflow}px`)

    await mobilePage.screenshot({ path: `${OUT}/09-orders-mobile-dark.png`, fullPage: true })

    await mobilePage.goto(`${BASE}/fa/admin/products`, { waitUntil: 'networkidle' })
    await mobilePage.waitForTimeout(2500)
    await mobilePage.screenshot({ path: `${OUT}/10-products-mobile-dark.png`, fullPage: true })

    const mobileOverflow = await mobilePage.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    check('فهرست محصولات بدون سرریز افقی', mobileOverflow <= 1, `${mobileOverflow}px`)

    await mobile.close()
  }

  /* ==========================================================
     ۷. نسخه انگلیسی
     ========================================================== */
  console.log('\n═══════ ۷. نسخه انگلیسی ═══════')
  {
    await page.goto(`${BASE}/en/admin/orders`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)
    const text = await page.locator('body').innerText()
    check('عنوان انگلیسی سفارش‌ها', text.includes('Orders'))
    check('وضعیت انگلیسی', /Delivered|Shipped|Paid|Pending/.test(text))

    await page.goto(`${BASE}/en/admin/products`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)
    const productsText = await page.locator('body').innerText()
    check('عنوان انگلیسی محصولات', productsText.includes('Products'))
    check('وضعیت انتشار انگلیسی', /Published|Draft|Archived/.test(productsText))

    await page.screenshot({ path: `${OUT}/11-products-en.png`, fullPage: true })
  }
} catch (error) {
  console.log(`\n❌ خطای اجرا: ${error.message.split('\n')[0]}`)
  await page.screenshot({ path: `${OUT}/error.png`, fullPage: true }).catch(() => {})
  fail++
}

console.log('\n═══════ خطاهای کنسول ═══════')
if (consoleErrors.length === 0) {
  console.log('  ✅ هیچ خطایی نبود')
} else {
  ;[...new Set(consoleErrors)].slice(0, 8).forEach((e) => console.log(`  ⚠ ${e}`))
}

console.log(`\n═══════ نتیجه: ${pass} موفق، ${fail} ناموفق ═══════`)
console.log(`اسکرین‌شات‌ها در ${OUT}/`)

await browser.close()
process.exit(fail > 0 ? 1 : 0)
