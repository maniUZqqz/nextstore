/**
 * تایپ‌های محصول، دسته‌بندی و برند
 * ---------------------------------------------------------------------------
 * ⚠️ این تایپ‌ها باید دقیقاً با خروجی Resource های لاراول مطابق باشند:
 *      ProductResource       → Product
 *      ProductDetailResource → ProductDetail
 *      CategoryResource      → Category
 *      BrandResource         → Brand
 *
 * قرارداد نام‌گذاری: بک‌اند خروجی را camelCase می‌دهد تا نیازی به
 * تبدیل نام فیلدها در فرانت‌اند نباشد.
 */

/** تصویر محصول با متن جایگزین محلی‌سازی‌شده. */
export interface ProductImage {
  id: number
  url: string
  /** متن alt به زبان جاری — برای دسترسی‌پذیری و سئو */
  alt: string
  isPrimary: boolean
}

/** ارجاع سبک به دسته یا برند (فقط فیلدهای لازم برای نمایش). */
export interface TaxonomyRef {
  id: number
  name: string
  slug: string
}

/**
 * محصول در نمای فهرست (کارت محصول).
 * سبک نگه داشته شده تا فهرست ۲۴ تایی حجم زیادی نداشته باشد.
 */
export interface Product {
  id: number
  name: string
  shortDescription: string | null
  slug: string
  sku: string

  /* --- قیمت‌گذاری (به کمترین واحد پول: ریال) --- */
  /** قیمت اصلی بدون تخفیف */
  price: number
  /** قیمتی که کاربر واقعاً می‌پردازد */
  finalPrice: number
  /** قیمت تخفیف‌خورده؛ null یعنی تخفیف ندارد */
  salePrice: number | null
  /** آیا تخفیف در همین لحظه فعال است */
  isOnSale: boolean
  /** درصد تخفیف برای نمایش روی برچسب */
  discountPercent: number
  /**
   * زمان پایان تخفیف؛ فقط وقتی isOnSale درست باشد فرستاده می‌شود.
   * برای تایمر شمارش معکوس «پیشنهاد شگفت‌انگیز» استفاده می‌شود.
   */
  saleEndsAt?: string | null

  /* --- موجودی --- */
  stock: number
  isInStock: boolean
  /** موجودی رو به اتمام — برای نمایش هشدار */
  isLowStock: boolean

  /* --- امتیاز --- */
  ratingAvg: number
  reviewsCount: number

  isFeatured: boolean
  hasVariants: boolean

  /** تصویر شاخص؛ فقط وقتی رابطه images بارگذاری شده باشد */
  thumbnail?: { url: string; alt: string } | null

  category?: TaxonomyRef
  brand?: TaxonomyRef
}

/** محصول در نمای جزئیات — فیلدهای سنگین‌تر فقط اینجا می‌آیند. */
export interface ProductDetail extends Product {
  description: string | null
  barcode: string | null
  weight: number | null
  dimensions: { length: number; width: number; height: number } | null
  /** زمان پایان تخفیف — برای تایمر شمارش معکوس */
  saleEndsAt: string | null
  images: ProductImage[]
  seo: { title: string; description: string | null }
  publishedAt: string | null
}

/** دسته‌بندی با ساختار درختی بازگشتی. */
export interface Category {
  id: number
  name: string
  description: string | null
  slug: string
  icon: string | null
  image: string | null
  isFeatured: boolean
  parentId: number | null
  /** تعداد محصولات این دسته و تمام زیردسته‌ها */
  productsCount: number
  /** تعداد محصولاتی که مستقیماً در این دسته ثبت شده‌اند */
  directProductsCount?: number
  children: Category[]
}

/** برند سازنده. */
export interface Brand {
  id: number
  name: string
  description: string | null
  slug: string
  logo: string | null
  website: string | null
  countryCode: string | null
  isFeatured: boolean
  productsCount?: number
}

/** داده‌های ترکیبی صفحه اصلی — همه در یک درخواست. */
export interface HomeData {
  featured: Product[]
  newArrivals: Product[]
  bestSellers: Product[]
  onSale: Product[]
  categories: Category[]
  brands: Brand[]
}

/**
 * مقادیر مجاز مرتب‌سازی.
 * باید با SORT_MAP در ProductQueryService بک‌اند یکسان باشد.
 */
export type ProductSort =
  | 'newest'
  | 'oldest'
  | 'price_asc'
  | 'price_desc'
  | 'popular'
  | 'rating'
  | 'views'

/** فیلترهای قابل اعمال روی فهرست محصولات. */
export interface ProductFilters {
  category?: string
  brand?: string | string[]
  min_price?: number
  max_price?: number
  in_stock?: boolean
  on_sale?: boolean
  min_rating?: number
  q?: string
  sort?: ProductSort
  page?: number
  per_page?: number
}

/**
 * دسته‌بندی در نمای صفحه‌ی اختصاصی.
 *
 * ⚠️ ساختارش عمداً با `Category` (نمای درختی منو) فرق دارد:
 *    منو به کل درخت نیاز دارد، اما صفحه‌ی دسته به مسیر ریشه تا
 *    خودش (بردکرامب) و فقط یک سطح زیردسته نیاز دارد. فرستادن کل
 *    درخت برای هر صفحه، داده‌ی بی‌استفاده جابه‌جا می‌کند.
 */
export interface CategoryDetail {
  id: number
  name: string
  description: string | null
  slug: string
  image: string | null
  /** مسیر از ریشه تا این دسته، برای ناوبری بالای صفحه */
  breadcrumb: Array<{ name: string; slug: string }>
  /** فقط یک سطح زیردسته — برای چیپ‌های فیلتر سریع */
  children: Array<{ id: number; name: string; slug: string }>
}
