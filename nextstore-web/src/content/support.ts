/**
 * محتوای صفحات پشتیبانی: شیوه‌های ارسال و رویه‌ی بازگرداندن کالا
 * ---------------------------------------------------------------------------
 * ⚠️ اعداد این صفحه‌ها باید با منطق واقعی بک‌اند بخوانند، وگرنه صفحه
 *    به مشتری چیزی می‌گوید که سیستم انجام نمی‌دهد.
 *
 *    منبع حقیقت این اعداد `config/shop.php` در بک‌اند است:
 *        آستانه ارسال رایگان  ۵٬۰۰۰٬۰۰۰ ریال = ۵۰۰ هزار تومان
 *        ارسال عادی            ۵۰۰٬۰۰۰ ریال = ۵۰ هزار تومان
 *        ارسال سریع          ۱٬۲۰۰٬۰۰۰ ریال = ۱۲۰ هزار تومان
 *
 *    نسخه‌ی اول این فایل اعداد دیگری نوشته بود (۴۵ هزار تومان و
 *    آستانه‌ی ۵ میلیون تومان) که با هیچ‌کدام از سه جای بک‌اند
 *    نمی‌خواند. صفحه‌ای که به مشتری قیمتی می‌گوید و سیستم مبلغ
 *    دیگری می‌گیرد، از نبودِ آن صفحه بدتر است.
 *
 *    اگر روزی config/shop.php عوض شد، همین‌جا و نوار بالای سایت
 *    (کلید topbar.freeShipping) هم باید به‌روز شوند.
 */

import type { ContentPage, LocalizedContent } from './types'

/* =========================================================================
 * شیوه‌های ارسال
 * ======================================================================= */

export const shippingContent: LocalizedContent<ContentPage> = {
  fa: {
    title: 'شیوه‌های ارسال',
    subtitle: 'هزینه، زمان تحویل و نحوه‌ی پیگیری مرسوله.',
    sections: [
      {
        heading: 'روش‌های ارسال',
        paragraphs: [
          'هنگام تکمیل خرید یکی از دو روش زیر را انتخاب می‌کنید:',
        ],
        bullets: [
          'ارسال عادی — تحویل ۳ تا ۵ روز کاری، ۵۰ هزار تومان.',
          'ارسال سریع — تحویل ۱ تا ۲ روز کاری، ۱۲۰ هزار تومان.',
        ],
      },
      {
        heading: 'هزینه‌ی ارسال',
        paragraphs: [
          'ارسال عادی ۵۰ هزار تومان است و برای سفارش‌های بالای ۵۰۰ هزار تومان رایگان می‌شود.',
          'ارسال سریع ۱۲۰ هزار تومان است و — برخلاف ارسال عادی — بالای آستانه هم رایگان نمی‌شود، چون هزینه‌ی واقعی تحویل فوری را پوشش می‌دهد.',
          'مبلغ دقیق پیش از پرداخت در خلاصه‌ی سفارش نمایش داده می‌شود؛ هیچ هزینه‌ای پس از ثبت سفارش اضافه نمی‌شود.',
        ],
      },
      {
        heading: 'زمان آماده‌سازی',
        paragraphs: [
          'سفارش‌های ثبت‌شده تا ساعت ۱۴ در همان روز کاری آماده و تحویل پست می‌شوند. سفارش‌های بعد از آن، روز کاری بعد پردازش می‌شوند.',
          'روزهای تعطیل رسمی جزو روزهای کاری محاسبه نمی‌شوند.',
        ],
      },
      {
        heading: 'پیگیری مرسوله',
        paragraphs: [
          'به‌محض تحویل بسته به پست، وضعیت سفارش به «ارسال شده» تغییر می‌کند و کد رهگیری در صفحه‌ی جزئیات سفارش نمایش داده می‌شود. با همین کد می‌توانید مرسوله را در سامانه‌ی پست دنبال کنید.',
        ],
      },
      {
        heading: 'تحویل و بررسی',
        paragraphs: [
          'هنگام تحویل، بسته‌بندی را پیش از امضا بررسی کنید. اگر بسته آسیب آشکار دارد، از تحویل خودداری کنید و همان لحظه با پشتیبانی تماس بگیرید؛ پیگیری خسارت پس از امضای رسید بسیار دشوارتر است.',
        ],
      },
    ],
  },

  en: {
    title: 'Shipping',
    subtitle: 'Cost, delivery times and how to track your parcel.',
    sections: [
      {
        heading: 'Delivery options',
        paragraphs: ['At checkout you choose one of two options:'],
        bullets: [
          'Standard — 3 to 5 working days, 50,000 Toman.',
          'Express — 1 to 2 working days, 120,000 Toman.',
        ],
      },
      {
        heading: 'Shipping cost',
        paragraphs: [
          'Standard shipping costs 50,000 Toman and is free on orders above 500,000 Toman.',
          'Express shipping costs 120,000 Toman and — unlike standard — is never free, because it covers the real cost of urgent delivery.',
          'The exact amount appears in your order summary before payment; nothing is added after you place the order.',
        ],
      },
      {
        heading: 'Processing time',
        paragraphs: [
          'Orders placed before 2pm are prepared and handed to the courier the same working day. Later orders are processed the next working day.',
          'Public holidays do not count as working days.',
        ],
      },
      {
        heading: 'Tracking',
        paragraphs: [
          'As soon as the parcel reaches the courier, the order status changes to “Shipped” and a tracking code appears on the order detail page. You can follow the parcel with that code on the postal service site.',
        ],
      },
      {
        heading: 'On delivery',
        paragraphs: [
          'Check the packaging before you sign. If the box is visibly damaged, refuse the delivery and contact support straight away — claiming damage after signing is far harder.',
        ],
      },
    ],
  },
}

