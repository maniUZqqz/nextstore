/**
 * تست API علاقه‌مندی‌ها
 * ---------------------------------------------------------------------------
 * ۱۵ بررسی روی: فهرست، افزودن، خودتوان بودن افزودن تکراری، حذف،
 * همگام‌سازی فهرست مهمان، اعتبارسنجی، محلی‌سازی پیام‌ها، و مهم‌تر
 * از همه جداسازی داده‌ی کاربران از هم (IDOR).
 *
 * پیش‌نیاز: بک‌اند در حال اجرا و دیتابیس سیدشده.
 *     php artisan serve --port=8001
 *     php artisan migrate --seed
 *
 * اجرا:
 *     node scripts/test-wishlist-api.mjs
 */

/* ⚠️ 127.0.0.1 و نه localhost — در ویندوز localhost اول به ::1 می‌رود. */
const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:8001/api/v1'

let pass = 0, fail = 0
const check = (label, ok, extra = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'} ${label}${extra ? '  -> ' + extra : ''}`)
  ok ? pass++ : fail++
}

/*
 * ورود با تلاش مجدد.
 * مسیر ورود throttle:auth دارد (۵ در دقیقه)؛ اجرای پشت‌سرهم چند
 * اسکریپت تست می‌تواند به سقف بخورد. بدون این حلقه، شکستِ تست
 * به کد نسبت داده می‌شود در حالی که فقط محدودیت نرخ بوده است.
 */
async function login(email) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, password: 'password' }),
    })
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 12000))
      continue
    }
    const body = await res.json()
    if (!res.ok) throw new Error(`login ${res.status}: ${JSON.stringify(body).slice(0, 200)}`)
    return body.data.token
  }
  throw new Error('login rate limited')
}

const call = (token, path, options = {}) =>
  fetch(`${API}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': 'fa',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

const json = async (res) => [res.status, await res.json()]

const customer = await login('user@demo.dev')
console.log('login ok\n')

/*
 * پاکسازی وضعیت اولیه.
 * تست باید بارها پشت‌سرهم قابل اجرا باشد؛ اگر از اجرای قبلی
 * ردیفی مانده باشد، شمارش‌ها یکی‌یکی جابه‌جا می‌شوند و تست
 * «شکست» می‌دهد بدون اینکه کد خراب باشد.
 */
{
  const [, body] = await json(await call(customer, '/wishlist'))
  for (const p of body.data ?? []) {
    await call(customer, `/wishlist/${p.id}`, { method: 'DELETE' })
  }
}

/* ============ 1. فهرست خالی ============ */
console.log('--- 1. empty list ---')
{
  const [status, body] = await json(await call(customer, '/wishlist'))
  check('status 200', status === 200, String(status))
  check('data is empty array', Array.isArray(body.data) && body.data.length === 0)
}

/* ============ 2. افزودن ============ */
console.log('\n--- 2. add ---')
{
  const [status, body] = await json(
    await call(customer, '/wishlist', { method: 'POST', body: JSON.stringify({ productId: 1 }) }),
  )
  check('status 200', status === 200, String(status))
  check('count = 1', body.data?.count === 1, `count=${body.data?.count}`)
  check('persian message', body.message === 'به علاقه‌مندی‌ها اضافه شد.', body.message)
}

/* ============ 3. افزودن تکراری خودتوان است ============ */
console.log('\n--- 3. duplicate add is idempotent ---')
{
  const [status, body] = await json(
    await call(customer, '/wishlist', { method: 'POST', body: JSON.stringify({ productId: 1 }) }),
  )
  check('status 200 not 500', status === 200, String(status))
  check('count still 1', body.data?.count === 1, `count=${body.data?.count}`)
}

/* ============ 4. محلی‌سازی پیام ============ */
console.log('\n--- 4. localization ---')
{
  const [, body] = await json(
    await call(customer, '/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId: 2 }),
      headers: { 'Accept-Language': 'en' },
    }),
  )
  check('english message', body.message === 'Added to your wishlist.', body.message)
}

/* ============ 5. شکل فهرست ============ */
console.log('\n--- 5. list shape ---')
{
  const [, body] = await json(await call(customer, '/wishlist'))
  const items = body.data ?? []
  check('two items', items.length === 2, `count=${items.length}`)
  check(
    'full product card',
    ['name', 'finalPrice', 'thumbnail', 'category'].every((k) => k in (items[0] ?? {})),
    Object.keys(items[0] ?? {}).slice(0, 6).join(','),
  )
  /* ترتیب باید بر اساس زمان پسندیدن باشد، نه زمان ساخت محصول */
  check('newest liked first', items[0]?.id === 2, `first id=${items[0]?.id}`)
}

/* ============ 6. اعتبارسنجی ============ */
console.log('\n--- 6. validation ---')
{
  const [status] = await json(
    await call(customer, '/wishlist', { method: 'POST', body: JSON.stringify({ productId: 999999 }) }),
  )
  check('nonexistent product -> 422', status === 422, String(status))

  const [missing] = await json(
    await call(customer, '/wishlist', { method: 'POST', body: JSON.stringify({}) }),
  )
  check('missing productId -> 422', missing === 422, String(missing))
}

/* ============ 7. حذف ============ */
console.log('\n--- 7. remove ---')
{
  const [status, body] = await json(await call(customer, '/wishlist/1', { method: 'DELETE' }))
  check('status 200', status === 200, String(status))
  check('count = 1', body.data?.count === 1, `count=${body.data?.count}`)
}

/* ============ 8. همگام‌سازی مهمان ============ */
console.log('\n--- 8. guest sync merges, never replaces ---')
{
  const [, body] = await json(
    await call(customer, '/wishlist/sync', {
      method: 'POST',
      body: JSON.stringify({ productIds: [3, 4, 999999] }),
    }),
  )
  const ids = (body.data ?? []).map((p) => p.id).sort((a, b) => a - b)
  /* محصول ۲ از قبل روی سرور بود و نباید پاک شده باشد */
  check('merges with server list', JSON.stringify(ids) === '[2,3,4]', `ids=${ids}`)
  check('drops invalid ids silently', !ids.includes(999999))
}

/* ============ 9. امنیت ============ */
console.log('\n--- 9. security ---')
{
  const [status] = await json(await call(null, '/wishlist'))
  check('no token -> 401', status === 401, String(status))

  const admin = await login('admin@demo.dev')
  const [, body] = await json(await call(admin, '/wishlist'))
  check('other user list is isolated', (body.data ?? []).length === 0, `count=${body.data?.length}`)
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
