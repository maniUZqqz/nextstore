/**
 * تست API پنل مدیریت — سفارش‌ها و محصولات
 * ---------------------------------------------------------------------------
 * ۶۸ بررسی روی: فهرست و فیلتر سفارش‌ها، جزئیات، قواعد انتقال وضعیت،
 * فهرست و CRUD محصولات، اعتبارسنجی، و مهم‌تر از همه اینکه فیلدهای
 * محرمانه‌ی ادمین (قیمت تمام‌شده، حاشیه سود، وضعیت انتشار) به
 * خروجی عمومی فروشگاه نشت نکنند.
 *
 * پیش‌نیاز: بک‌اند در حال اجرا و دیتابیس سیدشده.
 *     php artisan serve --port=8001
 *     php artisan migrate:fresh --seed
 *
 * اجرا:
 *     node scripts/test-admin-api.mjs
 */

/*
 * آدرس API از متغیر محیطی خوانده می‌شود تا با تغییر پورت نشکند.
 *
 * ⚠️ چرا 127.0.0.1 و نه localhost؟ در ویندوز، localhost ابتدا به
 *    ::1 (IPv6) ترجمه می‌شود. اگر برنامه‌ی دیگری روی همان پورت
 *    IPv6 گوش بدهد، تست بی‌صدا به سرور اشتباه وصل می‌شود و
 *    شکست‌هایی می‌دهد که هیچ ربطی به کد ندارند.
 */
const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:8001/api/v1'

let pass = 0, fail = 0
const check = (label, ok, extra = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'} ${label}${extra ? '  -> ' + extra : ''}`)
  ok ? pass++ : fail++
}

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
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

const PERSIAN = /[؀-ۿ]/

const admin = await login('admin@demo.dev')
console.log('login ok\n')

/* ============ 1. ORDERS LIST ============ */
console.log('--- 1. admin orders list ---')
{
  const res = await call(admin, '/admin/orders?per_page=5')
  const body = await res.json()
  check('status 200', res.status === 200, String(res.status))
  check('has meta', Boolean(body.meta), `total=${body.meta?.total}`)

  const first = body.data?.[0]
  check('has rows', Boolean(first))
  if (first) {
    check('customer object present', typeof first.customer === 'object')
    check('customer.name from snapshot', typeof first.customer.name === 'string', first.customer.name)
    check('customer.city present', 'city' in first.customer)
    check('adminNote key present', 'adminNote' in first)
    check('shippingMethod present', typeof first.shippingMethod === 'string')
    check('no paymentMethod ghost field', !('paymentMethod' in first))
    check('statusLabel localized (fa)', PERSIAN.test(first.statusLabel), first.statusLabel)
  }
}

/* ============ 2. ORDER FILTERS ============ */
console.log('\n--- 2. filters + search ---')
{
  const res = await call(admin, '/admin/orders?status=paid')
  const body = await res.json()
  check('status filter 200', res.status === 200)
  check('all rows are paid', body.data.every((o) => o.status === 'paid'), `${body.data.length} rows`)

  const all = await (await call(admin, '/admin/orders?per_page=1')).json()
  const number = all.data[0]?.orderNumber
  const search = await (await call(admin, `/admin/orders?q=${encodeURIComponent(number)}`)).json()
  check('search by order number', search.data.some((o) => o.orderNumber === number), number)

  const detail = await (await call(admin, `/admin/orders/${number}`)).json()
  const name = detail.data?.shippingAddress?.recipientName
  if (name) {
    const byName = await (await call(admin, `/admin/orders?q=${encodeURIComponent(name)}`)).json()
    check('search by persian recipient name', byName.data.length > 0, `${name} -> ${byName.data.length}`)
  }
}

/* ============ 3. ORDER DETAIL ============ */
console.log('\n--- 3. order detail ---')
let pendingOrder = null
{
  /*
   * ⚠️ وابستگی به وضعیت خاص حذف شد.
   *    این تست خودش وضعیت سفارش را جلو می‌برد و انتقال یک‌طرفه
   *    است. نسخه‌ی قبلی دنبال سفارش «paid» می‌گشت؛ پس از چند اجرا
   *    هیچ سفارش paid باقی نمی‌ماند، بخش «تغییر وضعیت» بی‌صدا
   *    رد می‌شد و مجموع تست‌ها از ۷۳ به ۶۸ می‌افتاد — بدون آنکه
   *    چیزی قرمز شود. یعنی پوشش تست کم می‌شد و کسی نمی‌فهمید.
   */
  const TERMINAL = ['delivered', 'cancelled', 'refunded']
  const list = await (await call(admin, '/admin/orders?per_page=50')).json()
  const target = list.data.find((o) => !TERMINAL.includes(o.status)) ?? list.data[0]

  const res = await call(admin, `/admin/orders/${target.orderNumber}`)
  const body = await res.json()
  const order = body.data

  check('status 200', res.status === 200)
  check('items array', Array.isArray(order.items) && order.items.length > 0, `${order.items?.length} items`)
  check('shippingAddress snapshot', typeof order.shippingAddress?.recipientName === 'string')
  check('customer.userId present', 'userId' in order.customer)
  check('customer.email present', 'email' in order.customer)
  check('adminNote key present', 'adminNote' in order)
  check('allowedTransitions is array', Array.isArray(order.allowedTransitions))
  check('transitions have label+color',
    order.allowedTransitions.every((tr) => tr.value && tr.label && tr.color),
    JSON.stringify(order.allowedTransitions.map((tr) => tr.value)))

  if (!TERMINAL.includes(order.status)) pendingOrder = order
}

