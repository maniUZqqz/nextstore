/**
 * تست لینک‌های شکسته
 * ---------------------------------------------------------------------------
 * ⚠️ چرا این تست وجود دارد:
 *
 *    فوتر به ۹ صفحه لینک می‌داد که هیچ‌کدام ساخته نشده بودند. همه
 *    ۴۰۴ می‌دادند و چون فوتر در *هر* صفحه‌ی سایت است، این یعنی ۹
 *    بن‌بست روی تمام صفحات. هیچ تست دیگری این را نمی‌گرفت: تست‌های
 *    API درست بودند و صفحات موجود هم درست کار می‌کردند.
 *
 *    این اسکریپت لینک‌های داخلی را از HTML صفحه‌ی اصلی استخراج
 *    می‌کند و هرکدام را واقعاً باز می‌کند.
 *
 * اجرا: node scripts/test-links.mjs
 */

const BASE = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3100'

let pass = 0
let fail = 0
const broken = []

const check = (label, ok, extra = '') => {
  console.log(`  ${ok ? '✅' : '❌'} ${label}${extra ? '  → ' + extra : ''}`)
  if (ok) pass++
  else fail++
}

/**
 * استخراج مسیرهای داخلی از HTML.
 *
 * فقط href هایی که با /fa یا /en شروع می‌شوند؛ لینک خارجی و لنگر
 * (#) بررسی نمی‌شوند.
 */
function extractLinks(html) {
  const matches = html.matchAll(/href="(\/(?:fa|en)[^"#?]*)"/g)
  return [...new Set([...matches].map((m) => m[1]))]
}

for (const locale of ['fa', 'en']) {
  console.log(`\n═══════ لینک‌های داخلی صفحه‌ی /${locale} ═══════`)

  const html = await (await fetch(`${BASE}/${locale}`)).text()
  const links = extractLinks(html).sort()

  console.log(`  (${links.length} لینک یکتا پیدا شد)\n`)

  for (const link of links) {
    const response = await fetch(`${BASE}${link}`, { redirect: 'manual' })

    /*
     * ۳۰۷ برای مسیرهای نیازمند ورود درست است (proxy کاربر مهمان را
     * به صفحه‌ی ورود می‌فرستد) — پس شکست حساب نمی‌شود.
     */
    const ok = response.status === 200 || response.status === 307

    check(link, ok, String(response.status))
    if (!ok) broken.push(`${link} → ${response.status}`)
  }
}

console.log(`\n═══════ نتیجه: ${pass} سالم، ${fail} شکسته ═══════`)

if (broken.length > 0) {
  console.log('\nلینک‌های شکسته:')
  broken.forEach((entry) => console.log(`  ✗ ${entry}`))
}

process.exit(fail > 0 ? 1 : 0)
