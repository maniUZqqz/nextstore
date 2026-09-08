# 🛍️ رودمپ کامل پروژه فروشگاه اینترنتی (نمونه‌کار حرفه‌ای)

> **Backend:** Laravel 11 (API-Only) · **Frontend:** Next.js 15 + React 19 + TypeScript
> **ویژگی‌ها:** دوزبانه (فارسی/انگلیسی) · RTL/LTR · دارک‌مود/لایت‌مود · کاملاً ریسپانسیو · کامنت‌گذاری کامل

---

## 📑 فهرست مطالب

| # | بخش |
|---|-----|
| ۰ | خلاصه اجرایی و اهداف |
| ۱ | استک تکنولوژی کامل |
| ۲ | معماری کلی سیستم |
| ۳ | ساختار پوشه‌بندی پروژه |
| ۴ | طراحی دیتابیس (ERD کامل) |
| ۵ | نقشه کامل API |
| ۶ | لیست کامل صفحات |
| ۷ | کتابخانه کامپوننت‌ها |
| ۸ | سیستم دوزبانه و RTL |
| ۹ | سیستم تم (دارک/لایت) |
| ۱۰ | استراتژی ریسپانسیو |
| ۱۱ | استاندارد کامنت‌گذاری |
| ۱۲ | فازبندی زمانی (۱۴ هفته) |
| ۱۳ | تست، امنیت، پرفورمنس، SEO |
| ۱۴ | دیپلوی و DevOps |
| ۱۵ | چک‌لیست نهایی تحویل |
| ۱۶ | 🎨 دیزاین‌سیستم (رنگ، تایپوگرافی، فاصله، موشن) |
| ۱۷ | ⭐ برش عمودی کامل — یک فیچر از مایگریشن تا کامپوننت |
| ۱۸ | لایه ارتباط با API و مدیریت خطا |
| ۱۹ | استراتژی مدیریت State (چه چیزی کجا) |
| ۲۰ | گیت، کامیت و جریان کار |
| ۲۱ | README حرفه‌ای (اسکلت آماده) |
| ۲۲ | ارائه نمونه‌کار و نکات مصاحبه |
| ۲۳ | اشتباهات رایج (از این‌ها پرهیز کن) |
| ۲۴ | تعریف «انجام‌شده» (Definition of Done) |

> 🔥 **اگر وقت کم داری:** بخش **۱۷ (برش عمودی)** و بخش **۲۴ (DoD)** را بخوان.
> این دو، الگو و چک‌لیست ساخت کل پروژه‌اند؛ بقیه بخش‌ها مرجع‌اند.

---

## ۰. خلاصه اجرایی و اهداف

### 🎯 هدف پروژه
ساخت یک **فروشگاه اینترنتی Full-Stack** به‌عنوان نمونه‌کار (Portfolio) که تمام قابلیت‌های یک فروشگاه واقعی را داشته باشد و بتوان آن را در رزومه، GitHub و مصاحبه‌های فنی ارائه کرد.

### 📌 چرا این پروژه؟
- نمایش تسلط بر **Backend (Laravel)** و **Frontend (Next.js)** به‌صورت هم‌زمان
- نمایش درک از **معماری Headless / API-First**
- نمایش توانایی در **i18n، a11y، Performance، SEO**
- نمایش **تمیزنویسی کد** و مستندسازی

### 🏷️ نام پیشنهادی پروژه
`NextStore` — در ادامه از همین نام استفاده می‌کنیم.

### 📦 خروجی نهایی

| خروجی | توضیح |
|-------|-------|
| ریپازیتوری Backend | `nextstore-api` (Laravel) |
| ریپازیتوری Frontend | `nextstore-web` (Next.js) |
| مستندات API | Swagger / Scribe |
| دموی آنلاین | Vercel (فرانت) + VPS/Liara (بک) |
| README حرفه‌ای | با اسکرین‌شات، ویدیو، توضیح معماری |
| Postman Collection | مجموعه کامل درخواست‌ها |

---

## ۱. استک تکنولوژی کامل

### 🔧 Backend — Laravel

| ابزار | نسخه | کاربرد |
|-------|------|--------|
| **PHP** | 8.3+ | زبان اصلی |
| **Laravel** | 11.x | فریم‌ورک اصلی (API-Only) |
| **MySQL** | 8.0+ | دیتابیس اصلی |
| **Redis** | 7.x | کش، صف، سشن، Rate Limit |
| **Laravel Sanctum** | 4.x | احراز هویت توکنی |
| **Spatie Permission** | 6.x | مدیریت نقش و دسترسی |
| **Spatie MediaLibrary** | 11.x | مدیریت تصاویر و فایل‌ها |
| **Spatie Translatable** | 6.x | چندزبانه کردن مدل‌ها |
| **Spatie QueryBuilder** | 6.x | فیلتر/سورت/Include داینامیک |
| **Laravel Scout + Meilisearch** | – | جستجوی سریع محصولات |
| **Laravel Horizon** | 5.x | مانیتورینگ صف‌ها |
| **Laravel Telescope** | 5.x | دیباگ (فقط local) |
| **Intervention Image** | 3.x | ریسایز و بهینه‌سازی تصویر |
| **Maatwebsite Excel** | 3.x | خروجی Excel گزارش‌ها |
| **Barryvdh DomPDF** | 3.x | تولید فاکتور PDF |
| **Pest PHP** | 3.x | تست‌نویسی |
| **Larastan (PHPStan)** | 2.x | تحلیل استاتیک کد |
| **Laravel Pint** | 1.x | فرمت‌کننده کد |
| **Scribe** | 4.x | تولید خودکار مستندات API |

### 🎨 Frontend — Next.js

| ابزار | نسخه | کاربرد |
|-------|------|--------|
| **Next.js** | 15.x | فریم‌ورک React (App Router) |
| **React** | 19.x | کتابخانه UI |
| **TypeScript** | 5.6+ | تایپ‌سیفتی |
| **Tailwind CSS** | 4.x | استایل‌دهی Utility-First |
| **shadcn/ui** | latest | کامپوننت‌های آماده قابل شخصی‌سازی |
| **Radix UI** | latest | پرایمیتیوهای Accessible |
| **next-intl** | 3.x | بین‌المللی‌سازی (i18n) |
| **next-themes** | 0.4.x | مدیریت دارک/لایت مود |
| **TanStack Query** | 5.x | مدیریت State سرور |
| **Zustand** | 5.x | مدیریت State کلاینت |
| **React Hook Form** | 7.x | مدیریت فرم‌ها |
| **Zod** | 3.x | اعتبارسنجی اسکیما |
| **Axios** | 1.x | HTTP Client با Interceptor |
| **Framer Motion** | 11.x | انیمیشن‌ها |
| **Embla Carousel** | 8.x | اسلایدرها |
| **Lucide React** | latest | آیکون‌ها |
| **Recharts** | 2.x | نمودارهای پنل ادمین |
| **Sonner** | 1.x | نوتیفیکیشن Toast |
| **date-fns + date-fns-jalali** | 3.x | تاریخ میلادی و شمسی |
| **Vitest + Testing Library** | – | تست یونیت و کامپوننت |
| **Playwright** | 1.x | تست E2E |
| **ESLint + Prettier** | – | لینت و فرمت |

### 🔤 فونت‌ها

| زبان | فونت | منبع |
|------|------|------|
| فارسی | **Vazirmatn** | `next/font/local` |
| انگلیسی | **Inter** | `next/font/google` |
| اعداد/کد | **JetBrains Mono** | `next/font/google` |

---

## ۲. معماری کلی سیستم

```
┌───────────────────────────────────────────────────────────────────┐
│                          کاربر / مرورگر                            │
└────────────────────────────┬──────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌───────────────────────────────────────────────────────────────────┐
│                     Next.js 15 (Frontend)                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐    │
│  │ App Router  │  │ Server       │  │ Client Components      │    │
│  │ /[locale]/  │  │ Components   │  │ (Zustand + TanStack)   │    │
│  └─────────────┘  └──────────────┘  └────────────────────────┘    │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐    │
│  │ Middleware  │  │ next-intl    │  │ next-themes            │    │
│  │ locale+auth │  │ (fa/en)      │  │ (dark/light)           │    │
│  └─────────────┘  └──────────────┘  └────────────────────────┘    │
└────────────────────────────┬──────────────────────────────────────┘
                             │ REST API (JSON) + Bearer Token
                             ▼
┌───────────────────────────────────────────────────────────────────┐
│                    Laravel 11 (Backend API)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐  │
│  │ Routes   │→│Middleware│→│Controller│→│ Service  │→│ Model   │  │
│  │ api.php  │ │ auth/lang│ │ (thin)   │ │ (logic)  │ │ Eloquent│  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └─────────┘  │
│       ↓                          ↓            ↓                    │
│  ┌──────────┐            ┌──────────────┐ ┌──────────────┐        │
│  │ Requests │            │ API Resources│ │ Repositories │        │
│  │(Validate)│            │ (Transform)  │ │  (Queries)   │        │
│  └──────────┘            └──────────────┘ └──────────────┘        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │  Events  │ │Listeners │ │   Jobs   │ │  Mails   │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
└──────┬──────────────┬──────────────┬──────────────┬───────────────┘
       ▼              ▼              ▼              ▼
  ┌─────────┐   ┌─────────┐   ┌───────────┐   ┌──────────┐
  │ MySQL 8 │   │ Redis 7 │   │Meilisearch│   │ S3/Local │
  │ (Data)  │   │(Cache/Q)│   │ (Search)  │   │ (Files)  │
  └─────────┘   └─────────┘   └───────────┘   └──────────┘
```

### 🔑 اصول معماری

| اصل | توضیح |
|-----|-------|
| **API-First** | بک‌اند فقط JSON برمی‌گرداند، هیچ Blade ای ندارد |
| **Thin Controller** | کنترلر فقط هماهنگ‌کننده است، منطق در Service |
| **Repository Pattern** | جداسازی کوئری‌های پیچیده از مدل |
| **DTO / Data Objects** | انتقال داده تایپ‌شده بین لایه‌ها |
| **Resource Transformer** | خروجی API همیشه از طریق Resource |
| **Event-Driven** | ثبت سفارش → Event → Listeners (ایمیل، SMS، کاهش موجودی) |
| **Queue for Heavy Tasks** | ارسال ایمیل/SMS/پردازش تصویر در صف |
| **Cache Layer** | کش محصولات، دسته‌بندی‌ها، تنظیمات |

### 🔄 جریان داده (مثال: ثبت سفارش)

```
[Frontend] کاربر «ثبت سفارش» می‌زند
    │
    ├─▶ POST /api/v1/orders  (با Bearer Token)
    │
[Laravel] OrderController@store
    │
    ├─▶ StoreOrderRequest  ✔ اعتبارسنجی ورودی
    ├─▶ OrderService::create()
    │       ├─ DB::beginTransaction()
    │       ├─ بررسی موجودی هر آیتم
    │       ├─ محاسبه قیمت + تخفیف + مالیات + هزینه ارسال
    │       ├─ ساخت Order + OrderItems
    │       ├─ کاهش موجودی انبار
    │       ├─ خالی کردن سبد خرید
    │       ├─ DB::commit()
    │       └─ event(new OrderPlaced($order))
    │              ├─▶ SendOrderEmailListener   (Queue)
    │              ├─▶ SendOrderSmsListener     (Queue)
    │              └─▶ NotifyAdminListener      (Queue)
    │
    ├─▶ new OrderResource($order)  → JSON استاندارد
    │
[Frontend] دریافت پاسخ → ریدایرکت به درگاه پرداخت
```

---

## ۳. ساختار پوشه‌بندی پروژه

### 📁 Backend — `nextstore-api/`

```
nextstore-api/
├── app/
│   ├── Console/Commands/
│   │   ├── SyncSearchIndexCommand.php      # همگام‌سازی ایندکس جستجو
│   │   ├── CleanExpiredCartsCommand.php    # پاک‌سازی سبدهای منقضی
│   │   └── GenerateSitemapCommand.php      # تولید نقشه سایت
│   │
│   ├── DTOs/                               # اشیاء انتقال داده
│   │   ├── CartItemData.php
│   │   ├── OrderData.php
│   │   └── ProductFilterData.php
│   │
│   ├── Enums/                              # مقادیر ثابت تایپ‌شده
│   │   ├── OrderStatus.php                 # pending/paid/shipped/...
│   │   ├── PaymentStatus.php
│   │   ├── PaymentGateway.php              # zarinpal/idpay/stripe
│   │   ├── UserRole.php                    # admin/manager/customer
│   │   ├── DiscountType.php                # percent/fixed
│   │   └── ProductStatus.php               # draft/active/archived
│   │
│   ├── Events/
│   │   ├── OrderPlaced.php
│   │   ├── OrderStatusChanged.php
│   │   ├── PaymentSucceeded.php
│   │   ├── ProductLowStock.php
│   │   └── ReviewSubmitted.php
│   │
│   ├── Exceptions/
│   │   ├── Handler.php                     # تبدیل خطاها به JSON
│   │   ├── InsufficientStockException.php
│   │   ├── InvalidCouponException.php
│   │   └── PaymentFailedException.php
│   │
│   ├── Http/
│   │   ├── Controllers/Api/V1/
│   │   │   ├── Auth/
│   │   │   │   ├── RegisterController.php
│   │   │   │   ├── LoginController.php
│   │   │   │   ├── LogoutController.php
│   │   │   │   ├── OtpController.php            # ورود با کد یکبارمصرف
│   │   │   │   ├── PasswordResetController.php
│   │   │   │   ├── EmailVerificationController.php
│   │   │   │   └── SocialAuthController.php     # گوگل/گیت‌هاب
│   │   │   │
│   │   │   ├── Shop/                            # عمومی (بدون احراز هویت)
│   │   │   │   ├── HomeController.php           # داده‌های صفحه اصلی
│   │   │   │   ├── ProductController.php
│   │   │   │   ├── CategoryController.php
│   │   │   │   ├── BrandController.php
│   │   │   │   ├── SearchController.php
│   │   │   │   ├── ReviewController.php
│   │   │   │   ├── BlogController.php
│   │   │   │   ├── PageController.php           # صفحات استاتیک
│   │   │   │   ├── BannerController.php
│   │   │   │   ├── ContactController.php
│   │   │   │   ├── NewsletterController.php
│   │   │   │   └── SettingController.php        # تنظیمات عمومی سایت
│   │   │   │
│   │   │   ├── Customer/                        # نیازمند احراز هویت
│   │   │   │   ├── ProfileController.php
│   │   │   │   ├── AddressController.php
│   │   │   │   ├── CartController.php
│   │   │   │   ├── WishlistController.php
│   │   │   │   ├── CompareController.php
│   │   │   │   ├── CheckoutController.php
│   │   │   │   ├── OrderController.php
│   │   │   │   ├── PaymentController.php
│   │   │   │   ├── ReviewController.php
│   │   │   │   ├── TicketController.php
│   │   │   │   ├── NotificationController.php
│   │   │   │   └── WalletController.php
│   │   │   │
│   │   │   └── Admin/                           # نیازمند نقش ادمین
│   │   │       ├── DashboardController.php
│   │   │       ├── ProductController.php
│   │   │       ├── ProductVariantController.php
│   │   │       ├── CategoryController.php
│   │   │       ├── BrandController.php
│   │   │       ├── AttributeController.php
│   │   │       ├── OrderController.php
│   │   │       ├── CustomerController.php
│   │   │       ├── CouponController.php
│   │   │       ├── ShippingMethodController.php
│   │   │       ├── BannerController.php
│   │   │       ├── BlogController.php
│   │   │       ├── ReviewController.php
│   │   │       ├── TicketController.php
│   │   │       ├── PageController.php
│   │   │       ├── SettingController.php
│   │   │       ├── UserController.php
│   │   │       ├── RoleController.php
│   │   │       ├── MediaController.php
│   │   │       └── ReportController.php
│   │   │
│   │   ├── Middleware/
│   │   │   ├── SetLocale.php               # تنظیم زبان از هدر Accept-Language
│   │   │   ├── EnsureIsAdmin.php           # بررسی نقش ادمین
│   │   │   ├── ForceJsonResponse.php       # همیشه JSON برگردان
│   │   │   ├── ApiRateLimiter.php          # محدودیت تعداد درخواست
│   │   │   └── CheckMaintenanceMode.php
│   │   │
│   │   ├── Requests/                       # اعتبارسنجی ورودی
│   │   │   ├── Auth/  · RegisterRequest · LoginRequest · ResetPasswordRequest
│   │   │   ├── Customer/ · UpdateProfileRequest · StoreAddressRequest
│   │   │   │              · AddToCartRequest · CheckoutRequest · StoreReviewRequest
│   │   │   └── Admin/ · StoreProductRequest · UpdateProductRequest
│   │   │               · StoreCategoryRequest · StoreCouponRequest
│   │   │               · UpdateOrderStatusRequest
│   │   │
│   │   └── Resources/                      # تبدیل مدل به JSON
│   │       ├── ProductResource.php
│   │       ├── ProductDetailResource.php
│   │       ├── ProductVariantResource.php
│   │       ├── CategoryResource.php
│   │       ├── CategoryTreeResource.php
│   │       ├── BrandResource.php
│   │       ├── CartResource.php
│   │       ├── OrderResource.php
│   │       ├── OrderDetailResource.php
│   │       ├── UserResource.php
│   │       ├── AddressResource.php
│   │       ├── ReviewResource.php
│   │       ├── CouponResource.php
│   │       ├── BlogPostResource.php
│   │       └── NotificationResource.php
│   │
│   ├── Jobs/
│   │   ├── SendOrderConfirmationEmail.php
│   │   ├── SendOtpSms.php
│   │   ├── ProcessProductImages.php
│   │   ├── UpdateSearchIndex.php
│   │   ├── GenerateInvoicePdf.php
│   │   └── SendAbandonedCartReminder.php
│   │
│   ├── Listeners/
│   │   ├── DecreaseProductStock.php
│   │   ├── SendOrderNotifications.php
│   │   ├── UpdateCouponUsage.php
│   │   └── NotifyAdminOnLowStock.php
│   │
│   ├── Mail/
│   │   ├── OrderConfirmationMail.php
│   │   ├── OrderShippedMail.php
│   │   ├── WelcomeMail.php
│   │   └── PasswordResetMail.php
│   │
│   ├── Models/
│   │   ├── User.php            ├── Address.php        ├── Category.php
│   │   ├── Brand.php           ├── Product.php        ├── ProductVariant.php
│   │   ├── ProductImage.php    ├── Attribute.php      ├── AttributeValue.php
│   │   ├── Cart.php            ├── CartItem.php       ├── Order.php
│   │   ├── OrderItem.php       ├── Payment.php        ├── Transaction.php
│   │   ├── ShippingMethod.php  ├── Coupon.php         ├── Review.php
│   │   ├── Wishlist.php        ├── Banner.php         ├── BlogPost.php
│   │   ├── BlogCategory.php    ├── Comment.php        ├── Page.php
│   │   ├── Setting.php         ├── Ticket.php         ├── TicketMessage.php
│   │   ├── Wallet.php          ├── Notification.php   ├── Province.php
│   │   └── City.php            └── Newsletter.php
│   │
│   ├── Observers/
│   │   ├── ProductObserver.php             # کش‌زدایی، ساخت slug
│   │   ├── OrderObserver.php               # تولید شماره سفارش
│   │   └── ReviewObserver.php              # بروزرسانی میانگین امتیاز
│   │
│   ├── Policies/
│   │   ├── ProductPolicy.php  ├── OrderPolicy.php
│   │   └── ReviewPolicy.php   └── AddressPolicy.php
│   │
│   ├── Repositories/
│   │   ├── Contracts/ · ProductRepositoryInterface · OrderRepositoryInterface
│   │   ├── ProductRepository.php
│   │   ├── OrderRepository.php
│   │   └── CategoryRepository.php
│   │
│   ├── Services/                           # منطق تجاری
│   │   ├── Auth/      · AuthService · OtpService
│   │   ├── Cart/      · CartService · CartCalculatorService
│   │   ├── Order/     · OrderService · OrderStatusService · InvoiceService
│   │   ├── Payment/   · PaymentManager
│   │   │              └── Gateways/ · PaymentGatewayInterface
│   │   │                            · ZarinpalGateway · IdPayGateway · StripeGateway
│   │   ├── Product/   · ProductService · InventoryService · PricingService
│   │   ├── Shipping/  · ShippingCalculatorService
│   │   ├── Discount/  · CouponService
│   │   ├── Notification/ · SmsService · EmailService
│   │   ├── Media/     · ImageService
│   │   └── Report/    · AnalyticsService
│   │
│   ├── Support/
│   │   ├── ApiResponse.php                 # فرمت یکسان پاسخ API
│   │   ├── SlugGenerator.php
│   │   ├── PriceFormatter.php
│   │   └── Helpers.php
│   │
│   └── Traits/
│       ├── HasSlug.php  ├── HasUuid.php
│       └── Filterable.php  └── ApiResponseTrait.php
│
├── config/
│   ├── shop.php                            # تنظیمات اختصاصی فروشگاه
│   ├── payment.php                         # کلیدهای درگاه‌ها
│   ├── sms.php
│   └── locales.php                         # زبان‌های پشتیبانی‌شده
│
├── database/
│   ├── factories/                          # داده تستی
│   ├── migrations/                         # ~۳۵ فایل
│   └── seeders/
│       ├── DatabaseSeeder.php
│       ├── RolePermissionSeeder.php
│       ├── CategorySeeder.php
│       ├── BrandSeeder.php
│       ├── AttributeSeeder.php
│       ├── ProductSeeder.php               # ۲۰۰+ محصول نمونه
│       ├── ProvinceCitySeeder.php          # استان و شهرهای ایران
│       ├── SettingSeeder.php
│       └── DemoOrderSeeder.php
│
├── lang/
│   ├── fa/ · validation.php · messages.php · orders.php · errors.php
│   └── en/ · (همان ساختار)
│
├── routes/
│   ├── api.php                             # بارگذاری فایل‌های زیر
│   └── api/v1/ · auth.php · shop.php · customer.php · admin.php
│
├── tests/
│   ├── Feature/ · Auth · Shop · Cart · Order · Admin
│   └── Unit/    · Services · Support
│
├── .env.example
├── phpstan.neon
├── pint.json
└── README.md
```

### 📁 Frontend — `nextstore-web/`

