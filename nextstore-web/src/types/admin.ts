/**
 * تایپ‌های پنل مدیریت
 * ---------------------------------------------------------------------------
 * باید با خروجی DashboardService و کنترلرهای Admin مطابق باشند.
 */

import type { Address, Order, OrderDetail, OrderStatusValue, StatusColor } from './order'
import type { Product } from './product'
import type { Review, ReviewStatus } from './review'
import type { TicketStatus } from './ticket'

/** آمار خلاصه داشبورد — کارت‌های بالای صفحه. */
export interface DashboardSummary {
  /* --- درآمد (به ریال) --- */
  revenueTotal: number
  revenueToday: number
  revenueMonth: number

  /* --- سفارش --- */
  ordersTotal: number
  ordersToday: number
  /** سفارش‌هایی که منتظر اقدام ادمین‌اند (پرداخت‌شده یا در حال آماده‌سازی) */
  ordersPending: number
  ordersAwaitingPayment: number

  /* --- مشتری --- */
  customersTotal: number
  customersToday: number

  /* --- محصول --- */
  productsTotal: number
  productsOutOfStock: number
  productsLowStock: number
}

/** یک نقطه از نمودار فروش روزانه. */
export interface SalesPoint {
  /** تاریخ به فرمت YYYY-MM-DD */
  date: string
  revenue: number
  orders: number
}

/** یک ردیف از جدول پرفروش‌ترین محصولات. */
export interface TopProduct {
  productId: number | null
  name: string
  /** تعداد فروخته‌شده */
  sold: number
  revenue: number
}

/** توزیع سفارش‌ها بر اساس وضعیت — برای نمودار. */
export interface StatusDistribution {
  status: OrderStatusValue
  label: string
  color: StatusColor
  count: number
}

/** پاسخ کامل داشبورد — همه در یک درخواست. */
export interface DashboardData {
  summary: DashboardSummary
  salesChart: SalesPoint[]
  topProducts: TopProduct[]
  ordersByStatus: StatusDistribution[]
  recentOrders: Order[]
}

/** یک وضعیت سفارش به‌همراه انتقال‌های مجازش. */
export interface OrderStatusOption {
  value: OrderStatusValue
  label: string
  color: StatusColor
  /** فقط این وضعیت‌ها از وضعیت فعلی قابل انتخاب‌اند */
  allowedTransitions: OrderStatusValue[]
}

/** ورودی تغییر وضعیت سفارش. */
export interface UpdateOrderStatusInput {
  status: OrderStatusValue
  tracking_code?: string
  admin_note?: string
}

/**
 * ورودی ساخت و ویرایش محصول.
 * فیلدهای چندزبانه به‌صورت شیء با کلید زبان ارسال می‌شوند.
 */
export interface ProductInput {
  name: { fa: string; en: string }
  short_description?: { fa?: string; en?: string }
  description?: { fa?: string; en?: string }

  category_id?: number | null
  brand_id?: number | null

  sku?: string
  barcode?: string

  price: number
  sale_price?: number | null
  sale_ends_at?: string | null
  cost_price?: number | null

  stock: number
  low_stock_threshold?: number
  allow_backorder?: boolean

  weight?: number | null

  status: 'draft' | 'active' | 'archived'
  is_featured?: boolean
}

/** فیلترهای فهرست محصولات در پنل مدیریت. */
export interface AdminProductFilters {
  status?: string
  category_id?: number
  low_stock?: boolean
  q?: string
  page?: number
  per_page?: number
}

/** فیلترهای فهرست سفارش‌ها در پنل مدیریت. */
export interface AdminOrderFilters {
  status?: OrderStatusValue
  q?: string
  page?: number
  per_page?: number
}

/* =========================================================================
 * محصول در پنل مدیریت
 *
 * ⚠️ چرا تایپ جداگانه از Product؟
 *    بک‌اند برای مسیر ادمین از AdminProductResource استفاده می‌کند که
 *    فیلدهای محرمانه (قیمت تمام‌شده) و مدیریتی (وضعیت انتشار) را
 *    اضافه می‌کند. این فیلدها در خروجی فروشگاه وجود ندارند، پس
 *    نباید در تایپ عمومی Product باشند.
 * ======================================================================= */

