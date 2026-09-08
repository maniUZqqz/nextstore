/**
 * توابع فراخوانی API مدیریت کدهای تخفیف
 * ---------------------------------------------------------------------------
 * ⚠️ هیچ مسیر عمومی‌ای کوپن‌ها را برنمی‌گرداند و این عمدی است: فهرست
 *    کوپن‌ها یعنی فهرست کدهای فعال. لو رفتنش در فروشگاه یعنی هر کاربری
 *    می‌تواند کدی را که برای کمپین خاصی ساخته شده استفاده کند.
 */

import { api } from './client'
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import type {
  AdminCoupon,
  AdminCouponFilters,
  CouponInput,
  CouponStateCounts,
  CouponTypeOption,
} from '@/types/admin'

/** پاسخ فهرست — شمارش وضعیت‌ها و گزینه‌های نوع را هم دارد. */
export interface AdminCouponListResponse extends PaginatedResponse<AdminCoupon> {
  counts: CouponStateCounts
  types: CouponTypeOption[]
}

/** فهرست کوپن‌ها با فیلتر وضعیت و جستجو. */
export function getAdminCoupons(filters: AdminCouponFilters = {}) {
  return api.get<AdminCouponListResponse>('/admin/coupons', {
    params: filters as Record<string, unknown>,
  })
}

/** ساخت کد تخفیف تازه. */
export async function createCoupon(input: CouponInput): Promise<AdminCoupon> {
  const response = await api.post<ApiResponse<AdminCoupon>>('/admin/coupons', input)
  return response.data
}

/** ویرایش کد تخفیف. */
export async function updateCoupon(id: number, input: CouponInput): Promise<AdminCoupon> {
  const response = await api.put<ApiResponse<AdminCoupon>>(`/admin/coupons/${id}`, input)
  return response.data
}

/**
 * حذف کد تخفیف.
 *
 * ⚠️ کوپنی که مصرف شده ۴۲۲ با کد `COUPON_HAS_USAGE` می‌دهد — حذفش
 *    آمار کمپین را نابود می‌کرد. راه درست، غیرفعال کردن است.
 */
export async function deleteCoupon(id: number): Promise<void> {
  await api.delete(`/admin/coupons/${id}`)
}

/**
 * فعال یا غیرفعال کردن سریع از روی جدول.
 *
 * اندپوینت جداست تا تغییر وضعیت کل فرم را به سرور نفرستد.
 */
export async function toggleCoupon(id: number, isActive: boolean): Promise<AdminCoupon> {
  const response = await api.patch<ApiResponse<AdminCoupon>>(
    `/admin/coupons/${id}/toggle`,
    { is_active: isActive },
  )
  return response.data
}
