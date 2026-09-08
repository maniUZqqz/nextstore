/**
 * کلاینت مرکزی ارتباط با API لاراول
 * ===========================================================================
 * تمام درخواست‌های بک‌اند از این فایل عبور می‌کنند.
 *
 * چرا fetch به‌جای axios؟
 *   Next.js نسخه‌ی fetch خودش را با قابلیت کش و بازاعتبارسنجی (ISR)
 *   یکپارچه کرده است. با axios از این قابلیت‌ها محروم می‌شویم و
 *   داده‌ها در هر بازدید دوباره از سرور گرفته می‌شوند.
 *
 * این فایل هم در Server Component و هم در Client Component کار می‌کند.
 */

import type { ApiErrorBody } from '@/types/api'

/** آدرس پایه‌ی API — در محیط تولید از متغیر محیطی خوانده می‌شود. */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'

/**
 * خطای یکدست برنامه.
 * تمام خطاهای API به این نوع تبدیل می‌شوند تا کد مصرف‌کننده فقط
 * با یک ساختار سروکار داشته باشد.
 */
export class ApiError extends Error {
  constructor(
    /** کد ماشین‌خوان خطا، مثلاً INSUFFICIENT_STOCK */
    public readonly code: string,
    message: string,
    /** کد وضعیت HTTP؛ صفر یعنی خطای شبکه */
    public readonly status: number,
    /** خطاهای اعتبارسنجی به تفکیک فیلد — برای نمایش زیر ورودی فرم */
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'ApiError'
  }

  /** آیا خطای اعتبارسنجی فرم است؟ */
  get isValidation(): boolean {
    return this.status === 422
  }

  /** آیا مشکل از قطعی شبکه است؟ */
  get isNetwork(): boolean {
    return this.status === 0
  }
}

/** تنظیمات اضافی مخصوص درخواست‌های ما. */
interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** پارامترهای Query که به رشته تبدیل می‌شوند */
  params?: Record<string, unknown>
  /** بدنه‌ی درخواست — خودکار به JSON تبدیل می‌شود */
  body?: unknown
  /** زبان درخواستی؛ در Server Component باید صریح پاس داده شود */
  locale?: string
  /** مدت اعتبار کش بر حسب ثانیه (فقط سمت سرور) */
  revalidate?: number
  /** برچسب کش برای بازاعتبارسنجی هدفمند */
  tags?: string[]
}

/**
 * ساخت رشته‌ی Query از یک شیء.
 *
 * مقادیر undefined و null و رشته‌ی خالی حذف می‌شوند تا آدرس تمیز بماند.
 * آرایه‌ها به‌صورت تکراری اضافه می‌شوند: ?brand=apple&brand=sony
 */
function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return ''

  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue

    if (Array.isArray(value)) {
      value.forEach((v) => search.append(key, String(v)))
    } else {
      search.append(key, String(value))
    }
  }

  const query = search.toString()
  return query ? `?${query}` : ''
}

/**
 * تشخیص زبان جاری وقتی صریحاً پاس داده نشده است.
 * در مرورگر از مسیر URL خوانده می‌شود؛ سمت سرور به زبان پیش‌فرض برمی‌گردیم.
 */
function detectLocale(): string {
  if (typeof window === 'undefined') return 'fa'
  return window.location.pathname.split('/')[1] || 'fa'
}

/**
 * انجام یک درخواست به API و بازگرداندن پاسخ تایپ‌شده.
 *
 * @throws ApiError در صورت خطای شبکه یا پاسخ ناموفق
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { params, body, locale, revalidate, tags, headers, ...rest } = options

  const url = `${API_BASE_URL}${endpoint}${buildQueryString(params)}`

  /* هدرهای مشترک همه‌ی درخواست‌ها */
  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    /* بک‌اند با این هدر تصمیم می‌گیرد پاسخ را به کدام زبان بدهد */
    'Accept-Language': locale ?? detectLocale(),
    ...(headers as Record<string, string>),
  }

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json'
  }

  /* توکن احراز هویت — فقط در مرورگر در دسترس است */
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token')
    if (token) requestHeaders.Authorization = `Bearer ${token}`

    /* شناسه نشست مهمان برای نگهداری سبد خرید کاربر لاگین‌نکرده */
    let sessionId = localStorage.getItem('session_id')
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      localStorage.setItem('session_id', sessionId)
    }
    requestHeaders['X-Session-Id'] = sessionId
  }

  let response: Response

  try {
    response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      /*
       * پیکربندی کش Next.js:
       *   revalidate مشخص می‌کند پاسخ چند ثانیه معتبر بماند.
       *   tags امکان باطل کردن هدفمند کش را می‌دهد (مثلاً بعد از
       *   ویرایش محصول در پنل ادمین).
       */
      next: revalidate !== undefined || tags ? { revalidate, tags } : undefined,
    })
  } catch {
    /* fetch فقط در خطای شبکه throw می‌کند، نه در پاسخ ۴xx/۵xx */
    throw new ApiError('NETWORK_ERROR', 'اتصال به سرور برقرار نشد', 0)
  }

  if (!response.ok) {
    /* تلاش برای خواندن جزئیات خطا از بدنه‌ی پاسخ */
    let errorBody: ApiErrorBody = {}
    try {
      errorBody = await response.json()
    } catch {
      /* بدنه JSON معتبر نبود — با پیام عمومی ادامه می‌دهیم */
    }

    throw new ApiError(
      errorBody.error?.code ?? `HTTP_${response.status}`,
      errorBody.message ?? response.statusText,
      response.status,
      errorBody.errors,
    )
  }

  /* پاسخ ۲۰۴ بدنه ندارد */
  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

/** میان‌برهای متدهای HTTP برای خوانایی بیشتر در لایه‌ی سرویس. */
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'POST', body }),

  /** جایگزینی کامل یک منبع — مثلاً ویرایش آدرس */
  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'PUT', body }),

  /** به‌روزرسانی جزئی — مثلاً تغییر تعداد یک قلم سبد */
  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
}
