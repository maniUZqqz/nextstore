/**
 * تایپ‌های آدرس، سفارش و پرداخت
 * ---------------------------------------------------------------------------
 * باید دقیقاً با خروجی Resource های لاراول مطابق باشند:
 *     AddressResource     → Address
 *     OrderResource       → Order
 *     OrderDetailResource → OrderDetail
 */

/** آدرس تحویل کاربر. */
export interface Address {
  id: number
  /** برچسب دلخواه: «خانه»، «محل کار» */
  label: string | null

  recipientName: string
  recipientPhone: string

  province: string
  city: string
  street: string
  postalCode: string | null
  buildingNo: string | null
  unit: string | null

  /** آدرس یک‌خطی آماده — بک‌اند آن را ساخته است */
  fullAddress: string

  isDefault: boolean
}

/** ورودی فرم آدرس — نام فیلدها با قرارداد بک‌اند (snake_case). */
export interface AddressInput {
  label?: string
  recipient_name: string
  recipient_phone: string
  province: string
  city: string
  street: string
  postal_code?: string
  building_no?: string
  unit?: string
  is_default?: boolean
}

/**
 * وضعیت سفارش — باید با App\Enums\OrderStatus یکسان باشد.
 */
export type OrderStatusValue =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

/** رنگ معنایی که بک‌اند برای وضعیت پیشنهاد می‌دهد. */
/*
 * ⚠️ 'muted' هم عضو این اتحاد است، هرچند هیچ وضعیت *سفارشی* آن را
 *    نمی‌گیرد. اولویت «کم» تیکت (TicketPriority::Low) این رنگ را
 *    برمی‌گرداند و همین تایپ برای همه‌ی رنگ‌های معنایی بک‌اند به کار
 *    می‌رود. جا انداختنش یعنی خطای تایپ در جایی که رنگ اولویت خوانده
 *    می‌شود — یا بدتر، یک `undefined` در نگاشت کلاس و نشانی بی‌استایل.
 */
export type StatusColor = 'warning' | 'info' | 'success' | 'destructive' | 'muted'

/** سفارش در نمای فهرست. */
export interface Order {
  id: number
  orderNumber: string

  status: OrderStatusValue
  /** برچسب فارسی/انگلیسی وضعیت */
  statusLabel: string
  statusColor: StatusColor
  /** شماره مرحله در نوار پیشرفت (۰ تا ۵؛ صفر یعنی لغو یا بازگشت) */
  statusStep: number
  isCancellable: boolean

  subtotal: number
  discount: number
  shippingCost: number
  tax: number
  total: number

  itemsCount?: number

  createdAt: string | null
  paidAt: string | null
  shippedAt: string | null
  deliveredAt: string | null

  trackingCode: string | null
}

/** یک قلم از سفارش — نام و قیمت در لحظه‌ی خرید کپی شده‌اند. */
export interface OrderItem {
  id: number
  name: string
  sku: string
  image: string | null
  unitPrice: number
  quantity: number
  lineTotal: number
  productId: number | null
  slug?: string | null
}

/** آدرس ثبت‌شده در سفارش — عکس لحظه‌ای، نه ارجاع به جدول آدرس. */
export interface OrderShippingAddress {
  recipientName: string
  recipientPhone: string
  province: string
  city: string
  street: string
  postalCode: string | null
  buildingNo: string | null
  unit: string | null
}

/** اطلاعات پرداخت سفارش. */
export interface OrderPayment {
  gateway: string
  status: 'initiated' | 'pending' | 'succeeded' | 'failed' | 'refunded'
  statusLabel: string
  /** شماره پیگیری بانکی */
  trackingNumber: string | null
  paidAt: string | null
}

/** سفارش در نمای جزئیات. */
export interface OrderDetail extends Order {
  items: OrderItem[]
  shippingAddress: OrderShippingAddress

  /**
   * کلید ماشین‌خوان روش ارسال: 'standard' یا 'express'.
   *
   * ⚠️ برای **نمایش** از `shippingMethodLabel` استفاده کنید، نه این.
   *    پیش‌تر همین کلید خام روی صفحه‌ی سفارش و فاکتور چاپ می‌شد و
   *    مشتری فارسی‌زبان عبارت «standard» را می‌دید.
   */
  shippingMethod: string
  shippingMethodLabel: string
  shippingMethodDescription: string
  customerNote: string | null
  payment: OrderPayment | null
  cancelledAt: string | null
}

/** ورودی ثبت سفارش. */
export interface PlaceOrderInput {
  address_id: number
  shipping_method: 'standard' | 'express'
  note?: string
}

/** درگاه پرداخت در دسترس. */
export interface PaymentGateway {
  id: string
  name: string
}

/** پاسخ شروع پرداخت. */
export interface InitiatePaymentResponse {
  /** آدرسی که کاربر باید به آن هدایت شود */
  redirectUrl: string
  referenceId: string
}
