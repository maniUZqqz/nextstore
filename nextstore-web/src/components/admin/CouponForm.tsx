'use client'

/**
 * فرم ساخت و ویرایش کد تخفیف
 * ---------------------------------------------------------------------------
 * ⚠️ مبالغ در این فرم به **تومان** وارد می‌شوند ولی بک‌اند **ریال**
 *    می‌خواهد. تبدیل فقط در دو نقطه انجام می‌شود: خواندن مقدار اولیه و
 *    ارسال فرم.
 *
 *    دلیل نمایش تومان: مدیر با تومان فکر می‌کند و «۵۰۰۰۰۰۰ ریال» تایپ
 *    کردن، احتمال یک صفر کم یا زیاد را بالا می‌برد — خطایی که مستقیم به
 *    مبلغ تخفیف مشتری تبدیل می‌شود.
 *
 * ⚠️ فیلد «سقف تخفیف» فقط برای نوع درصدی نشان داده می‌شود. بک‌اند هم
 *    همین را رد می‌کند؛ پنهان کردنش یعنی مدیر اصلاً به خطا نمی‌خورد.
 */

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Save, Loader2 } from 'lucide-react'
import * as couponsApi from '@/lib/api/admin-coupons'
import { ApiError } from '@/lib/api/client'
import { cn } from '@/lib/utils/cn'
import type { AdminCoupon, CouponInput, CouponTypeOption, CouponTypeValue } from '@/types/admin'

/** ریال به تومان — برای پرکردن فرم از مقدار ذخیره‌شده. */
const toToman = (rials: number | null): string =>
  rials === null || rials === 0 ? '' : String(Math.round(rials / 10))

/** تومان به ریال — برای ارسال به سرور. */
const toRials = (toman: string): number | null => {
  const value = Number(toman)
  return toman.trim() === '' || Number.isNaN(value) ? null : Math.round(value * 10)
}

/** تاریخ ISO به قالب input[type=date]. */
const toDateInput = (iso: string | null): string => (iso ? iso.slice(0, 10) : '')

/**
 * یک فیلد فرم با برچسب، راهنمای اختیاری و خطای سرور.
 *
 * ⚠️ **بیرون** از CouponForm تعریف شده و نه داخلش.
 *
 *    نسخه‌ی اول داخل بدنه‌ی کامپوننت بود. React هر رندر آن را یک
 *    *نوع کامپوننت جدید* می‌دید، کل زیردرخت را unmount و دوباره
 *    mount می‌کرد، و ورودی‌های داخلش حالتشان را از دست می‌دادند —
 *    یعنی فوکوس با هر کلید تایپ‌شده می‌پرید.
 */
