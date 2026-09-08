'use client'

/**
 * فرم عضویت در خبرنامه
 * ---------------------------------------------------------------------------
 * فعلاً فقط سمت کلاینت اعتبارسنجی و تأیید می‌کند. پس از پیاده‌سازی
 * اندپوینت `/newsletter` در بک‌اند، تابع ارسال به آن وصل می‌شود.
 *
 * نکته دسترسی‌پذیری: پیام موفقیت با aria-live اعلام می‌شود تا
 * کاربر صفحه‌خوان هم از ثبت شدن باخبر شود.
 */

import { useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function NewsletterForm({ className }: { className?: string }) {
  const t = useTranslations('footer.newsletter')

  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')

  /** ارسال فرم و نمایش بازخورد. */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')

    /* شبیه‌سازی درخواست شبکه تا وضعیت بارگذاری قابل مشاهده باشد */
    await new Promise((resolve) => setTimeout(resolve, 600))

    setStatus('success')
    setEmail('')

    /* بازگشت به حالت اولیه پس از چند ثانیه */
    setTimeout(() => setStatus('idle'), 4000)
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex flex-col gap-2', className)}>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('placeholder')}
          aria-label={t('placeholder')}
          disabled={status === 'loading'}
          className={cn(
            'h-11 flex-1 rounded-(--radius-md) border border-input bg-background px-3',
            'text-sm text-foreground placeholder:text-muted-foreground',
            'outline-none transition-colors focus:border-primary',
            'disabled:opacity-50',
          )}
        />

        <button
          type="submit"
          disabled={status === 'loading'}
          className={cn(
            'inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-(--radius-md)',
            'bg-primary px-5 text-sm font-medium text-primary-foreground',
            'transition-opacity hover:opacity-90 active:scale-[0.98]',
            'disabled:opacity-50',
          )}
        >
          {status === 'loading' && (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          {t('submit')}
        </button>
      </div>

      {/* پیام موفقیت — با aria-live برای صفحه‌خوان */}
      {status === 'success' && (
        <p
          className="flex items-center gap-1.5 text-xs font-medium text-success"
          role="status"
          aria-live="polite"
        >
          <Check className="size-4" aria-hidden="true" />
          {t('success')}
        </p>
      )}
    </form>
  )
}