/* ============ 4. STATUS TRANSITION RULES ============ */
console.log('\n--- 4. status transition ---')
if (pendingOrder) {
  /*
   * «pending» تقریباً از هیچ وضعیتی قابل بازگشت نیست، پس آزمون
   * انتقال غیرمجاز است — مگر خود سفارش pending باشد که در آن حالت
   * یک وضعیت غیرمجاز دیگر انتخاب می‌شود.
   */
  const illegal = pendingOrder.status === 'pending' ? 'delivered' : 'pending'
  const bad = await call(admin, `/admin/orders/${pendingOrder.orderNumber}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: illegal }),
  })
  check('illegal transition rejected', bad.status >= 400,
    `${pendingOrder.status} -> ${illegal} = ${bad.status}`)

  const target = pendingOrder.allowedTransitions[0]?.value
  if (target) {
    const good = await call(admin, `/admin/orders/${pendingOrder.orderNumber}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: target, admin_note: 'تست خودکار' }),
    })
    const body = await good.json()
    check('legal transition accepted', good.status === 200,
      `${pendingOrder.status} -> ${target}`)
    check('status actually changed', body.data?.status === target, body.data?.status)
    check('admin note saved', body.data?.adminNote === 'تست خودکار', body.data?.adminNote)
    check('allowedTransitions recomputed',
      Array.isArray(body.data?.allowedTransitions)
        && !body.data.allowedTransitions.some((tr) => tr.value === target))
  }
} else {
  /* رد شدن بی‌صدا ممنوع: نبودِ داده‌ی آزمون خودش یک شکست است */
  check('order available for transition test', false, 'هیچ سفارش غیرپایانی نیست')
}

/* ============ 5. PRODUCTS LIST ============ */
console.log('\n--- 5. admin products list ---')
{
  const res = await call(admin, '/admin/products?per_page=5')
  const body = await res.json()
  check('status 200', res.status === 200)
  const p = body.data?.[0]
  check('has rows', Boolean(p))
  if (p) {
    check('status field present', typeof p.status === 'string', p.status)
    check('statusLabel localized', PERSIAN.test(p.statusLabel), p.statusLabel)
    check('lowStockThreshold present', typeof p.lowStockThreshold === 'number')
    check('costPrice key present (admin only)', 'costPrice' in p)
    check('marginPercent computed or null',
      p.marginPercent === null || typeof p.marginPercent === 'number', String(p.marginPercent))
    check('inherits price fields', typeof p.finalPrice === 'number')
    check('inherits thumbnail', p.thumbnail === null || typeof p.thumbnail?.url === 'string')
  }
}

/* ============ 6. PUBLIC LIST MUST NOT LEAK ============ */
console.log('\n--- 6. public catalog leak check ---')
{
  const res = await fetch(`${API}/products?per_page=3`, { headers: { Accept: 'application/json' } })
  const body = await res.json()
  const p = body.data?.[0] ?? {}
  check('public list ok', res.status === 200)
  check('no costPrice in public', !('costPrice' in p))
  check('no status in public', !('status' in p))
  check('no marginPercent in public', !('marginPercent' in p))
}

/* ============ 7. PRODUCT FILTERS ============ */
console.log('\n--- 7. product filters ---')
{
  const draft = await (await call(admin, '/admin/products?status=draft')).json()
  check('draft filter', draft.data.every((p) => p.status === 'draft'), `${draft.data.length} rows`)

  const low = await (await call(admin, '/admin/products?low_stock=1')).json()
  check('low_stock filter', low.data.every((p) => p.stock <= p.lowStockThreshold), `${low.data.length} rows`)

  const term = encodeURIComponent('گوشی')
  const search = await (await call(admin, `/admin/products?q=${term}`)).json()
  check('persian search responds', Array.isArray(search.data), `${search.data?.length} rows`)
}

