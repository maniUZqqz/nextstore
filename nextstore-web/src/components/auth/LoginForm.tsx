'use client'

/**
 * فرم ورود به حساب
 * ---------------------------------------------------------------------------
 * React Hook Form برای مدیریت فرم و Zod برای اعتبارسنجی.
 *
 * جریان خطا:
 *   ۱. اعتبارسنجی کلاینت (Zod) → بازخورد فوری بدون درخواست شبکه
 *   ۲. ارسال به سرور
 *   ۳. اگر سرور ۴۲۲ داد → خطاهای فیلد به فرم تزریق می‌شوند
 *   ۴. خطاهای دیگر → پیام Toast
 *
 * دکمه «پر کردن خودکار» برای دموی نمونه‌کار است تا بازدیدکننده
 * بدون تایپ کردن بتواند وارد شود.
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { LogIn, Loader2 } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/lib/api/client'
import { createLoginSchema, type LoginFormValues } from '@/lib/validations/auth.schema'
import { FormField } from './FormField'

/** حساب‌های نمایشی برای دمو — با README همخوان است. */
const DEMO_ACCOUNTS = [
  { role: 'admin', email: 'admin@demo.dev', password: 'password' },
  { role: 'customer', email: 'user@demo.dev', password: 'password' },
] as const

export function LoginForm() {
  const t = useTranslations('auth')
  const tv = useTranslations('auth.validation')
  const tf = useTranslations('auth.fields')

  const { login, isLoggingIn } = useAuth()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(createLoginSchema(tv)),
    defaultValues: { email: '', password: '', remember: false },
  })

  /**
   * ارسال فرم.
   * خطاهای اعتبارسنجی سرور به فیلدهای متناظر نگاشت می‌شوند تا
   * کاربر دقیقاً بفهمد کدام فیلد مشکل دارد.
   */
  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values)
    } catch (error) {
      if (error instanceof ApiError && error.isValidation && error.fieldErrors) {
        Object.entries(error.fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof LoginFormValues, { message: messages[0] })
        })
      }
      /* خطاهای غیراعتبارسنجی در useAuth با Toast نمایش داده می‌شوند */
    }
  }

  /** پر کردن فرم با اطلاعات یک حساب نمایشی. */
  const fillDemo = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    form.setValue('email', account.email)
    form.setValue('password', account.password)
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      /*
       * ⚠️ چرا method="post" روی فرمی که با جاوااسکریپت ارسال می‌شود؟
       *
       *    اگر به هر دلیلی ری‌اکت هنوز سوار نشده باشد — چانک دیر
       *    برسد، خطای هیدریشن رخ دهد، یا کاربر پیش از آماده شدن
       *    صفحه Enter بزند — مرورگر فرم را به شکل *بومی* ارسال
       *    می‌کند. پیش‌فرض فرم HTML متد GET است، یعنی:
       *
       *        /fa/login?email=admin%40demo.dev&password=hunter2
       *
       *    رمز عبور در نوار آدرس، در تاریخچه‌ی مرورگر، در لاگ سرور
       *    و در هدر Referer می‌نشیند. این دقیقاً همان چیزی است که
       *    در یکی از اجراهای تست دیده شد.
       *
       *    با method="post" همان ارسال بومی، بدنه‌ی POST می‌سازد و
       *    هیچ اعتباری به آدرس نشت نمی‌کند.
       */
      method="post"
      className="flex flex-col gap-4"
      noValidate
    >
      <FormField
        {...form.register('email')}
        label={tf('email')}
        type="email"
        placeholder={tf('emailPlaceholder')}
        autoComplete="email"
        /* در فارسی ایمیل باید چپ‌چین بماند چون متن لاتین است */
        dir="ltr"
        error={form.formState.errors.email?.message}
      />

      <FormField
        {...form.register('password')}
        label={tf('password')}
        type="password"
        placeholder={tf('passwordPlaceholder')}
        autoComplete="current-password"
        dir="ltr"
        error={form.formState.errors.password?.message}
      />

      {/* --- مرا به خاطر بسپار + فراموشی رمز --- */}
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            {...form.register('remember')}
            type="checkbox"
            className="size-4 rounded border-input accent-[var(--primary)]"
          />
          {t('login.remember')}
        </label>

        <Link
          href="/forgot-password"
          className="text-sm text-primary hover:underline"
        >
          {t('login.forgotPassword')}
        </Link>
      </div>

      {/* --- دکمه ارسال --- */}
      <button
        type="submit"
        disabled={isLoggingIn}
        className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-(--radius-md) bg-primary font-bold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
      >
        {isLoggingIn ? (
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        ) : (
          <LogIn className="size-5" aria-hidden="true" />
        )}
        {t('login.submit')}
      </button>

      {/* ==========================================================
          حساب‌های نمایشی — مخصوص دموی نمونه‌کار
          ========================================================== */}
      <div className="mt-2 rounded-(--radius-md) border border-dashed border-border bg-muted p-3">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">
          {t('demoAccounts')}
        </p>

        <div className="flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => fillDemo(account)}
              className="rounded-(--radius-sm) border border-border bg-background px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
            >
              <span dir="ltr">{account.email}</span>
            </button>
          ))}
        </div>
      </div>
    </form>
  )
}
