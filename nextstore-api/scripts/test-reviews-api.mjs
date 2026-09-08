/**
 * تست API نظرات محصولات
 * ---------------------------------------------------------------------------
 * بررسی‌ها روی: ثبت نظر، اعتبارسنجی، قاعده‌ی «یک نظر برای هر محصول»،
 * تشخیص خرید تأییدشده، صف تعدیل، تأیید و رد، رأی «مفید بود»،
 * بازمحاسبه‌ی امتیاز محصول، و نشت‌نکردن نظر تأییدنشده به مسیر عمومی.
 *
 * پیش‌نیاز: بک‌اند در حال اجرا و دیتابیس سیدشده.
 *     php artisan serve --port=8001
 *     php artisan migrate --seed
 *
 * اجرا:
 *     node scripts/test-reviews-api.mjs
 */

/* ⚠️ 127.0.0.1 و نه localhost — در ویندوز localhost اول به ::1 می‌رود. */
const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:8001/api/v1'

let pass = 0, fail = 0
const check = (label, ok, extra = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'} ${label}${extra ? '  -> ' + extra : ''}`)
  ok ? pass++ : fail++
}

/* ورود با تلاش مجدد — مسیر ورود throttle:auth دارد (۵ در دقیقه). */
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

/*
 * محصول آزمایشی.
 *
 * sony-wh-1000xm5 (شناسه ۱۰) در یک سفارش «تحویل‌شده» کاربر
 * user@demo.dev هست، پس نظرش باید نشان «خرید تأییدشده» بگیرد.
 * iphone-15-pro-max در هیچ سفارش تحویل‌شده‌ی این کاربر نیست.
 */
const VERIFIED_SLUG = 'sony-wh-1000xm5'
const UNVERIFIED_SLUG = 'iphone-15-pro-max'

const customer = await login('user@demo.dev')
const admin = await login('admin@demo.dev')
console.log('login ok\n')

/*
 * وضعیت اولیه‌ی محصول آزمایشی.
 *
 * ⚠️ چرا مقدار مطلق ادعا نمی‌کنیم؟
 *    ReviewSeeder برای بیشتر محصولات نظر واقعی می‌سازد، پس این
 *    محصول از قبل امتیاز دارد. نسخه‌ی اول این تست فرض می‌کرد
 *    محصول پاک است و «میانگین باید ۵ باشد» را ادعا می‌کرد —
 *    تستی که فقط روی دیتابیس خالی سبز می‌شد.
 *
 *    حالا خط پایه گرفته می‌شود و *تغییر* نسبت به آن سنجیده
 *    می‌شود؛ این هم درست‌تر است و هم واقعاً منطق بازمحاسبه را
 *    آزمایش می‌کند، نه یک عدد ثابت را.
 *
 *    ⚠️ خط پایه *پس از* پاکسازی گرفته می‌شود، نه قبلش. اگر
 *    اجرای قبلی نظری جا گذاشته باشد، گرفتن خط پایه پیش از
 *    پاکسازی آن را در عدد مرجع حساب می‌کرد و همه‌ی ادعاهای
 *    «یکی زیاد شد» یکی جابه‌جا می‌شدند.
 */

/*
 * پاکسازی وضعیت اولیه: نظرات این کاربر روی دو محصول آزمایشی حذف
 * می‌شوند تا تست بارها پشت‌سرهم قابل اجرا باشد.
 */
{
  const [, body] = await json(await call(admin, '/admin/reviews?status=all&per_page=100'))
  for (const r of body.data ?? []) {
    if ([VERIFIED_SLUG, UNVERIFIED_SLUG].includes(r.product?.slug)) {
      await call(admin, `/admin/reviews/${r.id}`, { method: 'DELETE' })
    }
  }
}

const baseline = await (async () => {
  const [, body] = await json(await call(null, `/products/${VERIFIED_SLUG}`))
  return {
    ratingAvg: body.data?.ratingAvg ?? 0,
    reviewsCount: body.data?.reviewsCount ?? 0,
  }
})()
console.log(`baseline: ${VERIFIED_SLUG} = ${baseline.ratingAvg} / ${baseline.reviewsCount} reviews\n`)

