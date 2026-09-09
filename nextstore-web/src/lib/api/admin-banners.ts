/**
 * توابع فراخوانی API مدیریت بنرها
 * ---------------------------------------------------------------------------
 * همه‌ی این مسیرها پشت میدل‌ور `admin` بک‌اند هستند.
 *
 * ⚠️ فهرست **صفحه‌بندی ندارد** و این عمدی است: بنرها چند قلم‌اند و
 *    ترتیبشان در پنل قابل تغییر است. جابه‌جا کردن قلمی که در صفحه‌ی
 *    بعد نشسته، کار نشدنی می‌شود.
 */

import { api } from './client'
import type { ApiResponse } from '@/types/api'
import type { AdminBanner, BannerMeta, BannerPlacement } from '@/types/banner'

/** پاسخ فهرست — گزینه‌های فرم هم همراهش می‌آید. */
export interface AdminBannerListResponse {
  data: AdminBanner[]
  meta: BannerMeta
}

/** ورودی ساخت یا ویرایش — همان شکلی که بک‌اند می‌خواهد (snake_case). */
export interface BannerInput {
  placement: BannerPlacement
  theme: string
  badge: Record<string, string>
  title: Record<string, string>
  subtitle: Record<string, string>
  cta_label: Record<string, string>
  href: string
  icon: string | null
  sort_order: number
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
}

export function getBanners(placement?: BannerPlacement) {
  return api.get<AdminBannerListResponse>('/admin/banners', {
    params: { placement },
  })
}

export async function createBanner(input: BannerInput): Promise<AdminBanner> {
  const response = await api.post<ApiResponse<AdminBanner>>('/admin/banners', input)
  return response.data
}

export async function updateBanner(id: number, input: BannerInput): Promise<AdminBanner> {
  const response = await api.put<ApiResponse<AdminBanner>>(`/admin/banners/${id}`, input)
  return response.data
}

export function deleteBanner(id: number) {
  return api.delete<{ message: string }>(`/admin/banners/${id}`)
}

/**
 * روشن/خاموش سریع.
 *
 * ⚠️ مسیر جدا دارد و نه `update` با یک فیلد: مهم‌ترین کاری که مدیر با
 *    بنر می‌کند خاموش‌کردن کمپین تمام‌شده است، و مجبورکردنش به باز
 *    کردن فرم کامل برای یک تیک، همان اصطکاکی است که باعث می‌شود بنر
 *    منقضی روی صفحه بماند.
 */
export async function toggleBanner(id: number): Promise<AdminBanner> {
  const response = await api.patch<ApiResponse<AdminBanner>>(`/admin/banners/${id}/toggle`)
  return response.data
}
