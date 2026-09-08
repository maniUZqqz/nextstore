'use client'

/**
 * فرم ثبت‌نام
 * ---------------------------------------------------------------------------
 * ساختار مشابه فرم ورود، با فیلدهای بیشتر و اعتبارسنجی سخت‌گیرانه‌تر.
 *
 * قواعد رمز عبور با بک‌اند هماهنگ است (حداقل ۸ کاراکتر، حرف و عدد)،
 * وگرنه کاربر پیام‌های متناقض می‌بیند: کلاینت تأیید کند و سرور رد کند.
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { UserPlus, Loader2 } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/lib/api/client'
import {
  createRegisterSchema, type RegisterFormValues,
} from '@/lib/validations/auth.schema'
import { FormField } from './FormField'

export function RegisterForm() {
  const t = useTranslations('auth')
  const tv = useTranslations('auth.validation')
  const tf = useTranslations('auth.fields')

  const { register: registerUser, isRegistering } = useAuth()

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(createRegisterSchema(tv)),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      password_confirmation: '',
      accept_terms: false,
    },
  })

  /** ارسال فرم با نگاشت خطاهای سرور به فیلدها. */
  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await registerUser({
        ...values,
        /* رشته خالی را به undefined تبدیل می‌کنیم تا بک‌اند null ذخیره کند */
        phone: values.phone || undefined,
      })
    } catch (error) {
      if (error instanceof ApiError && error.isValidation && error.fieldErrors) {
        Object.entries(error.fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof RegisterFormValues, { message: messages[0] })
        })
      }
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      /* رمز عبور نباید در آدرس بنشیند — توضیح کامل در LoginForm */
      method="post"
      className="flex flex-col gap-4"
      noValidate
    >
      <FormField
        {...form.register('name')}
        label={tf('name')}
        placeholder={tf('namePlaceholder')}
        autoComplete="name"
        error={form.formState.errors.name?.message}
      />

      <FormField
        {...form.register('email')}
        label={tf('email')}
        type="email"
        placeholder={tf('emailPlaceholder')}
        autoComplete="email"
        dir="ltr"
        error={form.formState.errors.email?.message}
      />

      <FormField
        {...form.register('phone')}
        label={tf('phoneOptional')}
        type="tel"
        placeholder="09123456789"
        autoComplete="tel"
        dir="ltr"
        error={form.formState.errors.phone?.message}
      />

      <FormField
        {...form.register('password')}
        label={tf('password')}
        type="password"
        placeholder={tf('passwordPlaceholder')}
        autoComplete="new-password"
        dir="ltr"
        error={form.formState.errors.password?.message}
        hint={tv('passwordMin')}
      />

      <FormField
        {...form.register('password_confirmation')}
        label={tf('passwordConfirmation')}
        type="password"
        autoComplete="new-password"
        dir="ltr"
        error={form.formState.errors.password_confirmation?.message}
      />

      {/* --- پذیرش قوانین --- */}
      <div className="flex flex-col gap-1.5">
        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-muted-foreground">
          <input
            {...form.register('accept_terms')}
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 rounded border-input accent-[var(--primary)]"
            aria-invalid={Boolean(form.formState.errors.accept_terms)}
          />

          <span className="leading-6">
            {t.rich('register.acceptTerms', {
              /*
               * t.rich اجازه می‌دهد داخل رشته ترجمه، تگ سفارشی بگذاریم.
               * مزیت: مترجم می‌تواند جای لینک را در جمله جابه‌جا کند،
               * بدون اینکه کد تغییر کند.
               */
              terms: (chunks) => (
                <Link href="/terms" className="text-primary hover:underline">
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link href="/privacy" className="text-primary hover:underline">
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>

        {form.formState.errors.accept_terms && (
          <p role="alert" className="text-xs text-destructive">
            {form.formState.errors.accept_terms.message}
          </p>
        )}
      </div>

      {/* --- دکمه ارسال --- */}
      <button
        type="submit"
        disabled={isRegistering}
        className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-(--radius-md) bg-primary font-bold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
      >
        {isRegistering ? (
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        ) : (
          <UserPlus className="size-5" aria-hidden="true" />
        )}
        {t('register.submit')}
      </button>
    </form>
  )
}
