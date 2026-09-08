/**
 * تست API مدیریت دسته‌بندی و برند
 * ---------------------------------------------------------------------------
 * بررسی‌ها: درخت دسته، CRUD هر دو، ساخت خودکار نامک، جلوگیری از
 * حلقه در درخت، رد شدن حذفِ دسته/برندِ دارای وابستگی، مرتب‌سازی
 * دسته‌ای، و دسترسی.
 *
 * ⚠️ روی داده‌ی *تازه‌ساخته* کار می‌کند و در پایان پاکش می‌کند.
 *    دسته‌ها و برندهای سیدر دست نمی‌خورند.
 *
 * اجرا:
 *     node scripts/test-taxonomy-api.mjs
 */

/* ⚠️ 127.0.0.1 و نه localhost — در ویندوز localhost اول به ::1 می‌رود. */
const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:8001/api/v1'

const STAMP = Date.now()

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
    if (!res.ok) throw new Error(`login ${res.status}`)
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

const admin = await login('admin@demo.dev')
const customer = await login('user@demo.dev')
console.log('login ok\n')

/** شناسه‌های ساخته‌شده — در پایان پاک می‌شوند. */
const created = { categories: [], brands: [] }

/* ============ 1. دسترسی ============ */
console.log('--- 1. access control ---')
{
  for (const path of ['/admin/categories', '/admin/brands']) {
    const [noToken] = await json(await call(null, path))
    check(`${path} without token -> 401`, noToken === 401, String(noToken))

    const [asCustomer] = await json(await call(customer, path))
    check(`${path} as customer -> 403`, asCustomer === 403, String(asCustomer))
  }
}

/* ============ 2. درخت دسته‌ها ============ */
console.log('\n--- 2. category tree ---')
{
  const [status, body] = await json(await call(admin, '/admin/categories'))
  check('status 200', status === 200, String(status))

  const roots = body.data ?? []
  check('only roots at top level', roots.every((c) => c.parentId === null), `count=${roots.length}`)
  check('children nested', roots.some((c) => (c.children ?? []).length > 0))
  check('counts present', typeof roots[0]?.productsCount === 'number' && typeof roots[0]?.childrenCount === 'number',
        `products=${roots[0]?.productsCount} children=${roots[0]?.childrenCount}`)
  check('raw translations returned', typeof roots[0]?.name === 'object' && roots[0].name.fa && roots[0].name.en,
        JSON.stringify(roots[0]?.name))
}

/* ============ 3. اعتبارسنجی ============ */
console.log('\n--- 3. validation ---')
{
  const [empty] = await json(await call(admin, '/admin/categories', { method: 'POST', body: JSON.stringify({}) }))
  check('empty payload -> 422', empty === 422, String(empty))

  const [oneLang, oneLangBody] = await json(
    await call(admin, '/admin/categories', {
      method: 'POST',
      body: JSON.stringify({ name: { fa: 'فقط فارسی' } }),
    }),
  )
  check('missing english -> 422', oneLang === 422, String(oneLang))
  check('persian error message', /انگلیسی/.test(JSON.stringify(oneLangBody.errors ?? {})),
        JSON.stringify(oneLangBody.errors?.['name.en'] ?? '').slice(0, 50))

  const [badSlug] = await json(
    await call(admin, '/admin/categories', {
      method: 'POST',
      body: JSON.stringify({ name: { fa: 'تست', en: 'Test' }, slug: 'Not Valid!' }),
    }),
  )
  check('invalid slug -> 422', badSlug === 422, String(badSlug))

  /* برند: آدرس غیر http رد شود — بردار XSS در صفحه‌ی عمومی */
  const [badUrl] = await json(
    await call(admin, '/admin/brands', {
      method: 'POST',
      body: JSON.stringify({ name: { fa: 'تست', en: 'Test' }, website: 'javascript:alert(1)' }),
    }),
  )
  check('javascript: url rejected -> 422', badUrl === 422, String(badUrl))
}