```
nextstore-web/
├── messages/                               # فایل‌های ترجمه
│   ├── fa.json
│   └── en.json
│
├── public/
│   ├── fonts/ · Vazirmatn-Regular.woff2 · Vazirmatn-Medium.woff2
│   │           · Vazirmatn-Bold.woff2
│   ├── images/ · logo-light.svg · logo-dark.svg · placeholder.webp
│   │            · empty-states/
│   ├── icons/
│   ├── favicon.ico
│   ├── manifest.json                       # PWA
│   └── robots.txt
│
├── src/
│   ├── app/
│   │   ├── [locale]/                       # مسیر زبان‌محور
│   │   │   ├── layout.tsx                  # ⭐ لایوت ریشه (فونت، تم، RTL)
│   │   │   ├── page.tsx                    # 🏠 صفحه اصلی
│   │   │   ├── loading.tsx                 # اسکلتون بارگذاری
│   │   │   ├── error.tsx                   # مدیریت خطا
│   │   │   ├── not-found.tsx               # صفحه ۴۰۴
│   │   │   │
│   │   │   ├── (shop)/                     # گروه مسیر فروشگاه
│   │   │   │   ├── layout.tsx              # Header + Footer
│   │   │   │   ├── products/
│   │   │   │   │   ├── page.tsx            # لیست محصولات + فیلتر
│   │   │   │   │   ├── loading.tsx
│   │   │   │   │   └── [slug]/
│   │   │   │   │       ├── page.tsx        # جزئیات محصول
│   │   │   │   │       ├── loading.tsx
│   │   │   │   │       └── opengraph-image.tsx
│   │   │   │   ├── categories/ · page.tsx · [slug]/page.tsx
│   │   │   │   ├── brands/     · page.tsx · [slug]/page.tsx
│   │   │   │   ├── search/page.tsx
│   │   │   │   ├── cart/page.tsx
│   │   │   │   ├── compare/page.tsx
│   │   │   │   ├── blog/ · page.tsx · [slug]/page.tsx
│   │   │   │   │          · category/[slug]/page.tsx
│   │   │   │   ├── about/page.tsx
│   │   │   │   ├── contact/page.tsx
│   │   │   │   ├── faq/page.tsx
│   │   │   │   ├── terms/page.tsx
│   │   │   │   ├── privacy/page.tsx
│   │   │   │   └── shipping-info/page.tsx
│   │   │   │
│   │   │   ├── (auth)/                     # گروه مسیر احراز هویت
│   │   │   │   ├── layout.tsx              # لایوت ساده وسط‌چین
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   ├── forgot-password/page.tsx
│   │   │   │   ├── reset-password/page.tsx
│   │   │   │   └── verify-otp/page.tsx
│   │   │   │
│   │   │   ├── checkout/                   # فرآیند پرداخت (لایوت مجزا)
│   │   │   │   ├── layout.tsx              # بدون هدر شلوغ
│   │   │   │   ├── page.tsx                # مرحله ۱: آدرس
│   │   │   │   ├── shipping/page.tsx       # مرحله ۲: روش ارسال
│   │   │   │   ├── payment/page.tsx        # مرحله ۳: پرداخت
│   │   │   │   ├── success/page.tsx
│   │   │   │   └── failed/page.tsx
│   │   │   │
│   │   │   ├── account/                    # پنل کاربری
│   │   │   │   ├── layout.tsx              # سایدبار کاربر
│   │   │   │   ├── page.tsx                # داشبورد
│   │   │   │   ├── orders/ · page.tsx · [id]/page.tsx
│   │   │   │   ├── addresses/page.tsx
│   │   │   │   ├── wishlist/page.tsx
│   │   │   │   ├── reviews/page.tsx
│   │   │   │   ├── tickets/ · page.tsx · new/page.tsx · [id]/page.tsx
│   │   │   │   ├── notifications/page.tsx
│   │   │   │   ├── wallet/page.tsx
│   │   │   │   ├── profile/page.tsx
│   │   │   │   └── security/page.tsx
│   │   │   │
│   │   │   └── admin/                      # پنل مدیریت
│   │   │       ├── layout.tsx              # سایدبار ادمین
│   │   │       ├── page.tsx                # داشبورد + نمودارها
│   │   │       ├── products/ · page.tsx · new/page.tsx
│   │   │       │              · [id]/page.tsx · [id]/variants/page.tsx
│   │   │       ├── categories/page.tsx
│   │   │       ├── brands/page.tsx
│   │   │       ├── attributes/page.tsx
│   │   │       ├── orders/ · page.tsx · [id]/page.tsx
│   │   │       ├── customers/ · page.tsx · [id]/page.tsx
│   │   │       ├── coupons/page.tsx
│   │   │       ├── shipping/page.tsx
│   │   │       ├── banners/page.tsx
│   │   │       ├── blog/ · page.tsx · new/page.tsx · [id]/page.tsx
│   │   │       ├── reviews/page.tsx
│   │   │       ├── tickets/page.tsx
│   │   │       ├── pages/page.tsx
│   │   │       ├── media/page.tsx
│   │   │       ├── reports/ · sales · products · customers
│   │   │       ├── users/page.tsx
│   │   │       ├── roles/page.tsx
│   │   │       └── settings/ · page.tsx · payment · shipping · seo
│   │   │
│   │   ├── api/                            # Route Handler های Next
│   │   │   ├── revalidate/route.ts         # ISR On-Demand
│   │   │   └── og/route.tsx                # تصویر OG
│   │   │
│   │   ├── sitemap.ts                      # نقشه سایت داینامیک
│   │   ├── robots.ts
│   │   ├── manifest.ts
│   │   └── globals.css                     # ⭐ متغیرهای CSS تم
│   │
│   ├── components/
│   │   ├── ui/                             # shadcn/ui (پرایمیتیو)
│   │   │   button · input · select · dialog · sheet · dropdown-menu
│   │   │   tabs · accordion · badge · card · skeleton · table
│   │   │   pagination · slider · checkbox · radio-group · switch
│   │   │   tooltip · popover · avatar · separator · textarea · toast
│   │   │
│   │   ├── layout/
│   │   │   ├── header/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── TopBar.tsx              # نوار بالایی
│   │   │   │   ├── MainNav.tsx             # منوی اصلی دسکتاپ
│   │   │   │   ├── MegaMenu.tsx            # منوی چندسطحی دسته‌بندی
│   │   │   │   ├── MobileNav.tsx           # منوی کشویی موبایل
│   │   │   │   ├── SearchBar.tsx           # جستجو با پیشنهاد زنده
│   │   │   │   ├── CartButton.tsx          # آیکون سبد + تعداد
│   │   │   │   ├── CartDrawer.tsx          # کشوی سبد خرید
│   │   │   │   ├── UserMenu.tsx
│   │   │   │   ├── LocaleSwitcher.tsx      # ⭐ تعویض زبان
│   │   │   │   └── ThemeToggle.tsx         # ⭐ تعویض تم
│   │   │   ├── footer/
│   │   │   │   ├── Footer.tsx · FooterLinks.tsx · NewsletterForm.tsx
│   │   │   │   └── SocialLinks.tsx · TrustBadges.tsx
│   │   │   ├── BottomNav.tsx               # ناوبری پایین موبایل
│   │   │   ├── Breadcrumb.tsx
│   │   │   ├── ScrollToTop.tsx
│   │   │   └── AnnouncementBar.tsx
│   │   │
│   │   ├── home/
│   │   │   HeroSlider · CategoryGrid · FeaturedProducts · FlashSale
│   │   │   BestSellers · NewArrivals · BrandCarousel · PromoBanners
│   │   │   BlogSection · TestimonialSlider · FeatureHighlights
│   │   │
│   │   ├── product/
│   │   │   ProductCard · ProductCardSkeleton · ProductGrid · ProductList
│   │   │   ProductGallery · ProductInfo · ProductPrice
│   │   │   ProductVariantSelector · AddToCartButton · QuantitySelector
│   │   │   WishlistButton · CompareButton · ShareButtons · ProductTabs
│   │   │   ProductSpecs · RelatedProducts · RecentlyViewed
│   │   │   StockBadge · QuickViewModal
│   │   │
│   │   ├── filters/
│   │   │   FilterSidebar · FilterDrawer · PriceRangeFilter · CategoryFilter
│   │   │   BrandFilter · AttributeFilter · RatingFilter · AvailabilityFilter
│   │   │   SortDropdown · ActiveFilters · ViewToggle
│   │   │
│   │   ├── cart/
│   │   │   CartItem · CartSummary · CouponForm · EmptyCart · CartTable
│   │   │
│   │   ├── checkout/
│   │   │   CheckoutStepper · AddressForm · AddressSelector
│   │   │   ShippingMethods · PaymentMethods · OrderSummary · OrderConfirmation
│   │   │
│   │   ├── review/
│   │   │   ReviewList · ReviewCard · ReviewForm · RatingStars
│   │   │   RatingSummary · ReviewImageUpload
│   │   │
│   │   ├── account/
│   │   │   AccountSidebar · OrderCard · OrderTimeline · AddressCard
│   │   │   ProfileForm · PasswordForm · StatsCards · TicketThread
│   │   │
│   │   ├── admin/
│   │   │   AdminSidebar · AdminHeader · DataTable · DataTableToolbar
│   │   │   StatCard · SalesChart · RevenueChart · TopProductsTable
│   │   │   RecentOrdersTable · ProductForm · VariantMatrix · ImageUploader
│   │   │   RichTextEditor · CategoryTreeSelect · OrderStatusSelect
│   │   │   BulkActions · ExportButton
│   │   │
│   │   ├── common/
│   │   │   Container · Section · SectionHeader · EmptyState · ErrorState
│   │   │   LoadingSpinner · Price · LocalizedDate ⭐ · LocalizedNumber ⭐
│   │   │   OptimizedImage · Rating · Countdown · CopyButton
│   │   │   ConfirmDialog · InfiniteScroll · SeoJsonLd
│   │   │
│   │   └── providers/
│   │       ├── Providers.tsx               # ⭐ ترکیب همه Providerها
│   │       ├── ThemeProvider.tsx
│   │       ├── QueryProvider.tsx
│   │       ├── AuthProvider.tsx
│   │       └── DirectionProvider.tsx       # مدیریت RTL/LTR
│   │
│   ├── hooks/
│   │   useCart · useWishlist · useCompare · useAuth · useProducts
│   │   useProductFilters · useDebounce · useMediaQuery · useLocalStorage
│   │   useDirection ⭐ · useClickOutside · useIntersectionObserver
│   │   useCountdown · useRecentlyViewed
│   │
│   ├── lib/
│   │   ├── api/ · client.ts ⭐ · endpoints.ts · products.ts · categories.ts
│   │   │          · cart.ts · orders.ts · auth.ts · reviews.ts · admin.ts
│   │   ├── utils/ · cn.ts · format-price.ts · format-date.ts
│   │   │           · format-number.ts · slugify.ts · validators.ts · seo.ts
│   │   ├── validations/ · auth.schema · address.schema · checkout.schema
│   │   │                 · product.schema · review.schema
│   │   └── constants/ · routes.ts · config.ts · order-status.ts
│   │
│   ├── store/                              # Zustand
│   │   cart-store · wishlist-store · compare-store
│   │   ui-store · recently-viewed-store
│   │
│   ├── types/
│   │   product · category · cart · order · user · api · index
│   │
│   ├── styles/
│   │   ├── themes.css                      # ⭐ متغیرهای دارک/لایت
│   │   └── fonts.css
│   │
│   ├── i18n/
│   │   ├── routing.ts                      # ⭐ تنظیمات مسیر زبان
│   │   ├── request.ts                      # ⭐ بارگذاری پیام‌ها
│   │   └── navigation.ts                   # Link/router زبان‌آگاه
│   │
│   └── middleware.ts                       # ⭐ زبان + محافظت مسیر
│
├── tests/ · unit · components · e2e
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── playwright.config.ts
├── vitest.config.ts
└── README.md
```

---

## ۴. طراحی دیتابیس (ERD کامل)

### 🗺️ نمودار روابط

```
users ──┬──< addresses                 categories ──< categories (parent_id)
        ├──< orders ──< order_items         │
        ├──< carts  ──< cart_items          └──< products >── brands
        ├──< reviews                              │
        ├──< wishlists                            ├──< product_variants ──< variant_attribute_value
        ├──< tickets ──< ticket_messages          ├──< product_images
        ├──< wallet ──< transactions              ├──< reviews
        └──< notifications                        └──> attributes ──< attribute_values

orders ──> shipping_methods    orders ──> coupons    orders ──< payments
provinces ──< cities ──< addresses
blog_categories ──< blog_posts ──< comments
```

### 📋 جداول اصلی

#### ۱) `users` — کاربران
| ستون | نوع | توضیح |
|------|-----|-------|
| id | bigint PK | شناسه |
| name | string | نام کامل |
| email | string unique nullable | ایمیل |
| phone | string(11) unique nullable | موبایل |
| password | string nullable | رمز (هش) |
| avatar | string nullable | مسیر تصویر |
| email_verified_at | timestamp nullable | تایید ایمیل |
| phone_verified_at | timestamp nullable | تایید موبایل |
| national_code | string(10) nullable | کد ملی |
| birth_date | date nullable | تاریخ تولد |
| gender | enum(male,female,other) nullable | جنسیت |
| preferred_locale | enum(fa,en) default fa | **زبان پیش‌فرض کاربر** |
| preferred_theme | enum(light,dark,system) default system | **تم پیش‌فرض** |
| is_active | boolean default true | فعال/غیرفعال |
| last_login_at | timestamp nullable | آخرین ورود |
| created_at / updated_at / deleted_at | timestamps | SoftDeletes |

#### ۲) `categories` — دسته‌بندی (درختی)
| ستون | نوع | توضیح |
|------|-----|-------|
| id | bigint PK | |
| parent_id | bigint FK nullable → categories.id | دسته والد |
| name | **json** | `{"fa":"موبایل","en":"Mobile"}` |
| slug | string unique | نامک URL |
| description | json nullable | توضیح دوزبانه |
| icon | string nullable | آیکون |
| image | string nullable | تصویر |
| meta_title / meta_description | json nullable | سئو دوزبانه |
| order | int default 0 | ترتیب نمایش |
| is_active | boolean default true | |
| is_featured | boolean default false | نمایش در صفحه اصلی |

#### ۳) `brands` — برندها
`id` · `name (json)` · `slug` · `logo` · `description (json)` · `website` · `is_active` · `order`

#### ۴) `products` — محصولات
| ستون | نوع | توضیح |
|------|-----|-------|
| id | bigint PK | |
| category_id | FK → categories | دسته اصلی |
| brand_id | FK nullable → brands | برند |
| name | **json** | نام دوزبانه |
| slug | string unique | |
| sku | string unique | کد کالا |
| short_description | json nullable | خلاصه |
| description | json nullable | توضیح کامل (HTML) |
| specifications | json nullable | مشخصات فنی دوزبانه |
| price | decimal(15,0) | قیمت پایه (تومان) |
| compare_price | decimal(15,0) nullable | قیمت قبل تخفیف |
| cost_price | decimal(15,0) nullable | قیمت خرید (فقط ادمین) |
| stock | int default 0 | موجودی |
| low_stock_threshold | int default 5 | آستانه هشدار |
| weight | decimal(8,2) nullable | وزن (گرم) |
| status | enum(draft,active,archived) | وضعیت |
| has_variants | boolean default false | تنوع دارد؟ |
| is_featured | boolean default false | ویژه |
| views_count | int default 0 | بازدید |
| sales_count | int default 0 | فروش |
| rating_avg | decimal(2,1) default 0 | میانگین امتیاز |
| rating_count | int default 0 | تعداد نظر |
| published_at | timestamp nullable | زمان انتشار |
| meta_title / meta_description | json nullable | سئو |

> **ایندکس‌ها:** `slug`, `sku`, `status+published_at`, `category_id+status`, `price`, `is_featured`

#### ۵) `product_variants` — تنوع محصول
`id` · `product_id FK` · `sku unique` · `price` · `compare_price` · `stock` · `image` · `is_active`

#### ۶) `attributes` / `attribute_values` — ویژگی‌ها
- `attributes`: `id` · `name (json)` · `slug` · `type (select|color|text)` · `is_filterable` · `order`
- `attribute_values`: `id` · `attribute_id FK` · `value (json)` · `color_hex nullable` · `order`
- `variant_attribute_value` (pivot): `variant_id` · `attribute_value_id`
- `product_attribute_value` (pivot): `product_id` · `attribute_value_id`

#### ۷) `product_images`
`id` · `product_id FK` · `path` · `alt (json)` · `order` · `is_primary`

#### ۸) `carts` / `cart_items` — سبد خرید
- `carts`: `id` · `user_id FK nullable` · `session_id nullable` (مهمان) · `expires_at`
- `cart_items`: `id` · `cart_id FK` · `product_id FK` · `variant_id FK nullable` · `quantity` · `price_snapshot`

#### ۹) `orders` — سفارش‌ها
| ستون | نوع | توضیح |
|------|-----|-------|
| id | bigint PK | |
| order_number | string unique | مثل `NS-14040615-0042` |
| user_id | FK → users | |
| status | enum | pending / paid / processing / shipped / delivered / cancelled / refunded |
| payment_status | enum(unpaid,paid,refunded,partially_refunded) | |
| shipping_method_id | FK | روش ارسال |
| coupon_id | FK nullable | کد تخفیف |
| subtotal | decimal(15,0) | جمع کالاها |
| discount_amount | decimal(15,0) default 0 | تخفیف |
| shipping_cost | decimal(15,0) default 0 | هزینه ارسال |
| tax_amount | decimal(15,0) default 0 | مالیات |
| total | decimal(15,0) | مبلغ نهایی |
| shipping_address | **json** | اسنپ‌شات آدرس |
| tracking_code | string nullable | کد رهگیری پستی |
| customer_note | text nullable | یادداشت مشتری |
| admin_note | text nullable | یادداشت ادمین |
| locale | enum(fa,en) | **زبان ثبت سفارش (برای ایمیل/فاکتور)** |
| paid_at / shipped_at / delivered_at / cancelled_at | timestamp nullable | |

#### ۱۰) `order_items`
`id` · `order_id FK` · `product_id FK` · `variant_id FK nullable` · `product_name (json snapshot)` · `sku` · `price` · `quantity` · `total`

#### ۱۱) `payments` / `transactions`
- `payments`: `id` · `order_id FK` · `gateway (zarinpal|idpay|stripe|wallet|cod)` · `amount` · `authority` · `ref_id` · `status` · `paid_at` · `raw_response (json)`
- `transactions`: `id` · `wallet_id FK` · `type (deposit|withdraw)` · `amount` · `balance_after` · `description` · `reference`

#### ۱۲) `coupons` — کد تخفیف
`id` · `code unique` · `type (percent|fixed)` · `value` · `min_order_amount` · `max_discount_amount` · `usage_limit` · `usage_limit_per_user` · `used_count` · `starts_at` · `expires_at` · `is_active`
+ pivot: `coupon_product`, `coupon_category`, `coupon_user`

#### ۱۳) `shipping_methods`
`id` · `name (json)` · `description (json)` · `cost` · `free_above nullable` · `estimated_days` · `is_active` · `order`

#### ۱۴) `addresses`
`id` · `user_id FK` · `title` · `receiver_name` · `receiver_phone` · `province_id FK` · `city_id FK` · `postal_code` · `address_line` · `plaque` · `unit` · `lat/lng nullable` · `is_default`

#### ۱۵) `provinces` / `cities`
- `provinces`: `id` · `name (json)`
- `cities`: `id` · `province_id FK` · `name (json)`

#### ۱۶) `reviews` — نظرات
`id` · `user_id FK` · `product_id FK` · `order_id FK nullable` (خرید تاییدشده) · `rating (1-5)` · `title` · `comment` · `pros (json)` · `cons (json)` · `images (json)` · `is_approved` · `is_verified_purchase` · `helpful_count`

#### ۱۷) `wishlists`
`id` · `user_id FK` · `product_id FK` · unique(user_id, product_id)

#### ۱۸) `banners`
`id` · `title (json)` · `image_desktop` · `image_mobile` · `link` · `position (hero|sidebar|middle|footer)` · `order` · `is_active` · `starts_at` · `ends_at`

#### ۱۹) `blog_categories` / `blog_posts` / `comments`
- `blog_posts`: `id` · `blog_category_id FK` · `user_id FK` · `title (json)` · `slug` · `excerpt (json)` · `content (json)` · `cover_image` · `views_count` · `is_published` · `published_at` · `meta_* (json)`
- `comments`: `id` · `commentable_type/id (morph)` · `user_id FK` · `parent_id nullable` · `body` · `is_approved`

#### ۲۰) `pages` — صفحات استاتیک
`id` · `title (json)` · `slug` · `content (json)` · `meta_* (json)` · `is_active`

#### ۲۱) `settings`
`id` · `key unique` · `value (json)` · `group (general|seo|payment|shipping|social)`

#### ۲۲) `tickets` / `ticket_messages`
- `tickets`: `id` · `user_id FK` · `order_id FK nullable` · `subject` · `department` · `priority (low|normal|high)` · `status (open|answered|closed)`
- `ticket_messages`: `id` · `ticket_id FK` · `user_id FK` · `message` · `attachments (json)` · `is_admin`

#### ۲۳) `wallets`
`id` · `user_id FK unique` · `balance decimal(15,0)` · `is_active`

#### ۲۴) `notifications` (جدول استاندارد لاراول)
`id (uuid)` · `type` · `notifiable_type/id` · `data (json)` · `read_at`

#### ۲۵) `newsletters`
`id` · `email unique` · `is_active` · `verified_at`

#### ۲۶) جداول Spatie
`roles` · `permissions` · `model_has_roles` · `model_has_permissions` · `role_has_permissions` · `media`

### 🌐 استراتژی چندزبانگی در دیتابیس

**روش انتخابی: ستون JSON** (Spatie Translatable)

```php
// app/Models/Product.php
use Spatie\Translatable\HasTranslations;

class Product extends Model
{
    use HasTranslations;

    /** ستون‌هایی که چندزبانه هستند و به‌صورت JSON ذخیره می‌شوند */
    public array $translatable = [
        'name', 'short_description', 'description',
        'specifications', 'meta_title', 'meta_description',
    ];
}

// در دیتابیس:  {"fa": "گوشی سامسونگ", "en": "Samsung Phone"}
// خواندن:      $product->name              → بر اساس app()->getLocale()
// خواندن خاص:  $product->getTranslation('name', 'en')
```

**چرا JSON و نه جدول جداگانه؟**
| مزیت | توضیح |
|------|-------|
| بدون JOIN | سرعت بالاتر در لیست محصولات |
| ساده‌تر | یک مدل، یک جدول |
| MySQL 8 | پشتیبانی native از ایندکس JSON |
| Fallback خودکار | اگر ترجمه نبود، زبان پیش‌فرض |

---

## ۵. نقشه کامل API

### 🔧 قرارداد پاسخ استاندارد

```jsonc
// موفق - تکی
{ "success": true, "message": "...", "data": { } }

// موفق - لیست صفحه‌بندی‌شده
{
  "success": true,
  "data": [ ],
  "meta": { "current_page": 1, "last_page": 10, "per_page": 20, "total": 195 },
  "links": { "first": "...", "prev": null, "next": "..." }
}

// خطای اعتبارسنجی (422)
{
  "success": false,
  "message": "داده‌های ارسالی نامعتبر است.",
  "errors": { "email": ["ایمیل الزامی است."] }
}

// خطای عمومی (4xx/5xx)
{ "success": false, "message": "...", "code": "INSUFFICIENT_STOCK" }
```

### 🔑 هدرهای مشترک

```http
Accept: application/json
Content-Type: application/json
Accept-Language: fa            # ⭐ تعیین زبان پاسخ (fa | en)
Authorization: Bearer {token}  # برای مسیرهای محافظت‌شده
X-Currency: IRT                # اختیاری - واحد پول
```

### 🔐 Auth — `/api/v1/auth`