/* ============ 1. اعتبارسنجی ============ */
console.log('--- 1. validation ---')
{
  const [noRating] = await json(
    await call(customer, `/products/${VERIFIED_SLUG}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ comment: 'یک متن به اندازه کافی طولانی برای عبور از قاعده' }),
    }),
  )
  check('missing rating -> 422', noRating === 422, String(noRating))

  const [badRating] = await json(
    await call(customer, `/products/${VERIFIED_SLUG}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating: 9 }),
    }),
  )
  check('rating > 5 -> 422', badRating === 422, String(badRating))

  const [shortComment, shortBody] = await json(
    await call(customer, `/products/${VERIFIED_SLUG}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating: 5, comment: 'خوب' }),
    }),
  )
  check('comment under 10 chars -> 422', shortComment === 422, String(shortComment))
  check(
    'persian validation message',
    /کاراکتر/.test(JSON.stringify(shortBody.errors ?? shortBody)),
    JSON.stringify(shortBody.errors?.comment ?? '').slice(0, 80),
  )

  const [noAuth] = await json(
    await call(null, `/products/${VERIFIED_SLUG}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating: 5 }),
    }),
  )
  check('no token -> 401', noAuth === 401, String(noAuth))
}

/* ============ 2. ثبت نظر با خرید تأییدشده ============ */
console.log('\n--- 2. create with verified purchase ---')
let verifiedReviewId = null
{
  const [status, body] = await json(
    await call(customer, `/products/${VERIFIED_SLUG}/reviews`, {
      method: 'POST',
      body: JSON.stringify({
        rating: 5,
        title: 'صدای فوق‌العاده',
        comment: 'نویزگیر این هدفون واقعاً کار می‌کند و باتری‌اش هم عالی است.',
        pros: ['نویزگیر قوی', 'باتری طولانی', '  '],
        cons: ['قیمت بالا'],
      }),
    }),
  )
  verifiedReviewId = body.data?.id

  check('status 201', status === 201, String(status))
  check('verified purchase flag', body.data?.isVerifiedPurchase === true, String(body.data?.isVerifiedPurchase))
  check('starts unapproved', body.data?.status === 'pending', body.data?.status)
  check('blank pros entry dropped', body.data?.pros?.length === 2, JSON.stringify(body.data?.pros))
  check('author name present', Boolean(body.data?.author?.name), body.data?.author?.name)
  check(
    'author email not leaked',
    !JSON.stringify(body.data ?? {}).includes('@demo.dev'),
  )
}

/* ============ 3. ثبت نظر بدون خرید تأییدشده ============ */
console.log('\n--- 3. create without verified purchase ---')
let unverifiedReviewId = null
{
  const [status, body] = await json(
    await call(customer, `/products/${UNVERIFIED_SLUG}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating: 3, comment: 'ظاهرش خوب است ولی هنوز امتحانش نکرده‌ام.' }),
    }),
  )
  unverifiedReviewId = body.data?.id
  check('status 201', status === 201, String(status))
  check('not marked as verified', body.data?.isVerifiedPurchase === false, String(body.data?.isVerifiedPurchase))
}

/* ============ 4. یک نظر برای هر محصول ============ */
console.log('\n--- 4. one review per product ---')
{
  const [status, body] = await json(
    await call(customer, `/products/${VERIFIED_SLUG}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating: 1, comment: 'تلاش دوم برای ثبت نظر تکراری روی همین محصول.' }),
    }),
  )
  check('duplicate -> 409 not 500', status === 409, String(status))
  check('error code ALREADY_REVIEWED', body.error?.code === 'ALREADY_REVIEWED', body.error?.code)
}

/* ============ 5. نظر تأییدنشده عمومی نیست ============ */
console.log('\n--- 5. unapproved review is not public ---')
{
  const [status, body] = await json(await call(null, `/products/${VERIFIED_SLUG}/reviews`))
  check('status 200', status === 200, String(status))
  check(
    'pending review hidden from public list',
    !(body.data ?? []).some((r) => r.id === verifiedReviewId),
    `count=${body.data?.length}`,
  )
  check('stats block present', typeof body.stats?.distribution === 'object')
  check('pagination meta intact', typeof body.meta?.total === 'number', String(body.meta?.total))
}

