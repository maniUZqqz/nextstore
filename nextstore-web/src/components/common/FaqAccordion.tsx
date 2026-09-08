'use client'

/**
 * آکاردئون پرسش‌های متداول با جستجو
 * ---------------------------------------------------------------------------
 * ⚠️ چرا <details>/<summary> بومی و نه آکاردئون دست‌ساز؟
 *
 *    عنصر بومی مرورگر از قبل درست کار می‌کند: با کیبورد باز و بسته
 *    می‌شود، صفحه‌خوان وضعیت باز/بسته را اعلام می‌کند، و Ctrl+F
 *    مرورگر می‌تواند متن بسته را هم پیدا کند و بازش کند.
 *
 *    آکاردئون دست‌ساز با <div> و onClick همه‌ی این‌ها را از دست
 *    می‌دهد مگر اینکه aria-expanded، مدیریت فوکوس و کلید Enter/Space
 *    را دستی بنویسی — یعنی بازنویسی چیزی که مرورگر رایگان می‌دهد.
 *
 * ⚠️ جستجو روی *پرسش و پاسخ* هر دو کار می‌کند. جستجوی فقط روی
 *    عنوان، کاربری را که کلمه‌ی کلیدی‌اش داخل متن پاسخ است دست خالی
 *    برمی‌گرداند.
 */

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Search, ChevronDown, SearchX } from 'lucide-react'
import type { FaqCategory } from '@/content/faq'
import { cn } from '@/lib/utils/cn'

export function FaqAccordion({ categories }: { categories: FaqCategory[] }) {
  const t = useTranslations('faq')
  const tCommon = useTranslations('common')

  const [query, setQuery] = useState('')

  /**
   * فیلتر دسته‌ها بر اساس عبارت جستجو.
   *
   * useMemo چون با هر کلیدفشاری کل فهرست دوباره فیلتر می‌شود و
   * تعداد آیتم‌ها ثابت نیست.
   */
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()

    if (!term) return categories

    return categories
      .map((category) => ({
        ...category,
        items: category.items.filter(
          (item) =>
            item.question.toLowerCase().includes(term) ||
            item.answer.toLowerCase().includes(term),
        ),
      }))
      /* دسته‌ای که هیچ پاسخی ندارد نباید عنوان تنها نشان دهد */
      .filter((category) => category.items.length > 0)
  }, [categories, query])

  const totalMatches = filtered.reduce((sum, category) => sum + category.items.length, 0)
  const isSearching = query.trim().length > 0

  return (
    <div className="mt-6">
      {/* ================= جستجو ================= */}
      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('searchPlaceholder')}
          aria-label={tCommon('search')}
          className="h-11 w-full rounded-(--radius-md) border border-border bg-background ps-9 pe-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary"
        />
      </div>

      {/*
        شمارش نتیجه فقط هنگام جستجو.
        aria-live تا کاربر صفحه‌خوان بفهمد فهرست عوض شد — بدون آن،
        تایپ کردن هیچ بازخورد شنیداری ندارد.
      */}
      <p aria-live="polite" className="mt-2 min-h-5 text-xs text-muted-foreground">
        {isSearching && t('matches', { count: totalMatches })}
      </p>

      {/* ================= حالت بدون نتیجه ================= */}
      {filtered.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-(--radius-lg) border border-border bg-card px-6 py-14 text-center">
          <SearchX className="size-10 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-foreground">{t('noMatch')}</p>
          <p className="mt-1.5 max-w-sm text-xs leading-6 text-muted-foreground">
            {t('noMatchDesc')}
          </p>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="mt-5 h-10 rounded-(--radius-md) border border-border px-5 text-sm text-foreground transition-colors hover:bg-accent"
          >
            {t('clearSearch')}
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-6">
          {filtered.map((category) => (
            <section key={category.key}>
              <h2 className="text-sm font-bold text-foreground">{category.title}</h2>

              <ul className="mt-2 divide-y divide-border overflow-hidden rounded-(--radius-lg) border border-border bg-card">
                {category.items.map((item) => (
                  <li key={item.question}>
                    <details
                      /*
                        هنگام جستجو همه باز می‌شوند تا کاربر بی‌درنگ
                        پاسخ را ببیند؛ کلیک اضافه روی هر نتیجه، کل
                        فایده‌ی جستجو را از بین می‌برد.

                        key وابسته به عبارت جستجوست تا ری‌اکت عنصر را
                        بازسازی کند؛ وگرنه مرورگر حالت باز/بسته‌ی
                        قبلی را نگه می‌دارد.
                      */
                      key={isSearching ? 'open' : 'closed'}
                      open={isSearching}
                      className="group"
                    >
                      <summary
                        className={cn(
                          'flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5',
                          'text-sm font-medium text-foreground transition-colors hover:bg-accent/50',
                          /* حذف مثلث پیش‌فرض وبکیت */
                          '[&::-webkit-details-marker]:hidden',
                        )}
                      >
                        <span>{item.question}</span>
                        <ChevronDown
                          className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                          aria-hidden="true"
                        />
                      </summary>

                      <p className="px-4 pb-4 text-sm leading-8 text-muted-foreground">
                        {item.answer}
                      </p>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
