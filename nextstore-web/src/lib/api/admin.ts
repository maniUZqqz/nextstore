/**
 * توابع فراخوانی API پنل مدیریت
 * ---------------------------------------------------------------------------
 * تمام این مسیرها نیازمند توکن با نقش مدیر هستند.
 * اگر کاربر عادی درخواست بزند، بک‌اند ۴۰۳ برمی‌گرداند.
 */

import { api } from './client'
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import type {
  DashboardData,
  OrderStatusOption,
  UpdateOrderStatusInput,
  ProductInput,
  AdminProductFilters,
  AdminOrderFilters,
  AdminOrder,
  AdminOrderDetail,
  AdminProduct,
  AdminProductDetail,
} from '@/types/admin'

/* =========================================================================
 * داشبورد
 * ======================================================================= */

/** آمار کامل داشبورد در یک درخواست. */
export async function getDashboard(locale?: string): Promise<DashboardData> {
  const response = await api.get<ApiResponse<DashboardData>>('/admin/dashboard', {
    locale,
  })
  return response.data
}

/* =========================================================================
 * سفارش‌ها
 * ======================================================================= */

/** فهرست همه سفارش‌ها با فیلتر و جستجو. */
export function getAdminOrders(filters: AdminOrderFilters = {}) {
  return api.get<PaginatedResponse<AdminOrder>>('/admin/orders', {
    params: filters as Record<string, unknown>,
  })
}

/** جزئیات یک سفارش. */
export async function getAdminOrder(orderNumber: string): Promise<AdminOrderDetail> {
  const response = await api.get<ApiResponse<AdminOrderDetail>>(`/admin/orders/${orderNumber}`)
  return response.data
}

/**
 * فهرست وضعیت‌های ممکن به‌همراه انتقال‌های مجاز هرکدام.
 *
 * فرانت‌اند از allowedTransitions استفاده می‌کند تا فقط وضعیت‌های
 * قابل انتخاب را نشان دهد — کاربر گزینه‌ای که رد می‌شود نمی‌بیند.
 */
export async function getOrderStatuses(locale?: string): Promise<OrderStatusOption[]> {
  const response = await api.get<ApiResponse<OrderStatusOption[]>>(
    '/admin/orders/statuses',
    { locale },
  )
  return response.data
}

/** تغییر وضعیت سفارش (با کد رهگیری و یادداشت اختیاری). */
export async function updateOrderStatus(
  orderNumber: string,
  input: UpdateOrderStatusInput,
): Promise<AdminOrderDetail> {
  const response = await api.patch<ApiResponse<AdminOrderDetail>>(
    `/admin/orders/${orderNumber}/status`,
    input,
  )
  return response.data
}

/* =========================================================================
 * محصولات
 * ======================================================================= */

/** فهرست محصولات شامل پیش‌نویس و بایگانی. */
export function getAdminProducts(filters: AdminProductFilters = {}) {
  return api.get<PaginatedResponse<AdminProduct>>('/admin/products', {
    params: filters as Record<string, unknown>,
  })
}

/** جزئیات کامل محصول برای فرم ویرایش. */
export async function getAdminProduct(slug: string): Promise<AdminProductDetail> {
  const response = await api.get<ApiResponse<AdminProductDetail>>(`/admin/products/${slug}`)
  return response.data
}

/** ساخت محصول جدید. */
export async function createProduct(input: ProductInput): Promise<AdminProductDetail> {
  const response = await api.post<ApiResponse<AdminProductDetail>>('/admin/products', input)
  return response.data
}

/** ویرایش محصول. */
export async function updateProduct(
  slug: string,
  input: ProductInput,
): Promise<AdminProductDetail> {
  const response = await api.put<ApiResponse<AdminProductDetail>>(`/admin/products/${slug}`, input)
  return response.data
}

/** حذف نرم محصول. */
export async function deleteProduct(slug: string): Promise<void> {
  await api.delete(`/admin/products/${slug}`)
}

/** تغییر سریع موجودی — پرکاربردترین عملیات انبارداری. */
export async function updateProductStock(slug: string, stock: number): Promise<AdminProduct> {
  const response = await api.patch<ApiResponse<AdminProduct>>(
    `/admin/products/${slug}/stock`,
    { stock },
  )
  return response.data
}
