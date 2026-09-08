/**
 * محتوای صفحه‌ی پرسش‌های متداول
 * ---------------------------------------------------------------------------
 * ⚠️ پاسخ‌ها باید با رفتار *واقعی* سیستم بخوانند، نه با آنچه یک
 *    فروشگاه معمولی می‌گوید. چند نمونه که عمداً دقیق نوشته شده‌اند:
 *
 *      - سبد خرید کاربر مهمان با هدر X-Session-Id نگه داشته می‌شود
 *      - رمز عبور hash می‌شود و قابل بازیابی نیست
 *      - لغو سفارش فقط تا پیش از ارسال ممکن است (قواعد OrderStatus)
 *
 *    پاسخ نادرست در FAQ بدتر از نبودِ آن است: مشتری روی حرف صفحه
 *    حساب باز می‌کند و بعد سیستم چیز دیگری انجام می‌دهد.
 */

import type { LocalizedContent } from './types'

/** یک پرسش و پاسخ. */
export interface FaqItem {
  question: string
  answer: string
}

/** یک دسته‌ی پرسش. */
export interface FaqCategory {
  /** کلید پایدار برای state باز/بسته بودن — به متن وابسته نیست */
  key: string
  title: string
  items: FaqItem[]
}

export interface FaqContent {
  title: string
  subtitle: string
  categories: FaqCategory[]
}

