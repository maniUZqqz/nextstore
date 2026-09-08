'use client'

/**
 * جریان تسویه حساب — سه مرحله در یک صفحه
 * ===========================================================================
 *   ۱. آدرس تحویل   → انتخاب یا ثبت آدرس
 *   ۲. روش ارسال    → عادی یا سریع
 *   ۳. پرداخت       → انتخاب درگاه و ثبت سفارش
 *
 * ⚠️ چرا یک صفحه با مراحل، نه سه صفحه‌ی جدا؟
 *    هر جابه‌جایی بین صفحه‌ها یک فرصت برای رها کردن سبد است. با
 *    نگه داشتن همه‌چیز در یک صفحه، کاربر همیشه خلاصه‌ی سفارش را
 *    می‌بیند و پیشرفتش را حس می‌کند — نرخ تکمیل خرید بالاتر می‌رود.
 *
 * ⚠️ نکته امنیتی: مبلغ نهایی از پاسخ سرور خوانده می‌شود، نه از
 *    محاسبه‌ی سمت کلاینت. عدد نمایش‌داده‌شده و عدد پرداختی همیشه یکی است.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import {
  MapPin, Truck, CreditCard, Check, Plus, Loader2,
  ShoppingBag, ChevronLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { useAuth } from '@/hooks/useAuth'
import * as ordersApi from '@/lib/api/orders'
import { getCart } from '@/lib/api/cart'
import { ApiError } from '@/lib/api/client'
import type { AddressInput } from '@/types/order'
/* فرم آدرس مشترک است: هم در تسویه و هم در پنل کاربری استفاده می‌شود */
import { AddressForm } from '@/components/address/AddressForm'
import { formatPrice, currencyLabel } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

type Step = 1 | 2 | 3
type ShippingMethod = 'standard' | 'express'

