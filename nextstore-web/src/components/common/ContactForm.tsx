'use client'

/**
 * فرم تماس با ما
 * ---------------------------------------------------------------------------
 * ⚠️ صداقت درباره‌ی کاری که انجام می‌دهد:
 *
 *    این پروژه هنوز اندپوینتی برای دریافت پیام ندارد. فرمی که
 *    وانمود کند پیام را فرستاده و در واقع هیچ کاری نکند، بدترین
 *    حالت ممکن است: کاربر منتظر پاسخی می‌ماند که هرگز نمی‌آید.
 *
 *    پس فرم صریحاً می‌گوید که پیام ثبت *نمی‌شود* و راه‌های واقعی
 *    تماس را کنارش می‌گذارد. وقتی اندپوینت ساخته شد، فقط تابع
 *    ارسال عوض می‌شود.
 *
 * ⚠️ method="post" روی فرم: اگر ری‌اکت هنوز سوار نشده باشد، مرورگر
 *    فرم را بومی ارسال می‌کند و متد پیش‌فرض GET، متن پیام کاربر را
 *    داخل نوار آدرس و تاریخچه می‌نشاند. همان اشتباهی که در فرم ورود
 *    هم رفع شد.
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Send, Info, CheckCircle2 } from 'lucide-react'

export function ContactForm() {
  const t = useTranslations('contact')

  const [submitted, setSubmitted] = useState(false)

  const inputClass =
    'h-11 w-full rounded-(--radius-md) border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary'

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
      }}
      method="post"
      className="flex flex-col gap-4"
    >
      {/*
        اعلام صریح اینکه فرم هنوز به جایی وصل نیست.
        این کادر پیش از فیلدهاست، نه بعد از دکمه — کاربر باید پیش
        از صرف وقت برای نوشتن پیام، این را بداند.
      */}
      <p className="flex items-start gap-2.5 rounded-(--radius-md) border border-info/30 bg-info/10 px-3.5 py-3 text-xs leading-6 text-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
        {t('demoNotice')}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-1.5 block text-xs text-muted-foreground">
            {t('fields.name')}
            <span className="ms-0.5 text-destructive" aria-hidden="true">*</span>
          </label>
          <input id="contact-name" name="name" type="text" required className={inputClass} />
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
            dir="ltr"
            className={`${inputClass} text-start`}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className="mb-1.5 block text-xs text-muted-foreground">
          {t('fields.subject')}
        </label>
        <input id="contact-subject" name="subject" type="text" className={inputClass} />
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
          className="w-full resize-y rounded-(--radius-md) border border-border bg-background px-3 py-2.5 text-sm leading-7 text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="inline-flex h-11 items-center gap-2 rounded-(--radius-md) bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Send className="size-4" aria-hidden="true" />
          {t('submit')}
        </button>

        {/* aria-live تا نتیجه برای کاربر صفحه‌خوان هم اعلام شود */}
        <p aria-live="polite" className="min-h-5 text-xs">
          {submitted && (
            <span className="inline-flex items-center gap-1.5 text-success">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              {t('submittedNotice')}
            </span>
          )}
        </p>
      </div>
    </form>
  )
}