| متد | مسیر | توضیح |
|-----|------|-------|
| POST | `/register` | ثبت‌نام با ایمیل/موبایل |
| POST | `/login` | ورود با رمز |
| POST | `/otp/send` | ارسال کد یکبارمصرف |
| POST | `/otp/verify` | تایید کد و دریافت توکن |
| POST | `/logout` | خروج (باطل کردن توکن) |
| POST | `/refresh` | تمدید توکن |
| POST | `/forgot-password` | ارسال لینک بازیابی |
| POST | `/reset-password` | تنظیم رمز جدید |
| POST | `/email/verify/{id}/{hash}` | تایید ایمیل |
| GET | `/social/{provider}/redirect` | ریدایرکت به گوگل/گیت‌هاب |
| GET | `/social/{provider}/callback` | بازگشت از OAuth |
| GET | `/me` 🔒 | اطلاعات کاربر جاری |

### 🏪 Shop (عمومی) — `/api/v1`

| متد | مسیر | توضیح |
|-----|------|-------|
| GET | `/home` | همه داده‌های صفحه اصلی در یک درخواست |
| GET | `/products` | لیست + فیلتر + سورت + صفحه‌بندی |
| GET | `/products/{slug}` | جزئیات کامل محصول |
| GET | `/products/{slug}/related` | محصولات مرتبط |
| GET | `/products/{slug}/reviews` | نظرات محصول |
| GET | `/categories` | لیست تخت |
| GET | `/categories/tree` | ساختار درختی (برای مگامنو) |
| GET | `/categories/{slug}` | جزئیات + محصولات دسته |
| GET | `/categories/{slug}/filters` | فیلترهای موجود در آن دسته |
| GET | `/brands` | لیست برندها |
| GET | `/brands/{slug}` | جزئیات + محصولات برند |
| GET | `/search?q=` | جستجوی کامل |
| GET | `/search/suggestions?q=` | پیشنهاد زنده (autocomplete) |
| GET | `/banners?position=hero` | بنرها |
| GET | `/blog/posts` | لیست مقالات |
| GET | `/blog/posts/{slug}` | جزئیات مقاله |
| GET | `/blog/categories` | دسته‌های بلاگ |
| GET | `/pages/{slug}` | صفحه استاتیک (درباره ما، قوانین...) |
| GET | `/settings` | تنظیمات عمومی سایت |
| GET | `/provinces` | استان‌ها |
| GET | `/provinces/{id}/cities` | شهرهای استان |
| GET | `/shipping-methods` | روش‌های ارسال |
| POST | `/contact` | فرم تماس با ما |
| POST | `/newsletter/subscribe` | عضویت خبرنامه |

**پارامترهای فیلتر `/products`:**
```
?filter[category]=mobile
&filter[brand]=samsung,apple
&filter[price_min]=1000000&filter[price_max]=50000000
&filter[attributes][color]=red,blue
&filter[rating_min]=4
&filter[in_stock]=1
&filter[on_sale]=1
&sort=-created_at        # newest | -price | price | -sales_count | -rating_avg
&include=brand,category,images
&page=1&per_page=24
```

### 👤 Customer (نیازمند توکن) — `/api/v1`

| متد | مسیر | توضیح |
|-----|------|-------|
| GET/PUT | `/profile` | مشاهده/ویرایش پروفایل |
| POST | `/profile/avatar` | آپلود آواتار |
| PUT | `/profile/password` | تغییر رمز |
| PUT | `/profile/preferences` | زبان و تم پیش‌فرض |
| GET/POST | `/addresses` | لیست/افزودن آدرس |
| PUT/DELETE | `/addresses/{id}` | ویرایش/حذف |
| PATCH | `/addresses/{id}/default` | تنظیم به‌عنوان پیش‌فرض |
| GET | `/cart` | مشاهده سبد |
| POST | `/cart/items` | افزودن به سبد |
| PATCH | `/cart/items/{id}` | تغییر تعداد |
| DELETE | `/cart/items/{id}` | حذف آیتم |
| DELETE | `/cart` | خالی کردن سبد |
| POST | `/cart/merge` | ادغام سبد مهمان با کاربر |
| POST | `/cart/coupon` | اعمال کد تخفیف |
| DELETE | `/cart/coupon` | حذف کد تخفیف |
| GET/POST/DELETE | `/wishlist` | علاقه‌مندی‌ها |
| GET/POST/DELETE | `/compare` | مقایسه محصولات |
| POST | `/checkout/validate` | اعتبارسنجی قبل ثبت |
| POST | `/checkout/shipping-cost` | محاسبه هزینه ارسال |
| GET | `/orders` | لیست سفارش‌ها |
| GET | `/orders/{id}` | جزئیات سفارش |
| POST | `/orders` | ثبت سفارش |
| POST | `/orders/{id}/cancel` | لغو سفارش |
| GET | `/orders/{id}/invoice` | دانلود فاکتور PDF |
| POST | `/payments/initiate` | شروع پرداخت → لینک درگاه |
| GET | `/payments/verify` | تایید بازگشت از درگاه |
| GET/POST | `/reviews` | نظرات من / ثبت نظر |
| POST | `/reviews/{id}/helpful` | مفید بود |
| GET/POST | `/tickets` | تیکت‌ها |
| GET | `/tickets/{id}` | مکالمه تیکت |
| POST | `/tickets/{id}/reply` | پاسخ به تیکت |
| GET | `/notifications` | اعلان‌ها |
| PATCH | `/notifications/{id}/read` | خوانده شد |
| PATCH | `/notifications/read-all` | همه خوانده شد |
| GET | `/wallet` | موجودی کیف پول |
| GET | `/wallet/transactions` | تراکنش‌ها |
| POST | `/wallet/charge` | شارژ کیف پول |

### 🛠️ Admin (نیازمند نقش) — `/api/v1/admin`

| متد | مسیر | توضیح |
|-----|------|-------|
| GET | `/dashboard/stats` | کارت‌های آماری |
| GET | `/dashboard/charts?range=30d` | داده نمودارها |
| GET | `/dashboard/recent-orders` | آخرین سفارش‌ها |
| GET | `/dashboard/low-stock` | محصولات رو به اتمام |
| — | `/products` | CRUD کامل + `POST /bulk-action` |
| POST | `/products/{id}/images` | آپلود تصاویر |
| — | `/products/{id}/variants` | CRUD تنوع‌ها |
| — | `/categories` | CRUD + `POST /reorder` |
| — | `/brands` · `/attributes` · `/coupons` | CRUD |
| — | `/shipping-methods` · `/banners` · `/pages` | CRUD |
| GET | `/orders` | لیست با فیلتر پیشرفته |
| GET | `/orders/{id}` | جزئیات |
| PATCH | `/orders/{id}/status` | تغییر وضعیت |
| PATCH | `/orders/{id}/tracking` | ثبت کد رهگیری |
| GET | `/customers` | لیست مشتریان |
| GET | `/customers/{id}` | پروفایل + تاریخچه خرید |
| PATCH | `/customers/{id}/toggle-active` | فعال/غیرفعال |
| GET | `/reviews?status=pending` | نظرات در انتظار |
| PATCH | `/reviews/{id}/approve` | تایید نظر |
| — | `/blog/posts` · `/blog/categories` | CRUD |
| GET | `/tickets` | تیکت‌های پشتیبانی |
| GET/PUT | `/settings` | تنظیمات سایت |
| — | `/users` · `/roles` | مدیریت کاربران و نقش‌ها |
| GET | `/media` · POST/DELETE | مدیریت فایل‌ها |
| GET | `/reports/sales?from=&to=` | گزارش فروش |
| GET | `/reports/products` | پرفروش‌ترین‌ها |
| GET | `/reports/customers` | مشتریان برتر |
| GET | `/reports/export?type=orders` | خروجی Excel |

### 🪝 Webhooks — `/api/webhooks`
`POST /payment/{gateway}` · `POST /shipping/{provider}`

### 🚦 Rate Limiting

| گروه | محدودیت |
|------|---------|
| مسیرهای عمومی | ۶۰ درخواست / دقیقه |
| ورود و ثبت‌نام | ۵ درخواست / دقیقه |
| ارسال OTP | ۳ درخواست / ۵ دقیقه |
| جستجو | ۳۰ درخواست / دقیقه |
| مسیرهای ادمین | ۱۲۰ درخواست / دقیقه |

---

## ۶. لیست کامل صفحات

> علامت‌ها: 🌐 عمومی · 🔒 نیازمند ورود · 👑 نیازمند نقش ادمین
> رندر: **SSG** ایستا · **ISR** بازتولید دوره‌ای · **SSR** سمت سرور · **CSR** سمت کلاینت

### 🏠 بخش عمومی فروشگاه (۲۱ صفحه)

| # | صفحه | مسیر | رندر | محتوای صفحه |
|---|------|------|------|-------------|
| ۱ | **صفحه اصلی** | `/[locale]` | ISR (۶۰ ثانیه) | اسلایدر هیرو · گرید دسته‌بندی · فروش ویژه با تایمر · محصولات ویژه · پرفروش‌ترین‌ها · جدیدترین‌ها · بنرهای تبلیغاتی · کاروسل برند · آخرین مقالات · نظرات مشتریان · ویژگی‌های فروشگاه |
| ۲ | **لیست محصولات** | `/products` | SSR | سایدبار فیلتر · مرتب‌سازی · تغییر نمای گرید/لیست · چیپ فیلترهای فعال · صفحه‌بندی یا اسکرول بی‌نهایت · اسکلتون لودینگ |
| ۳ | **جزئیات محصول** | `/products/[slug]` | ISR (۳۰۰ ثانیه) | گالری با زوم · انتخاب تنوع (رنگ/سایز) · قیمت + تخفیف · دکمه سبد + تعداد · علاقه‌مندی + مقایسه · اشتراک‌گذاری · تب توضیحات/مشخصات/نظرات · نمودار امتیاز · فرم ثبت نظر · محصولات مرتبط · بازدیدهای اخیر · JSON-LD |
| ۴ | **لیست دسته‌ها** | `/categories` | SSG | کارت همه دسته‌ها با تصویر و تعداد محصول |
| ۵ | **صفحه دسته** | `/categories/[slug]` | ISR | بنر دسته · زیردسته‌ها · محصولات + فیلتر · توضیح سئویی |
| ۶ | **لیست برندها** | `/brands` | SSG | گرید لوگو برندها + جستجوی حرفی |
| ۷ | **صفحه برند** | `/brands/[slug]` | ISR | لوگو · معرفی · محصولات برند |
| ۸ | **جستجو** | `/search?q=` | SSR | نتایج · تصحیح غلط املایی · فیلترها · «چیزی یافت نشد» + پیشنهاد |
| ۹ | **سبد خرید** | `/cart` | CSR | جدول اقلام · تغییر تعداد · حذف · کد تخفیف · خلاصه مبلغ · سبد خالی · پیشنهاد محصول |
| ۱۰ | **مقایسه** | `/compare` | CSR | جدول مقایسه ویژگی‌ها (تا ۴ محصول) |
| ۱۱ | **بلاگ** | `/blog` | ISR | کارت مقالات · دسته‌بندی · جستجو · صفحه‌بندی |
| ۱۲ | **مقاله** | `/blog/[slug]` | ISR | محتوا · فهرست مطالب · نویسنده · اشتراک‌گذاری · نظرات · مقالات مرتبط |
| ۱۳ | **دسته بلاگ** | `/blog/category/[slug]` | ISR | مقالات آن دسته |
| ۱۴ | **درباره ما** | `/about` | SSG | داستان برند · تیم · آمار · تایم‌لاین |
| ۱۵ | **تماس با ما** | `/contact` | SSG | فرم · نقشه · اطلاعات تماس · شبکه‌های اجتماعی |
| ۱۶ | **سوالات متداول** | `/faq` | SSG | آکاردئون دسته‌بندی‌شده + جستجو |
| ۱۷ | **قوانین** | `/terms` | SSG | متن قوانین |
| ۱۸ | **حریم خصوصی** | `/privacy` | SSG | سیاست حریم خصوصی |
| ۱۹ | **راهنمای ارسال** | `/shipping-info` | SSG | روش‌ها · هزینه‌ها · زمان تحویل |
| ۲۰ | **۴۰۴** | `not-found.tsx` | Static | تصویر · لینک بازگشت · جستجو |
| ۲۱ | **خطا** | `error.tsx` | Static | پیام خطا · دکمه تلاش مجدد |

### 🔐 احراز هویت (۵ صفحه) 🌐

| # | صفحه | مسیر | محتوا |
|---|------|------|-------|
| ۲۲ | **ورود** | `/login` | ایمیل/موبایل + رمز · «مرا به خاطر بسپار» · ورود با کد یکبارمصرف · ورود با گوگل · لینک ثبت‌نام |
| ۲۳ | **ثبت‌نام** | `/register` | نام · موبایل/ایمیل · رمز + تکرار · قدرت رمز · پذیرش قوانین |
| ۲۴ | **فراموشی رمز** | `/forgot-password` | ورودی ایمیل/موبایل + ارسال لینک |
| ۲۵ | **بازیابی رمز** | `/reset-password` | رمز جدید + تکرار |
| ۲۶ | **تایید کد** | `/verify-otp` | ۶ خانه OTP · تایمر ۱۲۰ ثانیه · ارسال مجدد |

### 💳 فرآیند پرداخت (۵ صفحه) 🔒

| # | صفحه | مسیر | محتوا |
|---|------|------|-------|
| ۲۷ | **مرحله ۱: آدرس** | `/checkout` | انتخاب آدرس ذخیره‌شده · افزودن آدرس جدید · نشانگر مراحل |
| ۲۸ | **مرحله ۲: ارسال** | `/checkout/shipping` | روش‌های ارسال + هزینه + زمان تحویل · یادداشت سفارش |
| ۲۹ | **مرحله ۳: پرداخت** | `/checkout/payment` | درگاه‌ها · کیف پول · پرداخت در محل · خلاصه نهایی |
| ۳۰ | **موفق** | `/checkout/success` | انیمیشن تیک · شماره سفارش · جزئیات · دانلود فاکتور |
| ۳۱ | **ناموفق** | `/checkout/failed` | علت خطا · تلاش مجدد · بازگشت به سبد |

### 👤 پنل کاربری (۱۲ صفحه) 🔒

| # | صفحه | مسیر | محتوا |
|---|------|------|-------|
| ۳۲ | **داشبورد** | `/account` | کارت‌های آمار (سفارش‌ها، در انتظار، علاقه‌مندی، کیف پول) · آخرین سفارش‌ها · اعلان‌ها |
| ۳۳ | **سفارش‌ها** | `/account/orders` | فیلتر وضعیت · جستجو · کارت سفارش |
| ۳۴ | **جزئیات سفارش** | `/account/orders/[id]` | تایم‌لاین وضعیت · اقلام · آدرس · فاکتور PDF · کد رهگیری · لغو سفارش |
| ۳۵ | **آدرس‌ها** | `/account/addresses` | کارت آدرس‌ها · افزودن/ویرایش/حذف · تنظیم پیش‌فرض |
| ۳۶ | **علاقه‌مندی** | `/account/wishlist` | گرید محصولات · انتقال به سبد |
| ۳۷ | **نظرات من** | `/account/reviews` | نظرات ثبت‌شده · در انتظار تایید · محصولات قابل نظردهی |
| ۳۸ | **تیکت‌ها** | `/account/tickets` | لیست + وضعیت |
| ۳۹ | **تیکت جدید** | `/account/tickets/new` | موضوع · دپارتمان · اولویت · پیوست |
| ۴۰ | **مکالمه تیکت** | `/account/tickets/[id]` | نمای چت · پاسخ |
| ۴۱ | **اعلان‌ها** | `/account/notifications` | لیست · خوانده‌شدن |
| ۴۲ | **کیف پول** | `/account/wallet` | موجودی · شارژ · تراکنش‌ها |
| ۴۳ | **پروفایل** | `/account/profile` | اطلاعات شخصی · آواتار · **زبان پیش‌فرض** · **تم پیش‌فرض** |
| ۴۴ | **امنیت** | `/account/security` | تغییر رمز · دستگاه‌های فعال · خروج از همه |

### 👑 پنل مدیریت (۲۸ صفحه)

| # | صفحه | مسیر | محتوا |
|---|------|------|-------|
| ۴۵ | **داشبورد** | `/admin` | ۴ کارت KPI (فروش امروز/ماه، سفارش، مشتری جدید) · نمودار فروش · نمودار درآمد · پرفروش‌ترین‌ها · آخرین سفارش‌ها · هشدار موجودی کم |
| ۴۶ | **محصولات** | `/admin/products` | جدول با فیلتر/سورت/جستجو · عملیات گروهی · وضعیت · موجودی |
| ۴۷ | **محصول جدید** | `/admin/products/new` | فرم چندتبی: اطلاعات پایه (fa/en) · قیمت · موجودی · تصاویر · ویژگی‌ها · سئو |
| ۴۸ | **ویرایش محصول** | `/admin/products/[id]` | همان فرم + پیش‌نمایش |
| ۴۹ | **تنوع محصول** | `/admin/products/[id]/variants` | ماتریس تولید تنوع · قیمت و موجودی هر تنوع |
| ۵۰ | **دسته‌بندی‌ها** | `/admin/categories` | نمای درختی · Drag&Drop مرتب‌سازی · مودال CRUD |
| ۵۱ | **برندها** | `/admin/brands` | جدول + مودال CRUD + آپلود لوگو |
| ۵۲ | **ویژگی‌ها** | `/admin/attributes` | ویژگی + مقادیر · انتخابگر رنگ |
| ۵۳ | **سفارش‌ها** | `/admin/orders` | فیلتر پیشرفته (وضعیت، تاریخ، مبلغ) · خروجی Excel |
| ۵۴ | **جزئیات سفارش** | `/admin/orders/[id]` | اطلاعات مشتری · اقلام · تغییر وضعیت · کد رهگیری · یادداشت · چاپ فاکتور |
| ۵۵ | **مشتریان** | `/admin/customers` | جدول · فیلتر · خروجی |
| ۵۶ | **پروفایل مشتری** | `/admin/customers/[id]` | اطلاعات · تاریخچه سفارش · آدرس‌ها · مجموع خرید |
| ۵۷ | **کدهای تخفیف** | `/admin/coupons` | CRUD · محدودیت‌ها · آمار مصرف |
| ۵۸ | **روش‌های ارسال** | `/admin/shipping` | CRUD · هزینه · ارسال رایگان بالای مبلغ |
| ۵۹ | **بنرها** | `/admin/banners` | CRUD · موقعیت · تصویر دسکتاپ/موبایل · بازه زمانی |
| ۶۰ | **مقالات** | `/admin/blog` | جدول مقالات |
| ۶۱ | **مقاله جدید/ویرایش** | `/admin/blog/new` · `[id]` | ویرایشگر متن غنی دوزبانه · کاور · سئو |
| ۶۲ | **نظرات** | `/admin/reviews` | در انتظار تایید · تایید/رد · پاسخ |
| ۶۳ | **تیکت‌ها** | `/admin/tickets` | صف پشتیبانی · پاسخ |
| ۶۴ | **صفحات استاتیک** | `/admin/pages` | CRUD صفحات دوزبانه |
| ۶۵ | **مدیریت رسانه** | `/admin/media` | گالری فایل‌ها · آپلود · حذف |
| ۶۶ | **گزارش فروش** | `/admin/reports/sales` | نمودار بازه‌ای · مقایسه دوره · خروجی Excel |
| ۶۷ | **گزارش محصولات** | `/admin/reports/products` | پرفروش · پربازدید · کم‌فروش |
| ۶۸ | **گزارش مشتریان** | `/admin/reports/customers` | مشتریان برتر · نرخ بازگشت |
| ۶۹ | **کاربران** | `/admin/users` | مدیران و نقش‌هایشان |
| ۷۰ | **نقش‌ها** | `/admin/roles` | ماتریس دسترسی‌ها |
| ۷۱ | **تنظیمات عمومی** | `/admin/settings` | نام سایت (fa/en) · لوگو · اطلاعات تماس · شبکه‌های اجتماعی |
| ۷۲ | **تنظیمات پرداخت/ارسال/سئو** | `/admin/settings/*` | کلید درگاه‌ها · مالیات · متا تگ‌های پیش‌فرض |

**📊 جمع کل: ۷۲ صفحه × ۲ زبان = ۱۴۴ مسیر**

---

## ۷. کتابخانه کامپوننت‌ها

### 🧱 لایه‌بندی کامپوننت‌ها

```
ui/          → پرایمیتیو بدون منطق تجاری (Button, Input, Dialog…)
common/      → ابزارهای عمومی (Price, EmptyState, LocalizedDate…)
[domain]/    → مختص دامنه (product/, cart/, checkout/…)
layout/      → چیدمان صفحه (Header, Footer, Sidebar…)
providers/   → Context ها
```

### ⭐ کامپوننت‌های کلیدی با جزئیات

#### `ProductCard` — کارت محصول
| بخش | جزئیات |
|-----|--------|
| **Props** | `product: Product` · `variant: 'grid' \| 'list' \| 'compact'` · `priority?: boolean` |
| **نمایش** | تصویر با lazy-load · برچسب تخفیف · برچسب «ناموجود» · نام (دوزبانه) · امتیاز · قیمت + قیمت خط‌خورده · دکمه سبد · دکمه علاقه‌مندی · دکمه مقایسه · نمای سریع |
| **حالت‌ها** | عادی · هاور (نمایش دکمه‌ها) · ناموجود (خاکستری) · در حال افزودن (اسپینر) |
| **ریسپانسیو** | موبایل ۲ ستون · تبلت ۳ · دسکتاپ ۴ · وایداسکرین ۵ |
| **RTL** | جهت آیکون‌ها و موقعیت برچسب تخفیف معکوس می‌شود |

#### `DataTable` — جدول ادمین (عمومی)
| ویژگی | توضیح |
|-------|-------|
| **Props** | `columns` · `data` · `pagination` · `onSort` · `onFilter` · `bulkActions` |
| **قابلیت‌ها** | مرتب‌سازی ستونی · جستجوی سراسری · فیلتر ستونی · انتخاب چندتایی · عملیات گروهی · نمایش/مخفی ستون · خروجی CSV/Excel · صفحه‌بندی سمت سرور |
| **ریسپانسیو** | موبایل: تبدیل هر ردیف به کارت · دسکتاپ: جدول کامل |
| **حالت‌ها** | بارگذاری (اسکلتون) · خالی · خطا |

#### `FilterSidebar` / `FilterDrawer`
| ویژگی | توضیح |
|-------|-------|
| **همگام با URL** | هر فیلتر در QueryString ذخیره → قابل اشتراک و بازگشت با Back |
| **فیلترها** | بازه قیمت (اسلایدر دوسر) · دسته (درختی) · برند (چک‌باکس + جستجو) · رنگ (سوآچ) · سایز · امتیاز · موجود بودن · تخفیف‌دار |
| **رفتار** | دسکتاپ: سایدبار چسبان · موبایل: کشوی تمام‌صفحه با دکمه «اعمال» |
| **بهینه‌سازی** | Debounce ۳۰۰ms روی اسلایدر قیمت |

#### `CartDrawer` — کشوی سبد
باز شدن از سمت راست (fa) یا چپ (en) · لیست اقلام · تغییر سریع تعداد · جمع کل · دکمه «مشاهده سبد» و «تسویه» · حالت خالی

