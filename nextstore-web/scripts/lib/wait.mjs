/**
 * انتظار شرطی برای تست‌های سرتاسری
 * ---------------------------------------------------------------------------
 * ⚠️ چرا این فایل وجود دارد؟
 *
 *    نسخه‌ی اول سوئیت‌ها بعد از هر کنش `waitForTimeout(2000)` می‌گذاشت.
 *    این کار دو عیب دارد که هر دو در عمل به ما زدند:
 *
 *    ۱. روی ماشین کند کافی نیست. زنجیره‌ی «درخواست → invalidate →
 *       واکشی دوباره → رندر» گاهی از دو ثانیه رد می‌شود و بررسی، مقدار
 *       کهنه را می‌خواند. شکستِ حاصل («ردیف اول عوض نشد») دقیقاً شبیه
 *       باگ محصول است، و اجرای بعدی سبز می‌شود — بدترین نوع تست.
 *
 *    ۲. روی ماشین سریع، وقت تلف می‌کند. ۱۵۰ انتظار ثابت در ۲۲ سوئیت
 *       یعنی چند دقیقه نشستن بی‌دلیل.
 *
 *    راه‌حل: به‌جای «دو ثانیه صبر کن»، بگو «تا وقتی این شرط برقرار
 *    شود صبر کن، حداکثر تا این مهلت».
 *
 * ⚠️ در مهلت‌شدن، **استثنا پرتاب نمی‌شود**.
 *
 *    یک انتظارِ ناموفق نباید کل سوئیت را بیندازد و ۲۰ بررسی بعدی را
 *    اجرانشده بگذارد. اینجا فقط آخرین مقدار برگردانده می‌شود تا خودِ
 *    بررسی شکست بخورد و در گزارش با نام و عدد بیاید.
 */

/**
 * مقدار `read()` را می‌خواند تا وقتی `isDone` بپذیردش.
 *
 * @param {() => Promise<T>} read خواندن مقدار فعلی
 * @param {(value: T) => boolean} isDone شرط پایان
 * @param {{ timeout?: number, interval?: number }} [options]
 * @returns {Promise<T>} آخرین مقدار خوانده‌شده — چه شرط برقرار شده باشد چه نه
 * @template T
 */
export async function waitUntil(read, isDone, options = {}) {
  const { timeout = 15_000, interval = 200 } = options
  const deadline = Date.now() + timeout

  let value = await read()

  while (!isDone(value) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, interval))
    value = await read()
  }

  return value
}

/**
 * تعداد ردیف‌های یک سلکتور را می‌خواند تا به مقدار مورد انتظار برسد.
 *
 * حالت پرتکرار: کلیک روی یک فیلتر و انتظار برای اینکه جدول واقعاً
 * فیلتر شود.
 */
export function waitForCount(page, selector, expected, options) {
  return waitUntil(
    () => page.locator(selector).count(),
    (count) => count === expected,
    options,
  )
}

/** متن یک سلکتور را می‌خواند تا با مقدار پیشین فرق کند. */
export function waitForChange(page, selector, previous, options) {
  return waitUntil(
    () => page.locator(selector).first().innerText(),
    (text) => text !== previous,
    options,
  )
}
