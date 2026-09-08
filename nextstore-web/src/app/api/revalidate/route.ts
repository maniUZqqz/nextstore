/**
 * باطل کردن کش به‌درخواست (On-demand Revalidation)
 * ===========================================================================
 * مسیر: POST /api/revalidate
 *
 * ⚠️ مشکلی که این فایل حل می‌کند — یک باگ واقعی که وقت زیادی گرفت:
 *
 *    توابع لایه‌ی API با `revalidate` کش می‌شوند:
 *        getBrands     → ۳۶۰۰ ثانیه
 *        getCategories → ۳۶۰۰ ثانیه
 *        getProducts   → ۳۰۰ ثانیه
 *
 *    یعنی وقتی ادمین محصولی را ویرایش می‌کند، لاراول کش خودش را
 *    پاک می‌کند اما **کش نکست دست‌نخورده می‌ماند** و فروشگاه تا یک
 *    ساعت داده‌ی قدیمی نشان می‌دهد.
 *
 *    این باگ به‌شدت گمراه‌کننده است: API درست جواب می‌دهد، دیتابیس
 *    درست است، اما صفحه چیز دیگری نشان می‌دهد. در عمل با curl
 *    داده‌ی جدید می‌بینی و در مرورگر داده‌ی قدیمی.
 *
 *    راه‌حل: لاراول پس از هر تغییر کاتالوگ، این مسیر را صدا می‌زند
 *    و برچسب‌های مربوطه باطل می‌شوند.
 *
 * ⚠️ امنیت: این مسیر با یک راز مشترک محافظت می‌شود. بدون آن، هر
 *    کسی می‌توانست با درخواست‌های پیاپی کش را دائماً خالی نگه دارد
 *    و عملاً یک حمله‌ی منع سرویس به بک‌اند بزند.
 *
 *    راز در `REVALIDATE_SECRET` است — عمداً بدون پیشوند NEXT_PUBLIC_
 *    تا هرگز به باندل مرورگر نشت نکند.
 */

import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

/**
 * برچسب‌های مجاز.
 *
 * ⚠️ چرا فهرست سفید و نه هر برچسبی که فرستاده شد؟
 *    پذیرفتن ورودی دلخواه یعنی مهاجم می‌تواند برچسب‌های تصادفی
 *    بفرستد؛ بی‌ضرر است اما پنهان‌کننده‌ی اشتباه تایپی هم هست.
 *    با فهرست سفید، «brnads» به‌جای «brands» بلافاصله خطا می‌دهد
 *    به‌جای اینکه بی‌صدا هیچ کاری نکند.
 */
/*
 * ⚠️ هر برچسب تازه‌ای که بک‌اند می‌فرستد باید اینجا هم اضافه شود.
 *    فهرست سفید عمدی است — بدون آن هر کسی با دانستن راز می‌توانست
 *    هر برچسبی را باطل کند. ولی هزینه‌اش این است که جا انداختن یک
 *    برچسب، درخواست را **بی‌صدا رد** می‌کند و کش هرگز تازه نمی‌شود.
 */
const ALLOWED_TAGS = ['products', 'categories', 'brands', 'home', 'settings'] as const

type AllowedTag = (typeof ALLOWED_TAGS)[number]

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET

  /*
   * اگر راز تنظیم نشده باشد، مسیر کاملاً غیرفعال است.
   * حالت «بدون رمز = آزاد برای همه» خطرناک‌ترین پیش‌فرض ممکن است.
   */
  if (!secret) {
    return NextResponse.json(
      { message: 'revalidation is not configured' },
      { status: 503 },
    )
  }

  const provided = request.headers.get('x-revalidate-secret')

  if (provided !== secret) {
    return NextResponse.json({ message: 'unauthorized' }, { status: 401 })
  }

  let body: { tags?: unknown }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'invalid json body' }, { status: 400 })
  }

  const requested = Array.isArray(body.tags) ? body.tags : []

  const invalid = requested.filter(
    (tag) => typeof tag !== 'string' || !ALLOWED_TAGS.includes(tag as AllowedTag),
  )

  if (requested.length === 0 || invalid.length > 0) {
    return NextResponse.json(
      {
        message: 'tags must be a non-empty array of known tags',
        allowed: ALLOWED_TAGS,
        invalid,
      },
      { status: 422 },
    )
  }

  /*
   * ⚠️ در Next 16 آرگومان دوم اجباری شد و انتخابش اهمیت دارد.
   *
   *    اول `'max'` گذاشته شد چون در مستندات به‌عنوان نمونه آمده
   *    است. اما تست نشان داد کش پاک **نمی‌شود**: پروفایل، آستانه‌ی
   *    سن است، نه شدت پاک‌سازی. با `'max'` فقط ورودی‌هایی کهنه
   *    حساب می‌شوند که از طولانی‌ترین عمر ممکن هم قدیمی‌ترند —
   *    یعنی عملاً هیچ‌کدام.
   *
   *    `{ expire: 0 }` یعنی «همین حالا منقضی»، که همان چیزی است
   *    که پس از ویرایش ادمین می‌خواهیم.
   *
   *    این را فقط تست انتها‌به‌انتها گرفت؛ TypeScript از هر دو
   *    راضی بود و پاسخ API هم در هر دو حالت ۲۰۰ می‌داد.
   */
  for (const tag of requested as AllowedTag[]) {
    revalidateTag(tag, { expire: 0 })
  }

  return NextResponse.json({ revalidated: requested, at: Date.now() })
}
