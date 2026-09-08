/**
 * تست API پروفایل و امنیت حساب
 * ---------------------------------------------------------------------------
 * بررسی‌ها: مشاهده و ویرایش پروفایل، یکتایی ایمیل و موبایل، باطل شدن
 * تأیید ایمیل هنگام تغییر، تغییر رمز با تأیید رمز فعلی، خارج شدن
 * سایر دستگاه‌ها پس از تغییر رمز، فهرست نشست‌ها، و اینکه کاربر نتواند
 * نشست جاری یا نشست دیگران را ببندد.
 *
 * ⚠️ هر اجرا کاربر تازه‌ای می‌سازد و هیچ داده‌ی مشترکی را دست
 *    نمی‌زند. توضیح کاملش پایین‌تر، کنار تعریف کاربر آزمایشی.
 *
 * اجرا:
 *     node scripts/test-profile-api.mjs
 */

/* ⚠️ 127.0.0.1 و نه localhost — در ویندوز localhost اول به ::1 می‌رود. */
const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:8001/api/v1'

/*
 * ⚠️ تست روی یک کاربر *یکبارمصرف* اجرا می‌شود، نه user@demo.dev.
 *
 *    نسخه‌ی اول رمز حساب نمایشی مشترک را عوض می‌کرد و در پایان
 *    برمی‌گرداند. دو مشکل داشت:
 *
 *      ۱. رمز مستندشده‌ی «password» قاعده‌ی «حداقل یک عدد» را ندارد،
 *         پس اندپوینت تغییر رمز نمی‌تواند آن را برگرداند. تست یک بار
 *         نیمه‌کاره ماند و رمز حساب نمایشی روی مقدار موقت جا ماند —
 *         یعنی اطلاعات ورودِ مستندشده در README از کار افتاد.
 *
 *      ۲. هر تستی که وضعیت مشترک را عوض کند، اجرای موازی یا قطع‌شدن
 *         وسط کار را به یک مشکل واقعی تبدیل می‌کند.
 *
 *    کاربر تازه هیچ‌کدام از این‌ها را ندارد: خرابش هم بشود، کسی
 *    استفاده‌اش نمی‌کند.
 */
const STAMP = Date.now()
const TEST_EMAIL = `profile-test-${STAMP}@example.test`
const FIRST_PASSWORD = `Qx7${STAMP}vT`
const SECOND_PASSWORD = `Zr4${STAMP}wK`

/*
 * شماره‌ی موبایل هم باید یکتا باشد.
 * نسخه‌ی اول یک شماره‌ی ثابت داشت و از اجرای دوم به بعد با خطای
 * «این شماره قبلاً ثبت شده» رد می‌شد — چون کاربرِ اجرای قبلی هنوز
 * در دیتابیس بود و آن شماره را گرفته بود.
 */
const TEST_PHONE = `09${String(STAMP).slice(-9)}`

let pass = 0, fail = 0
const check = (label, ok, extra = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'} ${label}${extra ? '  -> ' + extra : ''}`)
  ok ? pass++ : fail++
}

/** ورود با تلاش مجدد — مسیر ورود throttle:auth دارد (۵ در دقیقه). */
async function login(email, password) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 12000))
      continue
    }
    const body = await res.json()
    return { status: res.status, token: body.data?.token ?? null }
  }
  throw new Error('login rate limited')
}

/** ثبت‌نام کاربر آزمایشی — با تلاش مجدد به همان دلیل. */
async function register() {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'Accept-Language': 'fa' },
      body: JSON.stringify({
        name: 'کاربر آزمایشی پروفایل',
        email: TEST_EMAIL,
        password: FIRST_PASSWORD,
        password_confirmation: FIRST_PASSWORD,
        /* ثبت‌نام پذیرش قوانین را الزامی می‌داند */
        accept_terms: true,
      }),
    })
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 12000))
      continue
    }
    const body = await res.json()
    if (!res.ok) throw new Error(`register ${res.status}: ${JSON.stringify(body).slice(0, 200)}`)
    return body.data.token
  }
  throw new Error('register rate limited')
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

