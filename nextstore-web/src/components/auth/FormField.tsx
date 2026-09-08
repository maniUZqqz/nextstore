'use client'

/**
 * فیلد ورودی فرم با برچسب و پیام خطا
 * ---------------------------------------------------------------------------
 * کامپوننت مشترک همه فرم‌ها. کار تکراری زیر را یکجا انجام می‌دهد:
 *   - اتصال برچسب به ورودی با id
 *   - نمایش خطا زیر فیلد
 *   - اعلام خطا به صفحه‌خوان با aria-invalid و aria-describedby
 *   - دکمه نمایش/پنهان‌سازی برای فیلد رمز عبور
 *
 * بدون این کامپوننت، این ۲۰ خط در هر فیلد تکرار می‌شد.
 */

import { useState, forwardRef, type InputHTMLAttributes } from 'react'
import { useTranslations } from 'next-intl'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  /** پیام خطای اعتبارسنجی — اگر باشد، فیلد قرمز می‌شود */
  error?: string
  /** متن راهنمای زیر فیلد (وقتی خطایی نیست) */
  hint?: string
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  function FormField({ label, error, hint, type = 'text', id, className, ...props }, ref) {
    const t = useTranslations('auth.fields')

    /** برای فیلد رمز: آیا متن آشکار است؟ */
    const [isRevealed, setIsRevealed] = useState(false)

    const isPassword = type === 'password'
    /* نوع واقعی ورودی — رمز با کلیک روی چشم به text تبدیل می‌شود */
    const inputType = isPassword && isRevealed ? 'text' : type

    /* شناسه‌های پایدار برای اتصال برچسب و پیام خطا */
    const fieldId = id ?? props.name ?? label
    const errorId = `${fieldId}-error`
    const hintId = `${fieldId}-hint`

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
          {label}
        </label>

        <div className="relative">
          <input
            ref={ref}
            id={fieldId}
            type={inputType}
            /* به صفحه‌خوان می‌گوید این فیلد خطا دارد */
            aria-invalid={Boolean(error)}
            /* پیام خطا یا راهنما را به فیلد متصل می‌کند */
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            className={cn(
              'h-11 w-full rounded-(--radius-md) border bg-background px-3',
              'text-sm text-foreground placeholder:text-muted-foreground',
              'outline-none transition-colors',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error
                ? 'border-destructive focus:border-destructive'
                : 'border-input focus:border-primary',
              /* فضای دکمه چشم در فیلد رمز */
              isPassword && 'pe-11',
              className,
            )}
            {...props}
          />

          {/* دکمه نمایش/پنهان رمز */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setIsRevealed((v) => !v)}
              aria-label={isRevealed ? t('hidePassword') : t('showPassword')}
              /* از ترتیب Tab خارج است تا مسیر پر کردن فرم را نشکند */
              tabIndex={-1}
              className="absolute end-1 top-1 inline-flex size-9 items-center justify-center rounded-(--radius-md) text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {isRevealed ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          )}
        </div>

        {/* پیام خطا — با role="alert" فوراً به صفحه‌خوان اعلام می‌شود */}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="flex items-start gap-1.5 text-xs text-destructive"
          >
            <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        {/* متن راهنما — فقط وقتی خطایی نیست */}
        {!error && hint && (
          <p id={hintId} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    )
  },
)
