/**
 * تست API مجله — عمومی و پنل مدیریت
 * ---------------------------------------------------------------------------
 * بررسی‌ها روی: فهرست و جزئیات عمومی، فیلتر دسته و جستجو، CRUD پنل،
 * ساخت خودکار نامک، وضعیت انتشار (پیش‌نویس/زمان‌بندی/منتشر)، برگشت
 * هر دو زبان در فرم ویرایش، و اینکه پیش‌نویس به مسیر عمومی نشت نکند.
 *
 * پیش‌نیاز: بک‌اند در حال اجرا و دیتابیس سیدشده.
 *
 * اجرا:
 *     node scripts/test-blog-api.mjs
 */

/* ⚠️ 127.0.0.1 و نه localhost — در ویندوز localhost اول به ::1 می‌رود. */
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

/* پاکسازی بازمانده‌های اجرای قبلی */
{
  const [, body] = await json(await call(admin, '/admin/posts?per_page=100'))
  for (const p of body.data ?? []) {
    if (p.slug.startsWith('test-')) {
      await call(admin, `/admin/posts/${p.id}`, { method: 'DELETE' })
    }
  }
}

/* ============ 1. فهرست عمومی ============ */
console.log('--- 1. public list ---')
{
  const [status, body] = await json(await call(null, '/posts?per_page=5'))
  check('status 200', status === 200, String(status))
  check('has posts', (body.data ?? []).length > 0, `count=${body.data?.length}`)
  check('pagination meta', typeof body.meta?.total === 'number', String(body.meta?.total))

  const post = body.data?.[0]
  check('title resolved to one language', typeof post?.title === 'string', typeof post?.title)
  check('cover image is absolute url', /^https?:\/\//.test(post?.coverImage ?? ''), post?.coverImage)
  check('category attached', Boolean(post?.category?.slug), post?.category?.slug)
  check('body not in list payload', !('body' in (post ?? {})))
}

/* ============ 2. جزئیات عمومی ============ */
console.log('\n--- 2. public detail ---')
{
  const [, list] = await json(await call(null, '/posts?per_page=1'))
  const slug = list.data[0].slug

  const [status, body] = await json(await call(null, `/posts/${slug}`))
  check('status 200', status === 200, String(status))
  check('body present', typeof body.data?.body === 'string' && body.data.body.length > 50)
  check('body is html', /<h2>|<p>/.test(body.data?.body ?? ''))

  const [missing] = await json(await call(null, '/posts/no-such-post-here'))
  check('unknown slug -> 404', missing === 404, String(missing))
}

/* ============ 3. فیلتر و جستجو ============ */
console.log('\n--- 3. filter and search ---')
{
  const [, cats] = await json(await call(null, '/post-categories'))
  check('categories listed', (cats.data ?? []).length === 5, `count=${cats.data?.length}`)

  const slug = cats.data[0].slug
  const [, filtered] = await json(await call(null, `/posts?category=${slug}`))
  check(
    'category filter works',
    (filtered.data ?? []).every((p) => p.category?.slug === slug),
    `count=${filtered.data?.length}`,
  )

  const [, searched] = await json(await call(null, '/posts?q=phone'))
  check('cross-language search finds a post', (searched.data ?? []).length > 0, `count=${searched.data?.length}`)
}

/* ============ 4. دسترسی پنل ============ */
console.log('\n--- 4. admin access ---')
{
  const [noToken] = await json(await call(null, '/admin/posts'))
  check('no token -> 401', noToken === 401, String(noToken))

  const [asCustomer] = await json(await call(customer, '/admin/posts'))
  check('customer -> 403', asCustomer === 403, String(asCustomer))

  const [status, body] = await json(await call(admin, '/admin/posts'))
  check('admin -> 200', status === 200, String(status))
  check('counts block present', typeof body.counts?.all === 'number', JSON.stringify(body.counts))
  check('pagination meta intact', typeof body.meta?.total === 'number', String(body.meta?.total))
}

/* ============ 5. اعتبارسنجی ============ */
console.log('\n--- 5. validation ---')
{
  const [empty] = await json(await call(admin, '/admin/posts', { method: 'POST', body: JSON.stringify({}) }))
  check('empty payload -> 422', empty === 422, String(empty))

  const [oneLang, oneLangBody] = await json(
    await call(admin, '/admin/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: { fa: 'فقط فارسی' },
        body: { fa: 'متن فارسی به اندازه کافی طولانی برای عبور از قاعده حداقل' },
        post_category_id: 1,
      }),
    }),
  )
  check('missing english -> 422', oneLang === 422, String(oneLang))
  check(
    'persian error message',
    /انگلیسی/.test(JSON.stringify(oneLangBody.errors ?? {})),
    JSON.stringify(oneLangBody.errors?.['title.en'] ?? '').slice(0, 60),
  )

  const [badSlug] = await json(
    await call(admin, '/admin/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: { fa: 'عنوان', en: 'Title' },
        body: { fa: 'متن فارسی به اندازه کافی طولانی', en: 'English body long enough to pass' },
        post_category_id: 1,
        slug: 'Not A Valid Slug!',
      }),
    }),
  )
  check('invalid slug -> 422', badSlug === 422, String(badSlug))
}