function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export function CouponForm({
  coupon,
  types,
  onDone,
  onCancel,
}: {
  /** `null` یعنی ساخت تازه */
  coupon: AdminCoupon | null
  types: CouponTypeOption[]
  onDone: () => void
  onCancel: () => void
}) {
  const t = useTranslations('admin.coupons')
  const tStates = useTranslations('states')
  const tCommon = useTranslations('common')

  const isEdit = coupon !== null

  const [code, setCode] = useState(coupon?.code ?? '')
  const [description, setDescription] = useState(coupon?.description ?? '')
  const [type, setType] = useState<CouponTypeValue>(coupon?.type ?? 'percent')

  /*
   * مقدار: برای درصدی یک عدد ساده، برای مبلغ ثابت به تومان.
   * هر دو در یک state نگه داشته می‌شوند چون فقط یکی همزمان معنا دارد.
   */
  const [value, setValue] = useState(
    coupon ? (coupon.type === 'percent' ? String(coupon.value) : toToman(coupon.value)) : '',
  )

  const [maxDiscount, setMaxDiscount] = useState(toToman(coupon?.maxDiscount ?? null))
  const [minOrderTotal, setMinOrderTotal] = useState(toToman(coupon?.minOrderTotal ?? null))
  const [usageLimit, setUsageLimit] = useState(
    coupon?.usageLimit === null || coupon === null ? '' : String(coupon.usageLimit),
  )
  const [perUserLimit, setPerUserLimit] = useState(String(coupon?.perUserLimit ?? 1))
  const [startsAt, setStartsAt] = useState(toDateInput(coupon?.startsAt ?? null))
  const [expiresAt, setExpiresAt] = useState(toDateInput(coupon?.expiresAt ?? null))
  const [isActive, setIsActive] = useState(coupon?.isActive ?? true)

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const buildInput = (): CouponInput => ({
    code: code.trim(),
    description: description.trim() || null,
    type,
    /* درصد خام می‌رود، مبلغ ثابت به ریال تبدیل می‌شود */
    value: type === 'percent' ? Number(value) : (toRials(value) ?? 0),
    max_discount: type === 'percent' ? toRials(maxDiscount) : null,
    min_order_total: toRials(minOrderTotal) ?? 0,
    usage_limit: usageLimit.trim() === '' ? null : Number(usageLimit),
    per_user_limit: Number(perUserLimit) || 1,
    starts_at: startsAt || null,
    expires_at: expiresAt || null,
    is_active: isActive,
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      isEdit
        ? couponsApi.updateCoupon(coupon.id, buildInput())
        : couponsApi.createCoupon(buildInput()),
    onSuccess: () => {
      toast.success(t(isEdit ? 'updated' : 'created'))
      onDone()
    },
    onError: (error) => {
      if (error instanceof ApiError && error.isValidation && error.fieldErrors) {
        setFieldErrors(error.fieldErrors)
        return
      }
      toast.error(tStates('errorTitle'))
    },
  })

  const errorFor = (field: string) => fieldErrors[field]?.[0]

  const inputClass = (field: string) =>
    cn(
      'h-10 w-full rounded-(--radius-md) border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring',
      errorFor(field) ? 'border-destructive' : 'border-border',
    )

  const canSubmit = code.trim() !== '' && value.trim() !== '' && !saveMutation.isPending

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        /* خطاهای قبلی پاک می‌شوند تا خطای کهنه کنار فیلد اصلاح‌شده نماند */
        setFieldErrors({})
        if (canSubmit) saveMutation.mutate()
      }}
      className="rounded-(--radius-lg) border border-border bg-card p-4 sm:p-5"
    >
      <h2 className="mb-4 font-medium text-foreground">
        {isEdit ? t('editTitle', { code: coupon.code }) : t('newTitle')}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* --- کد --- */}
        <Field id="coupon-code" label={t('fieldCode')} hint={t('fieldCodeHint')} error={errorFor('code')}>
          <input
            id="coupon-code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={40}
            dir="ltr"
            className={cn(inputClass('code'), 'font-mono uppercase')}
          />
        </Field>

        {/* --- نوع --- */}
        <Field id="coupon-type" label={t('fieldType')} error={errorFor('type')}>
          <select
            id="coupon-type"
            value={type}
            onChange={(e) => setType(e.target.value as CouponTypeValue)}
            className={inputClass('type')}
          >
            {types.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        {/* --- مقدار --- */}
        <Field
          id="coupon-value"
          label={type === 'percent' ? t('fieldPercent') : t('fieldAmount')}
          error={errorFor('value')}
        >
          <input
            id="coupon-value"
            type="number"
            inputMode="numeric"
            min={1}
            max={type === 'percent' ? 100 : undefined}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            dir="ltr"
            className={inputClass('value')}
          />
        </Field>

        {/*
          سقف تخفیف — فقط برای نوع درصدی.

          ⚠️ روی «مبلغ ثابت» بی‌معناست و بک‌اند هم ردش می‌کند؛ پنهان
             کردنش یعنی مدیر اصلاً به آن خطا نمی‌خورد.
        */}
        {type === 'percent' && (
          <Field
            id="coupon-max"
            label={t('fieldMaxDiscount')}
            hint={t('fieldOptionalToman')}
            error={errorFor('max_discount')}
          >
            <input
              id="coupon-max"
              type="number"
              inputMode="numeric"
              min={0}
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
              dir="ltr"
              className={inputClass('max_discount')}
            />
          </Field>
        )}

        {/* --- حداقل سبد --- */}
        <Field
          id="coupon-min"
          label={t('fieldMinTotal')}
          hint={t('fieldOptionalToman')}
          error={errorFor('min_order_total')}
        >
          <input
            id="coupon-min"
            type="number"
            inputMode="numeric"
            min={0}
            value={minOrderTotal}
            onChange={(e) => setMinOrderTotal(e.target.value)}
            dir="ltr"
            className={inputClass('min_order_total')}
          />
        </Field>

        {/* --- سقف کل --- */}
        <Field
          id="coupon-limit"
          label={t('fieldUsageLimit')}
          hint={t('fieldUnlimitedHint')}
          error={errorFor('usage_limit')}
        >
          <input
            id="coupon-limit"
            type="number"
            inputMode="numeric"
            min={1}
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
            dir="ltr"
            className={inputClass('usage_limit')}
          />
        </Field>

        {/* --- سقف هر کاربر --- */}
        <Field
          id="coupon-per-user"
          label={t('fieldPerUser')}
          error={errorFor('per_user_limit')}
        >
          <input
            id="coupon-per-user"
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            value={perUserLimit}
            onChange={(e) => setPerUserLimit(e.target.value)}
            dir="ltr"
            className={inputClass('per_user_limit')}
          />
        </Field>

        {/* --- بازه --- */}
        <Field id="coupon-start" label={t('fieldStartsAt')} error={errorFor('starts_at')}>
          <input
            id="coupon-start"
            type="date"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            dir="ltr"
            className={inputClass('starts_at')}
          />
        </Field>

        <Field id="coupon-end" label={t('fieldExpiresAt')} error={errorFor('expires_at')}>
          <input
            id="coupon-end"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            dir="ltr"
            className={inputClass('expires_at')}
          />
        </Field>

        {/* --- توضیح --- */}
        <div className="sm:col-span-2 lg:col-span-3">
          <Field
            id="coupon-desc"
            label={t('fieldDescription')}
            hint={t('fieldDescriptionHint')}
            error={errorFor('description')}
          >
            <input
              id="coupon-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={255}
              className={inputClass('description')}
            />
          </Field>
        </div>
      </div>

      {/* --- فعال بودن --- */}
      <label className="mt-4 flex w-fit cursor-pointer items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="size-4 rounded border-input accent-primary"
        />
        {t('fieldActive')}
      </label>

      {/* --- عملیات --- */}
      <div className="mt-5 flex items-center gap-2 border-t border-border pt-4">
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex h-10 items-center gap-2 rounded-(--radius-md) bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saveMutation.isPending
            ? <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            : <Save className="size-4" aria-hidden="true" />}
          {tCommon('save')}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-(--radius-md) border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          {tCommon('cancel')}
        </button>
      </div>
    </form>
  )
}
