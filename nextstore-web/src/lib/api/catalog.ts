/**
 * توابع فراخوانی API کاتالوگ (محصولات، دسته‌ها، برندها)
 * ---------------------------------------------------------------------------
 * هر تابع اینجا یک اندپوینت بک‌اند را می‌پوشاند.
 * هیچ منطق نمایشی اینجا نیست — فقط ارتباط با سرور و تایپ خروجی.
 *
 * استراتژی کش:
 *   داده‌های کم‌تغییر (دسته‌ها، برندها) طولانی‌تر کش می‌شوند.
 *   داده‌های وابسته به فیلتر کاربر کش نمی‌شوند.
 */

import { api } from './client'
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import type {
  Brand,
  Category,
  HomeData,
  Product,
  ProductDetail,
  CategoryDetail,
  ProductFilters,
} from '@/types/product'

/**
 * دریافت فهرست محصولات با فیلتر و صفحه‌بندی.
 *
 * @param filters فیلترهای اعمالی (دسته، برند، قیمت، مرتب‌سازی و ...)
 * @param locale  زبان درخواستی — در Server Component باید صریح داده شود
 */
export function getProducts(filters: ProductFilters = {}, locale?: string) {
  return api.get<PaginatedResponse<Product>>('/products', {
    params: filters as Record<string, unknown>,
    locale,
    /*
     * ۶۰ ثانیه کش. کوتاه است چون موجودی و قیمت ممکن است تغییر کند،
     * اما به‌اندازه‌ای هست که رفت‌وبرگشت‌های پشت‌سرهم را حذف کند.
     */
    revalidate: 60,
    tags: ['products'],
  })
}

/**
 * دریافت جزئیات یک محصول با نامک.
 *
 * @param slug   نامک محصول، مثلاً 'iphone-15-pro-max'
 * @param locale زبان درخواستی
 */
export function getProduct(slug: string, locale?: string) {
  return api.get<ApiResponse<ProductDetail>>(`/products/${slug}`, {
    locale,
    revalidate: 60,
    tags: ['products', `product:${slug}`],
  })
}

/** محصولات مشابه یک محصول — برای بخش «شاید بپسندید». */
export function getRelatedProducts(slug: string, locale?: string) {
  return api.get<ApiResponse<Product[]>>(`/products/${slug}/related`, {
    locale,
    revalidate: 300,
    tags: ['products'],
  })
}

/**
 * درخت کامل دسته‌بندی‌ها برای منوی چندسطحی.
 * یک ساعت کش می‌شود چون به‌ندرت تغییر می‌کند.
 */
export function getCategories(locale?: string) {
  return api.get<ApiResponse<Category[]>>('/categories', {
    locale,
    revalidate: 3600,
    tags: ['categories'],
  })
}

/** فهرست برندها به‌همراه تعداد محصولات هرکدام. */
export function getBrands(locale?: string) {
  return api.get<ApiResponse<Brand[]>>('/brands', {
    locale,
    revalidate: 3600,
    tags: ['brands'],
  })
}

/**
 * تمام داده‌های صفحه اصلی در یک درخواست.
 * به‌جای ۶ درخواست جداگانه، یک رفت‌وبرگشت شبکه.
 */
export function getHomeData(locale?: string) {
  return api.get<ApiResponse<HomeData>>('/home', {
    locale,
    revalidate: 300,
    tags: ['home', 'products'],
  })
}

/**
 * جزئیات یک دسته‌بندی به‌همراه مسیر بردکرامب و زیردسته‌ها.
 *
 * ⚠️ کش ۱۰ دقیقه‌ای است نه یک ساعت: تعداد محصولات هر دسته با
 *    ثبت هر سفارش و ویرایش ادمین تغییر می‌کند و عدد کهنه روی
 *    صفحه‌ی دسته بیشتر به چشم می‌آید تا در منو.
 */
export function getCategory(slug: string, locale?: string) {
  return api.get<ApiResponse<CategoryDetail>>(`/categories/${slug}`, {
    locale,
    revalidate: 600,
    tags: ['categories', `category-${slug}`],
  })
}

/** جزئیات یک برند برای صفحه‌ی اختصاصی آن. */
export function getBrand(slug: string, locale?: string) {
  return api.get<ApiResponse<Brand>>(`/brands/${slug}`, {
    locale,
    revalidate: 600,
    tags: ['brands', `brand-${slug}`],
  })
}