/** وضعیت انتشار محصول — باید با App\Enums\ProductStatus یکسان باشد. */
export type ProductStatusValue = 'draft' | 'active' | 'archived'

/** محصول در فهرست پنل مدیریت. */
export interface AdminProduct extends Product {
  status: ProductStatusValue
  statusLabel: string

  lowStockThreshold: number
  allowBackorder: boolean

  /** قیمت تمام‌شده به ریال — فقط ادمین می‌بیند */
  costPrice: number | null
  /** درصد حاشیه سود؛ null یعنی قیمت تمام‌شده ثبت نشده */
  marginPercent: number | null

  createdAt: string | null
  publishedAt: string | null
}

/** مقدار یک فیلد چندزبانه در فرم — هر دو زبان همیشه حاضرند. */
export interface Translated {
  fa: string
  en: string
}

/**
 * محصول در فرم ویرایش.
 *
 * ⚠️ فیلدهای متنی اینجا **شیء دو زبانه**‌اند، نه رشته. اگر رشته
 *    بودند، ذخیره‌ی فرم ترجمه‌ی زبان دیگر را پاک می‌کرد.
 */
export interface AdminProductDetail {
  id: number
  slug: string

  name: Translated
  shortDescription: Translated
  description: Translated
  metaTitle: Translated
  metaDescription: Translated
  /** نام به زبان جاری — فقط برای عنوان صفحه */
  displayName: string

  sku: string
  barcode: string | null
  categoryId: number | null
  brandId: number | null

  price: number
  salePrice: number | null
  costPrice: number | null
  saleStartsAt: string | null
  saleEndsAt: string | null

  stock: number
  lowStockThreshold: number
  allowBackorder: boolean

  weight: number | null
  dimensions: { length: number; width: number; height: number } | null

  status: ProductStatusValue
  isFeatured: boolean
  publishedAt: string | null

  images?: Array<{ id: number; url: string; alt: string; isPrimary: boolean }>
}

/* =========================================================================
 * سفارش در پنل مدیریت
 * ======================================================================= */

/** خلاصه‌ی مشتری روی ردیف فهرست سفارش‌ها. */
export interface AdminOrderCustomer {
  name: string | null
  phone: string | null
  city: string | null
  email?: string | null
  userId: number | null
}

/** سفارش در فهرست پنل مدیریت. */
export interface AdminOrder extends Order {
  customer: AdminOrderCustomer
  shippingMethod: string
  adminNote: string | null
}

/** یک انتقال مجاز از وضعیت فعلی. */
export interface AllowedTransition {
  value: OrderStatusValue
  label: string
  color: StatusColor
}

/** جزئیات کامل سفارش در پنل مدیریت. */
export interface AdminOrderDetail extends OrderDetail {
  customer: {
    userId: number | null
    name?: string | null
    email?: string | null
    phone?: string | null
  }
  adminNote: string | null
  /**
   * وضعیت‌هایی که از وضعیت *فعلی* قابل انتخاب‌اند.
   * فرم تغییر وضعیت فقط همین‌ها را نشان می‌دهد تا ادمین گزینه‌ای
   * که سرور ردش می‌کند اصلاً نبیند.
   */
  allowedTransitions: AllowedTransition[]
}

/* =========================================================================
 * مجله — پنل مدیریت
 * ======================================================================= */

/**
 * وضعیت انتشار مقاله.
 *
 * از ترکیب published_at در بک‌اند ساخته می‌شود، نه یک ستون جدا:
 *   تهی            → draft
 *   تاریخ آینده    → scheduled
 *   تاریخ گذشته    → published
 */
export type PostStatusValue = 'draft' | 'scheduled' | 'published'

/** مقاله در نمای جدول پنل — بدون بدنه، چون فهرست به آن نیازی ندارد. */
export interface AdminPost {
  id: number
  slug: string
  /** عنوان به زبان جاری پنل */
  title: string
  coverImage: string | null
  authorName: string | null
  readingMinutes: number
  viewsCount: number
  isFeatured: boolean
  status: PostStatusValue
  publishedAt: string | null
  category?: { id: number; name: string; slug: string }
  updatedAt: string | null
}