#### `ProductGallery` — گالری محصول
تصویر اصلی با زوم شیشه‌ذره‌بین (دسکتاپ) · سوایپ (موبایل) · تصاویر بندانگشتی · لایت‌باکس تمام‌صفحه · پشتیبانی ویدیو · Placeholder بلور

#### `LocalizedDate` — تاریخ زبان‌آگاه
```tsx
// fa → ۱۵ شهریور ۱۴۰۴  |  en → September 5, 2026
<LocalizedDate value={order.created_at} format="long" />
```

#### `LocalizedNumber` / `Price`
```tsx
// fa → ۱۲٬۵۰۰٬۰۰۰ تومان  |  en → 12,500,000 IRT
<Price amount={12500000} />
```

#### `ThemeToggle` و `LocaleSwitcher`
دکمه‌های هدر با آیکون خورشید/ماه و پرچم/کد زبان — بدون پرش محتوا (No FOUC)

### 📦 جدول کامل کامپوننت‌ها

| گروه | تعداد | نمونه‌ها |
|------|-------|----------|
| `ui/` | ۲۲ | Button, Input, Select, Dialog, Sheet, DropdownMenu, Tabs, Accordion, Badge, Card, Skeleton, Table, Pagination, Slider, Checkbox, RadioGroup, Switch, Tooltip, Popover, Avatar, Separator, Textarea |
| `layout/` | ۱۸ | Header, TopBar, MainNav, MegaMenu, MobileNav, SearchBar, CartButton, CartDrawer, UserMenu, LocaleSwitcher, ThemeToggle, Footer, FooterLinks, NewsletterForm, SocialLinks, TrustBadges, BottomNav, Breadcrumb |
| `home/` | ۱۱ | HeroSlider, CategoryGrid, FeaturedProducts, FlashSale, BestSellers, NewArrivals, BrandCarousel, PromoBanners, BlogSection, TestimonialSlider, FeatureHighlights |
| `product/` | ۱۹ | ProductCard, ProductGrid, ProductGallery, ProductVariantSelector, AddToCartButton, QuantitySelector, WishlistButton, ProductTabs, RelatedProducts, QuickViewModal… |
| `filters/` | ۱۱ | FilterSidebar, FilterDrawer, PriceRangeFilter, BrandFilter, AttributeFilter, SortDropdown, ActiveFilters… |
| `cart/` | ۵ | CartItem, CartSummary, CouponForm, EmptyCart, CartTable |
| `checkout/` | ۷ | CheckoutStepper, AddressForm, ShippingMethods, PaymentMethods, OrderSummary… |
| `review/` | ۶ | ReviewList, ReviewCard, ReviewForm, RatingStars, RatingSummary, ReviewImageUpload |
| `account/` | ۸ | AccountSidebar, OrderCard, OrderTimeline, AddressCard, ProfileForm, StatsCards… |
| `admin/` | ۱۷ | AdminSidebar, DataTable, StatCard, SalesChart, ProductForm, VariantMatrix, ImageUploader, RichTextEditor… |
| `common/` | ۱۷ | Container, Section, EmptyState, ErrorState, Price, LocalizedDate, LocalizedNumber, Countdown, ConfirmDialog, SeoJsonLd… |
| `providers/` | ۵ | Providers, ThemeProvider, QueryProvider, AuthProvider, DirectionProvider |
| **جمع** | **~۱۴۶** | |

---

## ۸. سیستم دوزبانه و RTL

### 🗂️ ساختار مسیرها

```
/fa                  → صفحه اصلی فارسی (پیش‌فرض، بدون پیشوند هم کار کند)
/en                  → صفحه اصلی انگلیسی
/fa/products         → لیست محصولات فارسی
/en/products         → لیست محصولات انگلیسی
/fa/products/[slug]  → جزئیات محصول
```

### ⚙️ پیکربندی `src/i18n/routing.ts`

```ts
/**
 * تنظیمات مسیریابی چندزبانه.
 * تعیین می‌کند چه زبان‌هایی پشتیبانی می‌شوند و کدام پیش‌فرض است.
 */
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  /** زبان‌های پشتیبانی‌شده */
  locales: ['fa', 'en'],

  /** زبان پیش‌فرض سایت */
  defaultLocale: 'fa',

  /** همیشه پیشوند زبان در URL باشد (برای سئوی بهتر) */
  localePrefix: 'always',

  /** تشخیص خودکار زبان از هدر مرورگر */
  localeDetection: true,
})

/** جهت نوشتار هر زبان */
export const localeDirection = {
  fa: 'rtl',
  en: 'ltr',
} as const

/** نام نمایشی هر زبان در سوییچر */
export const localeNames = {
  fa: 'فارسی',
  en: 'English',
} as const
```

### 🧭 `src/middleware.ts`

```ts
/**
 * میدل‌ور اصلی برنامه.
 * دو وظیفه دارد:
 *  ۱) تشخیص و اعمال زبان روی مسیر (next-intl)
 *  ۲) محافظت از مسیرهای خصوصی (/account, /admin)
 */
import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from '@/i18n/routing'

const intlMiddleware = createMiddleware(routing)

/** مسیرهایی که نیاز به ورود دارند */
const PROTECTED = ['/account', '/checkout']
/** مسیرهایی که نیاز به نقش ادمین دارند */
const ADMIN_ONLY = ['/admin']

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  // حذف پیشوند زبان برای بررسی مسیر  →  /fa/account  ⇒  /account
  const pathWithoutLocale = pathname.replace(/^\/(fa|en)/, '') || '/'
  const token = request.cookies.get('auth_token')?.value

  // اگر مسیر خصوصی است و توکن نداریم → به صفحه ورود
  if (PROTECTED.some((p) => pathWithoutLocale.startsWith(p)) && !token) {
    const locale = pathname.split('/')[1] || routing.defaultLocale
    const loginUrl = new URL(`/${locale}/login`, request.url)
    loginUrl.searchParams.set('redirect', pathname) // بعد از ورود برگردد
    return NextResponse.redirect(loginUrl)
  }

  // مسیر ادمین: بررسی نقش از روی کوکی نقش
  if (ADMIN_ONLY.some((p) => pathWithoutLocale.startsWith(p))) {
    const role = request.cookies.get('user_role')?.value
    if (role !== 'admin' && role !== 'manager') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return intlMiddleware(request)
}

export const config = {
  // همه مسیرها به‌جز فایل‌های استاتیک و API
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
```

### 🎨 لایوت ریشه با RTL و فونت — `app/[locale]/layout.tsx`

```tsx
/**
 * لایوت ریشه برنامه.
 * مسئولیت‌ها:
 *  - تنظیم زبان (lang) و جهت (dir) روی تگ <html>
 *  - بارگذاری فونت مناسب هر زبان
 *  - فراهم کردن Provider های تم، ترجمه و کوئری
 */
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import localFont from 'next/font/local'
import { Inter } from 'next/font/google'
import { routing, localeDirection } from '@/i18n/routing'
import { Providers } from '@/components/providers/Providers'
import '@/app/globals.css'

/** فونت فارسی (لوکال برای سرعت بالاتر) */
const vazirmatn = localFont({
  src: [
    { path: '../../../public/fonts/Vazirmatn-Regular.woff2', weight: '400' },
    { path: '../../../public/fonts/Vazirmatn-Medium.woff2', weight: '500' },
    { path: '../../../public/fonts/Vazirmatn-Bold.woff2', weight: '700' },
  ],
  variable: '--font-vazirmatn',
  display: 'swap',
})

/** فونت انگلیسی */
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

/** تولید استاتیک هر دو زبان در زمان build */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // اگر زبان معتبر نبود → صفحه ۴۰۴
  if (!routing.locales.includes(locale as 'fa' | 'en')) notFound()

  // فعال کردن رندر استاتیک برای این زبان
  setRequestLocale(locale)

  // بارگذاری فایل ترجمه (messages/fa.json یا en.json)
  const messages = await getMessages()

  const dir = localeDirection[locale as keyof typeof localeDirection]

  return (
    <html
      lang={locale}
      dir={dir}                                     // ⭐ rtl یا ltr
      suppressHydrationWarning                      // لازم برای next-themes
      className={`${vazirmatn.variable} ${inter.variable}`}
    >
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

### 📝 ساختار فایل ترجمه — `messages/fa.json`

```jsonc
{
  "common": {
    "search": "جستجو",
    "loading": "در حال بارگذاری…",
    "error": "خطایی رخ داد",
    "retry": "تلاش مجدد",
    "save": "ذخیره",
    "cancel": "انصراف",
    "confirm": "تایید",
    "delete": "حذف",
    "currency": "تومان"
  },
  "nav": {
    "home": "خانه",
    "products": "محصولات",
    "categories": "دسته‌بندی‌ها",
    "blog": "بلاگ",
    "about": "درباره ما",
    "contact": "تماس با ما"
  },
  "product": {
    "addToCart": "افزودن به سبد",
    "outOfStock": "ناموجود",
    "inStock": "موجود",
    // پلورال‌سازی خودکار بر اساس تعداد
    "stockLeft": "{count, plural, =0 {ناموجود} one {تنها # عدد باقی مانده} other {# عدد باقی مانده}}",
    "price": "قیمت",
    "discount": "{percent}٪ تخفیف",
    "reviews": "{count, plural, =0 {بدون نظر} other {# دیدگاه}}"
  },
  "cart": {
    "title": "سبد خرید",
    "empty": "سبد خرید شما خالی است",
    "subtotal": "جمع کالاها",
    "shipping": "هزینه ارسال",
    "discount": "تخفیف",
    "total": "مبلغ قابل پرداخت",
    "checkout": "تسویه حساب"
  },
  "order": {
    "status": {
      "pending": "در انتظار پرداخت",
      "paid": "پرداخت شده",
      "processing": "در حال آماده‌سازی",
      "shipped": "ارسال شده",
      "delivered": "تحویل داده شده",
      "cancelled": "لغو شده"
    }
  },
  "validation": {
    "required": "این فیلد الزامی است",
    "email": "ایمیل معتبر وارد کنید",
    "phone": "شماره موبایل معتبر وارد کنید",
    "minLength": "حداقل {min} کاراکتر"
  }
}
```

### 🔁 معادل انگلیسی — `messages/en.json`
همان ساختار دقیق با مقادیر انگلیسی. **کلیدها هرگز ترجمه نمی‌شوند.**

### ✅ قواعد طلایی i18n

| قاعده | توضیح |
|-------|-------|
| **هیچ متن هاردکد** | هر رشته نمایشی از `useTranslations()` بیاید |
| **کلیدهای تودرتو** | `product.addToCart` نه `add_to_cart_button_product_page` |
| **Pluralization** | از فرمت ICU استفاده شود |
| **اعداد و تاریخ** | با `Intl.NumberFormat` و `Intl.DateTimeFormat` |
| **جهت‌محور نوشتن CSS** | `ms-4` به‌جای `ml-4` · `ps-2` به‌جای `pl-2` · `start/end` به‌جای `left/right` |
| **آیکون‌های جهت‌دار** | فلش‌ها با `rtl:rotate-180` معکوس شوند |
| **hreflang** | در متادیتا برای سئوی چندزبانه |

### 🔄 Tailwind و RTL

```tsx
// ❌ اشتباه — در RTL خراب می‌شود
<div className="ml-4 pl-2 text-left border-l">

// ✅ درست — منطقی و جهت‌آگاه
<div className="ms-4 ps-2 text-start border-s">

// آیکون فلش که باید در فارسی برعکس شود
<ChevronLeft className="rtl:rotate-180" />
```

| فیزیکی (بد) | منطقی (خوب) |
|-------------|-------------|
| `ml-*` / `mr-*` | `ms-*` / `me-*` |
| `pl-*` / `pr-*` | `ps-*` / `pe-*` |
| `left-*` / `right-*` | `start-*` / `end-*` |
| `text-left` / `text-right` | `text-start` / `text-end` |
| `border-l` / `border-r` | `border-s` / `border-e` |
| `rounded-l-*` | `rounded-s-*` |

---

## ۹. سیستم تم (دارک/لایت)

### 🎨 متغیرهای CSS — `app/globals.css`

```css
@import "tailwindcss";

/* ═══════════════════════════════════════════════
   تم روشن (پیش‌فرض)
   همه رنگ‌ها با فرمت OKLCH برای یکنواختی ادراکی
   ═══════════════════════════════════════════════ */
:root {
  --background: oklch(1 0 0);                    /* پس‌زمینه اصلی */
  --foreground: oklch(0.145 0 0);                /* متن اصلی */

  --card: oklch(1 0 0);                          /* پس‌زمینه کارت */
  --card-foreground: oklch(0.145 0 0);

  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);

  --primary: oklch(0.55 0.22 264);               /* رنگ برند (آبی-بنفش) */
  --primary-foreground: oklch(0.98 0 0);

  --secondary: oklch(0.96 0.01 264);
  --secondary-foreground: oklch(0.2 0 0);

  --muted: oklch(0.96 0 0);                      /* پس‌زمینه کم‌رنگ */
  --muted-foreground: oklch(0.5 0 0);            /* متن ثانویه */

  --accent: oklch(0.96 0.02 264);
  --accent-foreground: oklch(0.2 0 0);

  --destructive: oklch(0.58 0.24 27);            /* قرمز خطا/حذف */
  --destructive-foreground: oklch(0.98 0 0);

  --success: oklch(0.65 0.18 145);               /* سبز موفقیت */
  --warning: oklch(0.75 0.17 75);                /* زرد هشدار */
  --info: oklch(0.65 0.15 230);                  /* آبی اطلاع */

  --border: oklch(0.9 0 0);                      /* خط حاشیه */
  --input: oklch(0.9 0 0);                       /* حاشیه ورودی */
  --ring: oklch(0.55 0.22 264);                  /* حلقه فوکوس */

  --radius: 0.625rem;                            /* گردی گوشه پایه */
}

/* ═══════════════════════════════════════════════
   تم تیره
   ═══════════════════════════════════════════════ */
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);

  --card: oklch(0.19 0 0);
  --card-foreground: oklch(0.985 0 0);

  --popover: oklch(0.19 0 0);
  --popover-foreground: oklch(0.985 0 0);

  --primary: oklch(0.68 0.19 264);               /* روشن‌تر برای کنتراست */
  --primary-foreground: oklch(0.145 0 0);

  --secondary: oklch(0.26 0.01 264);
  --secondary-foreground: oklch(0.985 0 0);

  --muted: oklch(0.26 0 0);
  --muted-foreground: oklch(0.68 0 0);

  --accent: oklch(0.26 0.02 264);
  --accent-foreground: oklch(0.985 0 0);

  --destructive: oklch(0.65 0.21 27);
  --destructive-foreground: oklch(0.985 0 0);

  --success: oklch(0.7 0.16 145);
  --warning: oklch(0.8 0.15 75);
  --info: oklch(0.7 0.14 230);

  --border: oklch(0.28 0 0);
  --input: oklch(0.28 0 0);
  --ring: oklch(0.68 0.19 264);
}

/* اتصال متغیرها به Tailwind v4 */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-primary: var(--primary);
  --color-muted: var(--muted);
  --color-border: var(--border);
  /* … بقیه توکن‌ها */

  /* فونت بر اساس زبان انتخاب می‌شود */
  --font-sans: var(--font-vazirmatn), var(--font-inter), system-ui, sans-serif;
}

/* فونت انگلیسی وقتی زبان en است */
html[lang='en'] {
  --font-sans: var(--font-inter), system-ui, sans-serif;
}

/* انتقال نرم هنگام تعویض تم */
* {
  transition: background-color 200ms ease, border-color 200ms ease;
}

/* غیرفعال کردن انیمیشن برای کاربرانی که ترجیح می‌دهند */
@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}
```

### 🔌 `ThemeProvider`

```tsx
/**
 * فراهم‌کننده تم (روشن/تیره/سیستمی).
 * از next-themes استفاده می‌کند تا:
 *  - انتخاب کاربر در localStorage ذخیره شود
 *  - قبل از رندر اولیه اعمال شود (بدون پرش رنگ / FOUC)
 */
'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"        // کلاس .dark روی <html> اضافه می‌شود
      defaultTheme="system"    // پیش‌فرض: پیروی از تنظیمات سیستم‌عامل
      enableSystem             // فعال بودن حالت سیستمی
      disableTransitionOnChange // جلوگیری از پرش انیمیشن هنگام سوییچ
      storageKey="nextstore-theme"
    >
      {children}
    </NextThemesProvider>
  )
}
```

### 🌗 `ThemeToggle`

```tsx
/**
 * دکمه تعویض تم در هدر.
 * سه حالت: روشن ↔ تیره ↔ سیستمی
 * تا زمان mount شدن یک placeholder نشان می‌دهد تا hydration mismatch رخ ندهد.
 */
'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Sun, Moon, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger }
  from '@/components/ui/dropdown-menu'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const t = useTranslations('theme')
  const [mounted, setMounted] = useState(false)

  // فقط سمت کلاینت رندر شود (تم در سرور مشخص نیست)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="size-9" aria-hidden />   // جای‌نگهدار هم‌اندازه
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('toggle')}>
          <Sun className="size-5 dark:hidden" />
          <Moon className="hidden size-5 dark:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="me-2 size-4" /> {t('light')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="me-2 size-4" /> {t('dark')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="me-2 size-4" /> {t('system')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### ✅ قواعد طلایی تم

| قاعده | مثال |
|-------|------|
| **هرگز رنگ ثابت ننویس** | ❌ `bg-white` → ✅ `bg-background` |
| **از توکن‌های معنایی استفاده کن** | `text-muted-foreground` نه `text-gray-500` |
| **کنتراست AA را رعایت کن** | حداقل ۴.۵:۱ برای متن |
| **تصاویر تم‌آگاه** | لوگو: `dark:hidden` و `hidden dark:block` |
| **از FOUC جلوگیری کن** | `suppressHydrationWarning` + بررسی `mounted` |
| **هر دو تم را تست کن** | اسکرین‌شات از همه صفحات در هر دو حالت |

---

## ۱۰. استراتژی ریسپانسیو

### 📐 Breakpoint ها

| نام | عرض | دستگاه هدف | ستون‌های محصول |
|-----|-----|------------|----------------|
| — | `< 640px` | موبایل کوچک (iPhone SE) | ۲ |
| `sm` | `≥ 640px` | موبایل بزرگ | ۲ |
| `md` | `≥ 768px` | تبلت عمودی (iPad) | ۳ |
| `lg` | `≥ 1024px` | تبلت افقی / لپ‌تاپ کوچک | ۴ |
| `xl` | `≥ 1280px` | دسکتاپ | ۴ |
| `2xl` | `≥ 1536px` | مانیتور بزرگ | ۵ |

### 📱 اصل Mobile-First

```tsx
// همیشه از موبایل شروع کن و رو به بالا اضافه کن
<div className="
  grid grid-cols-2 gap-3          /* موبایل: ۲ ستون */
  md:grid-cols-3 md:gap-4         /* تبلت: ۳ ستون */
  lg:grid-cols-4 lg:gap-6         /* دسکتاپ: ۴ ستون */
  2xl:grid-cols-5                 /* مانیتور بزرگ: ۵ ستون */
">
```

### 🧩 تفاوت چیدمان در هر دستگاه

| المان | موبایل | تبلت | دسکتاپ |
|-------|--------|------|--------|
| **ناوبری** | همبرگر + Sheet کشویی | همبرگر | منوی افقی + مگامنو |
| **جستجو** | آیکون → صفحه کامل | نوار کوچک | نوار کامل + پیشنهاد زنده |
| **فیلترها** | دکمه «فیلتر» → Drawer تمام‌صفحه | Drawer | سایدبار چسبان |
| **سبد خرید** | صفحه مجزا | Drawer | Drawer |
| **پنل کاربری** | تب‌های افقی اسکرول‌شونده | سایدبار جمع‌شونده | سایدبار ثابت |
| **جدول ادمین** | کارت به‌جای ردیف | جدول با اسکرول افقی | جدول کامل |
| **ناوبری پایین** | ✅ نمایش (۵ آیکون) | ❌ | ❌ |
| **گالری محصول** | سوایپ + نقطه | بندانگشتی زیر | بندانگشتی کنار + زوم |
| **فوتر** | آکاردئون | ۲ ستون | ۴ ستون |
| **Checkout** | تک‌ستونه، مرحله‌به‌مرحله | تک‌ستونه | دوستونه (فرم + خلاصه چسبان) |

### 🎯 قواعد کلیدی

| قاعده | جزئیات |
|-------|--------|
| **حداقل ناحیه لمس** | ۴۴×۴۴ پیکسل برای همه دکمه‌ها |
| **فونت ورودی موبایل** | حداقل `16px` تا سافاری زوم نکند |
| **ارتفاع صفحه** | `min-h-dvh` به‌جای `min-h-screen` (نوار آدرس موبایل) |
| **تصاویر** | `next/image` با `sizes` دقیق + فرمت WebP/AVIF |
| **کانتینر** | `mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8` |
| **Safe Area** | `pb-[env(safe-area-inset-bottom)]` برای iPhone |
| **اسکرول افقی** | فقط داخل کانتینر مشخص، هرگز روی `body` |
| **تست واقعی** | iPhone SE (375) · iPhone 14 (390) · iPad (768) · Laptop (1440) |

### 🖼️ نمونه تصویر ریسپانسیو

```tsx
/**
 * تصویر محصول بهینه‌شده.
 * پارامتر sizes به مرورگر می‌گوید در هر عرض صفحه،
 * تصویر چند درصد از ویوپورت را اشغال می‌کند تا فایل مناسب دانلود شود.
 */
<Image
  src={product.image}
  alt={product.name}
  fill
  sizes="(max-width: 640px) 50vw,
         (max-width: 768px) 33vw,
         (max-width: 1280px) 25vw,
         20vw"
  className="object-cover"
  priority={isAboveFold}      // فقط برای تصاویر بالای صفحه
/>
```

---

## ۱۱. استاندارد کامنت‌گذاری

> **قانون کلی:** هر فایل یک هدر دارد که می‌گوید «این فایل چه‌کاری می‌کند» و هر تابع یک JSDoc/PHPDoc که می‌گوید «این تابع چه‌کاری می‌کند، چه می‌گیرد، چه برمی‌گرداند».

### 🐘 قالب Backend (PHP)

#### فایل Controller