/* ============ 6. نظرات من ============ */
console.log('\n--- 6. my reviews ---')
{
  const [, body] = await json(await call(customer, '/reviews'))
  const mine = (body.data ?? []).filter((r) =>
    [verifiedReviewId, unverifiedReviewId].includes(r.id),
  )
  check('both reviews listed', mine.length === 2, `found=${mine.length}`)
  check('product info attached', Boolean(mine[0]?.product?.slug), mine[0]?.product?.slug)
}

/* ============ 7. صف تعدیل ============ */
console.log('\n--- 7. moderation queue ---')
{
  const [status, body] = await json(await call(admin, '/admin/reviews?status=pending&per_page=100'))
  check('status 200', status === 200, String(status))
  check(
    'new review in pending queue',
    (body.data ?? []).some((r) => r.id === verifiedReviewId),
  )
  check('counts block present', typeof body.counts?.pending === 'number', `pending=${body.counts?.pending}`)
  check('pagination meta intact', typeof body.meta?.total === 'number', String(body.meta?.total))

  const [forbidden] = await json(await call(customer, '/admin/reviews'))
  check('customer cannot moderate -> 403', forbidden === 403, String(forbidden))
}

/* ============ 8. تأیید و اثرش بر امتیاز محصول ============ */
console.log('\n--- 8. approve recalculates product rating ---')
{
  const [status, body] = await json(
    await call(admin, `/admin/reviews/${verifiedReviewId}/approve`, { method: 'PATCH' }),
  )
  check('status 200', status === 200, String(status))
  check('now approved', body.data?.status === 'approved', body.data?.status)

  const [, pub] = await json(await call(null, `/products/${VERIFIED_SLUG}/reviews?per_page=50`))
  check(
    'appears in public list',
    (pub.data ?? []).some((r) => r.id === verifiedReviewId),
  )
  check(
    'stats total grew by one',
    pub.stats?.total === baseline.reviewsCount + 1,
    `${pub.stats?.total} (baseline ${baseline.reviewsCount})`,
  )
  check(
    'stats distribution sums to total',
    Object.values(pub.stats?.distribution ?? {}).reduce((a, b) => a + b, 0) === pub.stats?.total,
    JSON.stringify(pub.stats?.distribution),
  )

  /* امتیاز روی خود محصول هم باید به‌روز شده باشد */
  const [, product] = await json(await call(null, `/products/${VERIFIED_SLUG}`))
  check(
    'product reviewsCount grew by one',
    product.data?.reviewsCount === baseline.reviewsCount + 1,
    `${product.data?.reviewsCount} (baseline ${baseline.reviewsCount})`,
  )
  /*
   * نظر تازه پنج‌ستاره است، پس میانگین باید بالا برود یا اگر
   * از قبل ۵ بوده، همان ۵ بماند — هرگز پایین‌تر.
   */
  check(
    'product ratingAvg moved toward 5',
    product.data?.ratingAvg >= baseline.ratingAvg,
    `${product.data?.ratingAvg} (baseline ${baseline.ratingAvg})`,
  )
  check(
    'product ratingAvg matches stats average',
    Math.abs(product.data?.ratingAvg - pub.stats?.average) < 0.01,
    `${product.data?.ratingAvg} vs ${pub.stats?.average}`,
  )
}

