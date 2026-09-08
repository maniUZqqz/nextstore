/**
 * تست حلقه‌ی باطل‌سازی کش بین لاراول و نکست
 * ---------------------------------------------------------------------------
 * سناریوی واقعی باگ:
 *   ۱. صفحه‌ی فروشگاه را می‌بینیم (کش نکست پر می‌شود)
 *   ۲. ادمین محصولی را ویرایش می‌کند
 *   ۳. صفحه باید *بلافاصله* نام تازه را نشان دهد، نه بعد از ۵ دقیقه
 */

/*
 * آدرس‌ها و راز از متغیر محیطی خوانده می‌شوند.
 *
 * ⚠️ پیش‌فرض پورت ۳۱۰۰ است نه ۳۰۰۰: روی این سیستم پورت ۳۰۰۰ در
 *    IPv6 توسط پروژه‌ی دیگری اشغال است و «localhost» به آن می‌رسد.
 *
 * پیش‌نیاز: هر دو سرور بالا باشند و FRONTEND_URL لاراول به همین
 * آدرس نکست اشاره کند، وگرنه فراخوانی باطل‌سازی به جای درست نمی‌رود.
 */
const WEB = process.env.WEB_URL ?? 'http://127.0.0.1:3100'
const API = process.env.API_URL ?? 'http://127.0.0.1:8100/api/v1'
const SECRET = process.env.REVALIDATE_SECRET ?? 'dev-only-revalidate-secret-change-me'

let pass = 0, fail = 0
const check = (label, ok, extra = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'} ${label}${extra ? '  -> ' + extra : ''}`)
  if (ok) pass++
  else fail++
}

/* ============ ۱. امنیت مسیر باطل‌سازی ============ */
console.log('--- 1. revalidate endpoint security ---')
{
  const noSecret = await fetch(`${WEB}/api/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags: ['products'] }),
  })
  check('401 without secret', noSecret.status === 401, String(noSecret.status))

  const wrongSecret = await fetch(`${WEB}/api/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Revalidate-Secret': 'wrong' },
    body: JSON.stringify({ tags: ['products'] }),
  })
  check('401 with wrong secret', wrongSecret.status === 401, String(wrongSecret.status))

  const badTag = await fetch(`${WEB}/api/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Revalidate-Secret': SECRET },
    body: JSON.stringify({ tags: ['brnads'] }),
  })
  check('422 on unknown tag (typo caught)', badTag.status === 422, String(badTag.status))

  const empty = await fetch(`${WEB}/api/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Revalidate-Secret': SECRET },
    body: JSON.stringify({ tags: [] }),
  })
  check('422 on empty tags', empty.status === 422, String(empty.status))

  const ok = await fetch(`${WEB}/api/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Revalidate-Secret': SECRET },
    body: JSON.stringify({ tags: ['products', 'home'] }),
  })
  const okBody = await ok.json()
  check('200 with valid secret + tags', ok.status === 200, JSON.stringify(okBody.revalidated))
}

/* ============ ۲. حلقه‌ی واقعی: ویرایش ادمین → صفحه تازه ============ */
console.log('\n--- 2. admin edit invalidates the shop page ---')
{
  /* ورود ادمین */
  let token = null
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: 'admin@demo.dev', password: 'password' }),
    })
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 12000))
      continue
    }
    token = (await res.json()).data.token
    break
  }

  if (!token) {
    check('admin login', false, 'rate limited')
  } else {
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': 'fa',
      Authorization: `Bearer ${token}`,
    }

    /* یک محصول منتشرشده برمی‌داریم */
    const list = await (
      await fetch(`${API}/admin/products?status=active&per_page=1`, { headers })
    ).json()
    const slug = list.data[0].slug

    const detail = await (await fetch(`${API}/admin/products/${slug}`, { headers })).json()
    const original = detail.data

    /* صفحه‌ی محصول را می‌بینیم تا کش نکست پر شود */
    const before = await (await fetch(`${WEB}/fa/products/${slug}`)).text()
    check('product page renders', before.includes(original.name.fa), original.name.fa)

    /* ادمین نام را عوض می‌کند */
    const marker = `تست کش ${Date.now().toString().slice(-5)}`
    const payload = {
      name: { fa: marker, en: original.name.en },
      short_description: original.shortDescription,
      description: original.description,
      category_id: original.categoryId,
      brand_id: original.brandId,
      price: original.price,
      sale_price: original.salePrice,
      cost_price: original.costPrice,
      stock: original.stock,
      low_stock_threshold: original.lowStockThreshold,
      status: original.status,
      is_featured: original.isFeatured,
    }

    const updated = await fetch(`${API}/admin/products/${slug}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    })
    check('admin update succeeded', updated.status === 200, String(updated.status))

    /* کمی صبر تا فراخوانی باطل‌سازی برسد */
    await new Promise((r) => setTimeout(r, 2500))

    const after = await (await fetch(`${WEB}/fa/products/${slug}`)).text()
    check('⚠ shop page shows the NEW name immediately', after.includes(marker), marker)
    check('old name gone', !after.includes(original.name.fa))

    /* بازگرداندن نام اصلی تا داده‌ی نمونه دست‌نخورده بماند */
    await fetch(`${API}/admin/products/${slug}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ ...payload, name: original.name }),
    })
    console.log(`  (نام اصلی «${original.name.fa}» بازگردانده شد)`)
  }
}

console.log(`\n===== ${pass} passed, ${fail} failed =====`)
process.exit(fail > 0 ? 1 : 0)