```php
<?php

/**
 * ═══════════════════════════════════════════════════════════════
 * کنترلر محصولات (بخش فروشگاه - عمومی)
 * ───────────────────────────────────────────────────────────────
 * این کنترلر مسئول نمایش محصولات به کاربران عادی سایت است.
 * شامل: لیست محصولات با فیلتر، جزئیات یک محصول، محصولات مرتبط.
 *
 * نکته: هیچ منطق تجاری اینجا نوشته نمی‌شود؛
 *       همه محاسبات در ProductService انجام می‌شود.
 *
 * @package App\Http\Controllers\Api\V1\Shop
 * ═══════════════════════════════════════════════════════════════
 */

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Shop;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Http\Resources\ProductDetailResource;
use App\Models\Product;
use App\Services\Product\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * تزریق سرویس محصول از طریق سازنده.
     *
     * @param ProductService $productService سرویس حاوی منطق محصولات
     */
    public function __construct(
        private readonly ProductService $productService
    ) {}

    /**
     * نمایش لیست محصولات با قابلیت فیلتر، مرتب‌سازی و صفحه‌بندی.
     *
     * فیلترهای پشتیبانی‌شده:
     *  - filter[category]    نامک دسته‌بندی
     *  - filter[brand]       نامک برند (چندتایی با کاما)
     *  - filter[price_min]   حداقل قیمت
     *  - filter[price_max]   حداکثر قیمت
     *  - filter[in_stock]    فقط موجودها
     *  - sort                ترتیب (-created_at, price, -sales_count)
     *
     * @param  Request      $request درخواست حاوی پارامترهای فیلتر
     * @return JsonResponse لیست صفحه‌بندی‌شده محصولات
     */
    public function index(Request $request): JsonResponse
    {
        // دریافت محصولات فیلترشده از سرویس (کش‌شده)
        $products = $this->productService->getFilteredProducts($request);

        // تبدیل به فرمت استاندارد API و بازگشت
        return ProductResource::collection($products)->response();
    }

    /**
     * نمایش جزئیات کامل یک محصول بر اساس نامک (slug).
     *
     * علاوه بر اطلاعات محصول، این موارد نیز بارگذاری می‌شوند:
     *  - تصاویر، تنوع‌ها، ویژگی‌ها، برند، دسته‌بندی
     *  - خلاصه امتیازات کاربران
     * همچنین شمارنده بازدید به‌صورت غیرهمزمان افزایش می‌یابد.
     *
     * @param  string       $slug نامک یکتای محصول
     * @return JsonResponse جزئیات کامل محصول
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException اگر محصول یافت نشود
     */
    public function show(string $slug): JsonResponse
    {
        // یافتن محصول فعال به همراه روابط موردنیاز
        $product = $this->productService->findBySlugOrFail($slug);

        // افزایش بازدید در پس‌زمینه (بدون کند کردن پاسخ)
        $this->productService->incrementViews($product);

        return (new ProductDetailResource($product))->response();
    }
}
```

#### فایل Service

```php
<?php

/**
 * ═══════════════════════════════════════════════════════════════
 * سرویس سبد خرید
 * ───────────────────────────────────────────────────────────────
 * تمام منطق مربوط به سبد خرید اینجا متمرکز است:
 * افزودن، بروزرسانی، حذف، ادغام سبد مهمان با کاربر، محاسبه مبالغ.
 *
 * این سرویس هم برای کاربر لاگین‌کرده (بر اساس user_id)
 * و هم برای مهمان (بر اساس session_id) کار می‌کند.
 * ═══════════════════════════════════════════════════════════════
 */

declare(strict_types=1);

namespace App\Services\Cart;

use App\Exceptions\InsufficientStockException;
use App\Models\Cart;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class CartService
{
    /**
     * افزودن یک محصول به سبد خرید.
     *
     * مراحل:
     *  ۱) پیدا کردن یا ساختن سبد کاربر
     *  ۲) بررسی موجودی انبار
     *  ۳) اگر محصول از قبل در سبد بود → افزایش تعداد
     *     در غیر این صورت → افزودن آیتم جدید
     *
     * @param  int      $productId شناسه محصول
     * @param  int      $quantity  تعداد درخواستی
     * @param  int|null $variantId شناسه تنوع (رنگ/سایز) در صورت وجود
     * @return Cart     سبد بروزرسانی‌شده به همراه آیتم‌ها
     *
     * @throws InsufficientStockException وقتی موجودی کافی نباشد
     */
    public function addItem(int $productId, int $quantity, ?int $variantId = null): Cart
    {
        return DB::transaction(function () use ($productId, $quantity, $variantId) {
            $cart    = $this->getOrCreateCart();
            $product = Product::findOrFail($productId);

            // بررسی اینکه موجودی انبار پاسخگوی درخواست هست یا نه
            $this->assertStockAvailable($product, $variantId, $quantity);

            // اگر همین محصول با همین تنوع در سبد بود، فقط تعداد را زیاد کن
            $item = $cart->items()
                ->where('product_id', $productId)
                ->where('variant_id', $variantId)
                ->first();

            if ($item) {
                $item->increment('quantity', $quantity);
            } else {
                $cart->items()->create([
                    'product_id'     => $productId,
                    'variant_id'     => $variantId,
                    'quantity'       => $quantity,
                    // قیمت لحظه افزودن ذخیره می‌شود تا تغییر قیمت روی سبد اثر نگذارد
                    'price_snapshot' => $product->price,
                ]);
            }

            return $cart->fresh('items.product');
        });
    }
}
```

#### فایل Model

```php
<?php

/**
 * ═══════════════════════════════════════════════════════════════
 * مدل محصول
 * ───────────────────────────────────────────────────────────────
 * نماینده جدول `products` در دیتابیس.
 * فیلدهای چندزبانه (نام، توضیحات، مشخصات) به‌صورت JSON ذخیره
 * می‌شوند و از طریق تِرِیت HasTranslations مدیریت می‌گردند.
 * ═══════════════════════════════════════════════════════════════
 */

declare(strict_types=1);

namespace App\Models;

use App\Enums\ProductStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Translatable\HasTranslations;

class Product extends Model
{
    use HasTranslations;

    /** ستون‌هایی که مقادیر چندزبانه دارند */
    public array $translatable = ['name', 'short_description', 'description', 'specifications'];

    /** ستون‌های قابل پر شدن انبوه */
    protected $fillable = [
        'category_id', 'brand_id', 'name', 'slug', 'sku',
        'description', 'price', 'stock', 'status',
    ];

    /** تبدیل خودکار نوع داده‌ها */
    protected function casts(): array
    {
        return [
            'price'        => 'decimal:0',
            'status'       => ProductStatus::class,
            'is_featured'  => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    /**
     * رابطه: هر محصول متعلق به یک دسته‌بندی است.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * رابطه: هر محصول می‌تواند چند تصویر داشته باشد (مرتب‌شده).
     */
    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('order');
    }

    /**
     * اسکوپ: فقط محصولات منتشرشده و فعال.
     *
     * استفاده:  Product::published()->get()
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', ProductStatus::Active)
                     ->whereNotNull('published_at')
                     ->where('published_at', '<=', now());
    }

    /**
     * محاسبه درصد تخفیف بر اساس قیمت قبلی.
     *
     * @return int درصد تخفیف (۰ اگر تخفیفی نباشد)
     */
    public function getDiscountPercentAttribute(): int
    {
        if (! $this->compare_price || $this->compare_price <= $this->price) {
            return 0;
        }

        return (int) round((($this->compare_price - $this->price) / $this->compare_price) * 100);
    }
}
```

### ⚛️ قالب Frontend (TypeScript/React)

#### فایل صفحه (Page)

```tsx
/**
 * ═══════════════════════════════════════════════════════════════
 * صفحه جزئیات محصول
 * ───────────────────────────────────────────────────────────────
 * مسیر: /[locale]/products/[slug]
 *
 * این صفحه اطلاعات کامل یک محصول را نمایش می‌دهد:
 *  · گالری تصاویر با قابلیت زوم
 *  · انتخاب تنوع (رنگ / سایز)
 *  · قیمت، تخفیف و وضعیت موجودی
 *  · افزودن به سبد خرید / علاقه‌مندی / مقایسه
 *  · تب‌های توضیحات، مشخصات فنی و نظرات کاربران
 *  · محصولات مرتبط
 *
 * نوع رندر: ISR — هر ۵ دقیقه بازتولید می‌شود.
 * ═══════════════════════════════════════════════════════════════
 */

import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { getProductBySlug, getRelatedProducts } from '@/lib/api/products'
import { ProductGallery } from '@/components/product/ProductGallery'
import { ProductInfo } from '@/components/product/ProductInfo'
import { ProductTabs } from '@/components/product/ProductTabs'
import { RelatedProducts } from '@/components/product/RelatedProducts'
import { SeoJsonLd } from '@/components/common/SeoJsonLd'

/** هر ۳۰۰ ثانیه صفحه دوباره در پس‌زمینه ساخته می‌شود */
export const revalidate = 300

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

/**
 * تولید متادیتای سئو برای این صفحه.
 * عنوان، توضیحات و تصویر اشتراک‌گذاری از خود محصول خوانده می‌شود
 * و لینک نسخه‌های زبانی دیگر (hreflang) اضافه می‌گردد.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const product = await getProductBySlug(slug, locale)

  if (!product) return { title: 'Not Found' }

  return {
    title: product.meta_title ?? product.name,
    description: product.meta_description ?? product.short_description,
    openGraph: {
      title: product.name,
      images: [{ url: product.image, width: 1200, height: 630 }],
    },
    alternates: {
      canonical: `/${locale}/products/${slug}`,
      languages: {
        fa: `/fa/products/${slug}`,
        en: `/en/products/${slug}`,
      },
    },
  }
}

/**
 * کامپوننت اصلی صفحه (Server Component).
 * داده‌ها را سمت سرور می‌گیرد و به کامپوننت‌های فرزند پاس می‌دهد.
 */
export default async function ProductDetailPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)           // فعال‌سازی رندر استاتیک برای این زبان

  const t = await getTranslations('product')

  // دریافت هم‌زمان محصول و محصولات مرتبط برای کاهش زمان انتظار
  const [product, related] = await Promise.all([
    getProductBySlug(slug, locale),
    getRelatedProducts(slug, locale),
  ])

  // اگر محصول وجود نداشت → صفحه ۴۰۴
  if (!product) notFound()

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* داده ساختاریافته برای گوگل (Rich Snippet قیمت و امتیاز) */}
      <SeoJsonLd type="Product" data={product} />

      {/* ستون چپ: گالری | ستون راست: اطلاعات خرید */}
      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={product.images} alt={product.name} />
        <ProductInfo product={product} />
      </div>

      {/* تب‌های توضیحات، مشخصات و نظرات */}
      <ProductTabs product={product} className="mt-12" />

      {/* محصولات مرتبط - فقط اگر وجود داشته باشند */}
      {related.length > 0 && (
        <RelatedProducts products={related} title={t('related')} className="mt-16" />
      )}
    </main>
  )
}
```

#### فایل کامپوننت

```tsx
/**
 * ═══════════════════════════════════════════════════════════════
 * کارت محصول
 * ───────────────────────────────────────────────────────────────
 * کارت نمایش خلاصه یک محصول که در گرید محصولات، اسلایدرها،
 * محصولات مرتبط و نتایج جستجو استفاده می‌شود.
 *
 * سه حالت نمایشی دارد:
 *  · grid    — پیش‌فرض، عمودی (لیست محصولات)
 *  · list    — افقی (نمای لیستی)
 *  · compact — کوچک (سایدبار، بازدیدهای اخیر)
 * ═══════════════════════════════════════════════════════════════
 */

'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils/cn'
import { Price } from '@/components/common/Price'
import { Rating } from '@/components/common/Rating'
import { AddToCartButton } from './AddToCartButton'
import { WishlistButton } from './WishlistButton'
import type { Product } from '@/types/product'

interface ProductCardProps {
  /** داده محصول برای نمایش */
  product: Product
  /** حالت نمایش کارت */
  variant?: 'grid' | 'list' | 'compact'
  /** بارگذاری با اولویت (فقط برای تصاویر بالای صفحه) */
  priority?: boolean
  className?: string
}

/**
 * کارت محصول را رندر می‌کند.
 *
 * @param product  اطلاعات محصول
 * @param variant  حالت چیدمان کارت
 * @param priority آیا تصویر با اولویت بارگذاری شود
 */
export function ProductCard({
  product,
  variant = 'grid',
  priority = false,
  className,
}: ProductCardProps) {
  const t = useTranslations('product')

  // محاسبه درصد تخفیف برای نمایش برچسب
  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0

  const isOutOfStock = product.stock === 0

  return (
    <article
      className={cn(
        'group relative rounded-xl border border-border bg-card',
        'transition-shadow hover:shadow-lg',
        variant === 'list' && 'flex gap-4',
        isOutOfStock && 'opacity-70',      // محصول ناموجود کم‌رنگ‌تر
        className,
      )}
    >
      {/* برچسب تخفیف — در RTL سمت راست، در LTR سمت چپ قرار می‌گیرد */}
      {discount > 0 && (
        <span className="absolute start-2 top-2 z-10 rounded-md bg-destructive px-2 py-1 text-xs font-bold text-destructive-foreground">
          {t('discount', { percent: discount })}
        </span>
      )}

      {/* دکمه علاقه‌مندی در گوشه مقابل */}
      <WishlistButton
        productId={product.id}
        className="absolute end-2 top-2 z-10"
      />

      {/* تصویر محصول */}
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-t-xl bg-muted">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </Link>

      {/* اطلاعات متنی */}
      <div className="flex flex-col gap-2 p-3">
        <Link href={`/products/${product.slug}`}>
          {/* حداکثر دو خط، مابقی با سه‌نقطه */}
          <h3 className="line-clamp-2 text-sm font-medium leading-6">
            {product.name}
          </h3>
        </Link>

        <Rating value={product.rating_avg} count={product.rating_count} size="sm" />

        <Price
          amount={product.price}
          comparePrice={product.compare_price}
          className="mt-auto"
        />

        <AddToCartButton
          product={product}
          disabled={isOutOfStock}
          className="w-full"
        />
      </div>
    </article>
  )
}
```

#### فایل Hook

```tsx
/**
 * ═══════════════════════════════════════════════════════════════
 * هوک مدیریت سبد خرید
 * ───────────────────────────────────────────────────────────────
 * یک واسط ساده روی استور Zustand و API بک‌اند فراهم می‌کند.
 * وظایف: افزودن، حذف، تغییر تعداد، همگام‌سازی با سرور.
 * ═══════════════════════════════════════════════════════════════
 */

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { cartApi } from '@/lib/api/cart'

export function useCart() {
  const queryClient = useQueryClient()
  const t = useTranslations('cart')

  /** دریافت سبد فعلی از سرور (کش‌شده به مدت ۱ دقیقه) */
  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.get,
    staleTime: 60_000,
  })

  /**
   * افزودن محصول به سبد.
   * پس از موفقیت، کش سبد باطل می‌شود تا داده تازه گرفته شود.
   */
  const addItem = useMutation({
    mutationFn: cartApi.addItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success(t('addedSuccessfully'))
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return {
    cart,
    isLoading,
    itemsCount: cart?.items_count ?? 0,
    addItem: addItem.mutate,
    isAdding: addItem.isPending,
  }
}
```

### 📏 قواعد کامنت‌گذاری

| قاعده | توضیح |
|-------|-------|
| **هدر هر فایل** | بلوک `/** … */` که نقش فایل را در یک تا سه جمله می‌گوید |
| **هر تابع/متد** | JSDoc/PHPDoc با `@param`، `@return`، و در صورت لزوم `@throws` |
| **کامنت «چرا» نه «چه»** | ❌ `// یک به i اضافه کن` ✅ `// از ۱ شروع می‌کنیم چون صفحه‌بندی یک‌مبناست` |
| **زبان کامنت** | فارسی (چون نمونه‌کار برای بازار ایران است) — یا انگلیسی، اما **یکدست** |
| **کامنت روی منطق پیچیده** | هر جا کد بدیهی نیست، توضیح بده |
| **TODO / FIXME** | با فرمت `// TODO(نام): توضیح` |
| **بدون کامنت زائد** | کد واضح نیازی به کامنت خط‌به‌خط ندارد |
| **بروزنگه‌داری** | کامنت غلط بدتر از نبود کامنت است |

---

## ۱۲. فازبندی زمانی (۱۴ هفته)

> فرض: روزی ۳ تا ۴ ساعت کار. اگر تمام‌وقت کار می‌کنی، زمان‌ها را نصف کن.

### 🏁 فاز ۰ — آماده‌سازی (هفته ۱)

| # | تسک | خروجی |
|---|-----|-------|
| ۱ | نصب Laravel 11 + پیکربندی `.env` | پروژه بالا می‌آید |
| ۲ | نصب Next.js 15 + TypeScript + Tailwind 4 | پروژه بالا می‌آید |
| ۳ | نصب پکیج‌های اصلی هر دو پروژه | `composer.json` / `package.json` |
| ۴ | تنظیم ESLint, Prettier, Pint, PHPStan | لینت پاس می‌شود |
| ۵ | ساخت ریپازیتوری‌های گیت + README اولیه | ۲ ریپو روی GitHub |
| ۶ | تنظیم CORS و Sanctum | فرانت به بک وصل می‌شود |

**✅ معیار پایان فاز:** فرانت یک `GET /api/v1/ping` از بک می‌گیرد.

### 🗄️ فاز ۱ — دیتابیس و مدل‌ها (هفته ۲)

| # | تسک |
|---|-----|
| ۱ | نوشتن تمام ۳۵ مایگریشن |
| ۲ | ساخت تمام مدل‌ها با روابط و اسکوپ‌ها |
| ۳ | ساخت Enum ها (OrderStatus, PaymentStatus, …) |
| ۴ | نوشتن Factory برای همه مدل‌ها |
| ۵ | نوشتن Seeder (دسته، برند، ۲۰۰ محصول، استان/شهر) |
| ۶ | تنظیم Spatie Permission (نقش‌ها و دسترسی‌ها) |
| ۷ | راه‌اندازی Spatie Translatable روی مدل‌ها |

**✅ معیار پایان فاز:** `php artisan migrate:fresh --seed` بدون خطا و با ۲۰۰ محصول دوزبانه.

### 🔐 فاز ۲ — احراز هویت (هفته ۳)

**Backend:** ثبت‌نام · ورود · OTP · فراموشی رمز · تایید ایمیل · OAuth گوگل · Rate Limit
**Frontend:** صفحات ورود/ثبت‌نام/OTP · `AuthProvider` · مدیریت توکن در کوکی HttpOnly · Interceptor برای ۴۰۱ · محافظت مسیر در Middleware

**✅ معیار پایان فاز:** کاربر ثبت‌نام می‌کند، وارد می‌شود، و `/account` برایش باز می‌شود.

### 🌐 فاز ۳ — زیرساخت i18n و تم (هفته ۴)

| # | تسک |
|---|-----|
| ۱ | نصب و پیکربندی `next-intl` + ساختار `[locale]` |
| ۲ | ساخت `messages/fa.json` و `en.json` (اسکلت کامل کلیدها) |
| ۳ | پیاده‌سازی `LocaleSwitcher` |
| ۴ | تنظیم فونت‌ها و جهت RTL/LTR |
| ۵ | نصب `next-themes` + متغیرهای CSS دو تم |
| ۶ | پیاده‌سازی `ThemeToggle` بدون FOUC |
| ۷ | نصب shadcn/ui و شخصی‌سازی توکن‌های رنگ |
| ۸ | ساخت `Header` + `Footer` + `MobileNav` + `BottomNav` |
| ۹ | ساخت کامپوننت‌های `common/` (Price, LocalizedDate, EmptyState…) |
| ۱۰ | میدل‌ور `SetLocale` در لاراول |

**✅ معیار پایان فاز:** تعویض زبان و تم روی کل سایت کار می‌کند و در ریفرش حفظ می‌شود.

### 🛍️ فاز ۴ — کاتالوگ محصولات (هفته ۵ و ۶)

**Backend:** API محصولات با فیلتر پیشرفته · دسته‌بندی درختی · برندها · جستجوی Meilisearch · کش Redis
**Frontend:** صفحه اصلی کامل · لیست محصولات + فیلتر همگام با URL · جزئیات محصول + گالری · صفحه دسته و برند · جستجو با پیشنهاد زنده · مگامنو

**✅ معیار پایان فاز:** کاربر محصول را پیدا، فیلتر و مشاهده می‌کند — در هر دو زبان و هر دو تم.

### 🛒 فاز ۵ — سبد خرید و علاقه‌مندی (هفته ۷)

**Backend:** CRUD سبد · سبد مهمان با session · ادغام سبد پس از ورود · اعتبارسنجی کد تخفیف · علاقه‌مندی · مقایسه
**Frontend:** استور Zustand · `CartDrawer` · صفحه سبد · فرم کد تخفیف · صفحه علاقه‌مندی · صفحه مقایسه

**✅ معیار پایان فاز:** افزودن به سبد به‌صورت مهمان، ورود، و حفظ سبد.

### 💳 فاز ۶ — تسویه و پرداخت (هفته ۸ و ۹)

**Backend:** آدرس‌ها · محاسبه هزینه ارسال · `OrderService` با تراکنش · درگاه‌های پرداخت (الگوی Strategy) · وبهوک · فاکتور PDF · ایمیل و SMS در صف
**Frontend:** ۳ مرحله تسویه · فرم آدرس با استان/شهر آبشاری · انتخاب روش ارسال · انتخاب درگاه · صفحه موفق/ناموفق

**✅ معیار پایان فاز:** یک سفارش کامل از سبد تا پرداخت تستی ثبت می‌شود.

### 👤 فاز ۷ — پنل کاربری (هفته ۱۰)

داشبورد · سفارش‌ها + تایم‌لاین · آدرس‌ها · نظرات · تیکت · کیف پول · پروفایل با تنظیم زبان و تم · امنیت

**✅ معیار پایان فاز:** کاربر تاریخچه سفارش و فاکتورش را می‌بیند.

### ⭐ فاز ۸ — نظرات و بلاگ (هفته ۱۱)

سیستم امتیاز و نظر با تایید ادمین · خرید تاییدشده · بلاگ کامل با دسته و نظر · صفحات استاتیک · خبرنامه · تماس با ما

### 👑 فاز ۹ — پنل مدیریت (هفته ۱۲ و ۱۳)

داشبورد با نمودار · `DataTable` عمومی · CRUD محصول با فرم چندتبی دوزبانه · ماتریس تنوع · آپلودر تصویر · مدیریت سفارش‌ها · مشتریان · کوپن · بنر · بلاگ · نظرات · تنظیمات · نقش‌ها · گزارش‌ها با خروجی Excel

**✅ معیار پایان فاز:** ادمین محصول دوزبانه اضافه می‌کند و وضعیت سفارش را عوض می‌کند.

### 🚀 فاز ۱۰ — پولیش و انتشار (هفته ۱۴)

| # | تسک |
|---|-----|
| ۱ | تست‌های Pest (Feature + Unit) — پوشش ۷۰٪+ |
| ۲ | تست Playwright برای مسیرهای حیاتی |
| ۳ | بهینه‌سازی Lighthouse (هدف: ۹۰+ در همه معیارها) |
| ۴ | سئو: sitemap، robots، JSON-LD، hreflang، OG images |
| ۵ | دسترس‌پذیری: تست کیبورد، ARIA، کنتراست |
| ۶ | حالت‌های خالی، خطا و لودینگ همه صفحات |
| ۷ | انیمیشن‌های Framer Motion |
| ۸ | تست روی دستگاه‌های واقعی |
| ۹ | مستندسازی API با Scribe |
| ۱۰ | README نهایی + اسکرین‌شات + ویدیو دمو |
| ۱۱ | دیپلوی روی Vercel + VPS |
| ۱۲ | دامنه، SSL، مانیتورینگ |

---

## ۱۳. تست، امنیت، پرفورمنس، SEO

### 🧪 استراتژی تست

| لایه | ابزار | پوشش هدف |
|------|-------|----------|
| **Unit (بک)** | Pest | سرویس‌ها، محاسبه قیمت، تخفیف، ارسال |
| **Feature (بک)** | Pest | تمام endpoint های API |
| **Unit (فرانت)** | Vitest | توابع کمکی، فرمترها، اسکیماها |
| **Component** | Testing Library | ProductCard، CartItem، فرم‌ها |
| **E2E** | Playwright | ۸ سناریوی حیاتی |

