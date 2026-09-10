'use client'

/**
 * فرم عضویت در خبرنامه
 * ---------------------------------------------------------------------------
 * ⚠️ این فرم پیش‌تر **ساختگی** بود.
 *
 *    نسخه‌ی اول یک `setTimeout` می‌گذاشت، «با موفقیت عضو شدید» نشان
 *    می‌داد و ایمیل را دور می‌ریخت. از بیرون هیچ فرقی با فرم واقعی
 *    نداشت — همان اشتباهی که یک بار در فرم تماس هم رخ داده بود. حالا
 *    به `POST /newsletter` وصل است.
 *
 * ⚠️ پیام موفقیت از **سرور** می‌آید، نه از فایل ترجمه.
 *
 *    بک‌اند برای «تازه ثبت شد» و «از قبل عضو بود» عمداً یک پاسخ
 *    می‌دهد تا نشود با امتحان‌کردن ایمیل‌ها فهمید چه کسانی مشترک‌اند.
 *    اگر فرانت متن خودش را نشان می‌داد، همان تصمیم امنیتی بی‌اثر
 *    می‌شد چون باید بین دو حالت فرق می‌گذاشت.
 *
 * نکته دسترسی‌پذیری: پیام موفقیت و خطا هر دو با aria-live اعلام
 * می‌شوند تا کاربر صفحه‌خوان هم از نتیجه باخبر شود.
 */

import { useState, type FormEvent } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useMutation } from '@tanstack/react-query'
import { Check, Loader2, AlertCircle } from 'lucide-react'
import { subscribeToNewsletter } from '@/lib/api/newsletter'
import { ApiError } from '@/lib/api/client'
import { cn } from '@/lib/utils/cn'

export function NewsletterForm({ className }: { className?: string }) {
  const t = useTranslations('footer.newsletter')
  const locale = useLocale()

  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const mutation = useMutation({
    mutationFn: (value: string) => subscribeToNewsletter(value, locale),

    onSuccess: (response) => {
      setMessage({ kind: 'success', text: response.message })
      setEmail('')
    },

    onError: (error) => {
      if (error instanceof ApiError) {
        /*
         * ⚠️ ۴۲۹ پیام مخصوص خودش دارد — همان قاعده‌ی فرم تماس.
         *
         *    این دو مسیر سقف نرخ مشترک دارند، پس کاربری که تازه فرم
         *    تماس را فرستاده ممکن است اینجا ۴۲۹ بگیرد. پیام عمومی
         *    «خطایی رخ داد» او را دنبال ایراد ایمیلش می‌فرستد.
         */
        if (error.status === 429) {
          setMessage({ kind: 'error', text: t('tooMany') })
          return
        }

        /* خطای اعتبارسنجی متن دقیق سرور را دارد؛ همان بهتر است */
        if (error.isValidation) {
          setMessage({ kind: 'error', text: error.message })
          return
        }
      }

      setMessage({ kind: 'error', text: t('failed') })
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const value = email.trim()
    if (value === '' || mutation.isPending) return

    setMessage(null)
    mutation.mutate(value)
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex flex-col gap-2', className)} noValidate>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('placeholder')}
          aria-label={t('placeholder')}
          aria-invalid={message?.kind === 'error' ? 'true' : undefined}
          disabled={mutation.isPending}
          className={cn(
            'h-11 flex-1 rounded-(--radius-md) border border-input bg-background px-3',
            'text-sm text-foreground placeholder:text-muted-foreground',
            'outline-none transition-colors focus:border-primary',
            'disabled:opacity-50',
            message?.kind === 'error' && 'border-destructive',
          )}
        />

        <button
          type="submit"
          disabled={mutation.isPending}
          className={cn(
            'inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-(--radius-md)',
            'bg-primary px-5 text-sm font-medium text-primary-foreground',
            'transition-opacity hover:opacity-90 active:scale-[0.98]',
            'disabled:opacity-50',
          )}
        >
          {mutation.isPending && (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          {t('submit')}
        </button>
      </div>

      {/* نتیجه — موفقیت یا خطا، هر دو برای صفحه‌خوان اعلام می‌شوند */}
      {message !== null && (
        <p
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium',
            message.kind === 'success' ? 'text-success' : 'text-destructive',
          )}
          role="status"
          aria-live="polite"
        >
          {message.kind === 'success' ? (
            <Check className="size-4 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          )}
          {message.text}
        </p>
      )}
    </form>
  )
}
