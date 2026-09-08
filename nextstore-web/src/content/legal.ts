/**
 * محتوای صفحات حقوقی: شرایط استفاده و حریم خصوصی
 * ---------------------------------------------------------------------------
 * ⚠️ این متن‌ها برای یک پروژه‌ی **نمونه‌کار** نوشته شده‌اند و مشاوره‌ی
 *    حقوقی نیستند. یک فروشگاه واقعی باید متن را با وکیل تنظیم کند و
 *    با قوانین تجارت الکترونیک کشور خودش تطبیق دهد.
 *
 *    عمداً از ادعاهای دقیق حقوقی (شماره‌ی ماده، تعهد قطعی) پرهیز شده
 *    و متن در سطح توصیف رویه‌ها مانده است.
 */

import type { ContentPage, LocalizedContent } from './types'

/* =========================================================================
 * شرایط استفاده
 * ======================================================================= */

export const termsContent: LocalizedContent<ContentPage> = {
  fa: {
    title: 'شرایط استفاده',
    subtitle:
      'با ثبت سفارش در نکست‌استور، شرایط زیر را می‌پذیرید. لطفاً پیش از خرید آن‌ها را بخوانید.',
    updatedAt: 'آخرین بازنگری: شهریور ۱۴۰۵',
    sections: [
      {
        heading: 'پذیرش شرایط',
        paragraphs: [
          'استفاده از این وب‌سایت، ساخت حساب کاربری و ثبت سفارش به‌معنای پذیرش کامل این شرایط است. اگر با بخشی از آن موافق نیستید، از خدمات فروشگاه استفاده نکنید.',
          'ما می‌توانیم این شرایط را به‌روزرسانی کنیم. تاریخ آخرین بازنگری بالای همین صفحه درج می‌شود و نسخه‌ی جاری از لحظه‌ی انتشار معتبر است.',
        ],
      },
      {
        heading: 'حساب کاربری',
        paragraphs: [
          'مسئولیت حفظ رمز عبور و فعالیت‌هایی که با حساب شما انجام می‌شود بر عهده‌ی خودتان است.',
        ],
        bullets: [
          'اطلاعاتی که هنگام ثبت‌نام می‌دهید باید درست و به‌روز باشد.',
          'استفاده‌ی هم‌زمان چند نفر از یک حساب مجاز نیست.',
          'اگر گمان می‌کنید حسابتان در دسترس دیگری قرار گرفته، بی‌درنگ رمز را عوض کنید.',
        ],
      },
      {
        heading: 'قیمت و سفارش',
        paragraphs: [
          'قیمت‌ها به ریال و شامل مالیات بر ارزش افزوده نمایش داده می‌شوند. مبلغ نهایی هر سفارش، همان چیزی است که در لحظه‌ی ثبت سفارش تأیید کرده‌اید و بعد از آن تغییر نمی‌کند.',
          'ثبت سفارش به‌معنای تضمین موجودی نیست. اگر کالایی پس از ثبت سفارش ناموجود شود، سفارش لغو و مبلغ به‌طور کامل بازگردانده می‌شود.',
          'در صورت خطای آشکار در قیمت‌گذاری (مثلاً کالای ده میلیونی با قیمت ده هزار ریال)، فروشگاه می‌تواند سفارش را لغو کند و وجه را برگرداند.',
        ],
      },
      {
        heading: 'حقوق مالکیت فکری',
        paragraphs: [
          'متن‌ها، طراحی و کد این وب‌سایت متعلق به نکست‌استور است. نام‌ها و نشان‌های تجاری برندهای فروخته‌شده متعلق به صاحبان آن‌هاست و صرفاً برای معرفی کالا استفاده می‌شوند.',
        ],
      },
      {
        heading: 'محدودیت مسئولیت',
        paragraphs: [
          'ما تلاش می‌کنیم اطلاعات محصولات دقیق باشد، اما مشخصات فنی ممکن است توسط سازنده تغییر کند. در صورت مغایرت آشکار میان کالای دریافتی و توضیحات صفحه، امکان مرجوعی طبق رویه‌ی بازگرداندن کالا وجود دارد.',
        ],
      },
      {
        heading: 'قانون حاکم',
        paragraphs: [
          'این شرایط تابع قوانین جمهوری اسلامی ایران است و اختلافات از طریق مراجع صالح رسیدگی می‌شود.',
        ],
      },
    ],
  },

  en: {
    title: 'Terms of Use',
    subtitle:
      'By placing an order on NextStore you accept the terms below. Please read them before you buy.',
    updatedAt: 'Last reviewed: September 2026',
    sections: [
      {
        heading: 'Acceptance',
        paragraphs: [
          'Using this site, creating an account, or placing an order means you accept these terms in full. If you disagree with any part of them, please do not use the store.',
          'We may update these terms. The review date is shown at the top of this page, and the current version applies from the moment it is published.',
        ],
      },
      {
        heading: 'Your account',
        paragraphs: [
          'You are responsible for keeping your password safe and for activity carried out through your account.',
        ],
        bullets: [
          'The details you provide at sign-up must be accurate and current.',
          'Sharing a single account between several people is not permitted.',
          'If you suspect someone else has access to your account, change the password immediately.',
        ],
      },
      {
        heading: 'Pricing and orders',
        paragraphs: [
          'Prices are shown in Rial and include VAT. The final amount for an order is the one you confirmed at checkout, and it does not change afterwards.',
          'Placing an order does not guarantee stock. If an item becomes unavailable after you order, the order is cancelled and refunded in full.',
          'Where a price is obviously wrong (for example a ten-million item listed at ten thousand), we may cancel the order and refund it.',
        ],
      },
      {
        heading: 'Intellectual property',
        paragraphs: [
          'The text, design and code of this site belong to NextStore. Brand names and marks of the products we sell belong to their owners and are used only to identify goods.',
        ],
      },
      {
        heading: 'Limitation of liability',
        paragraphs: [
          'We work to keep product information accurate, but manufacturers may change specifications. Where an item clearly differs from its description, you can return it under our returns policy.',
        ],
      },
      {
        heading: 'Governing law',
        paragraphs: [
          'These terms are governed by the laws of the Islamic Republic of Iran, and disputes are handled by the competent authorities.',
        ],
      },
    ],
  },
}