**۸ سناریوی E2E اجباری:**
۱) جستجو → فیلتر → مشاهده محصول
۲) افزودن به سبد → تغییر تعداد → حذف
۳) ثبت‌نام → تایید → ورود
۴) خرید کامل مهمان → ثبت‌نام حین تسویه
۵) خرید کامل کاربر لاگین‌کرده تا پرداخت
۶) تعویض زبان → بررسی حفظ مسیر و محتوا
۷) تعویض تم → ریفرش → بررسی ماندگاری
۸) ادمین: افزودن محصول → نمایش در فروشگاه

### 🔒 چک‌لیست امنیت

| مورد | راهکار |
|------|--------|
| احراز هویت | Sanctum + توکن با انقضا |
| ذخیره توکن | کوکی `HttpOnly` + `Secure` + `SameSite=Lax` |
| مجوزدهی | Policy برای هر مدل + Gate برای ادمین |
| اعتبارسنجی | FormRequest برای هر ورودی — بدون استثنا |
| SQL Injection | فقط Eloquent / Query Builder با بایندینگ |
| XSS | Escape خروجی + `dangerouslySetInnerHTML` فقط با DOMPurify |
| CSRF | برای مسیرهای stateful |
| Rate Limiting | روی ورود، OTP، جستجو، فرم تماس |
| آپلود فایل | بررسی MIME + پسوند + حجم + ذخیره خارج از public |
| اسرار | فقط در `.env` — هرگز در گیت |
| هدرهای امنیتی | CSP, HSTS, X-Frame-Options, X-Content-Type-Options |
| لاگ | لاگ کردن تلاش‌های ناموفق ورود |
| افشای اطلاعات | `APP_DEBUG=false` در پروداکشن |

### ⚡ چک‌لیست پرفورمنس

**Backend**
- Eager Loading برای جلوگیری از N+1 (با Telescope چک کن)
- ایندکس روی ستون‌های پرکاربرد در `WHERE` و `ORDER BY`
- کش Redis برای دسته‌بندی، تنظیمات، صفحه اصلی
- صف برای ایمیل، SMS، پردازش تصویر
- `select()` فقط ستون‌های لازم
- صفحه‌بندی Cursor برای لیست‌های بزرگ

**Frontend**
- Server Component پیش‌فرض؛ `'use client'` فقط وقتی لازم است
- `next/image` با `sizes` دقیق + AVIF/WebP
- `next/font` با `display: swap`
- Dynamic Import برای مودال‌ها، ویرایشگر متن، نمودارها
- ISR برای صفحات محصول و دسته
- Prefetch لینک‌های مهم
- Bundle Analyzer برای یافتن پکیج‌های سنگین

**اهداف Core Web Vitals**

| معیار | هدف |
|-------|-----|
| LCP | `< 2.5s` |
| INP | `< 200ms` |
| CLS | `< 0.1` |
| Lighthouse Performance | `≥ 90` |
| Lighthouse Accessibility | `≥ 95` |
| Lighthouse SEO | `≥ 100` |

### 🔍 چک‌لیست SEO

| مورد | پیاده‌سازی |
|------|-----------|
| متادیتای داینامیک | `generateMetadata` در هر صفحه |
| hreflang | `alternates.languages` برای fa و en |
| Canonical | در تمام صفحات |
| Sitemap | `app/sitemap.ts` — شامل هر دو زبان |
| robots.txt | `app/robots.ts` |
| JSON-LD | Product, BreadcrumbList, Organization, Article, FAQPage |
| Open Graph | تصویر داینامیک با `opengraph-image.tsx` |
| نامک فارسی | slug انگلیسی + عنوان فارسی |
| ساختار H1-H6 | یک `h1` در هر صفحه |
| Alt تصاویر | دوزبانه از دیتابیس |
| سرعت | ISR + کش لبه |

### ♿ چک‌لیست دسترس‌پذیری

- ناوبری کامل با کیبورد (Tab, Enter, Esc, فلش‌ها)
- `aria-label` برای دکمه‌های فقط-آیکون
- Focus Trap در مودال و کشو
- کنتراست حداقل ۴.۵:۱ در هر دو تم
- `prefers-reduced-motion`
- HTML معنایی (`nav`, `main`, `article`, `aside`)
- `alt` معنادار برای همه تصاویر
- پیام خطای فرم مرتبط با `aria-describedby`

---

## ۱۴. دیپلوی و DevOps

### 🌍 معماری استقرار

```
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│   Vercel     │──API──▶│  VPS / Liara │───────▶│   MySQL 8    │
│  (Next.js)   │        │  (Laravel)   │        │   Redis 7    │
│  Edge CDN    │        │  Nginx+PHP-FPM│       │  Meilisearch │
└──────────────┘        └──────────────┘        └──────────────┘
       │                        │
       ▼                        ▼
  shop.example.com      api.example.com
```

### 🔄 CI/CD — GitHub Actions

**بک‌اند (`.github/workflows/api.yml`)**
۱) نصب وابستگی‌ها ۲) `pint --test` ۳) `phpstan analyse` ۴) `pest --coverage` ۵) دیپلوی به VPS با SSH

**فرانت (`.github/workflows/web.yml`)**
۱) `pnpm install` ۲) `tsc --noEmit` ۳) `eslint` ۴) `vitest run` ۵) `next build` ۶) `playwright test` ۷) دیپلوی Vercel

### 🔐 متغیرهای محیطی

**Backend `.env`**
```env
APP_NAME=NextStore
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.example.com
FRONTEND_URL=https://shop.example.com

DB_CONNECTION=mysql
DB_DATABASE=nextstore

CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

SANCTUM_STATEFUL_DOMAINS=shop.example.com

SCOUT_DRIVER=meilisearch
MEILISEARCH_HOST=http://127.0.0.1:7700

ZARINPAL_MERCHANT_ID=
SMS_API_KEY=
```

**Frontend `.env.local`**
```env
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
NEXT_PUBLIC_SITE_URL=https://shop.example.com
NEXT_PUBLIC_DEFAULT_LOCALE=fa
REVALIDATE_SECRET=
```

### 📊 مانیتورینگ

| ابزار | کاربرد |
|-------|--------|
| **Laravel Horizon** | وضعیت صف‌ها |
| **Sentry** | ردیابی خطا در هر دو پروژه |
| **Vercel Analytics** | Core Web Vitals واقعی |
| **UptimeRobot** | مانیتور در دسترس بودن |
| **Laravel Pulse** | کوئری‌های کند و عملکرد |

---

## ۱۵. چک‌لیست نهایی تحویل

### ✅ عملکرد

- [ ] ثبت‌نام و ورود با ایمیل، موبایل، OTP و گوگل
- [ ] مرور، فیلتر، مرتب‌سازی و جستجوی محصولات
- [ ] جزئیات محصول با تنوع (رنگ/سایز)
- [ ] سبد خرید مهمان و کاربر + ادغام هنگام ورود
- [ ] کد تخفیف با همه محدودیت‌ها
- [ ] فرآیند تسویه سه‌مرحله‌ای
- [ ] پرداخت با حداقل یک درگاه واقعی (تستی)
- [ ] پنل کاربری کامل (۱۲ صفحه)
- [ ] پنل ادمین کامل (۲۸ صفحه)
- [ ] سیستم نظر و امتیاز با تایید
- [ ] بلاگ با دسته و نظر
- [ ] تیکت پشتیبانی
- [ ] کیف پول

### ✅ دوزبانه

- [ ] هر ۷۲ صفحه در هر دو زبان کامل است
- [ ] هیچ متن هاردکدی باقی نمانده
- [ ] چیدمان RTL بدون شکستگی
- [ ] اعداد و تاریخ محلی‌سازی شده (شمسی/میلادی)
- [ ] فونت هر زبان درست بارگذاری می‌شود
- [ ] پیام‌های خطای API دوزبانه است
- [ ] ایمیل و SMS به زبان کاربر ارسال می‌شود
- [ ] hreflang در همه صفحات
- [ ] تعویض زبان مسیر فعلی را حفظ می‌کند

### ✅ تم

- [ ] هر دو تم روی همه صفحات درست است
- [ ] هیچ FOUC ای وجود ندارد
- [ ] انتخاب کاربر ماندگار است
- [ ] حالت سیستمی کار می‌کند
- [ ] لوگو و تصاویر تم‌آگاه هستند
- [ ] کنتراست AA در هر دو تم

### ✅ ریسپانسیو

- [ ] تست شده روی ۳۲۰px تا ۲۵۶۰px
- [ ] بدون اسکرول افقی ناخواسته
- [ ] ناحیه لمس حداقل ۴۴px
- [ ] ورودی‌ها حداقل ۱۶px (بدون زوم سافاری)
- [ ] تصاویر در همه اندازه‌ها بهینه‌اند
- [ ] جداول ادمین در موبایل قابل استفاده‌اند

### ✅ کیفیت کد

- [ ] هر فایل هدر توضیحی دارد
- [ ] هر تابع JSDoc/PHPDoc دارد
- [ ] TypeScript بدون `any`
- [ ] PHPStan سطح ۶+ پاس می‌شود
- [ ] ESLint و Pint بدون خطا
- [ ] پوشش تست ۷۰٪+
- [ ] بدون `console.log` و `dd()` در کد نهایی

### ✅ مستندات

- [ ] README با اسکرین‌شات هر دو تم و هر دو زبان
- [ ] توضیح معماری + دیاگرام
- [ ] راهنمای نصب گام‌به‌گام
- [ ] مستندات API (Scribe/Swagger)
- [ ] Postman Collection
- [ ] ویدیو دمو ۲ تا ۳ دقیقه‌ای
- [ ] اطلاعات حساب دمو (ادمین و مشتری)

### ✅ انتشار

- [ ] فرانت روی Vercel با دامنه
- [ ] بک روی VPS با SSL
- [ ] دیتابیس با داده دمو seed شده
- [ ] Sentry فعال
- [ ] بکاپ خودکار دیتابیس
- [ ] Lighthouse در همه معیارها ۹۰+

---
## ۱۶. دیزاین‌سیستم (Design System)

> بدون دیزاین‌سیستم، پروژه «کارکردی» می‌شود ولی «حرفه‌ای» به‌نظر نمی‌رسد.
> این بخش تفاوت یک نمونه‌کار متوسط و یک نمونه‌کار استخدام‌کننده است.

### 🎨 پالت رنگ (Design Tokens)

همه رنگ‌ها با فرمت **OKLCH** تعریف می‌شوند (نه HEX) — چون در دارک‌مود روشنایی یکنواخت‌تری دارد و تنظیم کنتراست ساده‌تر است.

| توکن | نقش | لایت | دارک |
|------|-----|------|------|
| `--background` | پس‌زمینه صفحه | `oklch(1 0 0)` | `oklch(0.16 0.01 260)` |
| `--foreground` | متن اصلی | `oklch(0.20 0.01 260)` | `oklch(0.96 0 0)` |
| `--card` | پس‌زمینه کارت | `oklch(1 0 0)` | `oklch(0.21 0.01 260)` |
| `--muted` | پس‌زمینه خنثی | `oklch(0.97 0.005 260)` | `oklch(0.26 0.01 260)` |
| `--muted-foreground` | متن کم‌اهمیت | `oklch(0.55 0.02 260)` | `oklch(0.68 0.02 260)` |
| `--primary` | برند / CTA اصلی | `oklch(0.55 0.20 265)` | `oklch(0.65 0.19 265)` |
| `--primary-foreground` | متن روی primary | `oklch(0.99 0 0)` | `oklch(0.15 0 0)` |
| `--secondary` | دکمه ثانویه | `oklch(0.96 0.01 260)` | `oklch(0.28 0.01 260)` |
| `--accent` | هایلایت / هاور | `oklch(0.95 0.03 265)` | `oklch(0.30 0.03 265)` |
| `--border` | خطوط جداکننده | `oklch(0.92 0.005 260)` | `oklch(0.30 0.01 260)` |
| `--input` | حاشیه ورودی | `oklch(0.90 0.005 260)` | `oklch(0.32 0.01 260)` |
| `--ring` | حلقه فوکوس | `oklch(0.55 0.20 265)` | `oklch(0.65 0.19 265)` |

**رنگ‌های معنایی (Semantic) — کاربرد اختصاصی فروشگاه:**

| توکن | کاربرد |
|------|--------|
| `--success` | موجود در انبار، پرداخت موفق، سفارش تحویل‌شده |
| `--warning` | موجودی کم، در انتظار پرداخت |
| `--destructive` | ناموجود، لغو سفارش، حذف |
| `--info` | در حال ارسال، اطلاع‌رسانی |
| `--sale` | برچسب تخفیف (قرمز/نارنجی گرم) |
| `--rating` | ستاره امتیاز (زرد کهربایی) |

> ⚠️ **قانون:** هرگز رنگ خام (`text-red-500`) در کامپوننت ننویس — همیشه توکن (`text-destructive`).
> دلیل: با تغییر تم یا برند، فقط یک فایل عوض می‌شود نه ۲۰۰ کامپوننت.

### 🔤 مقیاس تایپوگرافی

| نام | موبایل | دسکتاپ | وزن | کاربرد |
|-----|--------|--------|-----|--------|
| `display` | 32px | 48px | 700 | تیتر هیرو صفحه اصلی |
| `h1` | 24px | 32px | 700 | عنوان صفحه |
| `h2` | 20px | 24px | 600 | عنوان بخش |
| `h3` | 18px | 20px | 600 | عنوان کارت |
| `body-lg` | 16px | 16px | 400 | متن توضیحات محصول |
| `body` | 14px | 14px | 400 | متن پیش‌فرض |
| `caption` | 12px | 12px | 400 | برچسب، متن کمکی |
| `price-lg` | 20px | 24px | 700 | قیمت در صفحه محصول |
| `price` | 16px | 16px | 600 | قیمت در کارت محصول |

**نکات حیاتی فارسی‌سازی:**

| نکته | مقدار | چرا |
|------|-------|-----|
| `line-height` فارسی | `1.8` | فارسی به فضای عمودی بیشتری نیاز دارد |
| `line-height` انگلیسی | `1.5` | استاندارد لاتین |
| `letter-spacing` فارسی | `0` | مقدار منفی حروف را می‌چسباند و ناخوانا می‌کند |
| `font-feature-settings` | `"ss01","ss02"` | فرم بهتر اعداد و کاف/یای فارسی در Vazirmatn |
| اعداد قیمت | `font-variant-numeric: tabular-nums` | ستون‌های قیمت هم‌تراز می‌شوند |

### 📏 مقیاس فاصله (Spacing)

مبنا **4px** — فقط از این مقادیر استفاده کن:
```
4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96
```

| کاربرد | مقدار |
|--------|-------|
| پدینگ داخل دکمه | `12px 20px` |
| فاصله بین کارت‌های محصول | `16px` موبایل / `24px` دسکتاپ |
| پدینگ کارت | `16px` |
| فاصله بین بخش‌های صفحه | `48px` موبایل / `80px` دسکتاپ |
| پدینگ افقی Container | `16px` / `24px` / `32px` |
| عرض حداکثر Container | `1280px` محتوا · `1536px` پنل ادمین |

### 🔲 گردی گوشه (Radius)

| توکن | مقدار | کاربرد |
|------|-------|--------|
| `--radius-sm` | 6px | برچسب، بج |
| `--radius-md` | 10px | دکمه، ورودی |
| `--radius-lg` | 14px | کارت محصول، مودال |
| `--radius-xl` | 20px | بنر، هیرو |
| `--radius-full` | 9999px | آواتار، چیپ فیلتر |

### 🌫️ سایه‌ها (Shadows)

> ⚠️ در دارک‌مود سایه دیده نمی‌شود. به‌جای سایه از **حاشیه روشن‌تر** استفاده کن.

| توکن | لایت | دارک |
|------|------|------|
| `--shadow-sm` | `0 1px 2px rgb(0 0 0 / .05)` | `1px solid var(--border)` |
| `--shadow-md` | `0 4px 12px rgb(0 0 0 / .08)` | `border` + `background: var(--card)` |
| `--shadow-lg` | `0 12px 32px rgb(0 0 0 / .12)` | `border` + پس‌زمینه روشن‌تر |

### 🎬 موشن (Animation)

| توکن | مقدار | کاربرد |
|------|-------|--------|
| `--duration-fast` | 150ms | هاور، فوکوس |
| `--duration-base` | 250ms | دراپ‌داون |
| `--duration-slow` | 400ms | کشوی سبد، مودال |
| `--ease-out` | `cubic-bezier(.16,1,.3,1)` | ورود عناصر |
| `--ease-in-out` | `cubic-bezier(.65,0,.35,1)` | جابه‌جایی |

```css
/* احترام به تنظیمات دسترسی‌پذیری کاربر — الزامی */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    transition-duration: .01ms !important;
  }
}
```

### 🧩 حالت‌های تعامل (Interaction States)

هر کامپوننت تعاملی **باید** این ۶ حالت را داشته باشد — دقیقاً چیزی که مصاحبه‌گر چک می‌کند:

| حالت | نشانه بصری |
|------|-----------|
| `default` | حالت عادی |
| `hover` | تغییر پس‌زمینه — فقط دسکتاپ با `@media (hover:hover)` |
| `focus-visible` | حلقه `--ring` ضخامت 2px با offset 2px |
| `active` | فشرده‌شدن `scale(.98)` |
| `disabled` | `opacity:.5` + `cursor:not-allowed` |
| `loading` | اسپینر + غیرفعال + متن «در حال ارسال...» |

### 📦 حالت‌های داده (Data States)

هر صفحه‌ای که داده می‌گیرد **باید** این ۴ حالت را پوشش دهد:

| حالت | کامپوننت | نکته |
|------|----------|------|
| `loading` | `<Skeleton />` | اسکلتون هم‌شکل و هم‌ابعاد محتوای واقعی — نه اسپینر وسط صفحه |
| `empty` | `<EmptyState />` | تصویر + پیام + دکمه اقدام («مشاهده محصولات») |
| `error` | `<ErrorState />` | پیام قابل‌فهم + دکمه «تلاش مجدد» |
| `success` | محتوای واقعی | — |

> 💡 **نکته طلایی نمونه‌کار:** بیشتر پروژه‌های آماتور فقط حالت `success` را می‌سازند.
> پوشش هر ۴ حالت، بلافاصله سطح کار را چند پله بالا می‌برد.

---
## ۱۷. برش عمودی کامل (Vertical Slice) — «افزودن به سبد خرید»

> این بخش **مهم‌ترین بخش کل رودمپ** است.
> یک فیچر را از مایگریشن تا کامپوننت نهایی، با کامنت کامل، پیاده می‌کنیم.
> بقیه فیچرها را دقیقاً با همین الگو بساز.

### 🔗 زنجیره کامل فایل‌ها

```
1. Migration        → ساخت جدول carts و cart_items
2. Model            → Cart.php, CartItem.php
3. Enum             → —
4. Request          → AddToCartRequest.php        (اعتبارسنجی)
5. Service          → CartService.php             (منطق تجاری)
6. Resource         → CartResource.php            (خروجی JSON)
7. Controller       → CartController.php          (هماهنگ‌کننده)
8. Route            → routes/api/v1/customer.php
9. Test             → tests/Feature/Cart/AddToCartTest.php
──────────────────── مرز بک‌اند / فرانت‌اند ────────────────────
10. Type            → types/cart.ts               (تایپ‌ها)
11. API fn          → lib/api/cart.ts             (فراخوانی)
12. Store           → store/cart-store.ts         (state کلاینت)
13. Hook            → hooks/useCart.ts            (اتصال React Query)
14. Component       → AddToCartButton.tsx         (UI)
15. Translation     → messages/fa.json + en.json
```

### ۱️⃣ Migration — `database/migrations/xxxx_create_carts_table.php`

```php
<?php

/**
 * مایگریشن جدول سبد خرید.
 *
 * چرا سبد در دیتابیس ذخیره می‌شود و نه فقط در localStorage؟
 *  - کاربر با موبایل محصول اضافه می‌کند، با لپ‌تاپ ادامه می‌دهد
 *  - امکان ارسال ایمیل «سبد رهاشده» (Abandoned Cart)
 *  - امکان گزارش‌گیری برای ادمین
 *
 * سبد مهمان (Guest) با session_id ذخیره می‌شود و هنگام ورود
 * به حساب کاربر merge می‌شود.
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** ساخت جداول carts و cart_items. */
    public function up(): void
    {
        Schema::create('carts', function (Blueprint $table) {
            $table->id();

            // کاربر مالک سبد — برای مهمان null است
            $table->foreignId('user_id')->nullable()
                  ->constrained()->cascadeOnDelete();

            // شناسه نشست برای کاربر مهمان (مهمان → کاربر: merge می‌شود)
            $table->string('session_id')->nullable()->index();

            // کوپن اعمال‌شده روی کل سبد
            $table->foreignId('coupon_id')->nullable()
                  ->constrained()->nullOnDelete();

            // زمان انقضا — سبدهای منقضی با Command پاک می‌شوند
            $table->timestamp('expires_at')->nullable()->index();

            $table->timestamps();

            // هر کاربر فقط یک سبد فعال دارد
            $table->unique('user_id');
        });

        Schema::create('cart_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('cart_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();

            // تنوع محصول (رنگ/سایز) — برای محصول ساده null است
            $table->foreignId('product_variant_id')->nullable()
                  ->constrained()->cascadeOnDelete();

            $table->unsignedInteger('quantity')->default(1);

            /*
             * قیمت لحظه‌ی افزودن به سبد را ذخیره می‌کنیم (Price Snapshot).
             * دلیل: اگر قیمت محصول تغییر کند، می‌توانیم به کاربر
             * اطلاع دهیم «قیمت این کالا تغییر کرده است».
             */
            $table->unsignedBigInteger('price_at_add');

            $table->timestamps();

            // جلوگیری از ردیف تکراری برای یک محصول/تنوع در یک سبد
            $table->unique(['cart_id', 'product_id', 'product_variant_id'], 'cart_item_unique');
        });
    }

    /** حذف جداول در صورت rollback. */
    public function down(): void
    {
        Schema::dropIfExists('cart_items');
        Schema::dropIfExists('carts');
    }
};
```

### ۲️⃣ Model — `app/Models/Cart.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * مدل سبد خرید.
 *
 * مسئولیت: نگهداری رابطه‌ها و محاسبات ساده‌ی مشتق‌شده.
 * منطق تجاری (افزودن/حذف/اعتبارسنجی موجودی) در CartService است، نه اینجا.
 *
 * @property int         $id
 * @property int|null    $user_id
 * @property string|null $session_id
 * @property int|null    $coupon_id
 */
class Cart extends Model
{
    use HasFactory;

    /** ستون‌های قابل پر شدن انبوه (Mass Assignment). */
    protected $fillable = ['user_id', 'session_id', 'coupon_id', 'expires_at'];

    /** تبدیل خودکار نوع ستون‌ها. */
    protected function casts(): array
    {
        return ['expires_at' => 'datetime'];
    }