export const faqContent: LocalizedContent<FaqContent> = {
  fa: {
    title: 'پرسش‌های متداول',
    subtitle: 'پاسخ کوتاه به چیزهایی که بیشتر پرسیده می‌شوند.',
    categories: [
      {
        key: 'orders',
        title: 'سفارش و پرداخت',
        items: [
          {
            question: 'بدون ثبت‌نام می‌توانم خرید کنم؟',
            answer:
              'می‌توانید محصولات را ببینید و به سبد اضافه کنید بدون اینکه وارد شوید؛ سبد شما با یک شناسه‌ی نشست در همان مرورگر نگه داشته می‌شود. اما برای ثبت نهایی سفارش باید وارد حساب شوید، چون سفارش به آدرس و سابقه‌ی پیگیری نیاز دارد.',
          },
          {
            question: 'چرا سبد خریدم پس از ورود عوض شد؟',
            answer:
              'وقتی وارد می‌شوید، سبد مهمانِ همان مرورگر با سبد حساب شما ادغام می‌شود. اگر کالایی در هر دو باشد، تعداد بیشتر در نظر گرفته می‌شود.',
          },
          {
            question: 'چه روش‌های پرداختی دارید؟',
            answer:
              'در این نسخه پرداخت از طریق یک درگاه شبیه‌سازی‌شده انجام می‌شود که هر دو نتیجه‌ی موفق و ناموفق را می‌توانید امتحان کنید. ساختار کد طوری نوشته شده که افزودن درگاه واقعی نیازی به تغییر منطق سفارش ندارد.',
          },
          {
            question: 'می‌توانم سفارشم را لغو کنم؟',
            answer:
              'تا پیش از ارسال، بله. دکمه‌ی لغو در صفحه‌ی سفارش نمایش داده می‌شود و با لغو، موجودی کالاها به انبار بازمی‌گردد. پس از ارسال، لغو ممکن نیست و باید از رویه‌ی بازگرداندن کالا استفاده کنید.',
          },
          {
            question: 'قیمت‌ها شامل مالیات هستند؟',
            answer:
              'بله. مالیات بر ارزش افزوده در خلاصه‌ی سفارش به‌صورت جداگانه نمایش داده می‌شود تا بدانید چه مبلغی بابت چیست، اما در مبلغ نهایی محاسبه شده است.',
          },
        ],
      },
      {
        key: 'shipping',
        title: 'ارسال و تحویل',
        items: [
          {
            question: 'ارسال چقدر طول می‌کشد؟',
            answer:
              'ارسال عادی ۳ تا ۵ روز کاری و ارسال سریع ۱ تا ۲ روز کاری. سفارش‌های ثبت‌شده تا ساعت ۱۴ همان روز کاری تحویل پست می‌شوند.',
          },
          {
            question: 'ارسال کی رایگان می‌شود؟',
            answer:
              'ارسال عادی برای سفارش‌های بالای ۵۰۰ هزار تومان رایگان است. ارسال سریع همیشه هزینه دارد، حتی بالای این مبلغ.',
          },
          {
            question: 'چطور مرسوله را پیگیری کنم؟',
            answer:
              'به‌محض ارسال، وضعیت سفارش به «ارسال شده» تغییر می‌کند و کد رهگیری در صفحه‌ی جزئیات سفارش نمایش داده می‌شود.',
          },
        ],
      },
      {
        key: 'returns',
        title: 'مرجوعی و گارانتی',
        items: [
          {
            question: 'تا چند روز می‌توانم کالا را پس بدهم؟',
            answer:
              'تا ۷ روز پس از تحویل، بدون نیاز به ذکر دلیل، به شرط سالم بودن کالا و بسته‌بندی. اگر کالا معیوب باشد این محدودیت اعمال نمی‌شود.',
          },
          {
            question: 'هزینه‌ی ارسال مرجوعی با کیست؟',
            answer:
              'اگر کالا معیوب یا اشتباه بوده، با ماست. اگر صرفاً نظرتان عوض شده، با شماست.',
          },
          {
            question: 'پول چه زمانی برمی‌گردد؟',
            answer:
              'پس از دریافت و بررسی کالا (حداکثر ۳ روز کاری)، مبلغ به همان روش پرداخت بازگردانده می‌شود. بسته به بانک ۲۴ تا ۷۲ ساعت طول می‌کشد.',
          },
        ],
      },
      {
        key: 'account',
        title: 'حساب کاربری',
        items: [
          {
            question: 'رمز عبورم را فراموش کرده‌ام.',
            answer:
              'از لینک «رمز عبور را فراموش کرده‌اید؟» در صفحه‌ی ورود استفاده کنید. رمز شما به‌صورت درهم‌سازی‌شده ذخیره می‌شود و حتی برای ما قابل خواندن نیست، به همین دلیل رمز جدید می‌سازید نه اینکه رمز قبلی برایتان فرستاده شود.',
          },
          {
            question: 'چند آدرس می‌توانم ثبت کنم؟',
            answer:
              'محدودیتی ندارد. یکی از آن‌ها را می‌توانید پیش‌فرض کنید تا در تسویه‌حساب خودکار انتخاب شود.',
          },
          {
            question: 'اطلاعات کارت بانکی‌ام ذخیره می‌شود؟',
            answer:
              'خیر. اطلاعات کارت هرگز به سرورهای ما نمی‌رسد؛ پرداخت در درگاه انجام می‌شود و ما فقط نتیجه‌ی تراکنش و شماره‌ی پیگیری را دریافت می‌کنیم.',
          },
        ],
      },
    ],
  },

  en: {
    title: 'Frequently Asked Questions',
    subtitle: 'Short answers to the things people ask most.',
    categories: [
      {
        key: 'orders',
        title: 'Orders and payment',
        items: [
          {
            question: 'Can I buy without registering?',
            answer:
              'You can browse and add items to a cart without signing in — your cart is kept against a session id in that browser. To place the order you do need an account, because an order needs an address and a tracking history.',
          },
          {
            question: 'Why did my cart change after signing in?',
            answer:
              'When you sign in, the guest cart from that browser is merged into your account cart. If an item exists in both, the larger quantity is kept.',
          },
          {
            question: 'Which payment methods do you support?',
            answer:
              'In this version payment goes through a simulated gateway where you can try both a successful and a failed result. The code is structured so that adding a real gateway needs no change to the order logic.',
          },
          {
            question: 'Can I cancel my order?',
            answer:
              'Before it ships, yes. A cancel button appears on the order page, and cancelling returns the stock to inventory. Once shipped, cancellation is not possible and you should use the returns process.',
          },
          {
            question: 'Do prices include tax?',
            answer:
              'Yes. VAT is shown separately in the order summary so you can see what you are paying for, but it is included in the final amount.',
          },
        ],
      },
      {
        key: 'shipping',
        title: 'Shipping and delivery',
        items: [
          {
            question: 'How long does delivery take?',
            answer:
              'Standard delivery takes 3 to 5 working days, express 1 to 2. Orders placed before 2pm go to the courier the same working day.',
          },
          {
            question: 'When is shipping free?',
            answer:
              'Standard shipping is free on orders above 500,000 Toman. Express shipping always costs, even above that amount.',
          },
          {
            question: 'How do I track my parcel?',
            answer:
              'As soon as it ships, the order status changes to “Shipped” and a tracking code appears on the order detail page.',
          },
        ],
      },
      {
        key: 'returns',
        title: 'Returns and warranty',
        items: [
          {
            question: 'How long do I have to return something?',
            answer:
              'Seven days from delivery, no reason needed, as long as the item and packaging are intact. If the item is faulty, that limit does not apply.',
          },
          {
            question: 'Who pays return shipping?',
            answer:
              'If the item was faulty or wrong, we do. If you simply changed your mind, you do.',
          },
          {
            question: 'When do I get my money back?',
            answer:
              'After we receive and inspect the item (up to 3 working days), we refund the original payment method. Depending on your bank it takes 24 to 72 hours.',
          },
        ],
      },
      {
        key: 'account',
        title: 'Your account',
        items: [
          {
            question: 'I forgot my password.',
            answer:
              'Use the “Forgot your password?” link on the sign-in page. Your password is stored hashed and is unreadable even to us, which is why you set a new one rather than being sent the old one.',
          },
          {
            question: 'How many addresses can I save?',
            answer:
              'There is no limit. You can mark one as default so it is selected automatically at checkout.',
          },
          {
            question: 'Do you store my card details?',
            answer:
              'No. Card details never reach our servers; payment happens on the gateway and we only receive the transaction result and a reference number.',
          },
        ],
      },
    ],
  },
}
