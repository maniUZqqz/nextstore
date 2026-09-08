'use client'

/**
 * فرم ثبت و ویرایش آدرس
 * ---------------------------------------------------------------------------
 * هم در صفحه‌ی تسویه (به‌صورت مودال) و هم در پنل کاربری استفاده می‌شود.
 *
 * اعتبارسنجی با Zod، هماهنگ با قواعد StoreAddressRequest در بک‌اند:
 *   - موبایل ایران: با ۰۹ شروع، ۱۱ رقم
 *   - کد پستی: دقیقاً ۱۰ رقم
 *   - نشانی: حداقل ۱۰ کاراکتر تا کاربر «تهران» تنها ننویسد
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { Loader2, Save } from 'lucide-react'
import { FormField } from '@/components/auth/FormField'
import { ApiError } from '@/lib/api/client'
import type { Address, AddressInput } from '@/types/order'
import { cn } from '@/lib/utils/cn'

/** الگوی شماره موبایل ایران. */
const IRAN_MOBILE = /^09\d{9}$/

/** الگوی کد پستی ایران — دقیقاً ۱۰ رقم. */
const POSTAL_CODE = /^\d{10}$/

/**
 * ساخت اسکیمای اعتبارسنجی با پیام‌های محلی‌سازی‌شده.
 * تابع است نه ثابت، چون پیام‌ها به زبان کاربر بستگی دارند.
 */
function createSchema(t: (key: string) => string) {
  return z.object({
    label: z.string().max(50).optional().or(z.literal('')),

    recipient_name: z.string().min(3, t('nameMin')).max(100),
    recipient_phone: z.string().regex(IRAN_MOBILE, t('phoneInvalid')),

    province: z.string().min(2, t('provinceRequired')).max(50),
    city: z.string().min(2, t('cityRequired')).max(50),
    street: z.string().min(10, t('streetMin')).max(500),

    postal_code: z
      .string()
      .regex(POSTAL_CODE, t('postalInvalid'))
      .optional()
      .or(z.literal('')),

    building_no: z.string().max(20).optional().or(z.literal('')),
    unit: z.string().max(20).optional().or(z.literal('')),
  })
}

type FormValues = z.infer<ReturnType<typeof createSchema>>

interface AddressFormProps {
  /** آدرس موجود برای ویرایش؛ نبودنش یعنی ثبت آدرس جدید */
  address?: Address | null
  onSubmit: (input: AddressInput) => Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
}

export function AddressForm({
  address,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: AddressFormProps) {
  const tf = useTranslations('address.fields')
  const tv = useTranslations('auth.validation')
  const tCommon = useTranslations('common')

  const form = useForm<FormValues>({
    resolver: zodResolver(createSchema(tv)),
    defaultValues: {
      label: address?.label ?? '',
      recipient_name: address?.recipientName ?? '',
      recipient_phone: address?.recipientPhone ?? '',
      province: address?.province ?? '',
      city: address?.city ?? '',
      street: address?.street ?? '',
      postal_code: address?.postalCode ?? '',
      building_no: address?.buildingNo ?? '',
      unit: address?.unit ?? '',
    },
  })

  /** ارسال فرم با نگاشت خطاهای سرور به فیلدها. */
  const handleSubmit = async (values: FormValues) => {
    try {
      /* رشته‌های خالی به undefined تبدیل می‌شوند تا بک‌اند null ذخیره کند */
      await onSubmit({
        ...values,
        label: values.label || undefined,
        postal_code: values.postal_code || undefined,
        building_no: values.building_no || undefined,
        unit: values.unit || undefined,
      })
    } catch (error) {
      if (error instanceof ApiError && error.isValidation && error.fieldErrors) {
        Object.entries(error.fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof FormValues, { message: messages[0] })
        })
      }
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      /* اطلاعات شخصی گیرنده نباید در آدرس و تاریخچه بنشیند */
      method="post"
      className="flex flex-col gap-4"
      noValidate
    >
      <FormField
        {...form.register('label')}
        label={tf('label')}
        placeholder={tf('labelPlaceholder')}
        error={form.formState.errors.label?.message}
      />

      {/* نام و تلفن گیرنده — در دسکتاپ کنار هم */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          {...form.register('recipient_name')}
          label={tf('recipientName')}
          autoComplete="name"
          error={form.formState.errors.recipient_name?.message}
        />

        <FormField
          {...form.register('recipient_phone')}
          label={tf('recipientPhone')}
          type="tel"
          placeholder="09123456789"
          autoComplete="tel"
          /* شماره لاتین است، پس چپ‌چین می‌ماند */
          dir="ltr"
          error={form.formState.errors.recipient_phone?.message}
        />
      </div>

      {/* استان و شهر */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          {...form.register('province')}
          label={tf('province')}
          autoComplete="address-level1"
          error={form.formState.errors.province?.message}
        />

        <FormField
          {...form.register('city')}
          label={tf('city')}
          autoComplete="address-level2"
          error={form.formState.errors.city?.message}
        />
      </div>

      <FormField
        {...form.register('street')}
        label={tf('street')}
        placeholder={tf('streetPlaceholder')}
        autoComplete="street-address"
        error={form.formState.errors.street?.message}
      />

      {/* پلاک، واحد و کد پستی */}
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          {...form.register('building_no')}
          label={tf('buildingNo')}
          error={form.formState.errors.building_no?.message}
        />

        <FormField
          {...form.register('unit')}
          label={tf('unit')}
          error={form.formState.errors.unit?.message}
        />

        <FormField
          {...form.register('postal_code')}
          label={tf('postalCode')}
          dir="ltr"
          autoComplete="postal-code"
          error={form.formState.errors.postal_code?.message}
        />
      </div>

      {/* --- دکمه‌های اقدام --- */}
      <div className="mt-2 flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-(--radius-md)',
            'bg-primary font-medium text-primary-foreground',
            'transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-50',
          )}
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="size-4" aria-hidden="true" />
          )}
          {tCommon('save')}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-(--radius-md) border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {tCommon('cancel')}
          </button>
        )}
      </div>
    </form>
  )
}