let token = await register()
console.log(`کاربر آزمایشی ساخته شد: ${TEST_EMAIL}\n`)

const original = (await (await call(token, '/profile')).json()).data

/* ============ 1. مشاهده پروفایل ============ */
console.log('--- 1. read profile ---')
{
  const [status, body] = await json(await call(token, '/profile'))
  check('status 200', status === 200, String(status))
  check('name present', Boolean(body.data?.name), body.data?.name)
  check('email present (private field)', Boolean(body.data?.email), body.data?.email)
  check('password hash never leaks', !JSON.stringify(body).includes('$2y$'))

  const [noToken] = await json(await call(null, '/profile'))
  check('no token -> 401', noToken === 401, String(noToken))
}

/* ============ 2. اعتبارسنجی ============ */
console.log('\n--- 2. validation ---')
{
  const [empty] = await json(
    await call(token, '/profile', { method: 'PUT', body: JSON.stringify({}) }),
  )
  check('empty payload -> 422', empty === 422, String(empty))

  const [badEmail, badEmailBody] = await json(
    await call(token, '/profile', {
      method: 'PUT',
      body: JSON.stringify({ name: original.name, email: 'not-an-email' }),
    }),
  )
  check('invalid email -> 422', badEmail === 422, String(badEmail))
  check(
    'persian error message',
    /معتبر/.test(JSON.stringify(badEmailBody.errors ?? {})),
    JSON.stringify(badEmailBody.errors?.email ?? '').slice(0, 60),
  )

  const [badPhone] = await json(
    await call(token, '/profile', {
      method: 'PUT',
      body: JSON.stringify({ name: original.name, email: original.email, phone: '12345' }),
    }),
  )
  check('invalid phone -> 422', badPhone === 422, String(badPhone))

  /* ایمیل کاربر دیگر نباید پذیرفته شود */
  const [taken] = await json(
    await call(token, '/profile', {
      method: 'PUT',
      body: JSON.stringify({ name: original.name, email: 'admin@demo.dev' }),
    }),
  )
  check('email of another user -> 422', taken === 422, String(taken))

  /* ایمیل خودِ کاربر باید پذیرفته شود (قاعده‌ی ignore) */
  const [sameEmail] = await json(
    await call(token, '/profile', {
      method: 'PUT',
      body: JSON.stringify({ name: original.name, email: original.email }),
    }),
  )
  check('own email accepted', sameEmail === 200, String(sameEmail))
}

/* ============ 3. نقش قابل تغییر نیست ============ */
console.log('\n--- 3. role cannot be escalated ---')
{
  const [, body] = await json(
    await call(token, '/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name: original.name,
        email: original.email,
        role: 'admin',
        is_active: false,
      }),
    }),
  )
  check('role unchanged', body.data?.role === original.role, body.data?.role)
  check('still not an admin', body.data?.isAdmin === false, String(body.data?.isAdmin))
  check('still active', body.data?.isActive === true, String(body.data?.isActive))
}

/* ============ 4. ویرایش موفق ============ */
console.log('\n--- 4. successful update ---')
{
  const [status, body] = await json(
    await call(token, '/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'نام آزمایشی',
        email: original.email,
        phone: TEST_PHONE,
        birth_date: '1990-05-20',
      }),
    }),
  )
  check('status 200', status === 200, String(status))
  check('name updated', body.data?.name === 'نام آزمایشی', body.data?.name)
  check('phone updated', body.data?.phone === TEST_PHONE, body.data?.phone)
  check('birth date stored', body.data?.birthDate === '1990-05-20', body.data?.birthDate)
  check('persian success message', /به‌روز/.test(body.message ?? ''), body.message)
}

