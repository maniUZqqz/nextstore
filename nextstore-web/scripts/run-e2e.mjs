/**
 * اجرای پشت‌سرهم همه‌ی تست‌های سرتاسری
 * ---------------------------------------------------------------------------
 * تا پیش از این، ۲۲ سوئیت فقط با `node scripts/e2e-<اسم>.mjs` اجرا
 * می‌شدند و باید اسم هرکدام را حفظ می‌بودی. نتیجه‌ی عملی‌اش این بود که
 * کسی همه را اجرا نمی‌کرد و شکستِ سوئیت‌های کم‌استفاده هفته‌ها پنهان
 * می‌ماند.
 *
 * ⚠️ **سریال اجرا می‌شوند، نه موازی.**
 *
 *    این تست‌ها روی یک دیتابیس مشترک کار می‌کنند و داده می‌سازند و
 *    پاک می‌کنند. موازی‌سازی یعنی تستِ کوپن، محصولی را می‌خرد که تستِ
 *    ادمین همان لحظه حذفش کرده — شکستی که هر بار جای دیگری ظاهر
 *    می‌شود و بازتولیدش تقریباً ناممکن است.
 *
 * ⚠️ اجرا با اولین شکست **متوقف نمی‌شود**.
 *
 *    اگر متوقف می‌شد، هر بار فقط یک مشکل معلوم می‌شد و رفع ده مشکل،
 *    ده بار اجرای کامل می‌خواست. گزارش پایانی همه را کنار هم می‌گذارد.
 *
 * اجرا:
 *     pnpm test:e2e              همه
 *     pnpm test:e2e checkout     فقط آن‌هایی که «checkout» در نامشان است
 */

