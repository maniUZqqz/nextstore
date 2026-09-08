/**
 * توابع فراخوانی API آدرس، سفارش و پرداخت
 * ---------------------------------------------------------------------------
 * تمام این مسیرها (به‌جز تأیید پرداخت) نیازمند توکن‌اند.
 * کلاینت API خودش توکن را از localStorage به هدر اضافه می‌کند.
 */

import { api } from './client'
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import type {
  Address, AddressInput,
  Order, OrderDetail, PlaceOrderInput,
  PaymentGateway, InitiatePaymentResponse,
} from '@/types/order'

/* =========================================================================
 * آدرس‌ها
 * ======================================================================= */

/** فهرست آدرس‌های کاربر — پیش‌فرض در ابتدا. */
export async function getAddresses(): Promise<Address[]> {
  const response = await api.get<ApiResponse<Address[]>>('/addresses')
  return response.data
}

/** ثبت آدرس جدید. */
export async function createAddress(input: AddressInput): Promise<Address> {
  const response = await api.post<ApiResponse<Address>>('/addresses', input)
  return response.data
}

/** ویرایش آدرس. */
export async function updateAddress(id: number, input: AddressInput): Promise<Address> {
  const response = await api.put<ApiResponse<Address>>(`/addresses/${id}`, input)
  return response.data
}

/** حذف آدرس. */
export async function deleteAddress(id: number): Promise<void> {
  await api.delete(`/addresses/${id}`)
}

/** تعیین آدرس پیش‌فرض. */
export async function setDefaultAddress(id: number): Promise<Address> {
  const response = await api.patch<ApiResponse<Address>>(`/addresses/${id}/default`)
  return response.data
}

/* =========================================================================
 * سفارش‌ها
 * ======================================================================= */

/** فهرست سفارش‌های کاربر (صفحه‌بندی‌شده). */
export function getOrders(page = 1) {
  return api.get<PaginatedResponse<Order>>('/orders', { params: { page } })
}

/** جزئیات یک سفارش با شماره سفارش. */
export async function getOrder(orderNumber: string): Promise<OrderDetail> {
  const response = await api.get<ApiResponse<OrderDetail>>(`/orders/${orderNumber}`)
  return response.data
}

/**
 * ثبت سفارش از روی سبد خرید.
 *
 * ⚠️ مبلغ در ورودی ارسال نمی‌شود — بک‌اند آن را از دیتابیس محاسبه
 *    می‌کند تا دستکاری قیمت سمت کلاینت ممکن نباشد.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<OrderDetail> {
  const response = await api.post<ApiResponse<OrderDetail>>('/orders', input)
  return response.data
}

/** لغو سفارش توسط مشتری. */
export async function cancelOrder(orderNumber: string): Promise<OrderDetail> {
  const response = await api.post<ApiResponse<OrderDetail>>(`/orders/${orderNumber}/cancel`)
  return response.data
}

/* =========================================================================
 * پرداخت
 * ======================================================================= */

/** فهرست درگاه‌های فعال. */
export async function getPaymentGateways(locale?: string): Promise<PaymentGateway[]> {
  const response = await api.get<ApiResponse<PaymentGateway[]>>('/payments/gateways', {
    locale,
  })
  return response.data
}

/**
 * شروع پرداخت — آدرس درگاه را برمی‌گرداند.
 *
 * @param orderNumber شماره سفارش
 * @param gateway     شناسه درگاه
 * @param callback    آدرس بازگشت پس از پرداخت
 */
export async function initiatePayment(
  orderNumber: string,
  gateway: string,
  callback: string,
): Promise<InitiatePaymentResponse> {
  const response = await api.post<ApiResponse<InitiatePaymentResponse>>(
    `/orders/${orderNumber}/pay`,
    { gateway, callback },
  )
  return response.data
}

/**
 * تأیید پرداخت پس از بازگشت از درگاه.
 *
 * این مسیر عمداً نیازی به توکن ندارد — درگاه واقعی کاربر را با یک
 * درخواست ساده برمی‌گرداند و هدر Authorization را حمل نمی‌کند.
 */
export async function verifyPayment(params: {
  ref: string
  success?: boolean
}): Promise<{ success: boolean; order: OrderDetail }> {
  const response = await api.post<ApiResponse<{ success: boolean; order: OrderDetail }>>(
    '/payments/verify',
    params,
  )
  return response.data
}
