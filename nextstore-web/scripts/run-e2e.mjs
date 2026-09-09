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

import { spawn } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

const DIR = 'scripts'

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
      /* خط پایانی هر سوئیت «N passed, M failed» است */
      const summary = output.trim().split('\n').filter(Boolean).pop() ?? ''

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
