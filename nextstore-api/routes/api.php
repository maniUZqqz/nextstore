<?php

/**
 * تعریف مسیرهای API فروشگاه
 * ===========================================================================
 * قرارداد نسخه‌بندی: تمام مسیرها با /api/v1 شروع می‌شوند.
 * دلیل: اگر روزی قرارداد API تغییر کند، می‌توانیم v2 را کنار v1 منتشر
 * کنیم بدون اینکه اپلیکیشن‌های قدیمی از کار بیفتند.
 *
 * گروه‌بندی:
 *   Shop      → عمومی، بدون احراز هویت (کاتالوگ، جستجو)
 *   Auth      → ثبت‌نام و ورود
 *   Customer  → نیازمند توکن (پروفایل، آدرس، سفارش)
 *   Admin     → نیازمند نقش مدیر                      ← فاز بعد
 */

use App\Http\Controllers\Api\V1\Admin\AdminBannerController;
use App\Http\Controllers\Api\V1\Admin\AdminBrandController;
use App\Http\Controllers\Api\V1\Admin\AdminCategoryController;
use App\Http\Controllers\Api\V1\Admin\AdminContactController;
use App\Http\Controllers\Api\V1\Admin\AdminCouponController;
use App\Http\Controllers\Api\V1\Admin\AdminCustomerController;
use App\Http\Controllers\Api\V1\Admin\AdminOrderController;
use App\Http\Controllers\Api\V1\Admin\AdminPostController;
use App\Http\Controllers\Api\V1\Admin\AdminProductController;
use App\Http\Controllers\Api\V1\Admin\AdminReviewController;
use App\Http\Controllers\Api\V1\Admin\AdminSettingController;
use App\Http\Controllers\Api\V1\Admin\AdminTicketController;
use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\PasswordResetController;
use App\Http\Controllers\Api\V1\Customer\AddressController;
use App\Http\Controllers\Api\V1\Customer\NotificationController;
use App\Http\Controllers\Api\V1\Customer\OrderController;
use App\Http\Controllers\Api\V1\Customer\ProfileController;
use App\Http\Controllers\Api\V1\Customer\TicketController;
use App\Http\Controllers\Api\V1\Customer\WishlistController;
use App\Http\Controllers\Api\V1\Shop\BannerController;
use App\Http\Controllers\Api\V1\Shop\BlogController;
use App\Http\Controllers\Api\V1\Shop\CartController;
use App\Http\Controllers\Api\V1\Shop\CatalogController;
use App\Http\Controllers\Api\V1\Shop\ContactController;
use App\Http\Controllers\Api\V1\Shop\PaymentController;
use App\Http\Controllers\Api\V1\Shop\ProductController;
use App\Http\Controllers\Api\V1\Shop\ReviewController;
use App\Http\Controllers\Api\V1\Shop\SettingsController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    /* =====================================================================
     * بخش عمومی فروشگاه — بدون نیاز به ورود
     * ===================================================================== */

    /** داده‌های ترکیبی صفحه اصلی در یک درخواست */
    Route::get('home', [CatalogController::class, 'home'])->name('api.home');

    /* --- محصولات --- */
    Route::get('products', [ProductController::class, 'index'])->name('api.products.index');
    Route::get('products/{product}', [ProductController::class, 'show'])->name('api.products.show');
    Route::get('products/{product}/related', [ProductController::class, 'related'])->name('api.products.related');

    /*
     * فهرست نظرات یک محصول — عمومی.
     * اگر توکن همراه باشد، رأی «مفید» خودِ کاربر هم برگردانده می‌شود،
     * ولی نبودن توکن خطا نیست.
     */
    Route::get('products/{product}/reviews', [ReviewController::class, 'index'])->name('api.products.reviews');

    /* --- دسته‌بندی‌ها --- */
    Route::get('categories', [CatalogController::class, 'categories'])->name('api.categories.index');
    Route::get('categories/{category}', [CatalogController::class, 'category'])->name('api.categories.show');

    /* --- برندها --- */
    Route::get('brands', [CatalogController::class, 'brands'])->name('api.brands.index');
    Route::get('brands/{brand}', [CatalogController::class, 'brand'])->name('api.brands.show');

    /* --- مجله --- */
    /*
     * ⚠️ ترتیب اهمیت دارد: `post-categories` باید پیش از
     *    `posts/{post}` نیاید چون پیشوندشان یکی نیست، اما اگر روزی
     *    مسیری مثل `posts/categories` اضافه شود، باید *بالاتر* از
     *    `posts/{post}` بنشیند وگرنه «categories» به‌عنوان نامک
     *    مقاله تفسیر می‌شود و ۴۰۴ می‌دهد.
     */
    Route::get('post-categories', [BlogController::class, 'categories'])->name('api.posts.categories');
    Route::get('posts', [BlogController::class, 'index'])->name('api.posts.index');
    Route::get('posts/{post}', [BlogController::class, 'show'])->name('api.posts.show');

    /* =====================================================================
     * سبد خرید — برای مهمان و کاربر واردشده
     *
     * مهمان با هدر X-Session-Id شناسایی می‌شود، پس این مسیرها
     * نیازی به احراز هویت ندارند. اگر توکن ارسال شود، سبد کاربر
     * واردشده برگردانده می‌شود.
     * ===================================================================== */

    Route::prefix('cart')->group(function () {
        Route::get('/', [CartController::class, 'show'])->name('api.cart.show');
        Route::delete('/', [CartController::class, 'clear'])->name('api.cart.clear');

        /*
         * ⚠️ 'coupon' باید *بالاتر* از 'items/{item}' نیاید مشکلی نمی‌سازد
         *    چون پیشوندشان متفاوت است، اما اگر روزی 'items/coupon' اضافه
         *    شود ترتیب اهمیت پیدا می‌کند.
         */
        Route::post('coupon', [CartController::class, 'applyCoupon'])->name('api.cart.coupon.apply');
        Route::delete('coupon', [CartController::class, 'removeCoupon'])->name('api.cart.coupon.remove');

        Route::post('items', [CartController::class, 'store'])->name('api.cart.items.store');
        Route::patch('items/{item}', [CartController::class, 'update'])->name('api.cart.items.update');
        Route::delete('items/{item}', [CartController::class, 'destroy'])->name('api.cart.items.destroy');
    });

    /* =====================================================================
     * پرداخت — بدون احراز هویت
     *
     * ⚠️ درگاه پرداخت کاربر را با یک درخواست ساده برمی‌گرداند و هدر
     *    Authorization ما را حمل نمی‌کند. امنیت با شناسه‌ی تصادفی
     *    تراکنش و تأیید نهایی نزد خود درگاه تأمین می‌شود.
     * ===================================================================== */

    Route::get('payments/gateways', [PaymentController::class, 'gateways'])
        ->name('api.payments.gateways');

    Route::post('payments/verify', [PaymentController::class, 'verify'])
        ->name('api.payments.verify');

    /*
     * تنظیمات عمومی فروشگاه — نام، تماس، شبکه‌های اجتماعی.
     * فوتر و نوار بالای هدر از این تغذیه می‌شوند، پس بدون احراز هویت است.
     */
    Route::get('settings', [SettingsController::class, 'index'])->name('api.settings');

    /*
     * بنرهای تبلیغاتی صفحه‌ی اصلی.
     *
     * ⚠️ بدون احراز هویت و کش‌شدنی — صفحه‌ی اصلی برای هر بازدیدکننده
     *    رندر می‌شود و بنرها هفته‌ها عوض نمی‌شوند.
     */
    Route::get('banners', [BannerController::class, 'index'])->name('api.banners');

    /*
     * فرم «تماس با ما».
     *
     * ⚠️ بدون احراز هویت — مهمان هم باید بتواند بپرسد. اجبار به
     *    ثبت‌نام برای پرسیدن یک سؤال، همان تماسی را از بین می‌برد که
     *    صفحه برای آن ساخته شده.
     *
     * ⚠️ throttle مخصوص خودش دارد، نه `api` عمومی: این تنها مسیر
     *    عمومی است که در دیتابیس **می‌نویسد**، پس سقف ۱۲۰ درخواست در
     *    دقیقه‌ی گروه اصلی برایش بی‌معنا بالاست.
     */
    Route::post('contact', [ContactController::class, 'store'])
        ->middleware('throttle:contact')
        ->name('api.contact.store');

    /** بررسی سلامت سرویس — برای مانیتورینگ */
    Route::get('health', fn () => response()->json([
        'status' => 'ok',
        'locale' => app()->getLocale(),
        'time' => now()->toIso8601String(),
    ]))->name('api.health');

    /* =====================================================================
     * احراز هویت
     * ===================================================================== */

    Route::prefix('auth')->group(function () {

        /*
         * ثبت‌نام و ورود با محدودیت سخت‌گیرانه‌تر (۵ تلاش در دقیقه).
         * بدون این، مهاجم می‌تواند هزاران رمز را در دقیقه امتحان کند.
         */
        Route::middleware('throttle:auth')->group(function () {
            Route::post('register', [AuthController::class, 'register'])->name('api.auth.register');
            Route::post('login', [AuthController::class, 'login'])->name('api.auth.login');
        });

        /*
         * بازیابی رمز عبور — هر کدام سطل نرخ خودش را دارد.
         *
         * ⚠️ عمداً **بیرون** از `throttle:auth` هستند.
         *
         *    نسخه‌ی اول داخلش بودند و نتیجه‌اش این می‌شد: کاربری که ۵
         *    بار رمزش را اشتباه زده — یعنی دقیقاً همان کسی که به
         *    بازیابی نیاز دارد — نمی‌توانست پیوند بگیرد. توضیح
         *    هر محدودکننده در `AppServiceProvider` است.
         */
        Route::post('forgot-password', [PasswordResetController::class, 'forgot'])
            ->middleware('throttle:password-forgot')
            ->name('api.auth.forgot-password');

        Route::post('reset-password', [PasswordResetController::class, 'reset'])
            ->middleware('throttle:password-reset')
            ->name('api.auth.reset-password');

        /* مسیرهای نیازمند توکن معتبر */
        Route::middleware('auth:sanctum')->group(function () {
            Route::get('me', [AuthController::class, 'me'])->name('api.auth.me');
            Route::post('logout', [AuthController::class, 'logout'])->name('api.auth.logout');
            Route::post('logout-all', [AuthController::class, 'logoutAll'])->name('api.auth.logout-all');
        });
    });

    /* =====================================================================
     * بخش کاربر — همه نیازمند توکن معتبر
     * ===================================================================== */

    Route::middleware('auth:sanctum')->group(function () {

        /* --- پروفایل و امنیت --- */
        /*
         * ⚠️ ترتیب اهمیت دارد: 'profile/password' و 'profile/sessions'
         *    باید پیش از هر مسیر پویایی زیر profile بیایند. الان
         *    چنین مسیری نداریم، ولی اگر روزی 'profile/{section}'
         *    اضافه شود، این دو باید بالاتر بمانند.
         */
        Route::get('profile', [ProfileController::class, 'show'])->name('api.profile.show');
        Route::put('profile', [ProfileController::class, 'update'])->name('api.profile.update');
        Route::put('profile/password', [ProfileController::class, 'updatePassword'])->name('api.profile.password');
        Route::get('profile/sessions', [ProfileController::class, 'sessions'])->name('api.profile.sessions');
        Route::delete('profile/sessions/{token}', [ProfileController::class, 'revokeSession'])->name('api.profile.sessions.revoke');

        /* --- آدرس‌ها --- */
        Route::get('addresses', [AddressController::class, 'index'])->name('api.addresses.index');
        Route::post('addresses', [AddressController::class, 'store'])->name('api.addresses.store');
        Route::put('addresses/{address}', [AddressController::class, 'update'])->name('api.addresses.update');
        Route::delete('addresses/{address}', [AddressController::class, 'destroy'])->name('api.addresses.destroy');
        Route::patch('addresses/{address}/default', [AddressController::class, 'setDefault'])->name('api.addresses.default');

        /* --- سفارش‌ها --- */
        Route::get('orders', [OrderController::class, 'index'])->name('api.orders.index');
        Route::post('orders', [OrderController::class, 'store'])->name('api.orders.store');
        Route::get('orders/{order}', [OrderController::class, 'show'])->name('api.orders.show');
        Route::post('orders/{order}/pay', [OrderController::class, 'pay'])->name('api.orders.pay');
        Route::post('orders/{order}/cancel', [OrderController::class, 'cancel'])->name('api.orders.cancel');

        /* --- علاقه‌مندی‌ها --- */
        /*
         * ⚠️ ترتیب اهمیت دارد: 'wishlist/sync' باید *بالاتر* از
         *    'wishlist/{product}' بنشیند، وگرنه لاراول کلمه‌ی
         *    «sync» را به‌عنوان شناسه‌ی محصول تفسیر می‌کند و
         *    درخواست همگام‌سازی به مسیر حذف می‌رود.
         */
        Route::get('wishlist', [WishlistController::class, 'index'])->name('api.wishlist.index');
        Route::post('wishlist/sync', [WishlistController::class, 'sync'])->name('api.wishlist.sync');
        Route::post('wishlist', [WishlistController::class, 'store'])->name('api.wishlist.store');
        Route::delete('wishlist/{product}', [WishlistController::class, 'destroy'])->name('api.wishlist.destroy');

        /* --- نظرات --- */
        Route::get('reviews', [ReviewController::class, 'mine'])->name('api.reviews.mine');
        Route::post('products/{product}/reviews', [ReviewController::class, 'store'])->name('api.reviews.store');
        Route::post('reviews/{review}/helpful', [ReviewController::class, 'helpful'])->name('api.reviews.helpful');

        /* --- تیکت‌های پشتیبانی --- */
        /*
         * ⚠️ بایند دستی و نه Route Model Binding.
         *
         *    پارامتر {ticket} یک *شماره‌ی تیکت* (TK-000123) است، نه
         *    شناسه. اگر لاراول خودش مدل را پیدا کند، تیکت را پیش از
         *    بررسی مالکیت بارگذاری می‌کند و کنترلر ناچار است بعد از
         *    آن اجازه را چک کند — یعنی یک قدم دیرتر از لازم.
         *    اینجا کنترلر با findOwned از `$user->tickets()` شروع
         *    می‌کند، پس تیکت دیگران اصلاً بارگذاری نمی‌شود.
         */
        /*
         * ⚠️ 'tickets/meta' باید *بالاتر* از 'tickets/{ticket}' بنشیند،
         *    وگرنه لاراول «meta» را شماره‌ی تیکت تفسیر می‌کند و درخواست
         *    به اکشن نمایش می‌رود و ۴۰۴ می‌گیرد.
         */
        /* --- اعلان‌ها --- */
        /*
         * ⚠️ ترتیب اهمیت دارد: 'notifications/unread-count' و
         *    'notifications/read-all' باید **بالاتر** از
         *    'notifications/{notification}' بنشینند، وگرنه لاراول
         *    «unread-count» را به‌عنوان شناسه می‌گیرد و ۴۰۴ می‌دهد.
         */
        Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount'])
            ->name('api.notifications.unread-count');
        Route::patch('notifications/read-all', [NotificationController::class, 'markAllRead'])
            ->name('api.notifications.read-all');

        Route::get('notifications', [NotificationController::class, 'index'])
            ->name('api.notifications.index');
        Route::patch('notifications/{notification}/read', [NotificationController::class, 'markRead'])
            ->name('api.notifications.read');
        Route::delete('notifications/{notification}', [NotificationController::class, 'destroy'])
            ->name('api.notifications.destroy');

        Route::get('tickets/meta', [TicketController::class, 'meta'])->name('api.tickets.meta');
        Route::get('tickets', [TicketController::class, 'index'])->name('api.tickets.index');
        Route::post('tickets', [TicketController::class, 'store'])->name('api.tickets.store');
        Route::get('tickets/{ticket}', [TicketController::class, 'show'])->name('api.tickets.show');
        Route::post('tickets/{ticket}/reply', [TicketController::class, 'reply'])->name('api.tickets.reply');
        Route::patch('tickets/{ticket}/close', [TicketController::class, 'close'])->name('api.tickets.close');
        Route::patch('tickets/{ticket}/reopen', [TicketController::class, 'reopen'])->name('api.tickets.reopen');
    });
    /* =====================================================================
     * پنل مدیریت — نیازمند توکن معتبر و نقش مدیر
     *
     * ⚠️ بررسی نقش با میدل‌ور انجام می‌شود، نه در تک‌تک کنترلرها.
     *    اگر در کنترلر باشد، فراموش کردنش در یک اکشن جدید یعنی
     *    یک در باز به پنل مدیریت.
     * ===================================================================== */

    Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {

        /* --- داشبورد --- */
        Route::get('dashboard', [DashboardController::class, 'index'])->name('api.admin.dashboard');

        /* --- سفارش‌ها --- */
        Route::get('orders/statuses', [AdminOrderController::class, 'statuses'])->name('api.admin.orders.statuses');
        Route::get('orders', [AdminOrderController::class, 'index'])->name('api.admin.orders.index');
        Route::get('orders/{order}', [AdminOrderController::class, 'show'])->name('api.admin.orders.show');
        Route::patch('orders/{order}/status', [AdminOrderController::class, 'updateStatus'])->name('api.admin.orders.status');

        /* --- محصولات --- */
        Route::get('products', [AdminProductController::class, 'index'])->name('api.admin.products.index');
        Route::post('products', [AdminProductController::class, 'store'])->name('api.admin.products.store');
        Route::get('products/{product}', [AdminProductController::class, 'show'])->name('api.admin.products.show');
        Route::put('products/{product}', [AdminProductController::class, 'update'])->name('api.admin.products.update');
        Route::delete('products/{product}', [AdminProductController::class, 'destroy'])->name('api.admin.products.destroy');
        Route::patch('products/{product}/stock', [AdminProductController::class, 'updateStock'])->name('api.admin.products.stock');

        /* --- دسته‌بندی‌ها --- */
        /*
         * ⚠️ 'categories/reorder' باید *بالاتر* از 'categories/{category}'
         *    بنشیند، وگرنه لاراول «reorder» را شناسه‌ی دسته تفسیر
         *    می‌کند و درخواست مرتب‌سازی به اکشن نمایش می‌رود.
         */
        Route::patch('categories/reorder', [AdminCategoryController::class, 'reorder'])->name('api.admin.categories.reorder');
        Route::get('categories', [AdminCategoryController::class, 'index'])->name('api.admin.categories.index');
        Route::post('categories', [AdminCategoryController::class, 'store'])->name('api.admin.categories.store');
        Route::get('categories/{category:id}', [AdminCategoryController::class, 'show'])->name('api.admin.categories.show');
        Route::put('categories/{category:id}', [AdminCategoryController::class, 'update'])->name('api.admin.categories.update');
        Route::delete('categories/{category:id}', [AdminCategoryController::class, 'destroy'])->name('api.admin.categories.destroy');

        /* --- برندها --- */
        Route::get('brands', [AdminBrandController::class, 'index'])->name('api.admin.brands.index');
        Route::post('brands', [AdminBrandController::class, 'store'])->name('api.admin.brands.store');
        Route::get('brands/{brand:id}', [AdminBrandController::class, 'show'])->name('api.admin.brands.show');
        Route::put('brands/{brand:id}', [AdminBrandController::class, 'update'])->name('api.admin.brands.update');
        Route::delete('brands/{brand:id}', [AdminBrandController::class, 'destroy'])->name('api.admin.brands.destroy');

        /* --- تنظیمات فروشگاه --- */
        Route::get('settings', [AdminSettingController::class, 'index'])->name('api.admin.settings.index');
        Route::put('settings', [AdminSettingController::class, 'update'])->name('api.admin.settings.update');

        /* --- بنرهای صفحه‌ی اصلی --- */
        Route::get('banners', [AdminBannerController::class, 'index'])->name('api.admin.banners.index');
        Route::post('banners', [AdminBannerController::class, 'store'])->name('api.admin.banners.store');
        Route::get('banners/{banner}', [AdminBannerController::class, 'show'])->name('api.admin.banners.show');
        Route::put('banners/{banner}', [AdminBannerController::class, 'update'])->name('api.admin.banners.update');
        Route::delete('banners/{banner}', [AdminBannerController::class, 'destroy'])->name('api.admin.banners.destroy');
        Route::patch('banners/{banner}/toggle', [AdminBannerController::class, 'toggle'])->name('api.admin.banners.toggle');

        /* --- صندوق پیام‌های تماس --- */
        Route::get('contact-messages', [AdminContactController::class, 'index'])->name('api.admin.contact.index');
        Route::get('contact-messages/{contactMessage}', [AdminContactController::class, 'show'])->name('api.admin.contact.show');
        Route::delete('contact-messages/{contactMessage}', [AdminContactController::class, 'destroy'])->name('api.admin.contact.destroy');

        /* --- کدهای تخفیف --- */
        /*
         * ⚠️ بایند با {coupon} و شناسه‌ی پیش‌فرض، نه با کد.
         *
         *    کد کوپن همان چیزی است که مدیر ویرایش می‌کند؛ اگر مسیر هم
         *    با کد بایند شود، لحظه‌ای که کد عوض شود آدرس ویرایش
         *    بی‌اعتبار می‌شود و درخواست ذخیره ۴۰۴ می‌گیرد — همان تله‌ای
         *    که برای مقاله هم وجود داشت.
         */
        Route::get('coupons', [AdminCouponController::class, 'index'])->name('api.admin.coupons.index');
        Route::post('coupons', [AdminCouponController::class, 'store'])->name('api.admin.coupons.store');
        Route::get('coupons/{coupon}', [AdminCouponController::class, 'show'])->name('api.admin.coupons.show');
        Route::put('coupons/{coupon}', [AdminCouponController::class, 'update'])->name('api.admin.coupons.update');
        Route::delete('coupons/{coupon}', [AdminCouponController::class, 'destroy'])->name('api.admin.coupons.destroy');
        Route::patch('coupons/{coupon}/toggle', [AdminCouponController::class, 'toggle'])->name('api.admin.coupons.toggle');

        /* --- مشتریان --- */
        /*
         * ⚠️ بایند با {customer:id}: مدل User متد getRouteKeyName را
         *    بازنویسی نکرده، پس پیش‌فرض همان id است — ولی صریح‌نوشتنش
         *    این را در برابر تغییر آینده‌ی مدل ایمن می‌کند.
         */
        Route::get('customers', [AdminCustomerController::class, 'index'])->name('api.admin.customers.index');
        Route::get('customers/{customer:id}', [AdminCustomerController::class, 'show'])->name('api.admin.customers.show');
        Route::patch('customers/{customer:id}/status', [AdminCustomerController::class, 'updateStatus'])->name('api.admin.customers.status');

        /* --- تعدیل نظرات --- */
        Route::get('reviews', [AdminReviewController::class, 'index'])->name('api.admin.reviews.index');
        Route::patch('reviews/{review}/approve', [AdminReviewController::class, 'approve'])->name('api.admin.reviews.approve');
        Route::patch('reviews/{review}/reject', [AdminReviewController::class, 'reject'])->name('api.admin.reviews.reject');
        Route::delete('reviews/{review}', [AdminReviewController::class, 'destroy'])->name('api.admin.reviews.destroy');

        /* --- صف پشتیبانی --- */
        /*
         * ⚠️ بایند با {ticket} و شماره‌ی تیکت انجام می‌شود، نه شناسه:
         *    مدل Ticket متد getRouteKeyName را روی «ticket_number»
         *    گذاشته. برخلاف مقاله، اینجا مشکلی نمی‌سازد چون شماره‌ی
         *    تیکت هرگز ویرایش نمی‌شود.
         */
        Route::get('tickets', [AdminTicketController::class, 'index'])->name('api.admin.tickets.index');
        Route::get('tickets/{ticket}', [AdminTicketController::class, 'show'])->name('api.admin.tickets.show');
        Route::post('tickets/{ticket}/reply', [AdminTicketController::class, 'reply'])->name('api.admin.tickets.reply');
        Route::patch('tickets/{ticket}/close', [AdminTicketController::class, 'close'])->name('api.admin.tickets.close');
        Route::patch('tickets/{ticket}/reopen', [AdminTicketController::class, 'reopen'])->name('api.admin.tickets.reopen');

        /* --- مجله --- */
        /*
         * ⚠️ بایند با {post:id} و نه {post}.
         *
         *    مدل Post متد getRouteKeyName را روی «slug» گذاشته که
         *    برای مسیرهای عمومی درست است (URL خوانا و سئوپسند).
         *    اما در پنل مدیریت، نامک همان چیزی است که ادمین ویرایش
         *    می‌کند: اگر مسیر هم با نامک بایند شود، لحظه‌ای که نامک
         *    عوض شود آدرس ویرایش بی‌اعتبار می‌شود و درخواست ذخیره
         *    ۴۰۴ می‌گیرد. شناسه هرگز تغییر نمی‌کند.
         */
        /*
         * ⚠️ ترتیب مهم است: 'post-categories' پیشوند متفاوتی دارد و
         *    با 'posts/{post}' تداخل نمی‌کند، ولی اگر روزی مسیری مثل
         *    'posts/categories' اضافه شود باید *بالاتر* بنشیند.
         */
        Route::get('post-categories', [AdminPostController::class, 'categories'])->name('api.admin.post-categories');
        Route::get('posts', [AdminPostController::class, 'index'])->name('api.admin.posts.index');
        Route::post('posts', [AdminPostController::class, 'store'])->name('api.admin.posts.store');
        Route::get('posts/{post:id}', [AdminPostController::class, 'show'])->name('api.admin.posts.show');
        Route::put('posts/{post:id}', [AdminPostController::class, 'update'])->name('api.admin.posts.update');
        Route::delete('posts/{post:id}', [AdminPostController::class, 'destroy'])->name('api.admin.posts.destroy');
        Route::patch('posts/{post:id}/publish', [AdminPostController::class, 'togglePublish'])->name('api.admin.posts.publish');
    });
});
