/**
 * محتوای صفحات شرکتی: درباره ما و فرصت‌های شغلی
 * ---------------------------------------------------------------------------
 * ⚠️ نکته‌ی صداقت در نمونه‌کار:
 *    نکست‌استور یک فروشگاه واقعی نیست. متن این صفحه‌ها عمداً از
 *    ادعاهای عددی جعلی («۵۰۰ هزار مشتری راضی») پرهیز می‌کند و
 *    به‌جای آن روی چیزی تمرکز دارد که واقعاً وجود دارد: تصمیم‌های
 *    فنی پروژه. صفحه‌ی «درباره ما» در یک نمونه‌کار، بهترین جا برای
 *    نشان دادن همین‌هاست.
 */

import type { ContentPage, LocalizedContent } from './types'

/* =========================================================================
 * درباره ما
 * ======================================================================= */

/** یک قلم آمار روی صفحه‌ی درباره‌ما. */
export interface AboutStat {
  value: string
  label: string
}

/** یک مرحله از مسیر پروژه. */
export interface TimelineStep {
  title: string
  description: string
}

export interface AboutContent extends ContentPage {
  stats: AboutStat[]
  timeline: TimelineStep[]
}

export const aboutContent: LocalizedContent<AboutContent> = {
  fa: {
    title: 'درباره نکست‌استور',
    subtitle:
      'یک فروشگاه اینترنتی کامل که به‌عنوان نمونه‌کار ساخته شده — از دیتابیس تا پنل مدیریت.',
    stats: [
      { value: '۲', label: 'زبان کامل با پشتیبانی راست‌به‌چپ' },
      { value: '۳۲', label: 'محصول در ۹ دسته‌بندی' },
      { value: '۱۶۷', label: 'بررسی خودکار در تست‌ها' },
      { value: '۱۰۰٪', label: 'کامنت‌گذاری فارسی در کد' },
    ],
    timeline: [
      {
        title: 'طراحی دیتابیس و API',
        description:
          'مدل‌سازی محصول، سفارش و پرداخت با در نظر گرفتن نکاتی مثل نگه‌داشتن قیمت به‌صورت عدد صحیح ریالی و کپی‌کردن اطلاعات در سفارش به‌جای ارجاع.',
      },
      {
        title: 'فروشگاه و سبد خرید',
        description:
          'فهرست و فیلتر محصولات، صفحه‌ی محصول، سبد خرید برای کاربر مهمان و واردشده، و چرخه‌ی کامل پرداخت با درگاه شبیه‌سازی‌شده.',
      },
      {
        title: 'دوزبانه، تم و ریسپانسیو',
        description:
          'فارسی و انگلیسی با مسیرهای جدا، جهت نوشتار خودکار، تم روشن و تاریک بدون پرش، و چیدمان کامل برای موبایل تا دسکتاپ.',
      },
      {
        title: 'پنل مدیریت',
        description:
          'داشبورد با نمودار فروش، مدیریت سفارش‌ها با قواعد انتقال وضعیت، و مدیریت محصولات با فرم دوزبانه.',
      },
    ],
    sections: [
      {
        heading: 'این پروژه چیست',
        paragraphs: [
          'نکست‌استور یک فروشگاه اینترنتی کامل است که برای نمایش توانایی فنی ساخته شده. بک‌اند آن با لاراول به‌صورت API نوشته شده و فرانت‌اند با Next.js و React — دو برنامه‌ی مستقل که فقط از طریق API با هم حرف می‌زنند.',
          'همه‌چیز واقعی کار می‌کند: می‌توانید محصول به سبد اضافه کنید، سفارش ثبت کنید، پرداخت را در درگاه شبیه‌سازی‌شده انجام دهید و سفارشتان را در پنل کاربری دنبال کنید.',
        ],
      },
      {
        heading: 'چرا این تصمیم‌های فنی',
        bullets: [
          'قیمت‌ها عدد صحیح به ریال ذخیره می‌شوند، نه اعشاری — محاسبات پولی با float خطای گردکردن می‌سازد.',
          'نام و قیمت محصول در لحظه‌ی خرید داخل سفارش کپی می‌شود؛ سند مالی نباید با تغییر بعدی محصول عوض شود.',
          'موجودی با قفل ردیف در تراکنش کم می‌شود تا دو خریدار هم‌زمان، آخرین کالا را دو بار نخرند.',
          'درگاه پرداخت پشت یک interface است، پس افزودن درگاه واقعی نیازی به تغییر منطق سفارش ندارد.',
        ],
      },
      {
        heading: 'حساب‌های نمایشی',
        paragraphs: [
          'برای دیدن پنل کاربری و پنل مدیریت نیازی به ثبت‌نام نیست. در صفحه‌ی ورود، دکمه‌های حساب نمایشی وجود دارند که فرم را پر می‌کنند.',
        ],
      },
    ],
  },

  en: {
    title: 'About NextStore',
    subtitle:
      'A complete online store built as a portfolio project — from the database to the admin panel.',
    stats: [
      { value: '2', label: 'full languages with RTL support' },
      { value: '32', label: 'products across 9 categories' },
      { value: '167', label: 'automated test assertions' },
      { value: '100%', label: 'of the code commented' },
    ],
    timeline: [
      {
        title: 'Database and API design',
        description:
          'Modelling products, orders and payments with care for details like storing money as integers and snapshotting data into orders instead of referencing it.',
      },
      {
        title: 'Storefront and cart',
        description:
          'Product listing and filters, product page, a cart that works for guests and signed-in users, and a full checkout flow with a simulated gateway.',
      },
      {
        title: 'Bilingual, theming, responsive',
        description:
          'Persian and English on separate routes, automatic text direction, light and dark themes without a flash, and layouts from mobile to desktop.',
      },
      {
        title: 'Admin panel',
        description:
          'A dashboard with sales charts, order management with status transition rules, and product management through a bilingual form.',
      },
    ],
    sections: [
      {
        heading: 'What this project is',
        paragraphs: [
          'NextStore is a complete e-commerce site built to demonstrate engineering work. The backend is an API-only Laravel application and the frontend is Next.js with React — two independent apps that talk only over the API.',
          'Everything really works: you can add products to a cart, place an order, pay through a simulated gateway and follow your order in your dashboard.',
        ],
      },
      {
        heading: 'Why these technical choices',
        bullets: [
          'Prices are stored as integers in Rial, never floats — money maths with floating point introduces rounding errors.',
          'Product name and price are copied into the order at purchase time; a financial record must not change when the product later does.',
          'Stock is decremented with a row lock inside a transaction so two simultaneous buyers cannot both take the last item.',
          'The payment gateway sits behind an interface, so adding a real one needs no change to the order logic.',
        ],
      },
      {
        heading: 'Demo accounts',
        paragraphs: [
          'You do not need to register to explore the customer and admin panels. The login page has demo-account buttons that fill the form for you.',
        ],
      },
    ],
  },
}