/* ============ 4. ساخت دسته ============ */
console.log('\n--- 4. create categories ---')
let parentId = null
let childId = null
{
  const [status, body] = await json(
    await call(admin, '/admin/categories', {
      method: 'POST',
      body: JSON.stringify({
        name: { fa: 'دسته والد تست', en: `Test Parent ${STAMP}` },
        description: { fa: 'توضیح فارسی', en: 'English description' },
        is_active: true,
      }),
    }),
  )
  parentId = body.data?.id
  created.categories.push(parentId)

  check('status 201', status === 201, String(status))
  check('slug generated from english', body.data?.slug === `test-parent-${STAMP}`, body.data?.slug)
  check('both languages stored', body.data?.name?.fa && body.data?.name?.en, JSON.stringify(body.data?.name))
  check('no parent by default', body.data?.parentId === null, String(body.data?.parentId))

  /* فرزند */
  const [childStatus, childBody] = await json(
    await call(admin, '/admin/categories', {
      method: 'POST',
      body: JSON.stringify({
        name: { fa: 'زیردسته تست', en: `Test Child ${STAMP}` },
        parent_id: parentId,
      }),
    }),
  )
  childId = childBody.data?.id
  created.categories.push(childId)

  check('child created', childStatus === 201, String(childStatus))
  check('parent linked', childBody.data?.parentId === parentId, String(childBody.data?.parentId))
}

/* ============ 5. جلوگیری از حلقه ============ */
console.log('\n--- 5. cycle prevention ---')
{
  /* الف) خودش والد خودش */
  const [self, selfBody] = await json(
    await call(admin, `/admin/categories/${parentId}`, {
      method: 'PUT',
      body: JSON.stringify({ name: { fa: 'دسته والد تست', en: `Test Parent ${STAMP}` }, parent_id: parentId }),
    }),
  )
  check('self as parent -> 422', self === 422, String(self))
  check('clear message', /خودش/.test(JSON.stringify(selfBody.errors ?? selfBody.message ?? '')),
        JSON.stringify(selfBody.errors?.parent_id ?? '').slice(0, 50))

  /*
   * ب) حلقه‌ی عمیق — والد را زیر فرزند خودش ببریم.
   * این حالتی است که قاعده‌ی ساده‌ی «خودش نباشد» نمی‌گیرد و اگر
   * رد نشود، هر دو دسته از درخت ناپدید می‌شوند.
   */
  const [deep, deepBody] = await json(
    await call(admin, `/admin/categories/${parentId}`, {
      method: 'PUT',
      body: JSON.stringify({ name: { fa: 'دسته والد تست', en: `Test Parent ${STAMP}` }, parent_id: childId }),
    }),
  )
  check('parent under its own child -> 422', deep === 422, String(deep))
  check('cycle message', /حلقه/.test(JSON.stringify(deepBody.errors ?? deepBody.message ?? '')),
        String(deepBody.message ?? '').slice(0, 60))

  /* درخت باید سالم مانده باشد */
  const [, tree] = await json(await call(admin, `/admin/categories/${parentId}`))
  check('parent still a root', tree.data?.parentId === null, String(tree.data?.parentId))
}