import { spawn, execSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

const DIR = 'scripts'

/**
 * فضای آزاد درایو، به مگابایت.
 *
 * ⚠️ چرا این بررسی در حلقه‌ی اجراست و نه فقط یک بار در ابتدا؟
 *
 *    کش بیلد نکست با هر صفحه‌ای که تست باز می‌کند بزرگ‌تر می‌شود. در
 *    یک اجرای واقعی، شروع با ۱.۶ گیگابایت آزاد بود و سوئیت چهاردهم
 *    درایو را کاملاً پر کرد.
 *
 *    وقتی دیسک پر می‌شود، هیچ خطای روشنی نمی‌آید: نکست نمی‌تواند کش
 *    بنویسد، صفحه‌ها هیدریشن نمی‌شوند، و **همه‌ی سوئیت‌های باقی‌مانده
 *    شکست می‌خورند** — شکستی که شبیه ده باگ به نظر می‌رسد در حالی که
 *    یک علت دارد.
 */
function freeSpaceMb() {
  try {
    const output = execSync(
      'powershell -NoProfile -Command "[math]::Round((Get-PSDrive C).Free/1MB)"',
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    )
    return Number.parseInt(output.trim(), 10)
  } catch {
    /* اگر نشد بخوانیم، جلوی اجرا را نمی‌گیریم */
    return Number.POSITIVE_INFINITY
  }
}

/** زیر این حد، اجرا متوقف می‌شود. */
const MIN_FREE_MB = 500


/** فیلتر اختیاری از خط فرمان. */
const filter = process.argv[2]

const suites = readdirSync(DIR)
  .filter((name) => name.startsWith('e2e-') && name.endsWith('.mjs'))
  .filter((name) => !filter || name.includes(filter))
  .sort()

if (suites.length === 0) {
  console.error(filter ? `هیچ سوئیتی با «${filter}» پیدا نشد.` : 'هیچ سوئیتی پیدا نشد.')
  process.exit(1)
}

/** اجرای یک سوئیت و برگرداندن نتیجه. */
function runSuite(name) {
  return new Promise((resolve) => {
    const started = Date.now()

    const child = spawn(process.execPath, [join(DIR, name)], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let output = ''
    child.stdout.on('data', (chunk) => { output += chunk })
    child.stderr.on('data', (chunk) => { output += chunk })

    child.on('close', (code) => {
      const lines = output.trim().split('\n').filter(Boolean)

      /*
       * خلاصه‌ی یک خطی هر سوئیت.
       *
       * ⚠️ آخرین خط همیشه «N passed, M failed» نیست.
       *
       *    وقتی سوئیت با استثنا می‌میرد، آخرین خط «Node.js v22.19.0»
       *    است — نسخه‌ی نود، که هیچ چیزی درباره‌ی علت نمی‌گوید. گزارش
       *    پایانی برای چند سوئیت شکسته، همان جمله را تکرار می‌کرد و
       *    آدم مجبور بود همه را تک‌تک دوباره اجرا کند تا بفهمد چه شده.
       *
       *    حالا اول دنبال خط خلاصه می‌گردیم و اگر نبود، پیام خطا را
       *    برمی‌داریم.
       */
      const summaryLine = [...lines].reverse().find((line) => /\d+ passed/.test(line))

      const errorLine = [...lines]
        .reverse()
        .find((line) => /^(\w*Error):/.test(line.trim()))

      const summary = summaryLine
        ?? (errorLine ? errorLine.trim().slice(0, 90) : lines.at(-1) ?? '')

      resolve({
        name,
        code,
        summary: summary.trim(),
        seconds: Math.round((Date.now() - started) / 1000),
        output,
      })
    })
  })
}

console.log(`اجرای ${suites.length} سوئیت — سریال، بدون توقف در اولین شکست\n`)

const results = []

for (const [index, name] of suites.entries()) {
  /*
   * ⚠️ بررسی فضا پیش از هر سوئیت، نه فقط یک بار.
   *
   *    توقف زودهنگام با یک پیام روشن، بهتر از ده سوئیتِ شکسته است که
   *    علتشان هیچ ربطی به کدشان ندارد.
   */
  const free = freeSpaceMb()

  if (free < MIN_FREE_MB) {
    console.log('')
    console.log(`✗ فضای دیسک تمام شد — فقط ${free} مگابایت آزاد است.`)
    console.log('  اجرا اینجا متوقف شد تا نتیجه‌ی گمراه‌کننده نسازد.')
    console.log('')
    console.log('  راه‌حل:')
    console.log('    powershell -ExecutionPolicy Bypass -File ..\scripts\clean-cache.ps1')
    console.log('')
    console.log(`  ${index} سوئیت اجرا شد، ${suites.length - index} سوئیت اجرا نشد.`)
    process.exit(1)
  }

  process.stdout.write(`[${index + 1}/${suites.length}] ${name.padEnd(26)} `)

  const result = await runSuite(name)
  results.push(result)

  const mark = result.code === 0 ? 'OK  ' : 'FAIL'
  console.log(`${mark} ${String(result.seconds).padStart(3)}s  ${result.summary}`)
}

/* ---------- گزارش پایانی ---------- */
const failed = results.filter((r) => r.code !== 0)

console.log('\n' + '─'.repeat(60))

if (failed.length === 0) {
  const total = results.reduce((sum, r) => sum + r.seconds, 0)
  console.log(`همه‌ی ${results.length} سوئیت پاس شد — ${total} ثانیه`)
  process.exit(0)
}

console.log(`${failed.length} سوئیت از ${results.length} شکست خورد:\n`)

for (const result of failed) {
  console.log(`── ${result.name} ──`)

  /*
   * ⚠️ فقط خطوط FAIL چاپ می‌شوند، نه کل خروجی.
   *
   *    خروجی کامل ۲۲ سوئیت هزاران خط است و خط FAIL در آن گم می‌شود —
   *    یعنی گزارشی که برای دیدن مشکل ساخته شده، خودش مشکل را پنهان
   *    می‌کند.
   */
  const lines = result.output.split('\n').filter((line) => /FAIL|Error:/.test(line))
  console.log(lines.length ? lines.join('\n') : result.output.slice(-600))
  console.log()
}

process.exit(1)