/* =========================================================================
 * فرصت‌های شغلی
 * ======================================================================= */

/** یک موقعیت شغلی باز. */
export interface JobOpening {
  title: string
  team: string
  location: string
  type: string
}

export interface CareersContent extends ContentPage {
  openings: JobOpening[]
  /** یادداشت صادقانه درباره‌ی نمونه‌کار بودن این صفحه */
  disclaimer: string
}

export const careersContent: LocalizedContent<CareersContent> = {
  fa: {
    title: 'فرصت‌های شغلی',
    subtitle: 'اگر ساختن چیزهای دقیق برایتان جذاب است، اینجا را ببینید.',
    disclaimer:
      'این صفحه بخشی از یک پروژه‌ی نمونه‌کار است و موقعیت‌های زیر واقعی نیستند. برای ارتباط واقعی از صفحه‌ی تماس با ما استفاده کنید.',
    openings: [
      {
        title: 'توسعه‌دهنده‌ی فرانت‌اند (React / Next.js)',
        team: 'تیم محصول',
        location: 'تهران · دورکاری ترکیبی',
        type: 'تمام‌وقت',
      },
      {
        title: 'توسعه‌دهنده‌ی بک‌اند (Laravel)',
        team: 'تیم زیرساخت',
        location: 'تهران · دورکاری ترکیبی',
        type: 'تمام‌وقت',
      },
      {
        title: 'کارشناس پشتیبانی مشتریان',
        team: 'تیم تجربه مشتری',
        location: 'تهران',
        type: 'تمام‌وقت',
      },
      {
        title: 'کارشناس انبار و لجستیک',
        team: 'تیم عملیات',
        location: 'کرج',
        type: 'شیفتی',
      },
    ],
    sections: [
      {
        heading: 'چطور کار می‌کنیم',
        bullets: [
          'کد بازبینی می‌شود؛ هیچ تغییری بدون خوانده شدن به شاخه‌ی اصلی نمی‌رود.',
          'هر تغییر رابط کاربری با اسکرین‌شات بررسی می‌شود، نه فقط با تست خودکار.',
          'نوشتن دلیلِ یک تصمیم در کامنت، به اندازه‌ی خود کد اهمیت دارد.',
        ],
      },
      {
        heading: 'مسیر استخدام',
        bullets: [
          'بررسی رزومه و نمونه‌کار.',
          'یک گفت‌وگوی کوتاه درباره‌ی تجربه‌ها.',
          'یک تمرین عملی کوچک، متناسب با نقش.',
          'جلسه‌ی فنی با هم‌تیمی‌های آینده.',
        ],
      },
    ],
  },

  en: {
    title: 'Careers',
    subtitle: 'If building things carefully appeals to you, take a look.',
    disclaimer:
      'This page is part of a portfolio project and the roles below are not real. For genuine contact, please use the contact page.',
    openings: [
      {
        title: 'Frontend Engineer (React / Next.js)',
        team: 'Product',
        location: 'Tehran · Hybrid',
        type: 'Full-time',
      },
      {
        title: 'Backend Engineer (Laravel)',
        team: 'Platform',
        location: 'Tehran · Hybrid',
        type: 'Full-time',
      },
      {
        title: 'Customer Support Specialist',
        team: 'Customer Experience',
        location: 'Tehran',
        type: 'Full-time',
      },
      {
        title: 'Warehouse & Logistics Associate',
        team: 'Operations',
        location: 'Karaj',
        type: 'Shift work',
      },
    ],
    sections: [
      {
        heading: 'How we work',
        bullets: [
          'Code gets reviewed; nothing reaches the main branch unread.',
          'Every UI change is checked with screenshots, not only automated tests.',
          'Writing down why a decision was made matters as much as the code itself.',
        ],
      },
      {
        heading: 'Hiring process',
        bullets: [
          'We review your CV and portfolio.',
          'A short conversation about your experience.',
          'A small practical exercise suited to the role.',
          'A technical session with your future teammates.',
        ],
      },
    ],
  },
}
