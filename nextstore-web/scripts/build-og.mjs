/**
 * ساخت تصویر پیش‌نمایش شبکه‌های اجتماعی (Open Graph)
 * ---------------------------------------------------------------------------
 * ⚠️ مشکلی که این اسکریپت حل می‌کند:
 *
 *    متادیتای سایت `twitter.card = 'summary_large_image'` اعلام می‌کرد،
 *    یعنی به شبکه‌های اجتماعی **وعده‌ی یک تصویر بزرگ** می‌داد — ولی
 *    هیچ تصویری نمی‌داد. نتیجه‌اش کارت خالی بود: عنوان و توضیح روی یک
 *    مستطیل خاکستری. صفحه‌ی محصول عکس داشت، بقیه‌ی سایت نه.
 *
 * ⚠️ چرا Playwright و نه `ImageResponse` نکست؟
 *
 *    موتور Satori (پشت `ImageResponse`) فونت **WOFF2 نمی‌خواند** و
 *    فونت‌های این پروژه همه woff2 هستند. بدون فونت فارسی، متن به
 *    مربع‌های خالی تبدیل می‌شد.
 *
 *    مرورگر واقعی woff2 را می‌خواند. و چون خروجی یک فایل ثابت است،
 *    هیچ هزینه‌ای در زمان اجرا ندارد — برخلاف تولید در هر درخواست.
 *
 * ⚠️ خروجی در `public/` می‌نشیند و **به مخزن سپرده می‌شود**.
 *
 *    اگر در زمان بیلد ساخته می‌شد، CI به مرورگر نیاز داشت (چند صد
 *    مگابایت دانلود) برای دو فایل که ماه‌ها عوض نمی‌شوند.
 *
 * اجرا (فقط وقتی طراحی یا نام سایت عوض شد):
 *     node scripts/build-og.mjs
 */