/* =========================================================================
 * رویه‌ی بازگرداندن کالا
 * ======================================================================= */

export const returnsContent: LocalizedContent<ContentPage> = {
  fa: {
    title: 'رویه بازگرداندن کالا',
    subtitle: 'شرایط مرجوعی، مهلت‌ها و نحوه‌ی بازگشت وجه.',
    sections: [
      {
        heading: 'مهلت مرجوعی',
        paragraphs: [
          'تا ۷ روز پس از تحویل می‌توانید کالا را بدون نیاز به ذکر دلیل مرجوع کنید، به شرط آنکه در وضعیت اولیه و همراه بسته‌بندی و لوازم جانبی باشد.',
        ],
      },
      {
        heading: 'کالاهای غیرقابل مرجوع',
        paragraphs: [
          'برخی اقلام به دلیل ماهیتشان قابل بازگشت نیستند:',
        ],
        bullets: [
          'محصولات آرایشی و بهداشتی که پلمب آن‌ها باز شده است.',
          'لباس زیر و جوراب.',
          'کالاهای سفارشی‌سازی‌شده به درخواست شما.',
        ],
      },
      {
        heading: 'کالای معیوب یا اشتباه',
        paragraphs: [
          'اگر کالای دریافتی معیوب است یا با سفارش شما مطابقت ندارد، محدودیت ۷ روز اعمال نمی‌شود و هزینه‌ی ارسال مرجوعی هم بر عهده‌ی ماست. کافی است از طریق صفحه‌ی تماس، شماره سفارش و توضیح مشکل را بفرستید.',
        ],
      },
      {
        heading: 'مراحل مرجوعی',
        bullets: [
          'درخواست خود را با شماره سفارش برای پشتیبانی بفرستید.',
          'پس از تأیید، کد مرجوعی و آدرس بازگشت برایتان ارسال می‌شود.',
          'کالا را با بسته‌بندی اصلی ارسال کنید.',
          'پس از دریافت و بررسی (حداکثر ۳ روز کاری)، وجه بازگردانده می‌شود.',
        ],
      },
      {
        heading: 'بازگشت وجه',
        paragraphs: [
          'مبلغ به همان روشی که پرداخت کرده‌اید بازمی‌گردد. بسته به بانک، بین ۲۴ تا ۷۲ ساعت طول می‌کشد تا در حساب شما بنشیند.',
          'وضعیت سفارش در این مدت به «بازگشت وجه» تغییر می‌کند و می‌توانید آن را در پنل کاربری ببینید.',
        ],
      },
    ],
  },

  en: {
    title: 'Returns',
    subtitle: 'Return conditions, deadlines and how refunds work.',
    sections: [
      {
        heading: 'Return window',
        paragraphs: [
          'You may return an item within 7 days of delivery without giving a reason, provided it is in its original condition with packaging and accessories.',
        ],
      },
      {
        heading: 'Items that cannot be returned',
        paragraphs: ['Some items cannot be returned because of their nature:'],
        bullets: [
          'Cosmetics and personal-care products with a broken seal.',
          'Underwear and socks.',
          'Items customised at your request.',
        ],
      },
      {
        heading: 'Faulty or incorrect items',
        paragraphs: [
          'If an item arrives faulty or does not match your order, the 7-day limit does not apply and we cover the return shipping. Just send us the order number and a description of the problem through the contact page.',
        ],
      },
      {
        heading: 'How to return',
        bullets: [
          'Send support your request with the order number.',
          'Once approved, you receive a return code and the return address.',
          'Ship the item in its original packaging.',
          'After we receive and inspect it (up to 3 working days), we refund you.',
        ],
      },
      {
        heading: 'Refunds',
        paragraphs: [
          'The money goes back the same way you paid. Depending on your bank it takes 24 to 72 hours to appear in your account.',
          'During this period the order status changes to “Refunded” and you can see it in your dashboard.',
        ],
      },
    ],
  },
}