    /** کاربر مالک این سبد (برای مهمان null). */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** اقلام داخل سبد. */
    public function items(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    /** کوپن تخفیف اعمال‌شده روی سبد. */
    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    /**
     * تعداد کل اقلام (مجموع quantity ها، نه تعداد ردیف‌ها).
     * مثال: ۲ عدد تیشرت + ۳ عدد شلوار = ۵
     */
    public function getTotalQuantityAttribute(): int
    {
        return (int) $this->items->sum('quantity');
    }

    /** آیا سبد خالی است؟ */
    public function isEmpty(): bool
    {
        return $this->items->isEmpty();
    }
}
```

### ۳️⃣ Request — `app/Http/Requests/Customer/AddToCartRequest.php`

```php
<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

/**
 * اعتبارسنجی درخواست «افزودن محصول به سبد خرید».
 *
 * این کلاس تنها مسئول بررسی *شکل* داده ورودی است.
 * بررسی موجودی انبار در CartService انجام می‌شود، چون
 * آن یک قاعده‌ی تجاری است نه یک قاعده‌ی اعتبارسنجی ورودی.
 */
class AddToCartRequest extends FormRequest
{
    /** همه (حتی مهمان) اجازه افزودن به سبد دارند. */
    public function authorize(): bool
    {
        return true;
    }

    /** قواعد اعتبارسنجی فیلدها. */
    public function rules(): array
    {
        return [
            // محصول باید وجود داشته و منتشرشده باشد
            'product_id' => ['required', 'integer', 'exists:products,id'],

            // تنوع محصول اختیاری است (محصول ساده تنوع ندارد)
            'variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],

            // حداکثر ۱۰ عدد در هر بار — جلوگیری از سوءاستفاده
            'quantity'   => ['required', 'integer', 'min:1', 'max:10'],
        ];
    }

    /** پیام‌های خطای محلی‌سازی‌شده (فارسی/انگلیسی بر اساس هدر زبان). */
    public function messages(): array
    {
        return [
            'product_id.required' => __('validation.cart.product_required'),
            'product_id.exists'   => __('validation.cart.product_not_found'),
            'quantity.max'        => __('validation.cart.quantity_max', ['max' => 10]),
        ];
    }
}
```

### ۴️⃣ Service — `app/Services/Cart/CartService.php`

```php
<?php

namespace App\Services\Cart;

use App\Exceptions\InsufficientStockException;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;

/**
 * سرویس مدیریت سبد خرید — قلب منطق تجاری سبد.
 *
 * چرا Service و نه Controller؟
 *  - کنترلر باید نازک بماند و فقط HTTP را مدیریت کند
 *  - همین منطق از Command، Job یا تست هم قابل فراخوانی است
 *  - تست‌پذیری بسیار بالاتر
 */
class CartService
{
    /**
     * دریافت سبد فعلی کاربر یا ساخت سبد جدید.
     *
     * @param  int|null     $userId    شناسه کاربر لاگین‌کرده
     * @param  string|null  $sessionId شناسه نشست برای مهمان
     */
    public function getOrCreate(?int $userId, ?string $sessionId): Cart
    {
        return Cart::query()
            ->when($userId, fn ($q) => $q->where('user_id', $userId))
            ->when(! $userId, fn ($q) => $q->where('session_id', $sessionId))
            ->firstOrCreate(
                $userId ? ['user_id' => $userId] : ['session_id' => $sessionId],
                ['expires_at' => now()->addDays(30)]
            );
    }

    /**
     * افزودن محصول به سبد خرید.
     *
     * جریان کار:
     *  ۱. قفل کردن ردیف محصول (جلوگیری از Race Condition)
     *  ۲. بررسی موجودی انبار
     *  ۳. اگر قبلاً در سبد بود → افزایش تعداد، وگرنه → ردیف جدید
     *  ۴. بازگرداندن سبد به‌روزشده
     *
     * @throws InsufficientStockException وقتی موجودی کافی نیست
     */
    public function add(Cart $cart, int $productId, ?int $variantId, int $quantity): Cart
    {
        return DB::transaction(function () use ($cart, $productId, $variantId, $quantity) {

            // lockForUpdate: تا پایان تراکنش هیچ درخواست دیگری این ردیف را تغییر نمی‌دهد
            $product = Product::query()->lockForUpdate()->findOrFail($productId);
            $variant = $variantId
                ? ProductVariant::query()->lockForUpdate()->findOrFail($variantId)
                : null;

            // منبع قیمت و موجودی: تنوع در اولویت است، وگرنه خود محصول
            $stock = $variant?->stock ?? $product->stock;
            $price = $variant?->final_price ?? $product->final_price;

            // آیا این محصول از قبل در سبد هست؟
            $existing = $cart->items()
                ->where('product_id', $productId)
                ->where('product_variant_id', $variantId)
                ->first();

            // تعداد نهایی = تعداد فعلی در سبد + تعداد درخواستی
            $newQuantity = ($existing?->quantity ?? 0) + $quantity;

            // بررسی موجودی انبار بر اساس تعداد نهایی
            if ($newQuantity > $stock) {
                throw new InsufficientStockException(
                    product: $product,
                    requested: $newQuantity,
                    available: $stock,
                );
            }

            // ثبت یا به‌روزرسانی ردیف
            if ($existing) {
                $existing->update(['quantity' => $newQuantity]);
            } else {
                $cart->items()->create([
                    'product_id'         => $productId,
                    'product_variant_id' => $variantId,
                    'quantity'           => $quantity,
                    'price_at_add'       => $price,
                ]);
            }

            // تمدید عمر سبد با هر تعامل
            $cart->update(['expires_at' => now()->addDays(30)]);

            // بارگذاری مجدد رابطه‌ها برای خروجی تازه
            return $cart->fresh(['items.product.media', 'items.variant', 'coupon']);
        });
    }

    /**
     * ادغام سبد مهمان با سبد کاربر پس از ورود به حساب.
     * هنگام لاگین فراخوانی می‌شود تا سبد کاربر از دست نرود.
     */
    public function merge(string $sessionId, int $userId): void
    {
        $guestCart = Cart::where('session_id', $sessionId)->with('items')->first();
        if (! $guestCart || $guestCart->isEmpty()) {
            return;
        }

        $userCart = $this->getOrCreate($userId, null);

        foreach ($guestCart->items as $item) {
            // از add استفاده می‌کنیم تا بررسی موجودی هم انجام شود
            try {
                $this->add($userCart, $item->product_id, $item->product_variant_id, $item->quantity);
            } catch (InsufficientStockException) {
                continue; // اقلام ناموجود بی‌صدا رد می‌شوند
            }
        }

        $guestCart->delete();
    }
}
```

### ۵️⃣ Controller — `app/Http/Controllers/Api/V1/Customer/CartController.php`

```php
<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\AddToCartRequest;
use App\Http\Resources\CartResource;
use App\Services\Cart\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * کنترلر سبد خرید — لایه‌ی نازک بین HTTP و CartService.
 *
 * وظایف: خواندن ورودی، صدا زدن سرویس، تبدیل خروجی به JSON.
 * هیچ منطق تجاری‌ای اینجا نوشته نمی‌شود.
 */
class CartController extends Controller
{
    public function __construct(
        private readonly CartService $cartService,
    ) {}

    /** GET /api/v1/cart — نمایش سبد فعلی. */
    public function show(Request $request): CartResource
    {
        $cart = $this->cartService->getOrCreate(
            userId: $request->user()?->id,
            sessionId: $request->header('X-Session-Id'),
        );

        return new CartResource($cart->load(['items.product.media', 'items.variant', 'coupon']));
    }

    /** POST /api/v1/cart/items — افزودن محصول به سبد. */
    public function store(AddToCartRequest $request): JsonResponse
    {
        $cart = $this->cartService->getOrCreate(
            userId: $request->user()?->id,
            sessionId: $request->header('X-Session-Id'),
        );

        $cart = $this->cartService->add(
            cart: $cart,
            productId: $request->integer('product_id'),
            variantId: $request->input('variant_id'),
            quantity: $request->integer('quantity'),
        );

        return (new CartResource($cart))
            ->additional(['message' => __('messages.cart.added')])
            ->response()
            ->setStatusCode(201);
    }
}
```

### ۶️⃣ Test — `tests/Feature/Cart/AddToCartTest.php`

```php
<?php

use App\Models\Product;
use App\Models\User;

/**
 * تست‌های فیچر «افزودن به سبد خرید».
 * هر تست یک رفتار قابل‌مشاهده را بررسی می‌کند، نه جزئیات پیاده‌سازی.
 */

it('کاربر می‌تواند محصول موجود را به سبد اضافه کند', function () {
    $user    = User::factory()->create();
    $product = Product::factory()->create(['stock' => 10, 'price' => 250_000]);

    $response = $this->actingAs($user)->postJson('/api/v1/cart/items', [
        'product_id' => $product->id,
        'quantity'   => 2,
    ]);

    $response->assertCreated()
             ->assertJsonPath('data.items.0.quantity', 2);

    $this->assertDatabaseHas('cart_items', [
        'product_id'   => $product->id,
        'quantity'     => 2,
        'price_at_add' => 250_000,
    ]);
});

it('افزودن بیش از موجودی انبار خطا برمی‌گرداند', function () {
    $user    = User::factory()->create();
    $product = Product::factory()->create(['stock' => 3]);

    $this->actingAs($user)
         ->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 5])
         ->assertStatus(422)
         ->assertJsonPath('error.code', 'INSUFFICIENT_STOCK');
});

it('افزودن دوباره‌ی یک محصول تعداد را جمع می‌زند نه ردیف جدید', function () {
    $user    = User::factory()->create();
    $product = Product::factory()->create(['stock' => 10]);

    $this->actingAs($user)->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 2]);
    $this->actingAs($user)->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 3]);

    expect(\App\Models\CartItem::count())->toBe(1)
        ->and(\App\Models\CartItem::first()->quantity)->toBe(5);
});
```

### ۷️⃣ Type — `src/types/cart.ts`

```ts
/**
 * تایپ‌های سبد خرید.
 * این تایپ‌ها باید دقیقاً با خروجی CartResource در بک‌اند مطابق باشند.
 */

import type { Product, ProductVariant } from './product'

/** یک قلم داخل سبد خرید. */
export interface CartItem {
  id: number
  quantity: number
  /** قیمت لحظه‌ی افزودن — برای تشخیص تغییر قیمت */
  priceAtAdd: number
  /** قیمت فعلی محصول */
  currentPrice: number
  /** جمع این قلم = currentPrice × quantity */
  lineTotal: number
  /** آیا قیمت از زمان افزودن تغییر کرده؟ */
  priceChanged: boolean
  product: Pick<Product, 'id' | 'name' | 'slug' | 'thumbnail' | 'stock'>
  variant: ProductVariant | null
}

/** خلاصه محاسبات مالی سبد. */
export interface CartSummary {
  subtotal: number       // جمع اقلام قبل از تخفیف
  discount: number       // مبلغ تخفیف کوپن
  shipping: number       // هزینه ارسال
  tax: number            // مالیات
  total: number          // مبلغ نهایی قابل پرداخت
}

/** کل سبد خرید. */
export interface Cart {
  id: number
  items: CartItem[]
  itemsCount: number
  summary: CartSummary
  coupon: { code: string; discountAmount: number } | null
}

/** ورودی افزودن به سبد. */
export interface AddToCartInput {
  productId: number
  variantId?: number | null
  quantity: number
}
```

### ۸️⃣ API Function — `src/lib/api/cart.ts`

```ts
/**
 * توابع فراخوانی API سبد خرید.
 * هیچ منطق UI اینجا نیست — فقط ارتباط با بک‌اند.
 */

import { apiClient } from './client'
import type { Cart, AddToCartInput } from '@/types/cart'
import type { ApiResponse } from '@/types/api'

/** دریافت سبد خرید فعلی کاربر. */
export async function getCart(): Promise<Cart> {
  const { data } = await apiClient.get<ApiResponse<Cart>>('/cart')
  return data.data
}

/** افزودن محصول به سبد خرید. */
export async function addToCart(input: AddToCartInput): Promise<Cart> {
  const { data } = await apiClient.post<ApiResponse<Cart>>('/cart/items', {
    product_id: input.productId,
    variant_id: input.variantId ?? null,
    quantity: input.quantity,
  })
  return data.data
}

/** تغییر تعداد یک قلم در سبد. */
export async function updateCartItem(itemId: number, quantity: number): Promise<Cart> {
  const { data } = await apiClient.patch<ApiResponse<Cart>>(`/cart/items/${itemId}`, { quantity })
  return data.data
}

/** حذف یک قلم از سبد. */
export async function removeCartItem(itemId: number): Promise<Cart> {
  const { data } = await apiClient.delete<ApiResponse<Cart>>(`/cart/items/${itemId}`)
  return data.data
}
```

### ۹️⃣ Hook — `src/hooks/useCart.ts`

```ts
'use client'

/**
 * هوک مدیریت سبد خرید.
 *
 * از TanStack Query برای همگام‌سازی با سرور استفاده می‌کند و
 * Optimistic Update دارد: UI بلافاصله به‌روز می‌شود، اگر درخواست
 * شکست خورد به حالت قبل برمی‌گردد.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { getCart, addToCart, updateCartItem, removeCartItem } from '@/lib/api/cart'
import type { AddToCartInput, Cart } from '@/types/cart'

/** کلید کش سبد خرید — در یک ثابت تا در همه‌جا یکسان باشد. */
const CART_KEY = ['cart'] as const

export function useCart() {
  const queryClient = useQueryClient()
  const t = useTranslations('cart')

  /** خواندن سبد از سرور. */
  const cartQuery = useQuery({
    queryKey: CART_KEY,
    queryFn: getCart,
    staleTime: 30_000, // ۳۰ ثانیه تازه در نظر گرفته می‌شود
  })

  /** افزودن به سبد با به‌روزرسانی خوش‌بینانه. */
  const addMutation = useMutation({
    mutationFn: (input: AddToCartInput) => addToCart(input),

    // قبل از رسیدن پاسخ سرور، شمارنده سبد را بلافاصله زیاد کن
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: CART_KEY })
      const previous = queryClient.getQueryData<Cart>(CART_KEY)

      queryClient.setQueryData<Cart>(CART_KEY, (old) =>
        old ? { ...old, itemsCount: old.itemsCount + input.quantity } : old
      )

      return { previous } // برای بازگردانی در صورت خطا
    },

    // در صورت خطا: بازگشت به حالت قبل + نمایش پیام
    onError: (error: any, _input, context) => {
      queryClient.setQueryData(CART_KEY, context?.previous)
      const code = error?.response?.data?.error?.code
      toast.error(
        code === 'INSUFFICIENT_STOCK' ? t('errors.insufficientStock') : t('errors.generic')
      )
    },

    // در صورت موفقیت: پیام تأیید
    onSuccess: () => toast.success(t('added')),

    // در هر حالت: همگام‌سازی نهایی با سرور
    onSettled: () => queryClient.invalidateQueries({ queryKey: CART_KEY }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      updateCartItem(itemId, quantity),
    onSettled: () => queryClient.invalidateQueries({ queryKey: CART_KEY }),
  })

  const removeMutation = useMutation({
    mutationFn: (itemId: number) => removeCartItem(itemId),
    onSuccess: () => toast.success(t('removed')),
    onSettled: () => queryClient.invalidateQueries({ queryKey: CART_KEY }),
  })

  return {
    cart: cartQuery.data,
    isLoading: cartQuery.isLoading,
    isError: cartQuery.isError,
    itemsCount: cartQuery.data?.itemsCount ?? 0,

    addItem: addMutation.mutate,
    isAdding: addMutation.isPending,

    updateItem: updateMutation.mutate,
    removeItem: removeMutation.mutate,
  }
}
```

### 🔟 Component — `src/components/product/AddToCartButton.tsx`

```tsx
'use client'

/**
 * دکمه «افزودن به سبد خرید».
 *
 * مسئولیت‌ها:
 *  - نمایش وضعیت موجودی (ناموجود / موجودی کم / موجود)
 *  - انتخاب تعداد
 *  - افزودن به سبد با نمایش وضعیت بارگذاری
 *  - پشتیبانی کامل از RTL/LTR، دارک‌مود و صفحه‌خوان
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ShoppingCart, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QuantitySelector } from './QuantitySelector'
import { useCart } from '@/hooks/useCart'
import { cn } from '@/lib/utils/cn'

interface AddToCartButtonProps {
  productId: number
  variantId?: number | null
  /** موجودی انبار — برای غیرفعال‌کردن دکمه و سقف تعداد */
  stock: number
  /** نمایش انتخابگر تعداد (در کارت محصول false، در صفحه محصول true) */
  showQuantity?: boolean
  /** تمام‌عرض شدن دکمه (موبایل) */
  fullWidth?: boolean
  className?: string
}

export function AddToCartButton({
  productId,
  variantId = null,
  stock,
  showQuantity = false,
  fullWidth = false,
  className,
}: AddToCartButtonProps) {
  const t = useTranslations('product')
  const { addItem, isAdding } = useCart()

  // تعداد انتخابی کاربر — فقط وقتی showQuantity فعال است قابل تغییر است
  const [quantity, setQuantity] = useState(1)

  // نمایش تیک موفقیت به‌مدت کوتاه پس از افزودن
  const [justAdded, setJustAdded] = useState(false)

  const isOutOfStock = stock <= 0
  const isLowStock = stock > 0 && stock <= 5

  /** ارسال درخواست افزودن به سبد و نمایش بازخورد بصری. */
  const handleAdd = () => {
    addItem(
      { productId, variantId, quantity },
      {
        onSuccess: () => {
          setJustAdded(true)
          setTimeout(() => setJustAdded(false), 2000)
        },
      }
    )
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* هشدار موجودی کم — فقط وقتی موجودی بین ۱ تا ۵ است */}
      {isLowStock && (
        <p className="text-caption text-warning" role="status">
          {t('lowStock', { count: stock })}
        </p>
      )}

      <div className={cn('flex items-center gap-3', fullWidth && 'w-full')}>
        {/* انتخابگر تعداد — در کارت محصول نمایش داده نمی‌شود */}
        {showQuantity && !isOutOfStock && (
          <QuantitySelector
            value={quantity}
            onChange={setQuantity}
            min={1}
            max={Math.min(stock, 10)}
          />
        )}

        <Button
          onClick={handleAdd}
          disabled={isOutOfStock || isAdding}
          size="lg"
          className={cn(fullWidth && 'flex-1')}
          // برای صفحه‌خوان: وضعیت دکمه را اعلام می‌کند
          aria-busy={isAdding}
          aria-label={t('addToCartAria')}
        >
          {/* آیکون‌ها با ms/me کار می‌کنند تا در RTL خودکار جابه‌جا شوند */}
          {isAdding ? (
            <Loader2 className="size-5 animate-spin me-2" aria-hidden />
          ) : justAdded ? (
            <Check className="size-5 me-2" aria-hidden />
          ) : (
            <ShoppingCart className="size-5 me-2" aria-hidden />
          )}

          {isOutOfStock
            ? t('outOfStock')
            : justAdded
              ? t('addedToCart')
              : t('addToCart')}
        </Button>
      </div>
    </div>
  )
}
```

### 1️⃣1️⃣ Translation — `messages/fa.json` (بخش مربوطه)

```json
{
  "product": {
    "addToCart": "افزودن به سبد خرید",
    "addToCartAria": "افزودن این محصول به سبد خرید",
    "addedToCart": "به سبد اضافه شد",
    "outOfStock": "ناموجود",
    "lowStock": "تنها {count} عدد در انبار باقی مانده",
    "quantity": "تعداد"
  },
  "cart": {
    "added": "محصول به سبد خرید اضافه شد",
    "removed": "محصول از سبد حذف شد",
    "errors": {
      "insufficientStock": "موجودی کافی نیست",
      "generic": "خطایی رخ داد. دوباره تلاش کنید"
    }
  }
}
```

### ✅ چک‌لیست یک برش عمودی کامل

هر فیچری که می‌سازی باید این ۱۲ مورد را داشته باشد:

- [ ] مایگریشن با ایندکس و کلید خارجی درست
- [ ] مدل با رابطه‌ها و کامنت PHPDoc
- [ ] Request برای اعتبارسنجی ورودی
- [ ] Service برای منطق تجاری (نه در کنترلر)
- [ ] Resource برای خروجی JSON
- [ ] کنترلر نازک
- [ ] روت با میدلور مناسب
- [ ] تست Feature (حالت موفق + حداقل ۲ حالت خطا)
- [ ] تایپ TypeScript مطابق خروجی API
- [ ] هوک با مدیریت loading/error
- [ ] کامپوننت با ۴ حالت داده و ۶ حالت تعامل
- [ ] کلیدهای ترجمه در هر دو زبان

---
## ۱۸. لایه ارتباط با API و مدیریت خطا

> این لایه‌ای است که ۹۰٪ نمونه‌کارها بد می‌نویسند. درست نوشتنش امتیاز بزرگی است.

### 🔌 کلاینت API — `src/lib/api/client.ts`

```ts
/**
 * کلاینت مرکزی ارتباط با API لاراول.
 *
 * مسئولیت‌ها:
 *  ۱. افزودن خودکار توکن احراز هویت به هر درخواست
 *  ۲. افزودن هدر زبان تا بک‌اند پاسخ محلی‌سازی‌شده بدهد
 *  ۳. افزودن شناسه نشست برای کاربر مهمان (سبد خرید)
 *  ۴. تبدیل خطاهای HTTP به خطاهای قابل‌فهم برنامه
 *  ۵. تلاش مجدد خودکار برای توکن منقضی‌شده
 */

import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

/** نمونه اصلی Axios با تنظیمات پایه. */
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1',
  timeout: 15_000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
})

/* ---------------------------------------------------------------------------
 * Interceptor درخواست — قبل از ارسال هر درخواست اجرا می‌شود
 * ------------------------------------------------------------------------- */
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // فقط در مرورگر به localStorage دسترسی داریم (نه در Server Component)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token')
    if (token) config.headers.Authorization = `Bearer ${token}`

    // شناسه نشست مهمان — برای نگهداری سبد خرید کاربر لاگین‌نکرده
    let sessionId = localStorage.getItem('session_id')
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      localStorage.setItem('session_id', sessionId)
    }
    config.headers['X-Session-Id'] = sessionId

    // زبان فعلی از مسیر URL خوانده می‌شود: /fa/products یا /en/products
    const locale = window.location.pathname.split('/')[1] || 'fa'
    config.headers['Accept-Language'] = locale
  }

  return config
})

/* ---------------------------------------------------------------------------
 * Interceptor پاسخ — خطاها را یکدست می‌کند
 * ------------------------------------------------------------------------- */
apiClient.interceptors.response.use(
  (response) => response,

  async (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status

    // ۴۰۱: توکن نامعتبر یا منقضی → خروج و هدایت به صفحه ورود
    if (status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      const locale = window.location.pathname.split('/')[1] || 'fa'
      // مسیر فعلی را نگه می‌داریم تا بعد از ورود برگردد
      const next = encodeURIComponent(window.location.pathname)
      window.location.href = `/${locale}/login?next=${next}`
    }

    // ۴۲۹: محدودیت تعداد درخواست
    if (status === 429) {
      return Promise.reject(new ApiError('RATE_LIMITED', 'تعداد درخواست بیش از حد مجاز', 429))
    }

    // ۵۰۰+: خطای سرور
    if (status && status >= 500) {
      return Promise.reject(new ApiError('SERVER_ERROR', 'خطای سرور', status))
    }

    // خطای شبکه (قطعی اینترنت، تایم‌اوت)
    if (!error.response) {
      return Promise.reject(new ApiError('NETWORK_ERROR', 'اتصال به اینترنت برقرار نیست', 0))
    }

    // بقیه خطاها با کد و پیام خود بک‌اند
    const body = error.response.data
    return Promise.reject(
      new ApiError(
        body?.error?.code ?? 'UNKNOWN',
        body?.message ?? 'خطای ناشناخته',
        status ?? 0,
        body?.errors,
      )
    )
  }
)