/**
 * مقاله در فرم ویرایش.
 *
 * ⚠️ مثل AdminProductDetail، فیلدهای متنی **شیء دو زبانه**‌اند نه رشته.
 *    اگر رشته بودند، ذخیره‌ی فرم ترجمه‌ی زبان دیگر را پاک می‌کرد.
 */
export interface AdminPostDetail {
  id: number
  slug: string

  title: Translated
  excerpt: Translated
  body: Translated

  /** عنوان آماده برای تیتر صفحه — راحتی فرانت‌اند */
  displayTitle: string

  postCategoryId: number
  authorName: string | null

  /** آدرس مطلق برای پیش‌نمایش */
  coverImage: string | null
  /** مسیر نسبی که فرم هنگام ذخیره پس می‌فرستد */
  coverImagePath: string | null

  readingMinutes: number
  viewsCount: number
  isFeatured: boolean

  status: PostStatusValue
  publishedAt: string | null

  category?: { id: number; name: string; slug: string }
  createdAt: string | null
  updatedAt: string | null
}

/** دسته‌ی مجله — برای انتخابگر فرم. */
export interface AdminPostCategory {
  id: number
  name: string
  slug: string
  postsCount?: number
}

/** ورودی ساخت و ویرایش مقاله. */
export interface PostInput {
  title: Translated
  excerpt?: Translated
  body: Translated
  post_category_id: number
  slug?: string
  author_name?: string
  cover_image?: string
  is_featured?: boolean
  /** تهی یعنی پیش‌نویس؛ تاریخ آینده یعنی زمان‌بندی‌شده */
  published_at?: string | null
}

/** فیلترهای فهرست مقالات در پنل. */
export interface AdminPostFilters {
  status?: PostStatusValue
  category_id?: number
  q?: string
  page?: number
  per_page?: number
}

/** شمارش مقالات در هر وضعیت — برای نشان‌های عددی روی تب‌ها. */
export interface PostStatusCounts {
  all: number
  published: number
  scheduled: number
  draft: number
}

/* =========================================================================
 * دسته‌بندی و برند — پنل مدیریت
 * ======================================================================= */

/**
 * دسته‌بندی در پنل.
 *
 * ⚠️ فیلدهای متنی **شیء دو زبانه**‌اند نه رشته — همان دلیل
 *    AdminPostDetail: اگر رشته بودند، ذخیره‌ی فرم ترجمه‌ی زبان
 *    دیگر را پاک می‌کرد.
 */
export interface AdminCategory {
  id: number
  slug: string

  name: Translated
  description: Translated
  metaTitle: Translated
  metaDescription: Translated

  /** نام به زبان جاری پنل — برای ستون جدول */
  displayName: string

  parentId: number | null
  icon: string | null
  image: string | null

  sortOrder: number
  isActive: boolean
  isFeatured: boolean

  /** محصولات مستقیم این دسته */
  productsCount: number
  /** تعداد زیردسته‌ها */
  childrenCount: number

  /** زیردسته‌ها — فقط در نمای درختی پر است */
  children?: AdminCategory[]

  updatedAt: string | null
}

/** برند در پنل. */
export interface AdminBrand {
  id: number
  slug: string

  name: Translated
  description: Translated
  displayName: string

  /** آدرس مطلق برای پیش‌نمایش */
  logo: string | null
  /** مسیر نسبی که فرم هنگام ذخیره پس می‌فرستد */
  logoPath: string | null

  website: string | null
  countryCode: string | null

  sortOrder: number
  isActive: boolean
  isFeatured: boolean

  productsCount: number
  updatedAt: string | null
}

/** ورودی ساخت و ویرایش دسته‌بندی. */
export interface CategoryInput {
  name: Translated
  description?: Translated
  meta_title?: Translated
  meta_description?: Translated
  parent_id?: number | null
  slug?: string
  icon?: string
  image?: string
  sort_order?: number
  is_active?: boolean
  is_featured?: boolean
}

/** ورودی ساخت و ویرایش برند. */
export interface BrandInput {
  name: Translated
  description?: Translated
  slug?: string
  logo?: string
  website?: string
  country_code?: string
  sort_order?: number
  is_active?: boolean
  is_featured?: boolean
}

