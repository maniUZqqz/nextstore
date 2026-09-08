/**
 * توابع فراخوانی API احراز هویت
 * ---------------------------------------------------------------------------
 * علاوه بر ارتباط با سرور، مدیریت ذخیره و حذف توکن هم اینجاست تا
 * در یک نقطه متمرکز بماند.
 *
 * ⚠️ توکن در دو جا ذخیره می‌شود:
 *   ۱. localStorage → برای اینکه کلاینت API آن را در هدر بگذارد
 *   ۲. کوکی        → برای اینکه proxy.ts (که سمت سرور اجرا می‌شود)
 *                     بتواند مسیرهای خصوصی را محافظت کند
 *
 *   کوکی با httpOnly نیست چون جاوااسکریپت باید بتواند آن را حذف کند.
 *   امنیت واقعی در بک‌اند با اعتبارسنجی توکن اعمال می‌شود، نه اینجا.
 */

import { api } from './client'
import type { ApiResponse } from '@/types/api'
import type { AuthResponse, LoginInput, RegisterInput, User } from '@/types/user'

/** کلید ذخیره توکن — در همه‌جا باید یکسان باشد. */
const TOKEN_KEY = 'auth_token'

/** نام کوکی که proxy.ts می‌خواند. */
const COOKIE_NAME = 'auth_token'

/* =========================================================================
 * مدیریت توکن
 * ======================================================================= */

/** خواندن توکن ذخیره‌شده. */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * ذخیره توکن در localStorage و کوکی.
 *
 * @param token     توکن دریافتی از سرور
 * @param remember  اگر true باشد کوکی ۳۰ روزه، وگرنه ۱ روزه
 */
export function storeToken(token: string, remember = false): void {
  if (typeof window === 'undefined') return

  localStorage.setItem(TOKEN_KEY, token)

  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24
  /*
   * SameSite=Lax از حملات CSRF پایه جلوگیری می‌کند و در عین حال
   * ناوبری عادی بین صفحات را نمی‌شکند.
   */
  document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${maxAge}; SameSite=Lax`
}

/** حذف توکن از هر دو محل — هنگام خروج یا انقضا. */
export function clearToken(): void {
  if (typeof window === 'undefined') return

  localStorage.removeItem(TOKEN_KEY)
  /* max-age=0 یعنی کوکی بلافاصله منقضی شود */
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`
}

/* =========================================================================
 * فراخوانی‌های API
 * ======================================================================= */

/** ورود با ایمیل و رمز عبور. */
export async function login(input: LoginInput): Promise<AuthResponse['data']> {
  const response = await api.post<AuthResponse>('/auth/login', input)

  storeToken(response.data.token, input.remember)

  return response.data
}

/** ثبت‌نام کاربر جدید. */
export async function register(input: RegisterInput): Promise<AuthResponse['data']> {
  const response = await api.post<AuthResponse>('/auth/register', input)

  storeToken(response.data.token, false)

  return response.data
}

/**
 * خروج از حساب.
 *
 * توکن حتی اگر درخواست سرور شکست بخورد پاک می‌شود — کاربر انتظار
 * دارد با زدن «خروج» از حساب خارج شود، نه اینکه به‌خاطر خطای شبکه
 * همچنان وارد بماند.
 */
export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout')
  } catch {
    /* خطا نادیده گرفته می‌شود؛ توکن در هر حال پاک می‌شود */
  } finally {
    clearToken()
  }
}

/**
 * دریافت اطلاعات کاربر واردشده.
 * اگر توکن منقضی یا نامعتبر باشد، سرور ۴۰۱ برمی‌گرداند.
 */
export async function getMe(): Promise<User> {
  const response = await api.get<ApiResponse<User>>('/auth/me')
  return response.data
}