/* ============ 6. ساخت ============ */
console.log('\n--- 6. create ---')
let createdId = null
{
  const [status, body] = await json(
    await call(admin, '/admin/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: { fa: 'مقاله آزمایشی', en: 'Test Post From Suite' },
        excerpt: { fa: 'خلاصه فارسی', en: 'English excerpt' },
        body: {
          fa: '<p>متن فارسی مقاله آزمایشی که به اندازه کافی طولانی است تا از قاعده عبور کند.</p>',
          en: '<p>English body of the test post, long enough to pass the minimum length rule.</p>',
        },
        post_category_id: 1,
        author_name: 'تست خودکار',
      }),
    }),
  )
  createdId = body.data?.id

  check('status 201', status === 201, String(status))
  check('slug generated from english title', body.data?.slug === 'test-post-from-suite', body.data?.slug)
  check('reading minutes computed', body.data?.readingMinutes >= 1, String(body.data?.readingMinutes))
  check('starts as draft', body.data?.status === 'draft', body.data?.status)
  check('both languages returned raw', typeof body.data?.title === 'object' && body.data.title.fa && body.data.title.en,
        JSON.stringify(body.data?.title))
}

/* ============ 7. پیش‌نویس عمومی نیست ============ */
console.log('\n--- 7. draft is not public ---')
{
  const [status] = await json(await call(null, '/posts/test-post-from-suite'))
  check('draft detail -> 404 for public', status === 404, String(status))

  const [, list] = await json(await call(null, '/posts?per_page=100'))
  check('draft absent from public list', !(list.data ?? []).some((p) => p.slug === 'test-post-from-suite'))
}

/* ============ 8. ویرایش ============ */
console.log('\n--- 8. update ---')
{
  const [status, body] = await json(
    await call(admin, `/admin/posts/${createdId}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: { fa: 'مقاله آزمایشی ویرایش‌شده', en: 'Test Post From Suite' },
        body: {
          fa: '<p>متن فارسی ویرایش‌شده که همچنان به اندازه کافی طولانی است.</p>',
          en: '<p>Updated English body, still long enough to pass validation.</p>',
        },
        post_category_id: 2,
        slug: 'test-post-from-suite',
        is_featured: true,
      }),
    }),
  )
  check('status 200', status === 200, String(status))
  check('title updated', body.data?.title?.fa === 'مقاله آزمایشی ویرایش‌شده', body.data?.title?.fa)
  check('category changed', body.data?.postCategoryId === 2, String(body.data?.postCategoryId))
  check('featured flag set', body.data?.isFeatured === true, String(body.data?.isFeatured))
  check('same slug accepted on update', body.data?.slug === 'test-post-from-suite', body.data?.slug)
}

/* ============ 9. انتشار ============ */
console.log('\n--- 9. publish toggle ---')
{
  const [status, body] = await json(
    await call(admin, `/admin/posts/${createdId}/publish`, {
      method: 'PATCH',
      body: JSON.stringify({ published: true }),
    }),
  )
  check('status 200', status === 200, String(status))
  check('now published', body.data?.status === 'published', body.data?.status)

  const [pub] = await json(await call(null, '/posts/test-post-from-suite'))
  check('visible publicly after publishing', pub === 200, String(pub))

  const [, back] = await json(
    await call(admin, `/admin/posts/${createdId}/publish`, {
      method: 'PATCH',
      body: JSON.stringify({ published: false }),
    }),
  )
  check('back to draft', back.data?.status === 'draft', back.data?.status)

  const [hidden] = await json(await call(null, '/posts/test-post-from-suite'))
  check('hidden publicly again', hidden === 404, String(hidden))
}

/* ============ 10. فیلتر وضعیت در پنل ============ */
console.log('\n--- 10. admin status filter ---')
{
  const [, drafts] = await json(await call(admin, '/admin/posts?status=draft&per_page=100'))
  check('draft filter includes our post', (drafts.data ?? []).some((p) => p.id === createdId))

  const [, published] = await json(await call(admin, '/admin/posts?status=published&per_page=100'))
  check('published filter excludes it', !(published.data ?? []).some((p) => p.id === createdId))

  const [, searched] = await json(await call(admin, '/admin/posts?q=test-post-from-suite'))
  check('admin search finds it', (searched.data ?? []).some((p) => p.id === createdId), `count=${searched.data?.length}`)
}

/* ============ 11. حذف ============ */
console.log('\n--- 11. delete ---')
{
  const [status] = await json(await call(admin, `/admin/posts/${createdId}`, { method: 'DELETE' }))
  check('status 200', status === 200, String(status))

  const [gone] = await json(await call(admin, `/admin/posts/${createdId}`))
  check('gone from admin -> 404', gone === 404, String(gone))
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
