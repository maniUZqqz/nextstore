/**
 * توابع فراخوانی API مدیریت دسته‌بندی و برند
 * ---------------------------------------------------------------------------
 * همه پشت میدل‌ور `admin` بک‌اند هستند؛ کلاینت API توکن را خودکار
 * اضافه می‌کند.
 *
 * ⚠️ آدرس‌ها با **شناسه** ساخته می‌شوند نه نامک — همان دلیل مقالات:
 *    نامک همان چیزی است که ادمین ویرایش می‌کند، پس آدرسی که به آن
 *    وابسته باشد با اولین تغییر نامک می‌شکند.
 */

import { api } from './client'
import type { ApiResponse } from '@/types/api'
import type {
  AdminBrand,
  AdminCategory,
  BrandInput,
  CategoryInput,
} from '@/types/admin'

/* =========================================================================
 * دسته‌بندی
 * ======================================================================= */

/**
 * درخت دسته‌ها (یا فهرست تخت، اگر عبارت جستجو داده شود).
 *
 * صفحه‌بندی ندارد: تعداد دسته‌ها ذاتاً کم است و درختِ نیمه‌بریده
 * بی‌معناست.
 */
export async function getAdminCategories(
  params: { q?: string } = {},
  locale?: string,
): Promise<AdminCategory[]> {
  const response = await api.get<ApiResponse<AdminCategory[]>>('/admin/categories', {
    params: params as Record<string, unknown>,
    locale,
  })
  return response.data
}

/** جزئیات یک دسته برای فرم ویرایش. */
export async function getAdminCategory(id: number): Promise<AdminCategory> {
  const response = await api.get<ApiResponse<AdminCategory>>(`/admin/categories/${id}`)
  return response.data
}

export async function createCategory(input: CategoryInput): Promise<AdminCategory> {
  const response = await api.post<ApiResponse<AdminCategory>>('/admin/categories', input)
  return response.data
}

export async function updateCategory(
  id: number,
  input: CategoryInput,
): Promise<AdminCategory> {
  const response = await api.put<ApiResponse<AdminCategory>>(`/admin/categories/${id}`, input)
  return response.data
}

/**
 * حذف دسته.
 *
 * ⚠️ اگر دسته فرزند یا محصول داشته باشد، سرور ۴۰۹ می‌دهد با کد
 *    HAS_CHILDREN یا HAS_PRODUCTS. فراخواننده باید پیام سرور را
 *    نشان دهد، نه یک پیام عمومی — پیام سرور تعداد را هم می‌گوید.
 */
export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/admin/categories/${id}`)
}

/**
 * ذخیره‌ی ترتیب چند دسته با یک درخواست.
 *
 * جابه‌جایی یک دسته، ترتیب همه‌ی هم‌نیاهایش را عوض می‌کند؛ فرستادن
 * یک درخواست به‌ازای هرکدام یعنی حالت نیمه‌ذخیره اگر یکی شکست بخورد.
 */
export async function reorderCategories(
  items: { id: number; sort_order: number }[],
): Promise<void> {
  await api.patch('/admin/categories/reorder', { items })
}

/* =========================================================================
 * برند
 * ======================================================================= */

export async function getAdminBrands(
  params: { q?: string; status?: 'active' | 'inactive' } = {},
  locale?: string,
): Promise<AdminBrand[]> {
  const response = await api.get<ApiResponse<AdminBrand[]>>('/admin/brands', {
    params: params as Record<string, unknown>,
    locale,
  })
  return response.data
}

export async function getAdminBrand(id: number): Promise<AdminBrand> {
  const response = await api.get<ApiResponse<AdminBrand>>(`/admin/brands/${id}`)
  return response.data
}

export async function createBrand(input: BrandInput): Promise<AdminBrand> {
  const response = await api.post<ApiResponse<AdminBrand>>('/admin/brands', input)
  return response.data
}

export async function updateBrand(id: number, input: BrandInput): Promise<AdminBrand> {
  const response = await api.put<ApiResponse<AdminBrand>>(`/admin/brands/${id}`, input)
  return response.data
}

/** حذف برند — اگر محصول داشته باشد سرور ۴۰۹ می‌دهد. */
export async function deleteBrand(id: number): Promise<void> {
  await api.delete(`/admin/brands/${id}`)
}