/* ============ 5. تغییر ایمیل تأیید را باطل می‌کند ============ */
console.log('\n--- 5. changing email resets verification ---')
{
  /*
   * ⚠️ محدودیت آگاهانه‌ی این بخش:
   *
   *    کاربر تازه‌ثبت‌نام‌کرده ایمیل تأییدنشده دارد (ثبت‌نام آن را
   *    تأیید نمی‌کند) و هیچ اندپوینتی برای تأیید دستی وجود ندارد.
   *    پس گذارِ «تأییدشده ← تأییدنشده» را نمی‌شود اینجا از سر تا ته
   *    اثبات کرد.
   *
   *    آنچه *می‌شود* سنجید و مهم است: پس از تغییر ایمیل، وضعیت
   *    هرگز تأییدشده نیست. اگر روزی کسی آن یک خط را حذف کند و
   *    ثبت‌نام هم ایمیل را تأیید کند، همین بررسی قرمز می‌شود.
   */
  const before = (await (await call(token, '/profile')).json()).data
  check('fresh user starts unverified', before.emailVerified === false, String(before.emailVerified))

  const changedEmail = 'changed-' + before.email
  const [, body] = await json(
    await call(token, '/profile', {
      method: 'PUT',
      body: JSON.stringify({ name: before.name, email: changedEmail }),
    }),
  )
  check('email changed', body.data?.email === changedEmail, body.data?.email)
  check('never verified after a change', body.data?.emailVerified === false, String(body.data?.emailVerified))

  /* برگرداندن ایمیل تا بخش‌های بعدی از وضعیت شناخته‌شده‌ای شروع کنند */
  await call(token, '/profile', {
    method: 'PUT',
    body: JSON.stringify({ name: before.name, email: before.email }),
  })
}

/* ============ 6. فهرست نشست‌ها ============ */
console.log('\n--- 6. sessions ---')
{
  const [status, body] = await json(await call(token, '/profile/sessions'))
  check('status 200', status === 200, String(status))
  check('at least one session', (body.data ?? []).length >= 1, `count=${body.data?.length}`)

  const current = (body.data ?? []).filter((s) => s.isCurrent)
  check('exactly one marked current', current.length === 1, `count=${current.length}`)
  check('no token value exposed', !JSON.stringify(body).includes('plainTextToken'))

  /* بستن نشست جاری از این مسیر ممنوع است */
  const [cur, curBody] = await json(
    await call(token, `/profile/sessions/${current[0]?.id}`, { method: 'DELETE' }),
  )
  check('cannot revoke current session -> 422', cur === 422, String(cur))
  check('error code CURRENT_SESSION', curBody.error?.code === 'CURRENT_SESSION', curBody.error?.code)

  /* نشست ناموجود */
  const [missing] = await json(
    await call(token, '/profile/sessions/999999', { method: 'DELETE' }),
  )
  check('unknown session -> 404', missing === 404, String(missing))
}

/* ============ 7. بستن نشست دیگر ============ */
console.log('\n--- 7. revoke another session ---')
{
  /*
   * ⚠️ شناسه‌ی نشست تازه با *تفاضل* پیدا می‌شود، نه با «اولین نشستی
   *    که جاری نیست».
   *
   *    نسخه‌ی اول همان کار را می‌کرد و شکست خورد: دیتابیس ده‌ها
   *    توکن از اجراهای قبلی دارد و فهرست بر اساس last_used_at مرتب
   *    است، پس «اولین غیرجاری» معمولاً یک توکن قدیمیِ بی‌ربط بود.
   *    تست آن را می‌بست و بعد ادعا می‌کرد توکن نشست دوم باید مرده
   *    باشد — که نبود.
   */
  const [, before] = await json(await call(token, '/profile/sessions'))
  const idsBefore = new Set((before.data ?? []).map((s) => s.id))

  const second = await login(TEST_EMAIL, FIRST_PASSWORD)
  check('second login works', Boolean(second.token))

  const [, after] = await json(await call(token, '/profile/sessions'))
  const fresh = (after.data ?? []).find((s) => !idsBefore.has(s.id) && !s.isCurrent)
  check('new session appears in the list', Boolean(fresh), `id=${fresh?.id}`)

  const [status] = await json(
    await call(token, `/profile/sessions/${fresh.id}`, { method: 'DELETE' }),
  )
  check('revoked', status === 200, String(status))

  /* توکن بسته‌شده باید دیگر کار نکند */
  const [dead] = await json(await call(second.token, '/profile'))
  check('revoked token rejected -> 401', dead === 401, String(dead))
}

