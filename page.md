لیست دقیق ۷۲ صفحه رودمپ
🏠 عمومی — ۱۹ از ۲۱ ✅
#	صفحه	مسیر	وضعیت
۱	صفحه اصلی	/[locale]	✅
۲	لیست محصولات	/products	✅
۳	جزئیات محصول	/products/[slug]	✅
۴	لیست دسته‌ها	/categories	✅
۵	صفحه دسته	/categories/[slug]	✅
۶	لیست برندها	/brands	✅
۷	صفحه برند	/brands/[slug]	✅
۸	جستجو	/search?q=	✅
۹	سبد خرید	/cart	✅
۱۰	مقایسه	/compare	❌
۱۱	بلاگ	/blog	✅
۱۲	مقاله	/blog/[slug]	✅
۱۳	دسته بلاگ	/blog/category/[slug]	✅
۱۴	درباره ما	/about	✅
۱۵	تماس با ما	/contact	✅
۱۶	سوالات متداول	/faq	✅
۱۷	قوانین	/terms	✅
۱۸	حریم خصوصی	/privacy	✅
۱۹	راهنمای ارسال	/shipping-info	✅
۲۰	۴۰۴	not-found.tsx	✅
۲۱	خطا	error.tsx	❌
🔐 احراز هویت — ۲ از ۵
#	صفحه	مسیر	وضعیت
۲۲	ورود	/login	✅
۲۳	ثبت‌نام	/register	✅
۲۴	فراموشی رمز	/forgot-password	❌
۲۵	بازیابی رمز	/reset-password	❌
۲۶	تایید کد OTP	/verify-otp	❌
💳 پرداخت — ۵ از ۵ ✅ (با ساختار متفاوت)
#	صفحه	مسیر رودمپ	وضعیت واقعی
۲۷	مرحله آدرس	/checkout	✅ CheckoutFlow گام ۱
۲۸	مرحله ارسال	/checkout/shipping	✅ گام ۲ (بدون روت مجزا)
۲۹	مرحله پرداخت	/checkout/payment	✅ گام ۳ (بدون روت مجزا)
۳۰	موفق	/checkout/success	✅ حالت داخل MockGateway
۳۱	ناموفق	/checkout/failed	✅ حالت داخل MockGateway
تصمیم آگاهانه: تسویه یک ویزارد تک‌مسیره است نه ۳ روت. عملکرد کامل است.

👤 پنل کاربری — ۸ از ۱۳
#	صفحه	مسیر	وضعیت
۳۲	داشبورد	/account	✅
۳۳	سفارش‌ها	/account/orders	✅
۳۴	جزئیات سفارش	/account/orders/[id]	✅
۳۵	آدرس‌ها	/account/addresses	✅
۳۶	علاقه‌مندی	/account/wishlist	✅
۳۷	نظرات من	/account/reviews	✅
۳۸	تیکت‌ها	/account/tickets	❌ (بک‌اند آماده، بی‌روت)
۳۹	تیکت جدید	/account/tickets/new	❌
۴۰	مکالمه تیکت	/account/tickets/[id]	❌
۴۱	اعلان‌ها	/account/notifications	❌
۴۲	کیف پول	/account/wallet	❌
۴۳	پروفایل	/account/profile	✅
۴۴	امنیت	/account/security	✅
👑 پنل مدیریت — ۱۰ از ۲۸ (بزرگ‌ترین شکاف)
#	صفحه	مسیر	وضعیت
۴۵	داشبورد	/admin	✅
۴۶	محصولات	/admin/products	✅
۴۷	محصول جدید	/admin/products/new	✅
۴۸	ویرایش محصول	/admin/products/[slug]	✅
۴۹	تنوع محصول	/admin/products/[id]/variants	❌
۵۰	دسته‌بندی‌ها	/admin/categories	✅
۵۱	برندها	/admin/brands	✅
۵۲	ویژگی‌ها	/admin/attributes	❌
۵۳	سفارش‌ها	/admin/orders	✅
۵۴	جزئیات سفارش	/admin/orders/[id]	✅
۵۵	مشتریان	/admin/customers	❌
۵۶	پروفایل مشتری	/admin/customers/[id]	❌
۵۷	کدهای تخفیف	/admin/coupons	❌
۵۸	روش‌های ارسال	/admin/shipping	❌
۵۹	بنرها	/admin/banners	❌
۶۰	مقالات	/admin/posts	✅
۶۱	مقاله جدید/ویرایش	/admin/posts/new · [id]	✅
۶۲	نظرات	/admin/reviews	❌ ← API آماده است!
۶۳	تیکت‌ها	/admin/tickets	❌
۶۴	صفحات استاتیک	/admin/pages	❌
۶۵	مدیریت رسانه	/admin/media	❌
۶۶	گزارش فروش	/admin/reports/sales	❌
۶۷	گزارش محصولات	/admin/reports/products	❌
۶۸	گزارش مشتریان	/admin/reports/customers	❌
۶۹	کاربران	/admin/users	❌
۷۰	نقش‌ها	/admin/roles	❌
۷۱	تنظیمات عمومی	/admin/settings	❌
۷۲	تنظیمات پرداخت/سئو	/admin/settings/*	❌
جمع: ۴۴ از ۷۲ صفحه