/* ============ 9. رأی «مفید بود» ============ */
console.log('\n--- 9. helpful votes ---')
{
  const [own, ownBody] = await json(
    await call(customer, `/reviews/${verifiedReviewId}/helpful`, { method: 'POST' }),
  )
  check('cannot vote on own review -> 422', own === 422, String(own))
  check('error code OWN_REVIEW', ownBody.error?.code === 'OWN_REVIEW', ownBody.error?.code)

  const [status, body] = await json(
    await call(admin, `/reviews/${verifiedReviewId}/helpful`, { method: 'POST' }),
  )
  check('vote recorded', status === 200 && body.data?.hasVoted === true, String(status))
  check('count = 1', body.data?.helpfulCount === 1, String(body.data?.helpfulCount))

  /*
   * ⚠️ خواندن دوباره از فهرست، نه اکتفا به پاسخِ همان درخواست.
   *
   *    نسخه‌ی اول این تست فقط پاسخ POST را می‌سنجید و سبز بود، در
   *    حالی که ستون helpful_count در دیتابیس هرگز نوشته نمی‌شد
   *    (بیرون از $fillable بود و update بی‌صدا ردش می‌کرد). عدد در
   *    پاسخ درست بود چون مستقیم از شمارش می‌آمد — و باگ تا تست
   *    مرورگر پنهان ماند.
   *
   *    هر تستِ «ذخیره شد» باید مقدار را از یک درخواست *جدا* بخواند.
   */
  const [, reread] = await json(
    await call(admin, `/products/${VERIFIED_SLUG}/reviews?per_page=50`),
  )
  const stored = (reread.data ?? []).find((r) => r.id === verifiedReviewId)
  check('count persisted in database', stored?.helpfulCount === 1, String(stored?.helpfulCount))

  /* hasVoted باید برای صاحب توکن true و برای مهمان اصلاً غایب باشد */
  const [, asVoter] = await json(
    await call(admin, `/products/${VERIFIED_SLUG}/reviews?per_page=50`),
  )
  const mine = (asVoter.data ?? []).find((r) => r.id === verifiedReviewId)
  check('hasVoted true for the voter', mine?.hasVoted === true, String(mine?.hasVoted))

  const [, asGuest] = await json(
    await call(null, `/products/${VERIFIED_SLUG}/reviews?per_page=50`),
  )
  const guestView = (asGuest.data ?? []).find((r) => r.id === verifiedReviewId)
  check('hasVoted absent for guests', guestView?.hasVoted === undefined, String(guestView?.hasVoted))

  /* رأی دوباره باید رأی را بردارد، نه اینکه عدد را دو کند */
  const [, again] = await json(
    await call(admin, `/reviews/${verifiedReviewId}/helpful`, { method: 'POST' }),
  )
  check('second vote toggles off', again.data?.hasVoted === false, String(again.data?.hasVoted))
  check('count back to 0', again.data?.helpfulCount === 0, String(again.data?.helpfulCount))

  /* رأی روی نظر تأییدنشده نباید ممکن باشد */
  const [pending] = await json(
    await call(admin, `/reviews/${unverifiedReviewId}/helpful`, { method: 'POST' }),
  )
  check('cannot vote on unapproved review -> 404', pending === 404, String(pending))
}

/* ============ 10. رد کردن ============ */
console.log('\n--- 10. reject ---')
{
  const [noReason] = await json(
    await call(admin, `/admin/reviews/${unverifiedReviewId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({}),
    }),
  )
  check('reason required -> 422', noReason === 422, String(noReason))

  const [status, body] = await json(
    await call(admin, `/admin/reviews/${unverifiedReviewId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason: 'نظر بدون تجربه‌ی واقعی استفاده از محصول است.' }),
    }),
  )
  check('status 200', status === 200, String(status))
  check('marked rejected', body.data?.status === 'rejected', body.data?.status)
  check('reason returned to user', Boolean(body.data?.rejectionReason), body.data?.rejectionReason?.slice(0, 30))
}

/* ============ 11. حذف و بازگشت امتیاز ============ */
console.log('\n--- 11. delete recalculates rating ---')
{
  const [status] = await json(
    await call(admin, `/admin/reviews/${verifiedReviewId}`, { method: 'DELETE' }),
  )
  check('status 200', status === 200, String(status))

  /* حذف باید محصول را دقیقاً به خط پایه برگرداند */
  const [, product] = await json(await call(null, `/products/${VERIFIED_SLUG}`))
  check(
    'reviewsCount back to baseline',
    product.data?.reviewsCount === baseline.reviewsCount,
    `${product.data?.reviewsCount} (baseline ${baseline.reviewsCount})`,
  )
  check(
    'ratingAvg back to baseline',
    Math.abs(product.data?.ratingAvg - baseline.ratingAvg) < 0.01,
    `${product.data?.ratingAvg} (baseline ${baseline.ratingAvg})`,
  )

  await call(admin, `/admin/reviews/${unverifiedReviewId}`, { method: 'DELETE' })
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