/* ============ 6. ویرایش ============ */
console.log('\n--- 6. update ---')
{
  const [status, body] = await json(
    await call(admin, `/admin/categories/${childId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: { fa: 'زیردسته ویرایش‌شده', en: `Test Child ${STAMP}` },
        parent_id: parentId,
        is_featured: true,
        sort_order: 42,
      }),
    }),
  )
  check('status 200', status === 200, String(status))
  check('name updated', body.data?.name?.fa === 'زیردسته ویرایش‌شده', body.data?.name?.fa)
  check('english untouched', body.data?.name?.en === `Test Child ${STAMP}`, body.data?.name?.en)
  check('featured set', body.data?.isFeatured === true, String(body.data?.isFeatured))
  check('sort order set', body.data?.sortOrder === 42, String(body.data?.sortOrder))
}

/* ============ 7. حذف محافظت‌شده ============ */
console.log('\n--- 7. protected delete ---')
{
  /* والد فرزند دارد → نباید حذف شود */
  const [hasChildren, childrenBody] = await json(
    await call(admin, `/admin/categories/${parentId}`, { method: 'DELETE' }),
  )
  check('category with children -> 409', hasChildren === 409, String(hasChildren))
  check('error code HAS_CHILDREN', childrenBody.error?.code === 'HAS_CHILDREN', childrenBody.error?.code)

  /* دسته‌ی سیدرشده که محصول دارد → نباید حذف شود */
  const [, tree] = await json(await call(admin, '/admin/categories'))
  const withProducts = (tree.data ?? [])
    .flatMap((c) => [c, ...(c.children ?? [])])
    .find((c) => c.productsCount > 0)

  if (withProducts) {
    const [hasProducts, productsBody] = await json(
      await call(admin, `/admin/categories/${withProducts.id}`, { method: 'DELETE' }),
    )
    check('category with products -> 409', hasProducts === 409, String(hasProducts))
    check('error code HAS_PRODUCTS', productsBody.error?.code === 'HAS_PRODUCTS', productsBody.error?.code)
    check('message includes the count', /\d/.test(productsBody.message ?? ''), productsBody.message)
  } else {
    check('a category with products exists to test against', false, 'none found')
  }
}

/* ============ 8. مرتب‌سازی دسته‌ای ============ */
console.log('\n--- 8. bulk reorder ---')
{
  const [status] = await json(
    await call(admin, '/admin/categories/reorder', {
      method: 'PATCH',
      body: JSON.stringify({
        items: [
          { id: parentId, sort_order: 7 },
          { id: childId, sort_order: 3 },
        ],
      }),
    }),
  )
  check('status 200', status === 200, String(status))

  const [, parent] = await json(await call(admin, `/admin/categories/${parentId}`))
  const [, child] = await json(await call(admin, `/admin/categories/${childId}`))
  check('parent order applied', parent.data?.sortOrder === 7, String(parent.data?.sortOrder))
  check('child order applied', child.data?.sortOrder === 3, String(child.data?.sortOrder))

  /* شناسه‌ی نامعتبر باید کل درخواست را رد کند */
  const [bad] = await json(
    await call(admin, '/admin/categories/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ items: [{ id: 999999, sort_order: 1 }] }),
    }),
  )
  check('unknown id -> 422', bad === 422, String(bad))
}

/* ============ 9. برندها ============ */
console.log('\n--- 9. brands ---')
let brandId = null
{
  const [status, body] = await json(
    await call(admin, '/admin/brands', {
      method: 'POST',
      body: JSON.stringify({
        name: { fa: 'برند تست', en: `Test Brand ${STAMP}` },
        website: 'https://example.com',
        country_code: 'ir',
      }),
    }),
  )
  brandId = body.data?.id
  created.brands.push(brandId)

  check('status 201', status === 201, String(status))
  check('slug generated', body.data?.slug === `test-brand-${STAMP}`, body.data?.slug)
  check('country code upper-cased', body.data?.countryCode === 'IR', body.data?.countryCode)
  check('website stored', body.data?.website === 'https://example.com', body.data?.website)

  /* فهرست و جستجو */
  const [, list] = await json(await call(admin, `/admin/brands?q=test-brand-${STAMP}`))
  check('search finds it', (list.data ?? []).some((b) => b.id === brandId), `count=${list.data?.length}`)

  /* برندی که محصول دارد نباید حذف شود */
  const [, all] = await json(await call(admin, '/admin/brands'))
  const withProducts = (all.data ?? []).find((b) => b.productsCount > 0)

  if (withProducts) {
    const [blocked, blockedBody] = await json(
      await call(admin, `/admin/brands/${withProducts.id}`, { method: 'DELETE' }),
    )
    check('brand with products -> 409', blocked === 409, String(blocked))
    check('error code HAS_PRODUCTS', blockedBody.error?.code === 'HAS_PRODUCTS', blockedBody.error?.code)
  } else {
    check('a brand with products exists to test against', false, 'none found')
  }
}

/* ============ 10. پاکسازی و حذف موفق ============ */
console.log('\n--- 10. cleanup deletes ---')
{
  /* فرزند اول، بعد والد — ترتیب مهم است */
  const [childDeleted] = await json(await call(admin, `/admin/categories/${childId}`, { method: 'DELETE' }))
  check('child deleted', childDeleted === 200, String(childDeleted))

  const [parentDeleted] = await json(await call(admin, `/admin/categories/${parentId}`, { method: 'DELETE' }))
  check('parent deleted once empty', parentDeleted === 200, String(parentDeleted))

  const [brandDeleted] = await json(await call(admin, `/admin/brands/${brandId}`, { method: 'DELETE' }))
  check('brand deleted', brandDeleted === 200, String(brandDeleted))

  const [gone] = await json(await call(admin, `/admin/categories/${parentId}`))
  check('gone from admin -> 404', gone === 404, String(gone))
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