/* =========================================================================
 * تعدیل نظرات — پنل مدیریت
 * ======================================================================= */

/**
 * یک نظر در صف تعدیل.
 *
 * همان `Review` عمومی است، اما اینجا `author` و `product` همیشه
 * بارگذاری می‌شوند: کنترلر پنل با `with(['user','product'])` کوئری
 * می‌زند. با این حال اختیاری اعلام می‌شوند تا اگر روزی آن `with`
 * حذف شود، TypeScript به‌جای خطای زمان اجرا هشدار بدهد.
 */
export type AdminReview = Review

/** تب‌های صف تعدیل. `all` فیلتری نیست — یعنی «بدون فیلتر». */
export type ReviewStatusTab = ReviewStatus | 'all'

/** فیلترهای فهرست نظرات در پنل. */
export interface AdminReviewFilters {
  status?: ReviewStatusTab
  page?: number
  per_page?: number
}

/**
 * شمارش نظرات در هر وضعیت — برای نشان‌های عددی روی تب‌ها.
 *
 * ⚠️ برخلاف `PostStatusCounts` کلید `all` ندارد: بک‌اند فقط سه
 *    وضعیت را می‌شمارد. جمعِ تب «همه» در فرانت حساب می‌شود.
 */
export interface ReviewStatusCounts {
  pending: number
  approved: number
  rejected: number
}

/* =========================================================================
 * صف پشتیبانی — پنل مدیریت
 * ======================================================================= */

/**
 * تب‌های صف پشتیبانی.
 *
 * ⚠️ `needs_attention` یک وضعیت در enum بک‌اند **نیست** — یک نمای
 *    ترکیبی است (open + customer_reply) که scopeNeedsAttention
 *    می‌سازد: یعنی «توپ در زمین ماست». پیش‌فرض همین است، چون کار
 *    روزانه‌ی پشتیبان همین صف است نه مرور کل تاریخچه.
 */
export type AdminTicketTab = 'needs_attention' | 'open' | 'answered' | 'closed' | 'all'

/** فیلترهای صف پشتیبانی در پنل. */
export interface AdminTicketFilters {
  status?: AdminTicketTab
  q?: string
  page?: number
  per_page?: number
}

/**
 * شمارش تیکت‌ها برای نشان‌های عددی روی تب‌ها.
 *
 * علاوه بر هر وضعیت enum، دو کلید ترکیبی هم دارد: `all` و
 * `needs_attention`. تایپ نگاشتی روی TicketStatus تضمین می‌کند
 * افزودن وضعیت تازه در بک‌اند اینجا خطای کامپایل بدهد، نه یک
 * `undefined` بی‌صدا روی نشان.
 */
export type TicketStatusCounts = Record<TicketStatus, number> & {
  all: number
  needs_attention: number
}

/* =========================================================================
 * مشتریان — پنل مدیریت
 * ======================================================================= */

/** تب‌های فهرست مشتریان. */
export type CustomerTab = 'all' | 'active' | 'inactive' | 'buyers'

/** مرتب‌سازی‌های مجاز فهرست مشتریان. */
export type CustomerSort = 'newest' | 'oldest' | 'orders' | 'spent' | 'name'

/** فیلترهای فهرست مشتریان. */
export interface AdminCustomerFilters {
  status?: CustomerTab
  sort?: CustomerSort
  q?: string
  page?: number
  per_page?: number
}

/** شمارش مشتریان در هر وضعیت — برای نشان‌های عددی روی تب‌ها. */
export interface CustomerStatusCounts {
  all: number
  active: number
  inactive: number
  buyers: number
}

/** یک مشتری در فهرست پنل. */
export interface AdminCustomer {
  id: number
  name: string
  email: string
  phone: string | null
  avatar: string | null

  role: string
  roleLabel: string

  isActive: boolean
  emailVerified: boolean
  phoneVerified: boolean

  ordersCount: number
  /** مجموع خرید به ریال — فقط سفارش‌های پرداخت‌شده */
  totalSpent: number
  lastOrderAt: string | null

