/**
 * توابع فراخوانی API پروفایل و امنیت حساب
 * ---------------------------------------------------------------------------
 * همه‌ی این مسیرها نیازمند توکن‌اند و روی کاربرِ همان توکن کار
 * می‌کنند — هیچ شناسه‌ای از بیرون گرفته نمی‌شود.
 */

import { api } from './client'
import type { ApiResponse } from '@/types/api'
import type { PasswordInput, ProfileInput, User, UserSession } from '@/types/user'

/** اطلاعات کامل کاربر جاری. */
export async function getProfile(): Promise<User> {
  const response = await api.get<ApiResponse<User>>('/profile')
  return response.data
}

/** ویرایش اطلاعات شخصی. */
export async function updateProfile(input: ProfileInput): Promise<User> {
  const response = await api.put<ApiResponse<User>>('/profile', input)
  return response.data
}

/**
 * تغییر رمز عبور.
 *
 * ⚠️ پس از موفقیت، سرور همه‌ی نشست‌های *دیگر* را می‌بندد ولی توکن
 *    جاری معتبر می‌ماند. یعنی کاربر از حساب خودش پرت نمی‌شود و
 *    نیازی به ورود دوباره ندارد.
 */
export async function updatePassword(input: PasswordInput): Promise<void> {
  await api.put('/profile/password', input)
}

/** فهرست دستگاه‌هایی که با آن‌ها وارد شده‌اید. */
export async function getSessions(): Promise<UserSession[]> {
  const response = await api.get<ApiResponse<UserSession[]>>('/profile/sessions')
  return response.data
}

/**
 * خروج از یک دستگاه.
 *
 * نشست جاری از این مسیر قابل بستن نیست — سرور ۴۲۲ با کد
 * CURRENT_SESSION برمی‌گرداند.
 */
export async function revokeSession(id: number): Promise<void> {
  await api.delete(`/profile/sessions/${id}`)
}