/* ============ 8. EDIT FORM PAYLOAD ============ */
console.log('\n--- 8. edit form payload ---')
{
  const list = await (await call(admin, '/admin/products?per_page=1')).json()
  const slug = list.data[0].slug

  const res = await call(admin, `/admin/products/${slug}`)
  const body = await res.json()
  const p = body.data

  check('status 200', res.status === 200)
  check('name is object not string', typeof p.name === 'object' && p.name !== null, JSON.stringify(p.name))
  check('name.fa non-empty', typeof p.name.fa === 'string' && p.name.fa.length > 0)
  check('name.en non-empty', typeof p.name.en === 'string' && p.name.en.length > 0)
  check('shortDescription both keys', 'fa' in p.shortDescription && 'en' in p.shortDescription)
  check('description never undefined',
    typeof p.description.fa === 'string' && typeof p.description.en === 'string')
  check('categoryId numeric or null', p.categoryId === null || typeof p.categoryId === 'number')
  check('status value valid', ['draft', 'active', 'archived'].includes(p.status), p.status)
  check('displayName is a string', typeof p.displayName === 'string', p.displayName)
}

/* ============ 9. PRODUCT CRUD ============ */
console.log('\n--- 9. product CRUD ---')
{
  const suffix = Date.now().toString().slice(-6)
  const payload = {
    name: { fa: `کالای آزمایشی ${suffix}`, en: `Test Product ${suffix}` },
    short_description: { fa: 'توضیح کوتاه', en: 'Short description' },
    description: { fa: 'توضیح کامل فارسی', en: 'Full english description' },
    price: 5000000,
    sale_price: 4500000,
    stock: 12,
    low_stock_threshold: 3,
    status: 'draft',
    is_featured: false,
  }

  const created = await call(admin, '/admin/products', { method: 'POST', body: JSON.stringify(payload) })
  const createdBody = await created.json()
  check('create 201', created.status === 201, String(created.status))

  const slug = createdBody.data?.slug
  check('slug from english name', typeof slug === 'string' && slug.includes('test-product'), slug)
  check('sku auto-generated', /^NS-\d{5}$/.test(createdBody.data?.sku ?? ''), createdBody.data?.sku)
  check('create returns raw translations', createdBody.data?.name?.fa === payload.name.fa)

  const invalid = await call(admin, '/admin/products', {
    method: 'POST',
    body: JSON.stringify({ ...payload, name: { fa: 'فقط فارسی' } }),
  })
  const invalidBody = await invalid.json()
  check('422 when english name missing', invalid.status === 422, String(invalid.status))
  check('field error keyed name.en', Boolean(invalidBody.errors?.['name.en']),
    JSON.stringify(Object.keys(invalidBody.errors ?? {})))

  const badPrice = await call(admin, '/admin/products', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      name: { fa: `دیگر ${suffix}`, en: `Other ${suffix}` },
      sale_price: 9000000,
    }),
  })
  check('422 when sale_price >= price', badPrice.status === 422, String(badPrice.status))

  const updated = await call(admin, `/admin/products/${slug}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...payload,
      name: { fa: 'نام تازه فارسی', en: payload.name.en },
      stock: 40,
    }),
  })
  const updatedBody = await updated.json()
  check('update 200', updated.status === 200, String(updated.status))
  check('persian name updated', updatedBody.data?.name?.fa === 'نام تازه فارسی')
  check('english name preserved', updatedBody.data?.name?.en === payload.name.en, updatedBody.data?.name?.en)
  check('slug unchanged (seo safe)', updatedBody.data?.slug === slug, updatedBody.data?.slug)
  check('stock updated', updatedBody.data?.stock === 40)

  const stockRes = await call(admin, `/admin/products/${slug}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ stock: 7 }),
  })
  const stockBody = await stockRes.json()
  check('quick stock 200', stockRes.status === 200)
  check('quick stock returns list shape',
    typeof stockBody.data?.status === 'string' && stockBody.data?.stock === 7)

  const badStock = await call(admin, `/admin/products/${slug}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ stock: -5 }),
  })
  check('negative stock rejected', badStock.status === 422, String(badStock.status))

  const removed = await call(admin, `/admin/products/${slug}`, { method: 'DELETE' })
  check('delete 200', removed.status === 200, String(removed.status))

  const gone = await call(admin, `/admin/products/${slug}`)
  check('deleted product 404s', gone.status === 404, String(gone.status))
}

/* ============ 10. AUTHORIZATION ============ */
console.log('\n--- 10. authorization ---')
{
  const user = await login('user@demo.dev')
  for (const path of ['/admin/orders', '/admin/products', '/admin/dashboard']) {
    const res = await call(user, path)
    check(`403 on ${path}`, res.status === 403, String(res.status))
  }
  const noToken = await fetch(`${API}/admin/products`, { headers: { Accept: 'application/json' } })
  check('401 without token', noToken.status === 401, String(noToken.status))
}

console.log(`\n===== ${pass} passed, ${fail} failed =====`)
process.exit(fail > 0 ? 1 : 0)
