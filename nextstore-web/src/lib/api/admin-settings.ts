/**
 * توابع فراخوانی API تنظیمات فروشگاه — پنل مدیریت
 * ---------------------------------------------------------------------------
 * ⚠️ ذخیره **دسته‌جمعی** است، نه فیلد به فیلد. فرم تنظیمات یک واحد است
 *    و ذخیره‌ی جزئی حالتی می‌سازد که نیمی از مقادیر تازه‌اند و نیمی
 *    کهنه — بدترین حالت برای عیب‌یابی.
 */

import { api } from './client'
import type { ApiResponse } from '@/types/api'
import type { AdminSetting } from '@/types/admin'

/** همه‌ی تنظیمات با مقدار خام — دوزبانه‌ها با هر دو زبان. */
export async function getAdminSettings(): Promise<AdminSetting[]> {
  const response = await api.get<ApiResponse<AdminSetting[]>>('/admin/settings')
  return response.data
}

/** ذخیره‌ی دسته‌جمعی؛ فهرست تازه را برمی‌گرداند. */
export async function saveAdminSettings(
  settings: Pick<AdminSetting, 'key' | 'value'>[],
): Promise<AdminSetting[]> {
  const response = await api.put<ApiResponse<AdminSetting[]>>('/admin/settings', { settings })
  return response.data
}