  createdAt: string
  lastLoginAt: string | null
}

/**
 * پروفایل کامل مشتری.
 *
 * ⚠️ `recentOrders` عمداً محدود به ده سفارش آخر است، نه همه.
 *    فهرست کامل جای خودش در `/admin/orders` است.
 */
export interface AdminCustomerDetail extends AdminCustomer {
  birthDate: string | null

  reviewsCount: number
  ticketsCount: number
  addressesCount: number
  wishlistCount: number

  addresses: Address[]
  recentOrders: Order[]
}

/* =========================================================================
 * کدهای تخفیف — پنل مدیریت
 * ======================================================================= */

/** نوع تخفیف — آینه‌ی CouponType در بک‌اند. */
export type CouponTypeValue = 'percent' | 'fixed'

/**
 * وضعیت محاسبه‌شده‌ی کوپن.
 *
 * ⚠️ این مقدار از بک‌اند می‌آید و فرانت نباید آن را از روی تاریخ‌ها
 *    بازسازی کند: هر بازسازی یعنی نسخه‌ی دومی از قاعده که با تغییر
 *    بک‌اند بی‌صدا از آن دور می‌شود.
 */
export type CouponState = 'active' | 'scheduled' | 'expired' | 'exhausted' | 'disabled'

/** تب‌های فهرست کوپن‌ها. */
export type CouponTab = 'all' | CouponState

/** یک گزینه‌ی نوع تخفیف — از پاسخ فهرست می‌آید. */
export interface CouponTypeOption {
  value: CouponTypeValue
  label: string
}

/** شمارش کوپن‌ها در هر وضعیت. */
export type CouponStateCounts = Record<CouponTab, number>

/** فیلترهای فهرست کوپن‌ها. */
export interface AdminCouponFilters {
  state?: CouponTab
  q?: string
  page?: number
  per_page?: number
}

/** یک کد تخفیف در پنل. */
export interface AdminCoupon {
  id: number
  code: string
  description: string | null

  type: CouponTypeValue
  typeLabel: string

  /** معنایش به `type` وابسته است: درصد یا مبلغ ریالی */
  value: number
  /** سقف تخفیف به ریال — فقط برای نوع درصدی */
  maxDiscount: number | null
  minOrderTotal: number

  usageLimit: number | null
  perUserLimit: number
  usedCount: number
  /** تهی یعنی نامحدود */
  remainingUses: number | null

  startsAt: string | null
  expiresAt: string | null
  isActive: boolean

  state: CouponState
  createdAt: string
}

/**
 * ورودی ساخت و ویرایش کوپن.
 *
 * ⚠️ نام فیلدها snake_case است چون مستقیم به اعتبارسنجی لاراول می‌رود
 *    و خطاهای ۴۲۲ هم با همین کلیدها برمی‌گردند؛ تبدیل نام یعنی خطای
 *    سرور به فیلد اشتباهی می‌چسبید.
 */
export interface CouponInput {
  code: string
  description?: string | null
  type: CouponTypeValue
  value: number
  max_discount?: number | null
  min_order_total?: number
  usage_limit?: number | null
  per_user_limit: number
  starts_at?: string | null
  expires_at?: string | null
  is_active: boolean
}

/* =========================================================================
 * تنظیمات فروشگاه — پنل مدیریت
 * ======================================================================= */

/** گروه‌های تنظیمات — برای دسته‌بندی در فرم. */
export type SettingGroup = 'general' | 'contact' | 'social'

/** نوع ورودی فرم — بک‌اند تعیین می‌کند تا شما یک جا بماند. */
export type SettingInput = 'text' | 'textarea' | 'email' | 'url'

/**
 * یک تنظیم در پنل.
 *
 * ⚠️ `value` بسته به `translatable` دو شکل دارد: رشته‌ی ساده، یا شیء
 *    با کلید هر زبان. بک‌اند همیشه هر دو کلید را می‌فرستد (حتی خالی)
 *    تا ورودی کنترل‌شده‌ی React هرگز `undefined` نگیرد.
 */
export interface AdminSetting {
  key: string
  group: SettingGroup
  translatable: boolean
  input: SettingInput
  value: string | { fa: string; en: string }
}
