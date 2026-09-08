'use client'

/**
 * دکمه‌ی اشتراک‌گذاری مقاله
 * ---------------------------------------------------------------------------
 * تنها بخش تعاملی صفحه‌ی مقاله — بقیه‌ی صفحه Server Component است.
 *
 * دو مسیر دارد:
 *   ۱. Web Share API — روی موبایل، شیت بومی سیستم را باز می‌کند
 *   ۲. کپی در کلیپ‌بورد — روی دسکتاپ که Web Share معمولاً نیست
 *
 * ⚠️ هر دو ممکن است شکست بخورند: کاربر شیت را ببندد (AbortError)، یا
 *    مرورگر بدون HTTPS دسترسی کلیپ‌بورد ندهد. هیچ‌کدام نباید خطای
 *    قرمز در کنسول بگذارد یا به کاربر پیام ترسناک نشان دهد.
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Share2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

export function ShareButton({ title, className }: { title: string; className?: string }) {
  const t = useTranslations('blog')
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = window.location.href

    /* مسیر ۱: شیت بومی (عمدتاً موبایل) */
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        /*
         * بستن شیت توسط کاربر هم یک استثنا می‌اندازد و از یک خطای
         * واقعی قابل تفکیک نیست. در هر دو حالت به کپی برمی‌گردیم که
         * بی‌ضرر است.
         */
      }
    }

    /* مسیر ۲: کپی در کلیپ‌بورد */
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success(t('shareCopied'))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* بدون HTTPS یا با اجازه‌ی ردشده — کاری از دست ما برنمی‌آید */
      toast.error(t('share'))
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={t('share')}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-(--radius-md) border border-border px-3',
        'text-sm font-medium text-muted-foreground transition-colors',
        'hover:bg-accent hover:text-foreground active:scale-95',
        className,
      )}
    >
      {copied
        ? <Check className="size-4 text-success" aria-hidden="true" />
        : <Share2 className="size-4" aria-hidden="true" />}
      {t('share')}
    </button>
  )
}