/** ساختار بدنه خطای استاندارد بک‌اند. */
interface ApiErrorBody {
  message?: string
  error?: { code?: string }
  errors?: Record<string, string[]>
}

/** کلاس خطای یکدست برنامه — همه‌جا همین نوع پرتاب می‌شود. */
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    /** خطاهای اعتبارسنجی فیلد به فیلد (برای نمایش زیر ورودی فرم) */
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'ApiError'
  }

  /** آیا خطای اعتبارسنجی فرم است؟ */
  get isValidation(): boolean {
    return this.status === 422
  }
}
```

### 🛡️ مدیریت خطا در بک‌اند — `app/Exceptions/Handler.php`

```php
<?php

namespace App\Exceptions;

use App\Exceptions\InsufficientStockException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

/**
 * تبدیل تمام استثناها به پاسخ JSON با ساختار یکسان.
 *
 * چرا مهم است؟ فرانت‌اند فقط با یک ساختار خطا کار می‌کند و
 * لازم نیست برای هر نوع خطا کد جداگانه بنویسد.
 */
class Handler extends ExceptionHandler
{
    /** تبدیل استثنا به پاسخ JSON. */
    public function render($request, Throwable $e): JsonResponse
    {
        // خطای اعتبارسنجی فرم — ۴۲۲
        if ($e instanceof ValidationException) {
            return $this->error('VALIDATION_ERROR', $e->getMessage(), 422, $e->errors());
        }

        // عدم احراز هویت — ۴۰۱
        if ($e instanceof AuthenticationException) {
            return $this->error('UNAUTHENTICATED', __('errors.unauthenticated'), 401);
        }

        // موجودی ناکافی — خطای تجاری اختصاصی
        if ($e instanceof InsufficientStockException) {
            return $this->error('INSUFFICIENT_STOCK', $e->getMessage(), 422, [
                'available' => $e->available,
                'requested' => $e->requested,
            ]);
        }

        // منبع یافت نشد — ۴۰۴
        if ($e instanceof ModelNotFoundException || $e instanceof NotFoundHttpException) {
            return $this->error('NOT_FOUND', __('errors.not_found'), 404);
        }

        // خطای پیش‌بینی‌نشده — ۵۰۰
        // در محیط توسعه جزئیات را نشان می‌دهیم، در تولید هرگز
        return $this->error(
            'SERVER_ERROR',
            config('app.debug') ? $e->getMessage() : __('errors.server_error'),
            500,
            config('app.debug') ? ['trace' => $e->getTrace()] : null,
        );
    }

    /** ساخت پاسخ خطای استاندارد. */
    private function error(string $code, string $message, int $status, ?array $errors = null): JsonResponse
    {
        return response()->json(array_filter([
            'success' => false,
            'message' => $message,
            'error'   => ['code' => $code],
            'errors'  => $errors,
        ], fn ($v) => $v !== null), $status);
    }
}
```

### 🎯 نمایش خطای فرم در فرانت

```tsx
/**
 * الگوی نمایش خطاهای اعتبارسنجی سرور روی فیلدهای فرم.
 * از React Hook Form برای مدیریت فرم و از setError برای
 * تزریق خطاهای بک‌اند استفاده می‌کنیم.
 */
const onSubmit = async (values: AddressFormValues) => {
  try {
    await createAddress(values)
    toast.success(t('address.created'))
  } catch (error) {
    if (error instanceof ApiError && error.isValidation && error.fieldErrors) {
      // خطاهای بک‌اند را به فیلدهای فرم نگاشت می‌کنیم
      Object.entries(error.fieldErrors).forEach(([field, messages]) => {
        form.setError(field as keyof AddressFormValues, { message: messages[0] })
      })
      return
    }
    toast.error(t('errors.generic'))
  }
}
```

---

## ۱۹. استراتژی مدیریت State

> سؤال کلیدی مصاحبه: «چه چیزی را کجا نگه می‌داری؟»
> این جدول جواب حرفه‌ای است:

| نوع داده | ابزار | دلیل |
|----------|-------|------|
| محصولات، دسته‌ها، سفارش‌ها | **TanStack Query** | داده سرور است؛ نیاز به کش، refetch، invalidate دارد |
| سبد خرید | **TanStack Query** + Optimistic | داده سرور است ولی باید فوری در UI دیده شود |
| علاقه‌مندی‌ها (کاربر مهمان) | **Zustand + persist** | تا قبل از لاگین فقط سمت کلاینت است |
| مقایسه محصولات | **Zustand + persist** | کاملاً کلاینتی، نیازی به سرور ندارد |
| بازدیدهای اخیر | **Zustand + persist** | کلاینتی، در localStorage |
| باز/بسته بودن مودال و کشو | **Zustand (بدون persist)** | وضعیت گذرای UI |
| زبان فعلی | **URL** (`/fa/...`) | باید قابل اشتراک‌گذاری و ایندکس‌شدنی باشد |
| تم دارک/لایت | **next-themes** (کوکی + localStorage) | باید قبل از رندر اول اعمال شود |
| فیلترهای محصولات | **URL Query Params** | قابل اشتراک، قابل بوکمارک، بازگشت مرورگر کار می‌کند |
| مقادیر فرم | **React Hook Form** | state محلی فرم، نباید سراسری شود |
| کاربر لاگین‌کرده | **TanStack Query** (`/me`) | داده سرور، با کش طولانی |

### ⚠️ ضدالگوهایی که باید از آن‌ها پرهیز کنی

| ضدالگو | چرا بد است | جایگزین |
|--------|-----------|---------|
| ریختن داده سرور در Zustand | باید دستی sync کنی، باگ می‌آورد | TanStack Query |
| نگه‌داشتن فیلترها در useState | با رفرش پاک می‌شود، لینک‌پذیر نیست | URL params |
| Context برای سبد خرید | همه مصرف‌کننده‌ها ری‌رندر می‌شوند | Zustand (انتخابی) |
| `useEffect` برای fetch داده | مسابقه‌ای، بدون کش، بدون لغو | TanStack Query |
| `'use client'` روی لایوت ریشه | کل درخت کلاینتی می‌شود، SEO خراب | فقط روی برگ‌های تعاملی |

### 🏬 نمونه Store — `src/store/wishlist-store.ts`

```ts
/**
 * استور علاقه‌مندی‌ها برای کاربر مهمان.
 *
 * پس از لاگین، محتوای این استور با سرور همگام و سپس خالی می‌شود.
 * از میدلور persist استفاده می‌کنیم تا با رفرش صفحه از بین نرود.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistState {
  /** شناسه محصولات علاقه‌مندی */
  productIds: number[]
  /** افزودن یا حذف (toggle) یک محصول */
  toggle: (productId: number) => void
  /** بررسی وجود یک محصول در لیست */
  has: (productId: number) => boolean
  /** خالی کردن لیست — پس از همگام‌سازی با سرور */
  clear: () => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],

      toggle: (productId) =>
        set((state) => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds.filter((id) => id !== productId)
            : [...state.productIds, productId],
        })),

      has: (productId) => get().productIds.includes(productId),

      clear: () => set({ productIds: [] }),
    }),
    { name: 'wishlist-storage' } // کلید در localStorage
  )
)
```

---

## ۲۰. گیت، کامیت و جریان کار

> کارفرما قبل از خواندن کد، **تاریخچه گیت** را نگاه می‌کند.
> ۵۰ کامیت با پیام `update` یعنی رد شدن.

### 🌿 استراتژی شاخه‌ها

```
main            ← فقط کد پایدار و دیپلوی‌شده
 └── develop    ← شاخه یکپارچه‌سازی
      ├── feat/product-catalog
      ├── feat/cart-checkout
      ├── fix/rtl-price-alignment
      └── chore/upgrade-tailwind
```

### 📝 قرارداد پیام کامیت (Conventional Commits)

```
<type>(<scope>): <description>

[body اختیاری]
```

| type | کاربرد | مثال |
|------|--------|------|
| `feat` | قابلیت جدید | `feat(cart): add optimistic update to add-to-cart` |
| `fix` | رفع باگ | `fix(rtl): correct price alignment in Persian locale` |
| `refactor` | بازنویسی بدون تغییر رفتار | `refactor(order): extract pricing into PricingService` |
| `perf` | بهبود کارایی | `perf(products): add composite index on category_id,status` |
| `test` | افزودن تست | `test(cart): cover insufficient stock scenario` |
| `docs` | مستندات | `docs(api): document checkout endpoints` |
| `style` | فرمت کد | `style: run pint on app directory` |
| `chore` | نگهداری | `chore(deps): upgrade next to 15.1` |
| `ci` | پایپ‌لاین | `ci: add lighthouse budget check` |

### 🔒 هوک‌های پیش از کامیت

**بک‌اند** (`.git/hooks/pre-commit` یا `captainhook`):
```bash
./vendor/bin/pint --test    # بررسی فرمت کد
./vendor/bin/phpstan analyse # تحلیل استاتیک
./vendor/bin/pest --parallel # اجرای تست‌ها
```

**فرانت‌اند** (`husky` + `lint-staged`):
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  }
}
```

### 📊 نکته نمونه‌کار

| کار | تأثیر |
|-----|-------|
| کامیت‌های کوچک و معنادار | نشان‌دهنده نظم کاری |
| پیام‌های انگلیسی استاندارد | نشان‌دهنده کار تیمی بین‌المللی |
| PR های واقعی روی گیت‌هاب (حتی سولو) | نشان‌دهنده آشنایی با فرآیند بازبینی کد |
| تگ نسخه (`v1.0.0`) | نشان‌دهنده مدیریت انتشار |
| GitHub Actions سبز | نشان‌دهنده تسلط بر CI |

---

## ۲۱. README حرفه‌ای (اسکلت آماده)

> اگر README ضعیف باشد، هیچ‌کس کد را باز نمی‌کند.

```markdown
<h1 align="center">🛍️ NextStore</h1>
<p align="center">
  فروشگاه اینترنتی Full-Stack — Laravel 11 API + Next.js 15
  <br/>دوزبانه (فارسی/انگلیسی) · دارک‌مود · کاملاً ریسپانسیو
</p>

<p align="center">
  <a href="https://nextstore-demo.vercel.app">🔗 دموی زنده</a> ·
  <a href="https://api.nextstore.dev/docs">📘 مستندات API</a> ·
  <a href="#">🎥 ویدیوی معرفی</a>
</p>

![پیش‌نمایش](./docs/preview.png)

## ✨ قابلیت‌ها
- 🌐 دوزبانه کامل با مسیر مجزا (`/fa`, `/en`) و پشتیبانی RTL/LTR
- 🌗 دارک‌مود/لایت‌مود با تشخیص خودکار تنظیمات سیستم
- 📱 ریسپانسیو از ۳۲۰px تا ۲۵۶۰px
- 🛒 سبد خرید با Optimistic Update و پشتیبانی از کاربر مهمان
- 💳 اتصال به درگاه پرداخت (زرین‌پال / Stripe)
- 🔍 جستجوی لحظه‌ای با Meilisearch
- 👑 پنل مدیریت کامل با نمودار و گزارش
- ♿ رعایت WCAG 2.1 AA

## 🏗️ معماری
[دیاگرام]

## 🚀 راه‌اندازی سریع
```bash
# بک‌اند
git clone ... && cd nextstore-api
cp .env.example .env && composer install
php artisan key:generate && php artisan migrate --seed
php artisan serve

# فرانت‌اند
cd ../nextstore-web
cp .env.example .env.local && pnpm install
pnpm dev
```

## 👤 حساب‌های نمایشی
| نقش | ایمیل | رمز |
|-----|-------|-----|
| مدیر | admin@demo.dev | password |
| مشتری | user@demo.dev | password |

## 📊 آمار پروژه
| معیار | مقدار |
|-------|-------|
| پوشش تست بک‌اند | ٪۸۵ |
| امتیاز Lighthouse | ۹۸ / ۱۰۰ / ۱۰۰ / ۱۰۰ |
| تعداد اندپوینت API | ۹۰+ |
| تعداد صفحات | ۷۱ |

## 🧠 تصمیمات فنی
- **چرا Service Layer؟** ... 
- **چرا Optimistic Update در سبد؟** ...
- **چرا OKLCH به‌جای HEX؟** ...
```

> 💡 بخش **«تصمیمات فنی»** مهم‌ترین قسمت README برای نمونه‌کار است.
> نشان می‌دهد فقط کد نزده‌ای، بلکه **فکر** کرده‌ای.

---

## ۲۲. ارائه نمونه‌کار و نکات مصاحبه

### 🎥 چه چیزهایی باید آماده باشد

| مورد | جزئیات |
|------|--------|
| **دمو زنده** | فرانت روی Vercel، بک روی Liara/Railway — باید همیشه بالا باشد |
| **حساب نمایشی** | ادمین + مشتری با داده واقعی (۲۰۰ محصول، ۵۰ سفارش) |
| **اسکرین‌شات** | ۶ تصویر: صفحه اصلی لایت، صفحه اصلی دارک، محصول، سبد، پنل ادمین، موبایل |
| **GIF کوتاه** | تغییر زبان fa↔en و تغییر تم — بلافاصله تأثیرگذار است |
| **ویدیو ۲ دقیقه‌ای** | روایت: مشکل → معماری → دمو → چالش فنی |
| **مستندات API** | Scribe یا Swagger با امکان تست مستقیم |
| **Postman Collection** | برای بازبین فنی |

### 🎬 اسکریپت ویدیوی ۲ دقیقه‌ای

```
۰:۰۰-۰:۱۵  «این یک فروشگاه Full-Stack است با Laravel و Next.js»
۰:۱۵-۰:۳۵  دیاگرام معماری — چرا API-First
۰:۳۵-۱:۰۰  دمو: جستجو → فیلتر → محصول → سبد → تسویه
۱:۰۰-۱:۲۰  تغییر زبان و تم به‌صورت زنده
۱:۲۰-۱:۴۰  پنل ادمین: افزودن محصول با تنوع
۱:۴۰-۲:۰۰  یک چالش فنی و راه‌حل آن (مثلاً Race Condition موجودی)
```

### 💬 سؤالات محتملی که پرسیده می‌شود — و پاسخ آماده

| سؤال | پاسخ کوتاه |
|------|-----------|
| چرا Laravel را API-Only کردی؟ | جداسازی نگرانی‌ها؛ همان API بعداً به اپ موبایل هم سرویس می‌دهد |
| چطور Race Condition موجودی را حل کردی؟ | `lockForUpdate` داخل تراکنش دیتابیس |
| چرا قیمت را در `cart_items` ذخیره کردی؟ | Price Snapshot — برای اطلاع‌رسانی تغییر قیمت به کاربر |
| RTL را چطور مدیریت کردی؟ | ویژگی منطقی CSS (`ms/me/ps/pe`) به‌جای `left/right` |
| چرا فیلترها در URL هستند؟ | قابل اشتراک‌گذاری، بوکمارک، و دکمه بازگشت مرورگر |
| SEO را چطور رعایت کردی؟ | SSR/ISR، `hreflang`، JSON-LD، sitemap داینامیک |
| اگر ترافیک ۱۰ برابر شود؟ | کش Redis، ایندکس ترکیبی، صف برای کارهای سنگین، CDN تصاویر |
| بزرگ‌ترین چالشت چه بود؟ | (یک داستان واقعی آماده داشته باش — نه جواب کلی) |

### 🏆 چیزهایی که این پروژه را متمایز می‌کند

| تمایزدهنده | چرا اثرگذار است |
|-----------|-----------------|
| پوشش هر ۴ حالت داده در هر صفحه | ۹۰٪ نمونه‌کارها فقط حالت موفق دارند |
| تست با پوشش واقعی | نشان‌دهنده بلوغ مهندسی |
| دیزاین‌سیستم با توکن | نشان‌دهنده درک از مقیاس‌پذیری UI |
| دسترسی‌پذیری (a11y) | تقریباً هیچ نمونه‌کاری این را ندارد |
| مستندات تصمیمات فنی | تفاوت «کدنویس» و «مهندس» |
| CI/CD سبز | آمادگی برای محیط واقعی |

---

## ۲۳. اشتباهات رایج (از این‌ها پرهیز کن)

### 🐘 بک‌اند

| اشتباه | نتیجه | راه‌حل |
|--------|-------|--------|
| کوئری N+1 | صفحه محصولات ۳ ثانیه طول می‌کشد | `with()` + بررسی با Telescope |
| منطق تجاری در کنترلر | کنترلر ۳۰۰ خطی و غیرقابل تست | Service Layer |
| ذخیره قیمت به‌صورت `float` | خطای گرد کردن در محاسبات مالی | `unsignedBigInteger` (ریال/سِنت) |
| نبود تراکنش در ثبت سفارش | سفارش ثبت می‌شود ولی موجودی کم نمی‌شود | `DB::transaction` |
| برگرداندن مستقیم مدل | افشای فیلدهای حساس | همیشه `Resource` |
| نبود ایندکس روی ستون فیلتر | کندی شدید با ۱۰هزار محصول | ایندکس ترکیبی |
| ارسال ایمیل به‌صورت همزمان | درخواست ۵ ثانیه معطل می‌ماند | `Queue` |
| اعتماد به ورودی کاربر برای قیمت | فروش محصول ۱ تومانی! | قیمت همیشه از دیتابیس |

### ⚛️ فرانت‌اند

| اشتباه | نتیجه | راه‌حل |
|--------|-------|--------|
| `'use client'` در لایوت ریشه | کل سایت کلاینتی، SEO صفر | فقط روی برگ‌های تعاملی |
| استفاده از `left/right` در CSS | چیدمان فارسی خراب می‌شود | `start/end` و `ms/me` |
| رنگ خام به‌جای توکن | دارک‌مود ناخوانا | متغیرهای CSS |
| فونت از CDN گوگل | FOUT + کندی + مشکل تحریم | `next/font/local` |
| `<img>` به‌جای `next/image` | LCP بد، بدون lazy | همیشه `next/image` |
| نبود اسکلتون | پرش چیدمان (CLS) | `<Skeleton />` هم‌ابعاد محتوا |
| فیلتر در `useState` | با رفرش پاک می‌شود | URL params |
| ترجمه هاردکد در JSX | زبان دوم ناقص می‌ماند | همیشه `useTranslations` |
| نبود `focus-visible` | غیرقابل استفاده با کیبورد | حلقه فوکوس واضح |
| بارگذاری همه محصولات یکجا | حافظه و کندی | صفحه‌بندی/Infinite Scroll |

### 🌐 دوزبانه

| اشتباه | راه‌حل |
|--------|--------|
| ترجمه با جایگزینی رشته در کد | فایل JSON مجزا با کلید ساختاریافته |
| فرض یکسان بودن طول متن | انگلیسی تا ۳۰٪ بلندتر — چیدمان انعطاف‌پذیر |
| تاریخ میلادی برای کاربر فارسی | `date-fns-jalali` بر اساس locale |
| اعداد انگلیسی در متن فارسی | `toLocaleString('fa-IR')` |
| نبود `hreflang` | گوگل نسخه‌ها را تکراری می‌بیند |
| آیکون فلش ثابت | باید در RTL آینه شود |

---

## ۲۴. تعریف «انجام‌شده» (Definition of Done)

هیچ تسکی بسته نمی‌شود مگر این ۱۵ مورد ✅ باشد:

### برای هر فیچر بک‌اند
- [ ] مایگریشن با ایندکس مناسب اجرا شده
- [ ] Request برای اعتبارسنجی نوشته شده
- [ ] منطق در Service قرار دارد نه کنترلر
- [ ] خروجی از Resource عبور می‌کند
- [ ] Policy/Permission بررسی شده
- [ ] تست Feature: ۱ حالت موفق + ۲ حالت خطا
- [ ] پیام‌ها در `lang/fa` و `lang/en` موجودند
- [ ] `pint` و `phpstan` بدون خطا
- [ ] در مستندات API ثبت شده

### برای هر فیچر فرانت‌اند
- [ ] تایپ TypeScript دقیق (بدون `any`)
- [ ] هر ۴ حالت داده پوشش داده شده (loading/empty/error/success)
- [ ] در هر دو زبان تست شده (fa + en)
- [ ] در هر دو تم تست شده (dark + light)
- [ ] در ۳ سایز تست شده (۳۷۵px / ۷۶۸px / ۱۴۴۰px)
- [ ] با کیبورد قابل استفاده است (Tab / Enter / Esc)
- [ ] `aria-label` برای دکمه‌های آیکونی
- [ ] بدون خطا و هشدار در کنسول
- [ ] کامنت بالای فایل و توابع اصلی نوشته شده

---

## 🎬 جمع‌بندی

### 📊 حجم کار در یک نگاه

| بخش | تعداد |
|-----|-------|
| جداول دیتابیس | ۳۵+ |
| اندپوینت API | ۹۰+ |
| صفحات فرانت‌اند | ۷۱ |
| کامپوننت React | ۱۵۰+ |
| کلاس‌های بک‌اند | ۲۰۰+ |
| مدت زمان | ۱۴ هفته (پاره‌وقت) |

### 🎯 ترتیب اجرا (خلاصه)

```
هفته ۱      → راه‌اندازی، دیزاین‌سیستم، اسکلت پروژه
هفته ۲      → دیتابیس و مدل‌ها
هفته ۳      → احراز هویت (بک + فرانت)
هفته ۴      → ⭐ زیرساخت i18n و تم — قبل از ساخت هر صفحه‌ای!
هفته ۵-۶    → کاتالوگ محصولات (برش عمودی کامل)
هفته ۷      → سبد خرید و علاقه‌مندی
هفته ۸-۹    → تسویه و پرداخت
هفته ۱۰     → پنل کاربری
هفته ۱۱     → نظرات و بلاگ
هفته ۱۲-۱۳  → پنل مدیریت
هفته ۱۴     → پولیش، تست، دیپلوی، مستندات
```

### ⚠️ سه قانون طلایی

1. **زیرساخت i18n و تم را قبل از ساخت اولین صفحه بساز.**
   افزودن دوزبانگی به یک پروژه آماده = بازنویسی کل UI.

2. **هر فیچر را به‌صورت برش عمودی کامل بساز.**
   نه اینکه اول همه بک‌اند را بزنی بعد همه فرانت را. فیچر به فیچر، انتها به انتها.

3. **کیفیت را قربانی سرعت نکن.**
   یک فروشگاه با ۵ فیچرِ بی‌نقص، بسیار قوی‌تر از فروشگاهی با ۲۰ فیچر نصفه‌کاره است.

---

<p align="center">
  <b>موفق باشی! 🚀</b><br/>
  <sub>هر فیچری را با الگوی بخش ۱۷ (برش عمودی) بساز و از بخش ۲۴ (DoD) به‌عنوان چک‌لیست استفاده کن.</sub>
</p>