/* =========================================================================
 * حریم خصوصی
 * ======================================================================= */

export const privacyContent: LocalizedContent<ContentPage> = {
  fa: {
    title: 'حریم خصوصی',
    subtitle:
      'چه اطلاعاتی جمع می‌کنیم، چرا جمع می‌کنیم و چطور از آن‌ها محافظت می‌کنیم.',
    updatedAt: 'آخرین بازنگری: شهریور ۱۴۰۵',
    sections: [
      {
        heading: 'چه اطلاعاتی جمع می‌کنیم',
        paragraphs: [
          'فقط داده‌هایی را نگه می‌داریم که برای انجام سفارش و پشتیبانی لازم‌اند:',
        ],
        bullets: [
          'نام، ایمیل و شماره تماس — برای ساخت حساب و اطلاع‌رسانی وضعیت سفارش.',
          'آدرس تحویل — برای ارسال کالا.',
          'سابقه‌ی سفارش — برای پیگیری، مرجوعی و گارانتی.',
          'شناسه‌ی نشست مهمان — تا سبد خرید کاربر واردنشده حفظ شود.',
        ],
      },
      {
        heading: 'چه چیزی را نگه نمی‌داریم',
        paragraphs: [
          'اطلاعات کارت بانکی شما هرگز روی سرورهای ما ذخیره نمی‌شود. پرداخت در درگاه بانک انجام می‌شود و ما فقط نتیجه‌ی تراکنش و شماره‌ی پیگیری را دریافت می‌کنیم.',
          'رمز عبور به‌صورت درهم‌سازی‌شده (hash) ذخیره می‌شود و حتی برای ما قابل بازیابی نیست؛ به همین دلیل در بازیابی رمز، رمز جدید می‌سازید نه اینکه رمز قبلی برایتان فرستاده شود.',
        ],
      },
      {
        heading: 'کوکی‌ها',
        paragraphs: [
          'از کوکی و حافظه‌ی محلی مرورگر برای نگه‌داشتن نشست ورود، زبان و تم انتخابی شما استفاده می‌کنیم. این موارد برای کارکرد سایت ضروری‌اند و برای ردیابی تبلیغاتی به کار نمی‌روند.',
        ],
      },
      {
        heading: 'اشتراک‌گذاری با دیگران',
        paragraphs: [
          'اطلاعات شما فروخته نمی‌شود. تنها در دو حالت با دیگران به اشتراک گذاشته می‌شود: با شرکت پست برای تحویل مرسوله (نام، آدرس و تلفن)، و با درگاه پرداخت برای انجام تراکنش.',
        ],
      },
      {
        heading: 'حقوق شما',
        bullets: [
          'می‌توانید اطلاعات حسابتان را در هر زمان از پنل کاربری ویرایش کنید.',
          'می‌توانید درخواست حذف حساب بدهید. سوابق مالی سفارش‌های گذشته طبق الزامات قانونی نگهداری می‌شوند اما از حساب شما جدا می‌گردند.',
          'می‌توانید عضویت خبرنامه را با یک کلیک لغو کنید.',
        ],
      },
      {
        heading: 'تماس درباره‌ی حریم خصوصی',
        paragraphs: [
          'برای هر پرسشی درباره‌ی داده‌هایتان می‌توانید از صفحه‌ی تماس با ما استفاده کنید.',
        ],
      },
    ],
  },

  en: {
    title: 'Privacy Policy',
    subtitle: 'What we collect, why we collect it, and how we protect it.',
    updatedAt: 'Last reviewed: September 2026',
    sections: [
      {
        heading: 'What we collect',
        paragraphs: [
          'We keep only the data needed to fulfil orders and support you:',
        ],
        bullets: [
          'Name, email and phone — to create your account and notify you about orders.',
          'Delivery address — to ship your items.',
          'Order history — for tracking, returns and warranty.',
          'A guest session id — so a logged-out visitor keeps their cart.',
        ],
      },
      {
        heading: 'What we never store',
        paragraphs: [
          'Your card details are never stored on our servers. Payment happens on the bank gateway and we only receive the transaction result and a reference number.',
          'Passwords are stored hashed and cannot be recovered even by us. That is why password recovery lets you set a new one rather than sending the old one.',
        ],
      },
      {
        heading: 'Cookies',
        paragraphs: [
          'We use cookies and browser storage to keep you signed in and to remember your language and theme. These are needed for the site to work and are not used for advertising tracking.',
        ],
      },
      {
        heading: 'Sharing with others',
        paragraphs: [
          'We do not sell your data. It is shared in only two cases: with the courier to deliver your parcel (name, address, phone), and with the payment gateway to process a transaction.',
        ],
      },
      {
        heading: 'Your rights',
        bullets: [
          'You can edit your account details at any time from your dashboard.',
          'You can request account deletion. Financial records of past orders are retained as the law requires, but are detached from your account.',
          'You can unsubscribe from the newsletter with one click.',
        ],
      },
      {
        heading: 'Privacy contact',
        paragraphs: [
          'For any question about your data, please use the contact page.',
        ],
      },
    ],
  },
}