/* ============ 8. تغییر رمز ============ */
console.log('\n--- 8. change password ---')
{
  const currentPassword = FIRST_PASSWORD

  const [wrong, wrongBody] = await json(
    await call(token, '/profile/password', {
      method: 'PUT',
      body: JSON.stringify({
        current_password: 'totally-wrong',
        password: SECOND_PASSWORD,
        password_confirmation: SECOND_PASSWORD,
      }),
    }),
  )
  check('wrong current password -> 422', wrong === 422, String(wrong))
  check(
    'clear error message',
    /رمز فعلی/.test(JSON.stringify(wrongBody.errors ?? {})),
    JSON.stringify(wrongBody.errors?.current_password ?? '').slice(0, 50),
  )

  const [mismatch] = await json(
    await call(token, '/profile/password', {
      method: 'PUT',
      body: JSON.stringify({
        current_password: currentPassword,
        password: SECOND_PASSWORD,
        password_confirmation: 'something-else',
      }),
    }),
  )
  check('confirmation mismatch -> 422', mismatch === 422, String(mismatch))

  const [weak] = await json(
    await call(token, '/profile/password', {
      method: 'PUT',
      body: JSON.stringify({
        current_password: currentPassword,
        password: 'abc',
        password_confirmation: 'abc',
      }),
    }),
  )
  check('weak password -> 422', weak === 422, String(weak))

  const [same] = await json(
    await call(token, '/profile/password', {
      method: 'PUT',
      body: JSON.stringify({
        current_password: currentPassword,
        password: currentPassword,
        password_confirmation: currentPassword,
      }),
    }),
  )
  check('same as current -> 422', same === 422, String(same))
}

/* ============ 9. تغییر رمز سایر دستگاه‌ها را خارج می‌کند ============ */
console.log('\n--- 9. password change signs out other devices ---')
{
  const currentPassword = FIRST_PASSWORD
  const newPassword = SECOND_PASSWORD

  /* یک نشست دیگر می‌سازیم تا ببینیم بسته می‌شود */
  const other = await login(TEST_EMAIL, currentPassword)
  check('extra session created', Boolean(other.token))

  const [status, body] = await json(
    await call(token, '/profile/password', {
      method: 'PUT',
      body: JSON.stringify({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: newPassword,
      }),
    }),
  )
  check('status 200', status === 200, String(status))
  check('message mentions other devices', /دستگاه/.test(body.message ?? ''), body.message)

  /* توکن جاری باید هنوز کار کند */
  const [stillOk] = await json(await call(token, '/profile'))
  check('current token still valid', stillOk === 200, String(stillOk))

  /* ولی نشست دیگر باید بسته شده باشد */
  const [dead] = await json(await call(other.token, '/profile'))
  check('other session signed out -> 401', dead === 401, String(dead))

  /* رمز قدیمی دیگر کار نمی‌کند */
  const oldTry = await login(TEST_EMAIL, currentPassword)
  check('old password rejected', oldTry.token === null, String(oldTry.status))

  const newTry = await login(TEST_EMAIL, newPassword)
  check('new password works', Boolean(newTry.token))
  token = newTry.token
}

/* ============ پایان ============ */
/*
 * هیچ پاکسازی‌ای لازم نیست: کاربر آزمایشی یکبارمصرف است و هیچ
 * داده‌ی مشترکی دست نخورده. حساب باقی می‌ماند ولی بی‌ضرر است —
 * ایمیلش دامنه‌ی .test دارد و هرگز به کسی نمی‌رسد.
 *
 * برای پاک کردن کاربران آزمایشی انباشته:
 *     php artisan tinker --execute="App\\Models\\User::where('email','like','profile-test-%')->delete();"
 */

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
