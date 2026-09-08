/**
 * پوسته‌ی مشترک صفحات محتوایی
 * ---------------------------------------------------------------------------
 * شش صفحه (قوانین، حریم خصوصی، ارسال، مرجوعی، فرصت‌های شغلی و بخش
 * متنی درباره‌ما) ساختار یکسانی دارند: بردکرامب، عنوان، توضیح کوتاه،
 * و مجموعه‌ای از بخش‌های متنی.
 *
 * ⚠️ چرا کامپوننت مشترک؟ نسخه‌ی اول هر صفحه را جدا نوشتم و شش فایل
 *    تقریباً یکسان درآمد. هر اصلاح تایپوگرافی یعنی شش‌بار ویرایش و
 *    یکی همیشه جا می‌ماند.
 *
 * Server Component است — هیچ تعامل کلاینتی ندارد، پس هیچ جاوااسکریپتی
 * برای آن به مرورگر نمی‌رود.
 */

import { getTranslations } from 'next-intl/server'
import { CalendarClock } from 'lucide-react'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import type { ContentPage } from '@/content/types'

export async function ContentPageShell({
  content,
  breadcrumbLabel,
}: {
  content: ContentPage
  /** برچسب آخرین گره بردکرامب؛ معمولاً همان عنوان صفحه */
  breadcrumbLabel?: string
}) {
  const tNav = await getTranslations('nav')

  return (
    <main
      id="main-content"
      className="mx-auto max-w-(--container-content) px-4 py-4 sm:px-6 lg:px-8"
    >
      <Breadcrumb
        items={[
          { label: tNav('home'), href: '/' },
          { label: breadcrumbLabel ?? content.title },
        ]}
      />

      {/*
        max-w روی متن، نه روی ظرف.
        خط متن بلندتر از حدود ۷۵ کاراکتر، خواندن را سخت می‌کند چون
        چشم موقع برگشتن به ابتدای خط بعد، خط را گم می‌کند.
      */}
      <article className="mt-4 max-w-3xl">
        <header>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {content.title}
          </h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground sm:text-base">
            {content.subtitle}
          </p>

          {/* تاریخ بازنگری — فقط صفحات حقوقی دارند */}
          {content.updatedAt && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              <CalendarClock className="size-3.5" aria-hidden="true" />
              {content.updatedAt}
            </p>
          )}
        </header>

        <div className="mt-8 flex flex-col gap-8">
          {content.sections.map((section, index) => (
            <section key={section.heading ?? index}>
              {section.heading && (
                <h2 className="text-lg font-bold text-foreground">
                  {section.heading}
                </h2>
              )}

              {section.paragraphs?.map((paragraph, paragraphIndex) => (
                <p
                  key={paragraphIndex}
                  className="mt-3 text-sm leading-8 text-muted-foreground"
                >
                  {paragraph}
                </p>
              ))}

              {section.bullets && (
                <ul className="mt-3 space-y-2">
                  {section.bullets.map((bullet, bulletIndex) => (
                    <li
                      key={bulletIndex}
                      className="flex gap-2.5 text-sm leading-7 text-muted-foreground"
                    >
                      {/*
                        نقطه‌ی فهرست به‌جای list-disc بومی.
                        در RTL، بولت پیش‌فرض مرورگر گاهی سمت اشتباه
                        می‌افتد؛ این روش در هر دو جهت یکسان است.
                      */}
                      <span
                        aria-hidden="true"
                        className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary/60"
                      />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </article>
    </main>
  )
}
