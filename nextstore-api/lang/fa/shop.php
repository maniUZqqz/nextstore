<?php

/** پیام‌های فروشگاه — فارسی */

return [
    /* --- سبد خرید --- */
    'cart_added' => 'محصول به سبد خرید اضافه شد.',
    'cart_updated' => 'سبد خرید به‌روز شد.',
    'cart_removed' => 'محصول از سبد خرید حذف شد.',
    'cart_cleared' => 'سبد خرید خالی شد.',

    /* --- خطاها --- */
    'insufficient_stock' => 'موجودی کافی نیست. تنها :count عدد در انبار باقی مانده است.',
    'out_of_stock' => 'این محصول در حال حاضر موجود نیست.',
    'product_required' => 'انتخاب محصول الزامی است.',
    'product_not_found' => 'محصول موردنظر یافت نشد.',
    'quantity_max' => 'حداکثر :max عدد از هر کالا قابل سفارش است.',
    /* --- آدرس --- */
    'address_created' => 'آدرس با موفقیت ثبت شد.',
    'address_updated' => 'آدرس به‌روز شد.',
    'address_deleted' => 'آدرس حذف شد.',
    'address_default_set' => 'آدرس پیش‌فرض تغییر کرد.',
    'address_not_found' => 'آدرس انتخابی یافت نشد.',

    /* --- سفارش --- */
    'order_placed' => 'سفارش شما با موفقیت ثبت شد.',
    'order_cancelled' => 'سفارش لغو شد.',
    'order_not_payable' => 'این سفارش قابل پرداخت نیست.',
    'order_not_cancellable' => 'این سفارش دیگر قابل لغو نیست.',
    'cart_empty' => 'سبد خرید شما خالی است.',
    'product_unavailable' => 'یکی از کالاهای سبد دیگر در دسترس نیست.',
    'invalid_status_transition' => 'تغییر وضعیت از «:from» به «:to» مجاز نیست.',

    /* --- پرداخت --- */
    'payment_succeeded' => 'پرداخت با موفقیت انجام شد.',
    'payment_failed' => 'پرداخت ناموفق بود.',
    'gateway_not_supported' => 'درگاه پرداخت انتخابی پشتیبانی نمی‌شود.',
    /* --- پنل مدیریت --- */
    'order_status_updated' => 'وضعیت سفارش تغییر کرد.',
    'invalid_status' => 'وضعیت انتخابی معتبر نیست.',
    'product_created' => 'محصول با موفقیت ساخته شد.',
    'product_updated' => 'محصول به‌روز شد.',
    'product_deleted' => 'محصول حذف شد.',
    'stock_updated' => 'موجودی به‌روز شد.',

    /* --- علاقه‌مندی --- */
    'wishlist_added' => 'به علاقه‌مندی‌ها اضافه شد.',
    'wishlist_removed' => 'از علاقه‌مندی‌ها حذف شد.',
    'wishlist_empty' => 'فهرست علاقه‌مندی‌های شما خالی است.',
    'product' => 'محصول',

    /* --- نظرات --- */
    'review_submitted' => 'نظر شما ثبت شد و پس از بررسی منتشر می‌شود.',
    'review_already_exists' => 'شما قبلاً برای این محصول نظر ثبت کرده‌اید.',
    'review_rating_required' => 'ثبت امتیاز الزامی است.',
    'review_rating_range' => 'امتیاز باید بین ۱ تا ۵ ستاره باشد.',
    'review_comment_short' => 'متن نظر باید حداقل :min کاراکتر باشد.',
    'review_own_vote' => 'نمی‌توانید به نظر خودتان رأی بدهید.',
    'review_voted' => 'رأی شما ثبت شد.',
    'review_unvoted' => 'رأی شما برداشته شد.',
    'review_approved' => 'نظر تأیید و منتشر شد.',
    'review_rejected' => 'نظر رد شد.',
    'review_deleted' => 'نظر حذف شد.',

    /* --- مجله --- */
    'post_created' => 'مقاله ساخته شد.',
    'post_updated' => 'مقاله به‌روز شد.',
    'post_deleted' => 'مقاله حذف شد.',
    'post_published' => 'مقاله منتشر شد.',
    'post_unpublished' => 'مقاله به پیش‌نویس برگشت.',

    /* --- پروفایل و امنیت --- */
    'profile_updated' => 'اطلاعات حساب به‌روز شد.',
    'profile_name_required' => 'نام الزامی است.',
    'profile_name_short' => 'نام باید حداقل ۳ نویسه باشد.',
    'profile_email_required' => 'ایمیل الزامی است.',
    'profile_email_invalid' => 'ایمیل معتبر نیست.',
    'profile_email_taken' => 'این ایمیل قبلاً ثبت شده است.',
    'profile_phone_invalid' => 'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.',
    'profile_phone_taken' => 'این شماره قبلاً ثبت شده است.',
    'profile_birth_future' => 'تاریخ تولد نمی‌تواند در آینده باشد.',
    'password_updated' => 'رمز عبور تغییر کرد. سایر دستگاه‌ها خارج شدند.',
    'password_current_required' => 'رمز فعلی الزامی است.',
    'password_current_wrong' => 'رمز فعلی درست نیست.',
    'password_new_required' => 'رمز جدید الزامی است.',
    'password_mismatch' => 'تکرار رمز با رمز جدید یکی نیست.',
    'password_same_as_current' => 'رمز جدید نباید با رمز فعلی یکی باشد.',
    'session_revoked' => 'دستگاه از حساب خارج شد.',
    'session_not_found' => 'این نشست یافت نشد.',
    'session_cannot_revoke_current' => 'نمی‌توانید نشست جاری را از اینجا ببندید.',

    /* --- دسته‌بندی و برند (پنل) --- */
    'category_created' => 'دسته‌بندی ساخته شد.',
    'category_updated' => 'دسته‌بندی به‌روز شد.',
    'category_deleted' => 'دسته‌بندی حذف شد.',
    'category_reordered' => 'ترتیب دسته‌ها ذخیره شد.',
    'category_cycle' => 'این انتخاب حلقه می‌سازد: دسته نمی‌تواند زیرمجموعه‌ی فرزند خودش شود.',
    'category_has_children' => 'ابتدا زیردسته‌ها را حذف یا جابه‌جا کنید.',
    'category_has_products' => 'این دسته :count محصول دارد و حذف نمی‌شود. می‌توانید غیرفعالش کنید.',
    'brand_created' => 'برند ساخته شد.',
    'brand_updated' => 'برند به‌روز شد.',
    'brand_deleted' => 'برند حذف شد.',
    'brand_has_products' => 'این برند :count محصول دارد و حذف نمی‌شود. می‌توانید غیرفعالش کنید.',
    /* --- تیکت پشتیبانی --- */
    'ticket_created' => 'تیکت :number ثبت شد. کارشناسان ما به‌زودی پاسخ می‌دهند.',
    'ticket_replied' => 'پاسخ شما ثبت شد.',
    'ticket_closed' => 'این تیکت بسته شده است. برای ادامه‌ی گفتگو ابتدا آن را باز کنید.',
    'ticket_closed_ok' => 'تیکت بسته شد.',
    'ticket_reopened' => 'تیکت دوباره باز شد.',
    'ticket_subject_required' => 'موضوع تیکت الزامی است.',
    'ticket_subject_short' => 'موضوع باید حداقل :min نویسه باشد.',
    'ticket_body_required' => 'متن پیام الزامی است.',
    'ticket_body_short' => 'متن پیام باید حداقل :min نویسه باشد.',
    'ticket_reply_required' => 'متن پاسخ الزامی است.',
    'ticket_order_invalid' => 'سفارش انتخاب‌شده متعلق به شما نیست.',
    'ticket_department_required' => 'انتخاب دپارتمان الزامی است.',
    'ticket_department_invalid' => 'دپارتمان انتخاب‌شده معتبر نیست.',
    'ticket_priority_required' => 'انتخاب اولویت الزامی است.',
    'ticket_priority_invalid' => 'اولویت انتخاب‌شده معتبر نیست.',

    /* --- مشتریان (پنل) --- */
    'customer_enabled' => 'حساب مشتری فعال شد.',
    'customer_disabled' => 'حساب مشتری غیرفعال شد. تا فعال‌سازی دوباره نمی‌تواند وارد شود.',
    'customer_is_staff' => 'این حساب متعلق به کارکنان است و از اینجا قابل تغییر نیست.',

    /* --- کد تخفیف --- */
    'coupon_applied' => 'کد تخفیف اعمال شد.',
    'coupon_removed' => 'کد تخفیف برداشته شد.',
    'coupon_invalid' => 'این کد تخفیف معتبر نیست.',
    'coupon_not_started' => 'این کد هنوز فعال نشده است.',
    'coupon_expired' => 'مهلت این کد تخفیف تمام شده است.',
    'coupon_exhausted' => 'ظرفیت این کد تخفیف تکمیل شده است.',
    'coupon_min_total' => 'این کد فقط برای سبدهای بالای :amount تومان است.',
    'coupon_already_used' => 'شما قبلاً از این کد استفاده کرده‌اید.',

    /* --- کد تخفیف (پنل) --- */
    'coupon_created' => 'کد تخفیف :code ساخته شد.',
    'coupon_updated' => 'کد تخفیف به‌روز شد.',
    'coupon_deleted' => 'کد تخفیف حذف شد.',
    'coupon_enabled' => 'کد تخفیف فعال شد.',
    'coupon_disabled' => 'کد تخفیف غیرفعال شد.',
    'coupon_has_usage' => 'این کد قبلاً استفاده شده و حذف نمی‌شود؛ برای پایان کمپین آن را غیرفعال کنید.',
    'coupon_code_required' => 'وارد کردن کد الزامی است.',
    'coupon_code_format' => 'کد فقط می‌تواند شامل حروف انگلیسی، عدد، خط تیره و زیرخط باشد.',
    'coupon_code_taken' => 'این کد قبلاً ثبت شده است.',
    'coupon_type_required' => 'نوع تخفیف را انتخاب کنید.',
    'coupon_value_required' => 'مقدار تخفیف الزامی است.',
    'coupon_value_min' => 'مقدار تخفیف باید بزرگ‌تر از صفر باشد.',
    'coupon_percent_range' => 'تخفیف درصدی نمی‌تواند بیش از ۱۰۰ باشد.',
    'coupon_max_only_percent' => 'سقف تخفیف فقط برای تخفیف درصدی معنا دارد.',
    'coupon_expiry_order' => 'تاریخ پایان باید پس از تاریخ شروع باشد.',
    'coupon_per_user_required' => 'سقف مصرف هر کاربر الزامی است.',

    /* --- تنظیمات --- */
    'settings_saved' => 'تنظیمات ذخیره شد.',

    /* --- تماس با ما --- */
    'contact_name_required' => 'نام را وارد کنید.',
    'contact_name_short' => 'نام باید دست‌کم ۳ نویسه باشد.',
    'contact_email_required' => 'ایمیل را وارد کنید.',
    'contact_email_invalid' => 'ایمیل معتبر نیست — بدون آن نمی‌توانیم پاسخ بدهیم.',
    'contact_subject_required' => 'موضوع را وارد کنید.',
    'contact_subject_short' => 'موضوع باید دست‌کم ۳ نویسه باشد.',
    'contact_message_required' => 'متن پیام را وارد کنید.',
    'contact_message_short' => 'متن پیام باید دست‌کم :min نویسه باشد.',
    'contact_sent' => 'پیام شما ثبت شد. به‌زودی پاسخ می‌دهیم.',
    'contact_deleted' => 'پیام حذف شد.',

    /* --- بنرها --- */
    'banner_title_required' => 'عنوان فارسی بنر الزامی است.',
    'banner_href_required' => 'مقصد بنر را وارد کنید.',
    'banner_href_internal' => 'مقصد باید یک مسیر داخلی باشد و با / شروع شود — نشانی بیرونی پذیرفته نمی‌شود.',
    'banner_icon_invalid' => 'نام آیکون فقط می‌تواند حروف کوچک انگلیسی، رقم و خط تیره داشته باشد.',
    'banner_date_order' => 'تاریخ پایان باید پس از تاریخ شروع باشد.',
    'banner_created' => 'بنر ساخته شد.',
    'banner_updated' => 'بنر به‌روزرسانی شد.',
    'banner_deleted' => 'بنر حذف شد.',
];
