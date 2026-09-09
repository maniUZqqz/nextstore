'use client'

/**
 * فرم تماس با ما
 * ---------------------------------------------------------------------------
 * پیام را واقعاً به `POST /contact` می‌فرستد و در صندوق پنل مدیریت
 * می‌نشیند.
 *
 * ⚠️ تا پیش از این، فرم هیچ کاری نمی‌کرد و خودش هم همین را در یک کادر
 *    اعلام می‌کرد. آن صداقت از تظاهر بهتر بود، ولی نتیجه‌اش صفحه‌ای
 *    بود که کاربر را به همان راه‌های کناری می‌فرستاد — یعنی فرم فقط
 *    فضا می‌گرفت.
 *
 * ⚠️ `method="post"` روی فرم: اگر ری‌اکت هنوز سوار نشده باشد، مرورگر
 *    فرم را بومی ارسال می‌کند و متد پیش‌فرض GET، متن پیام کاربر را
 *    داخل نوار آدرس و تاریخچه می‌نشاند. همان اشتباهی که در فرم ورود
 *    هم رفع شد.
 */

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import { Send, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { sendContactMessage } from '@/lib/api/contact'
import { ApiError } from '@/lib/api/client'
import type { ContactMessageInput } from '@/types/contact'

/**
 * پیام خطای زیر یک فیلد.
 *
 * ⚠️ بیرون از کامپوننت اصلی تعریف شده، نه داخلش.
 *
 *    کامپوننتی که در بدنه‌ی رندر والد ساخته شود، در هر رندر یک نوع
 *    تازه است و ری‌اکت زیردرختش را unmount و دوباره mount می‌کند —
 *    همان چیزی که در فرم کوپن باعث می‌شد فوکوس با هر کلید بپرد.
 */
function FieldError({ field, message }: { field: string; message?: string }) {
  if (!message) return null

  return (
    <p
      id={`contact-${field}-error`}
      className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive"
    >
      <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  )
}

export function ContactForm() {
  const t = useTranslations('contact')
  const locale = useLocale()

  const [sent, setSent] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const mutation = useMutation({
    mutationFn: (input: ContactMessageInput) => sendContactMessage(input, locale),

    onSuccess: (response) => {
      setFieldErrors({})
      setSent(true)
      toast.success(response.message)
    },

    onError: (error) => {
      setSent(false)

      if (error instanceof ApiError) {
        if (error.isValidation && error.fieldErrors) {
          setFieldErrors(error.fieldErrors)
          toast.error(error.message)
          return
        }

        /*
         * ⚠️ ۴۲۹ پیام مخصوص خودش دارد.
         *
         *    بک‌اند سقف ۳ پیام در دقیقه گذاشته. اگر این حالت با خطای
         *    عمومی یکی شود، کاربری که دو بار پشت هم فرستاده فکر
         *    می‌کند متنش ایراد دارد و همان را بارها بازنویسی می‌کند —
         *    در حالی که فقط باید یک دقیقه صبر کند.
         */
        if (error.status === 429) {
          toast.error(t('tooMany'))
          return
        }
      }

      toast.error(t('failed'))
    },
  })

  const errorFor = (field: string) => fieldErrors[field]?.[0]

  const inputClass =
    'h-11 w-full rounded-(--radius-md) border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary'

  /** حاشیه‌ی قرمز روی فیلدی که خطا دارد. */
  const withError = (field: string, base: string) =>
    errorFor(field) ? `${base} border-destructive` : base

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()

        const data = new FormData(event.currentTarget)
        mutation.mutate({
          name: String(data.get('name') ?? '').trim(),
          email: String(data.get('email') ?? '').trim(),
          subject: String(data.get('subject') ?? '').trim(),
          message: String(data.get('message') ?? '').trim(),
        })
      }}
      method="post"
      className="flex flex-col gap-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-1.5 block text-xs text-muted-foreground">
            {t('fields.name')}
            <span className="ms-0.5 text-destructive" aria-hidden="true">*</span>
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            aria-invalid={Boolean(errorFor('name'))}
            aria-describedby={errorFor('name') ? 'contact-name-error' : undefined}
            className={withError('name', inputClass)}
          />
          <FieldError field="name" message={errorFor('name')} />
        </div>

        <div>
          <label htmlFor="contact-email" className="mb-1.5 block text-xs text-muted-foreground">
            {t('fields.email')}
            <span className="ms-0.5 text-destructive" aria-hidden="true">*</span>
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            dir="ltr"
            aria-invalid={Boolean(errorFor('email'))}
            aria-describedby={errorFor('email') ? 'contact-email-error' : undefined}
            className={withError('email', `${inputClass} text-start`)}
          />
          <FieldError field="email" message={errorFor('email')} />
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className="mb-1.5 block text-xs text-muted-foreground">
          {t('fields.subject')}
          {/*
            ⚠️ ستاره و `required` اضافه شدند چون بک‌اند موضوع را اجباری
               می‌داند. پیش‌تر هیچ‌کدام را نداشت — یعنی کاربر آن را خالی
               می‌گذاشت و خطایی می‌گرفت که هیچ نشانه‌ای از آن ندیده بود.
          */}
          <span className="ms-0.5 text-destructive" aria-hidden="true">*</span>
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          required
          aria-invalid={Boolean(errorFor('subject'))}
          aria-describedby={errorFor('subject') ? 'contact-subject-error' : undefined}
          className={withError('subject', inputClass)}
        />
        <FieldError field="subject" message={errorFor('subject')} />
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1.5 block text-xs text-muted-foreground">
          {t('fields.message')}
          <span className="ms-0.5 text-destructive" aria-hidden="true">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={6}
          required
          placeholder={t('fields.messagePlaceholder')}
          aria-invalid={Boolean(errorFor('message'))}
          aria-describedby={errorFor('message') ? 'contact-message-error' : undefined}
          className={withError(
            'message',
            'w-full resize-y rounded-(--radius-md) border border-border bg-background px-3 py-2.5 text-sm leading-7 text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary',
          )}
        />
        <FieldError field="message" message={errorFor('message')} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex h-11 items-center gap-2 rounded-(--radius-md) bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="size-4" aria-hidden="true" />
          )}
          {t('submit')}
        </button>

        {/* aria-live تا نتیجه برای کاربر صفحه‌خوان هم اعلام شود */}
        <p aria-live="polite" className="min-h-5 text-xs">
          {sent && (
            <span className="inline-flex items-center gap-1.5 text-success">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              {t('sentNotice')}
            </span>
          )}
        </p>
      </div>
    </form>
  )
}