import { chromium } from 'playwright-core'
import { existsSync, readdirSync, readFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const OUT = 'public'

/** ۱۲۰۰×۶۳۰ — اندازه‌ای که فیسبوک، لینکدین، تلگرام و ایکس هر چهار انتظار دارند. */
const WIDTH = 1200
const HEIGHT = 630

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

/**
 * فونت به‌صورت data: تعبیه می‌شود.
 *
 * ⚠️ مسیر نسبی (`/fonts/...`) کار نمی‌کند: صفحه با `setContent` بدون
 *    سرور بارگذاری می‌شود و هیچ ریشه‌ای برای مسیر نسبی وجود ندارد.
 *    نتیجه‌اش فونت پیش‌فرض بود و متن فارسی بی‌ریخت.
 */
function embeddedFont(file) {
  const buffer = readFileSync(join('public/fonts', file))
  return `data:font/woff2;base64,${buffer.toString('base64')}`
}

const fontBold = embeddedFont('Vazirmatn-Bold.woff2')
const fontRegular = embeddedFont('Vazirmatn-Regular.woff2')

/** متن هر زبان — همان چیزی که در `messages/*.json` است. */
const CONTENT = {
  fa: {
    dir: 'rtl',
    name: 'نکست‌استور',
    tagline: 'فروشگاه اینترنتی مدرن',
    description: 'سریع، دوزبانه و کاملاً ریسپانسیو',
    badges: ['ارسال رایگان', 'گارانتی اصالت', 'پشتیبانی ۲۴ ساعته'],
  },
  en: {
    dir: 'ltr',
    name: 'NextStore',
    tagline: 'Modern e-commerce',
    description: 'Fast, bilingual and fully responsive',
    badges: ['Free shipping', 'Authenticity guarantee', '24/7 support'],
  },
}

/**
 * قالب کارت.
 *
 * ⚠️ رنگ‌ها از توکن‌های `globals.css` گرفته شده‌اند ولی به‌صورت مقدار
 *    ثابت نوشته می‌شوند: این صفحه بیرون از برنامه رندر می‌شود و به
 *    شیوه‌نامه‌ی پروژه دسترسی ندارد. اگر روزی رنگ اصلی عوض شد، این
 *    فایل هم باید به‌روز شود — به همین دلیل کنار هر رنگ نامش آمده.
 */
function template({ dir, name, tagline, description, badges }) {
  return `
<!doctype html>
<html dir="${dir}">
<head>
<meta charset="utf-8">
<style>
  @font-face {
    font-family: 'Vazirmatn';
    src: url('${fontBold}') format('woff2');
    font-weight: 700;
  }
  @font-face {
    font-family: 'Vazirmatn';
    src: url('${fontRegular}') format('woff2');
    font-weight: 400;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body { width: ${WIDTH}px; height: ${HEIGHT}px; }

  /*
    ⚠️ کارت یک ظرف مستقل است، نه خود body.

       نسخه‌ی اول همه‌چیز را روی body گذاشت با overflow:hidden. در
       CSS، سرریزِ body به viewport تسری پیدا می‌کند و خودِ body چیزی
       را نمی‌بُرد — پس دایره‌های تزئینی که با مقدار منفی بیرون
       نشسته‌اند، ناحیه‌ی پیمایش را بزرگ می‌کردند و در حالت راست‌به‌چپ
       کل محتوا را از لبه بیرون می‌انداختند. نشان و نام از کادر
       می‌زدند بیرون.
  */
  .card {
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    font-family: 'Vazirmatn', sans-serif;
    /* --background سفید، با گرادیان ملایم از --accent */
    background: linear-gradient(135deg, #eef0fd 0%, #ffffff 55%, #f7f8ff 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 90px;
    position: relative;
    overflow: hidden;
    color: #2b2d36;              /* --foreground */
  }

  /*
    دو دایره‌ی نرم پس‌زمینه — همان زبان بصری اسلایدر صفحه‌ی اصلی.
    بدون آن‌ها کارت یک مستطیل تخت است.
  */
  .glow { position: absolute; border-radius: 50%; filter: blur(70px); }
  .glow-a { width: 460px; height: 460px; background: rgba(88,86,214,0.28); top: -160px; inset-inline-end: -110px; }
  .glow-b { width: 320px; height: 320px; background: rgba(88,86,214,0.14); bottom: -130px; inset-inline-start: -80px; }

  .brand { display: flex; align-items: center; gap: 22px; margin-bottom: 34px; }

  .mark {
    width: 92px; height: 92px;
    border-radius: 26px;
    background: #5856d6;         /* --primary */
    color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 54px; font-weight: 700;
    /* حرف N همیشه لاتین است، پس جهتش مستقل از زبان صفحه ثابت می‌ماند */
    direction: ltr;
  }

  .name { font-size: 62px; font-weight: 700; line-height: 1.1; }

  .tagline { font-size: 40px; font-weight: 700; color: #5856d6; margin-bottom: 16px; }
  .description { font-size: 30px; font-weight: 400; color: #6b6d78; }  /* --muted-foreground */

  .badges { display: flex; gap: 14px; margin-top: 46px; }
  .badge {
    font-size: 22px;
    padding: 12px 26px;
    border-radius: 999px;
    background: rgba(255,255,255,0.82);
    border: 1px solid rgba(88,86,214,0.22);
    color: #4a4c58;
  }

  /* نوار باریک پایین — امضای بصری، مثل نوار تأکید صفحه‌ها */
  .stripe {
    position: absolute; inset-inline: 0; bottom: 0; height: 12px;
    background: linear-gradient(90deg, #5856d6, #7b79e8, #5856d6);
  }
</style>
</head>
<body>
  <div class="card">
    <span class="glow glow-a"></span>
    <span class="glow glow-b"></span>

    <div class="brand">
      <span class="mark">N</span>
      <span class="name">${name}</span>
    </div>

    <p class="tagline">${tagline}</p>
    <p class="description">${description}</p>

    <div class="badges">
      ${badges.map((b) => `<span class="badge">${b}</span>`).join('')}
    </div>

    <span class="stripe"></span>
  </div>
</body>
</html>`
}

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ executablePath: findChromium() })
const page = await browser.newPage({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 1,
})

for (const [locale, content] of Object.entries(CONTENT)) {
  await page.setContent(template(content), { waitUntil: 'load' })

  /* فونت تعبیه‌شده هم باید آماده شود، وگرنه گاهی با فونت پیش‌فرض عکس گرفته می‌شود */
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(300)

  const path = join(OUT, `og-${locale}.png`)
  await page.screenshot({ path, type: 'png' })
  console.log(`  ✓ ${path}`)
}

await browser.close()
