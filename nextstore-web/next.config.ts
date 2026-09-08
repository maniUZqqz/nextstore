/**
 * پیکربندی Next.js
 * ---------------------------------------------------------------------------
 * افزونه next-intl را به تنظیمات وصل می‌کند تا فایل i18n/request.ts
 * در زمان رندر سمت سرور شناسایی و اجرا شود.
 */

import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

/** مسیر فایل پیکربندی i18n را به افزونه معرفی می‌کنیم. */
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/**
 * ساخت فهرست میزبان‌های مجاز تصویر از روی آدرس API.
 *
 * هر دو نام میزبان محلی (127.0.0.1 و localhost) اضافه می‌شوند چون
 * بسته به اینکه کاربر سایت را با کدام باز کند، مرورگر همان را
 * می‌فرستد و Next نام میزبان را دقیق مقایسه می‌کند.
 */
function buildImagePatterns() {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8100/api/v1'

  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    /* آدرس خراب نباید بیلد را بخواباند — به پیش‌فرض برمی‌گردیم */
    parsed = new URL('http://127.0.0.1:8100/api/v1')
  }

  const protocol = parsed.protocol.replace(':', '') as 'http' | 'https'
  const port = parsed.port

  return ['127.0.0.1', 'localhost'].map((hostname) => ({
    protocol,
    hostname,
    port,
  }))
}

const nextConfig: NextConfig = {
  /** بررسی سخت‌گیرانه React برای شناسایی زودهنگام باگ‌ها در محیط توسعه */
  reactStrictMode: true,

  /*
   * میزبان‌هایی که در حالت توسعه اجازه‌ی دریافت منابع داخلی Next را دارند.
   *
   * ⚠️ چرا این خط لازم شد؟
   *    Next 16 دسترسی به /_next/hmr و چانک‌های توسعه را از هر میزبانی
   *    جز همان میزبانِ سرور مسدود می‌کند. باز کردن سایت با آدرس
   *    127.0.0.1 (به‌جای localhost) باعث می‌شد **هیچ چیزی hydrate نشود**:
   *    صفحه درست رندر می‌شد اما هیچ دکمه‌ای کار نمی‌کرد و فرم ورود
   *    به‌صورت GET بومی ارسال می‌شد.
   *
   *    این نشانه‌ی گمراه‌کننده‌ای دارد — صفحه سالم به نظر می‌رسد — و
   *    فقط در لاگ سرور یک هشدار می‌بینید. چون روی این سیستم پورت
   *    localhost می‌تواند اشغال باشد و ناچار از 127.0.0.1 استفاده
   *    می‌کنیم، این آدرس‌ها صریحاً مجاز شده‌اند.
   *
   *    فقط روی سرور توسعه اثر دارد و در بیلد تولیدی نادیده گرفته می‌شود.
   */
  allowedDevOrigins: ['127.0.0.1', 'localhost'],

  /** حذف هدر «X-Powered-By: Next.js» — نشت اطلاعات فنی به مهاجم */
  poweredByHeader: false,

  images: {
    /*
     * دامنه‌هایی که اجازه‌ی سرو کردن تصویر از آن‌ها را داریم.
     * تصاویر محصولات و کاور مقالات از بک‌اند لاراول می‌آیند.
     *
     * ⚠️ پورت از NEXT_PUBLIC_API_URL مشتق می‌شود، نه هاردکد.
     *
     *    قبلاً «۸۰۰۱» مستقیم اینجا نوشته شده بود. وقتی run.bat
     *    سرویس‌ها را روی پورت دیگری بالا آورد، آدرس تصویرها با این
     *    فهرست نخواند و Next هر تصویر را رد کرد — بدون خطای واضح،
     *    فقط کادر خالی. دو منبع حقیقت برای یک پورت، دیر یا زود
     *    واگرا می‌شوند.
     */
    remotePatterns: buildImagePatterns(),

    /** فرمت‌های مدرن با حجم کمتر — Next خودکار بهترین را انتخاب می‌کند */
    formats: ['image/avif', 'image/webp'],

    /*
     * اجازه‌ی نمایش SVG.
     *
     * چرا پیش‌فرض غیرفعال است؟ فایل SVG می‌تواند حاوی <script> باشد و
     * اگر از منبع نامعتبر بیاید، امکان اجرای کد در دامنه‌ی ما را می‌دهد.
     *
     * چرا اینجا امن است؟
     *   ۱. تصاویر SVG را خودمان تولید کرده‌ایم (اسکریپت generate-product-images)
     *   ۲. remotePatterns فقط بک‌اند خودمان را مجاز می‌کند
     *   ۳. هدر CSP زیر هر اسکریپتی را در فایل تصویر مسدود و آن را
     *      داخل sandbox اجرا می‌کند
     */
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",

    /*
     * اجازه‌ی دریافت تصویر از IP خصوصی — فقط در محیط توسعه.
     *
     * Next.js نسخه ۱۶ برای جلوگیری از حمله‌ی SSRF، بهینه‌ساز تصویر را
     * از دریافت فایل از آدرس‌های خصوصی (127.0.0.1، 192.168.x.x و…)
     * منع می‌کند و خطای ۴۰۰ برمی‌گرداند:
     *
     *     "hostname resolved to private IP"
     *
     * نتیجه‌ی آن باگ: تمام تصاویر محصولات سفید و خالی نمایش داده می‌شدند.
     *
     * ⚠️ این گزینه عمداً فقط در development فعال است. در محیط تولید،
     *    بک‌اند روی دامنه‌ی عمومی است و این محافظ باید فعال بماند.
     */
    dangerouslyAllowLocalIP: process.env.NODE_ENV === 'development',
  },

  /** هدرهای امنیتی روی تمام مسیرها */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // جلوگیری از تشخیص خودکار نوع فایل توسط مرورگر
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // جلوگیری از قرار گرفتن سایت در iframe سایت دیگر (Clickjacking)
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // ارسال نشدن آدرس کامل صفحه به سایت‌های خارجی
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default withNextIntl(nextConfig)