export function CheckoutFlow() {
  const t = useTranslations('checkout')
  const tAddr = useTranslations('address')
  const tCart = useTranslations('cart')
  const tCommon = useTranslations('common')
  const locale = useLocale() as Locale

  const queryClient = useQueryClient()
  const { isLoading: isAuthLoading } = useAuth()

  /* --- وضعیت جریان --- */
  const [step, setStep] = useState<Step>(1)
  /*
   * فقط آدرسی که کاربر *صریحاً* انتخاب کرده.
   * تهی یعنی «هنوز چیزی انتخاب نکرده» — که پایین‌تر به آدرس
   * پیش‌فرض ترجمه می‌شود. این دو را جدا نگه می‌داریم تا انتخاب
   * خودکار هرگز روی انتخاب دستی کاربر ننشیند.
   */
  const [chosenAddressId, setChosenAddressId] = useState<number | null>(null)
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('standard')
  const [note, setNote] = useState('')
  const [gateway, setGateway] = useState('mock')
  const [showAddressForm, setShowAddressForm] = useState(false)

  /* =====================================================================
   * داده‌های موردنیاز
   * =================================================================== */

  const cartQuery = useQuery({ queryKey: ['cart'], queryFn: getCart })

  const addressesQuery = useQuery({
    queryKey: ['addresses'],
    queryFn: ordersApi.getAddresses,
  })

  const gatewaysQuery = useQuery({
    queryKey: ['payment-gateways', locale],
    queryFn: () => ordersApi.getPaymentGateways(locale),
    staleTime: 60 * 60 * 1000,
  })

  const addresses = addressesQuery.data ?? []

  /*
   * انتخاب خودکار آدرس پیش‌فرض — یک کلیک کمتر برای کاربر.
   *
   * ⚠️ این یک *مقدار مشتق* است، نه state همگام‌شده با افکت.
   *
   *    نسخه‌ی قبلی با useEffect آدرس پیش‌فرض را داخل state می‌نوشت.
   *    سه اشکال داشت:
   *      ۱. رندر آبشاری: یک‌بار بدون انتخاب رندر می‌شد، افکت اجرا
   *         می‌شد، دوباره رندر می‌شد. کاربر یک فریم فرم بدون آدرسِ
   *         انتخاب‌شده می‌دید.
   *      ۲. اگر کاربر تنها آدرسش را حذف می‌کرد، state روی شناسه‌ی
   *         مرده می‌ماند و شرط `if (selectedAddressId) return` مانع
   *         اصلاحش می‌شد — دکمه‌ی «ادامه» فعال بود ولی ثبت سفارش
   *         با آدرس ناموجود شکست می‌خورد.
   *      ۳. `setState` داخل افکت، قانون react-hooks را می‌شکست.
   *
   *    حالا انتخاب کاربر و پیش‌فرض دو چیز جدا هستند و مقدار مؤثر
   *    در هر رندر از روی داده‌ی تازه حساب می‌شود.
   */
  const defaultAddressId =
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? null

  /*
   * انتخاب کاربر فقط تا وقتی معتبر است که آن آدرس هنوز وجود داشته
   * باشد؛ وگرنه به پیش‌فرض برمی‌گردیم.
   */
  const selectedAddressId =
    (chosenAddressId !== null && addresses.some((a) => a.id === chosenAddressId)
      ? chosenAddressId
      : null) ?? defaultAddressId

  /* =====================================================================
   * عملیات
   * =================================================================== */

  const createAddressMutation = useMutation({
    mutationFn: (input: AddressInput) => ordersApi.createAddress(input),
    onSuccess: (address) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      setChosenAddressId(address.id)
      setShowAddressForm(false)
      toast.success(tAddr('saved'))
    },
  })

  /**
   * ثبت سفارش و رفتن به درگاه.
   *
   * دو مرحله پشت سر هم:
   *   ۱. POST /orders   → سفارش ساخته و سبد خالی می‌شود
   *   ۲. POST /orders/{n}/pay → آدرس درگاه گرفته می‌شود
   *
   * اگر گام دوم شکست بخورد، سفارش «در انتظار پرداخت» می‌ماند و
   * کاربر می‌تواند از پنل کاربری دوباره پرداخت کند — سفارش گم نمی‌شود.
   */
  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      const order = await ordersApi.placeOrder({
        address_id: selectedAddressId!,
        shipping_method: shippingMethod,
        note: note.trim() || undefined,
      })

      const callback = `${window.location.origin}/${locale}/checkout/gateway`

      const payment = await ordersApi.initiatePayment(
        order.orderNumber,
        gateway,
        callback,
      )

      return { order, redirectUrl: payment.redirectUrl }
    },

    onSuccess: ({ redirectUrl }) => {
      /* سبد خالی شده — کش را باطل می‌کنیم تا شمارنده هدر به‌روز شود */
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })

      /* هدایت به درگاه پرداخت */
      window.location.href = redirectUrl
    },

    onError: (error) => {
      if (error instanceof ApiError) {
        const firstFieldError = error.fieldErrors
          ? Object.values(error.fieldErrors)[0]?.[0]
          : null
        toast.error(firstFieldError ?? error.message)
      } else {
        toast.error(tCart('errors.generic'))
      }
    },
  })

  /* =====================================================================
   * حالت‌های داده
   * =================================================================== */

  const isLoading = isAuthLoading || cartQuery.isLoading || addressesQuery.isLoading

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-(--radius-lg) border border-border bg-muted" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-(--radius-lg) border border-border bg-muted" />
      </div>
    )
  }

  const cart = cartQuery.data

  /* سبد خالی — تسویه بی‌معنی است */
  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-(--radius-lg) border border-border bg-card py-20 text-center">
        <ShoppingBag className="size-14 text-muted-foreground" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-bold text-foreground">{t('emptyCart')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t('emptyCartDesc')}</p>
        <Link
          href="/products"
          className="mt-6 inline-flex h-11 items-center rounded-(--radius-md) bg-primary px-6 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          {tCart('startShopping')}
        </Link>
      </div>
    )
  }

  /** هزینه ارسال بر اساس روش انتخابی — هماهنگ با OrderService بک‌اند. */
  const shippingCost =
    shippingMethod === 'express'
      ? 1_200_000
      : cart.summary.subtotal >= cart.summary.freeShippingThreshold
        ? 0
        : 500_000

  const total = cart.summary.subtotal + shippingCost

  /** مراحل جریان — برای نوار پیشرفت. */
  const steps = [
    { id: 1 as Step, label: t('steps.address'), Icon: MapPin },
    { id: 2 as Step, label: t('steps.shipping'), Icon: Truck },
    { id: 3 as Step, label: t('steps.payment'), Icon: CreditCard },
  ]

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
      {/* ==========================================================
          ستون مراحل
          ========================================================== */}
      <div className="flex flex-col gap-5">
        {/* --- نوار پیشرفت --- */}
        <ol className="flex items-center gap-2 rounded-(--radius-lg) border border-border bg-card p-4">
          {steps.map((item, index) => {
            const isDone = step > item.id
            const isCurrent = step === item.id

            return (
              <li key={item.id} className="flex flex-1 items-center gap-2">
                <button
                  type="button"
                  /* برگشت به مرحله‌ی قبل آزاد است، پرش به جلو نه */
                  onClick={() => isDone && setStep(item.id)}
                  disabled={!isDone}
                  className={cn(
                    'flex items-center gap-2 rounded-(--radius-md) px-2 py-1',
                    isDone && 'cursor-pointer hover:bg-accent',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors',
                      isDone
                        ? 'bg-success text-success-foreground'
                        : isCurrent
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {isDone ? (
                      <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                    ) : (
                      <item.Icon className="size-4" aria-hidden="true" />
                    )}
                  </span>

                  <span
                    className={cn(
                      'hidden text-sm sm:block',
                      isCurrent ? 'font-bold text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {item.label}
                  </span>
                </button>

                {/* خط اتصال بین مراحل */}
                {index < steps.length - 1 && (
                  <span
                    className={cn(
                      'h-px flex-1 transition-colors',
                      isDone ? 'bg-success' : 'bg-border',
                    )}
                    aria-hidden="true"
                  />
                )}
              </li>
            )
          })}
        </ol>

        {/* ==========================================================
            مرحله ۱ — آدرس تحویل
            ========================================================== */}
        {step === 1 && (
          <section className="rounded-(--radius-lg) border border-border bg-card p-4 sm:p-5">
            <h2 className="mb-4 text-base font-bold text-foreground">
              {t('selectAddress')}
            </h2>

            {addresses.length === 0 && !showAddressForm ? (
              <div className="flex flex-col items-center py-10 text-center">
                <MapPin className="size-10 text-muted-foreground" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium text-foreground">{t('noAddress')}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t('noAddressDesc')}</p>
                <button
                  type="button"
                  onClick={() => setShowAddressForm(true)}
                  className="mt-5 inline-flex h-10 items-center gap-2 rounded-(--radius-md) bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  {t('addAddress')}
                </button>
              </div>
            ) : showAddressForm ? (
              <AddressForm
                onSubmit={async (input) => {
                  await createAddressMutation.mutateAsync(input)
                }}
                onCancel={addresses.length > 0 ? () => setShowAddressForm(false) : undefined}
                isSubmitting={createAddressMutation.isPending}
              />
            ) : (
              <>
                {/* فهرست آدرس‌ها به‌صورت رادیو */}
                <ul className="space-y-2.5">
                  {addresses.map((address) => (
                    <li key={address.id}>
                      <label
                        className={cn(
                          'flex cursor-pointer gap-3 rounded-(--radius-md) border p-3.5 transition-colors',
                          selectedAddressId === address.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-accent',
                        )}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddressId === address.id}
                          onChange={() => setChosenAddressId(address.id)}
                          className="sr-only"
                        />

                        {/* دایره‌ی رادیو سفارشی */}
                        <span
                          className={cn(
                            'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                            selectedAddressId === address.id
                              ? 'border-primary'
                              : 'border-input',
                          )}
                          aria-hidden="true"
                        >
                          {selectedAddressId === address.id && (
                            <span className="size-2 rounded-full bg-primary" />
                          )}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {address.recipientName}
                            </span>

                            {address.label && (
                              <span className="rounded-(--radius-sm) bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                                {address.label}
                              </span>
                            )}

                            {address.isDefault && (
                              <span className="rounded-(--radius-sm) bg-success/10 px-1.5 py-0.5 text-[11px] font-medium text-success">
                                {tAddr('isDefault')}
                              </span>
                            )}
                          </span>

                          <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                            {address.fullAddress}
                          </span>

                          <span className="mt-0.5 block text-xs text-muted-foreground" dir="ltr">
                            {address.recipientPhone}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => setShowAddressForm(true)}
                  className="mt-3 inline-flex h-10 items-center gap-2 rounded-(--radius-md) border border-dashed border-border px-4 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  {t('addAddress')}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!selectedAddressId}
                  className="mt-5 flex h-12 w-full items-center justify-center rounded-(--radius-md) bg-primary font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {tCommon('next')}
                </button>
              </>
            )}
          </section>
        )}

        {/* ==========================================================
            مرحله ۲ — روش ارسال
            ========================================================== */}
        {step === 2 && (
          <section className="rounded-(--radius-lg) border border-border bg-card p-4 sm:p-5">
            <h2 className="mb-4 text-base font-bold text-foreground">
              {t('steps.shipping')}
            </h2>

            <ul className="space-y-2.5">
              {(['standard', 'express'] as const).map((method) => {
                const cost =
                  method === 'express'
                    ? 1_200_000
                    : cart.summary.subtotal >= cart.summary.freeShippingThreshold
                      ? 0
                      : 500_000

                return (
                  <li key={method}>
                    <label
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-(--radius-md) border p-3.5 transition-colors',
                        shippingMethod === method
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-accent',
                      )}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        checked={shippingMethod === method}
                        onChange={() => setShippingMethod(method)}
                        className="sr-only"
                      />

                      <span
                        className={cn(
                          'flex size-4 shrink-0 items-center justify-center rounded-full border-2',
                          shippingMethod === method ? 'border-primary' : 'border-input',
                        )}
                        aria-hidden="true"
                      >
                        {shippingMethod === method && (
                          <span className="size-2 rounded-full bg-primary" />
                        )}
                      </span>

                      <Truck className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />

                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-foreground">
                          {t(`shippingMethods.${method}`)}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {t(`shippingMethods.${method}Desc`)}
                        </span>
                      </span>

                      <span
                        className={cn(
                          'shrink-0 text-sm font-bold',
                          cost === 0 ? 'text-success' : 'text-foreground',
                        )}
                        data-price
                      >
                        {cost === 0 ? tCommon('free') : formatPrice(cost, locale)}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>

            {/* یادداشت مشتری */}
            <div className="mt-5">
              <label htmlFor="order-note" className="mb-1.5 block text-sm font-medium text-foreground">
                {t('note')}
              </label>
              <textarea
                id="order-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={t('notePlaceholder')}
                className="w-full rounded-(--radius-md) border border-input bg-background p-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-12 rounded-(--radius-md) border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                {t('back')}
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="h-12 flex-1 rounded-(--radius-md) bg-primary font-bold text-primary-foreground transition-opacity hover:opacity-90"
              >
                {t('continueToPayment')}
              </button>
            </div>
          </section>
        )}

        {/* ==========================================================
            مرحله ۳ — پرداخت
            ========================================================== */}
        {step === 3 && (
          <section className="rounded-(--radius-lg) border border-border bg-card p-4 sm:p-5">
            <h2 className="mb-4 text-base font-bold text-foreground">
              {t('selectGateway')}
            </h2>

            <ul className="space-y-2.5">
              {(gatewaysQuery.data ?? []).map((item) => (
                <li key={item.id}>
                  <label
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-(--radius-md) border p-3.5 transition-colors',
                      gateway === item.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent',
                    )}
                  >
                    <input
                      type="radio"
                      name="gateway"
                      checked={gateway === item.id}
                      onChange={() => setGateway(item.id)}
                      className="sr-only"
                    />

                    <span
                      className={cn(
                        'flex size-4 shrink-0 items-center justify-center rounded-full border-2',
                        gateway === item.id ? 'border-primary' : 'border-input',
                      )}
                      aria-hidden="true"
                    >
                      {gateway === item.id && <span className="size-2 rounded-full bg-primary" />}
                    </span>

                    <CreditCard className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm font-medium text-foreground">{item.name}</span>
                  </label>
                </li>
              ))}
            </ul>

            {/* خلاصه‌ی آدرس انتخابی — تأیید نهایی پیش از پرداخت */}
            {selectedAddress && (
              <div className="mt-5 rounded-(--radius-md) bg-muted p-3.5">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {t('steps.address')}
                </p>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                  {selectedAddress.recipientName} — {selectedAddress.fullAddress}
                </p>
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="h-12 rounded-(--radius-md) border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                {t('back')}
              </button>

              <button
                type="button"
                onClick={() => placeOrderMutation.mutate()}
                disabled={placeOrderMutation.isPending || !selectedAddressId}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-(--radius-md) bg-primary font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {placeOrderMutation.isPending ? (
                  <>
                    <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                    {t('processing')}
                  </>
                ) : (
                  <>
                    <CreditCard className="size-5" aria-hidden="true" />
                    {t('placeOrder')}
                  </>
                )}
              </button>
            </div>
          </section>
        )}
      </div>

      {/* ==========================================================
          ستون خلاصه سفارش — در دسکتاپ چسبان
          ========================================================== */}
      <aside className="rounded-(--radius-lg) border border-border bg-card p-4 lg:sticky lg:top-24">
        <h2 className="mb-4 text-base font-bold text-foreground">{t('orderSummary')}</h2>

        {/* اقلام */}
        <ul className="mb-4 max-h-64 space-y-2.5 overflow-y-auto">
          {cart.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 flex-1">
                <span className="line-clamp-1 text-foreground">{item.product.name}</span>
                <span className="text-xs text-muted-foreground">×{item.quantity}</span>
              </span>
              <span className="shrink-0 font-medium text-foreground" data-price>
                {formatPrice(item.lineTotal, locale)}
              </span>
            </li>
          ))}
        </ul>

        <hr className="border-border" />

        {/* ریز مبالغ */}
        <dl className="mt-4 space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">{tCart('subtotal')}</dt>
            <dd className="font-medium text-foreground" data-price>
              {formatPrice(cart.summary.subtotal, locale)}
            </dd>
          </div>

          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">{tCart('shipping')}</dt>
            <dd
              className={cn('font-medium', shippingCost === 0 ? 'text-success' : 'text-foreground')}
              data-price
            >
              {shippingCost === 0 ? tCommon('free') : formatPrice(shippingCost, locale)}
            </dd>
          </div>

          <hr className="border-border" />

          <div className="flex items-baseline justify-between">
            <dt className="font-bold text-foreground">{tCart('total')}</dt>
            <dd className="flex items-baseline gap-1">
              <span className="text-lg font-black text-foreground" data-price>
                {formatPrice(total, locale)}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {currencyLabel(locale)}
              </span>
            </dd>
          </div>
        </dl>

        <Link
          href="/cart"
          className="mt-4 flex items-center justify-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="rtl-flip size-3.5" aria-hidden="true" />
          {tCart('title')}
        </Link>
      </aside>
    </div>
  )
}
