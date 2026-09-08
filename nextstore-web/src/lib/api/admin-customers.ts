/**
 * توابع فراخوانی API مدیریت مشتریان
 * ---------------------------------------------------------------------------
 * ⚠️ اینجا **اندپوینت حذف وجود ندارد** و این عمدی است: حذف حساب
 *    مشتری به سفارش‌هایش آبشار می‌کند و یک سند مالی را نابود می‌کند.
 *    تنها کنش مخرب مجاز، غیرفعال کردن حساب است.
 */

import { api } from './client'
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import type {
  AdminCustomer,
  AdminCustomerDetail,
  AdminCustomerFilters,
  CustomerStatusCounts,
} from '@/types/admin'

/** پاسخ فهرست — علاوه بر صفحه‌بندی، شمارش وضعیت‌ها هم دارد. */
export interface AdminCustomerListResponse extends PaginatedResponse<AdminCustomer> {
  counts: CustomerStatusCounts
}

/** فهرست مشتریان با جستجو، فیلتر و مرتب‌سازی. */
export function getAdminCustomers(filters: AdminCustomerFilters = {}) {
  return api.get<AdminCustomerListResponse>('/admin/customers', {
    params: filters as Record<string, unknown>,
  })
}

/** پروفایل کامل یک مشتری — با آدرس‌ها و ده سفارش آخر. */
export async function getAdminCustomer(id: number): Promise<AdminCustomerDetail> {
  const response = await api.get<ApiResponse<AdminCustomerDetail>>(`/admin/customers/${id}`)
  return response.data
}

/**
 * فعال یا غیرفعال کردن حساب.
 *
 * ⚠️ روی حساب کارکنان ۴۲۲ با کد `CUSTOMER_IS_STAFF` می‌دهد — بک‌اند
 *    اجازه نمی‌دهد مدیری دسترسی مدیر دیگری (یا خودش) را قفل کند.
 */
export async function setCustomerActive(id: number, isActive: boolean): Promise<void> {
  await api.patch(`/admin/customers/${id}/status`, { is_active: isActive })
}
