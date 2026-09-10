/**
 * صفحه اصلی فروشگاه
 * ===========================================================================
 * چیدمان بر اساس الگوی فروشگاه‌های بزرگ (نه سایت شرکتی):
 *
 *   ۱. اسلایدر بنر تبلیغاتی        ← جای «هیرو با شعار سازمانی»
 *   ۲. ردیف دایره‌ای دسته‌بندی‌ها
 *   ۳. نوار خدمات (ارسال، مرجوعی، پشتیبانی، ضمانت)
 *   ۴. پیشنهاد شگفت‌انگیز + تایمر شمارش معکوس
 *   ۵. بنرهای تبلیغاتی میان‌صفحه
 *   ۶. پرفروش‌ترین‌ها
 *   ۷. محصولات منتخب
 *   ۸. تازه‌رسیده‌ها
 *   ۹. برندهای محبوب
 *
 * Server Component است و همه داده را در **یک درخواست** می‌گیرد.
 * اگر API در دسترس نباشد، بخش‌های ثابت رندر می‌شوند و فقط بخش‌های
 * داده‌محور جای خود را به یک پیام راهنما می‌دهند (تخریب تدریجی).
 */

import { setRequestLocale, getTranslations } from 'next-intl/server'
import {
  Truck, RotateCcw, Headphones, ShieldCheck, AlertCircle,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getHomeData } from '@/lib/api/catalog'
import { getBanners } from '@/lib/api/banners'
import { getSiteSettings, freeShippingValues } from '@/lib/api/settings'
import type { HomeData } from '@/types/product'
import { HeroSlider } from '@/components/home/HeroSlider'
import { CategoryCircles } from '@/components/home/CategoryCircles'
import { ProductRow } from '@/components/home/ProductRow'
import { PromoBanners } from '@/components/home/PromoBanners'
import { Countdown } from '@/components/home/Countdown'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('home')
  const tCommon = await getTranslations('common')

  /* دریافت داده با مدیریت خطا */
  let home: HomeData | null = null
  try {
    home = (await getHomeData(locale)).data
  } catch {
    home = null
  }

  /*
   * بنرهای تبلیغاتی — از پنل مدیریت.
   *
   * ⚠️ اینجا گرفته می‌شوند و به‌صورت prop پایین می‌روند، نه در خود
   *    کامپوننت‌ها.
   *
   *    `HeroSlider` کلاینت-کامپوننت است و `PromoBanners` سرور؛ اگر هر
   *    کدام خودش می‌گرفت، دو درخواست جدا برای یک اندپوینت می‌شد و
   *    اسلایدر تا رسیدن داده روی صفحه می‌پرید.
   *
   * ⚠️ `getBanners` هرگز throw نمی‌کند و در بدترین حالت فهرست تهی
   *    می‌دهد، پس try/catch جداگانه لازم ندارد.
   */
  const banners = await getBanners(locale)

  /*
   * آستانه‌ی ارسال رایگان برای کارت خدمات.
   *
   * ⚠️ همان عددی که نوار بالای هدر تبلیغ می‌کند و همان عددی که سبد
   *    خرید با آن حساب می‌کند — از `config/shop.php` بک‌اند. پیش‌تر
   *    اینجا هم دستی در فایل ترجمه نوشته شده بود.
   */
  const settings = await getSiteSettings(locale)
  const freeShipping = freeShippingValues(settings, locale as Locale)

  /** نوار خدمات فروشگاه. */
  const features = [
    { key: 'shipping', Icon: Truck },
    { key: 'returns', Icon: RotateCcw },
    { key: 'support', Icon: Headphones },
    { key: 'warranty', Icon: ShieldCheck },
  ] as const

  /*
   * زمان پایان فروش ویژه = زودترین پایان تخفیف در میان محصولات تخفیف‌دار.
   *
   * ⚠️ نسخه‌ی قبلی این مقدار را می‌ساخت:
   *        new Date(Date.now() + 24 * 3600 * 1000)
   *
   *    یعنی تایمر همیشه «۲۴ ساعت مانده» نشان می‌داد و با هر بار
   *    رفرش صفحه از نو شروع می‌شد. این یک «فوریت جعلی» است: به
   *    کاربر فشار خرید وارد می‌کند بدون آنکه مهلتی واقعی وجود
   *    داشته باشد. حالا ProductResource فیلد saleEndsAt را
   *    می‌فرستد و تایمر مهلت *واقعی* را می‌شمارد.
   *
   *    اگر هیچ‌کدام از محصولات تخفیف‌دار مهلت مشخصی نداشته باشند،
   *    مقدار undefined می‌ماند و تایمر اصلاً نمایش داده نمی‌شود —
   *    بهتر از نشان دادن عددی که معنایی ندارد.
   */
  const flashSaleEndsAt = (home?.onSale ?? [])
    .map((product) => product.saleEndsAt)
    .filter((value): value is string => Boolean(value))
    .sort()[0]

  return (
    <main id="main-content" className="mx-auto max-w-(--container-content) px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 sm:gap-8">

        {/* ==========================================================
            ۱. اسلایدر بنر تبلیغاتی
            ========================================================== */}
        <HeroSlider slides={banners.hero} />

        {/* ==========================================================
            ۲. ردیف دایره‌ای دسته‌بندی‌ها
            ========================================================== */}
        {home && home.categories.length > 0 && (
          <CategoryCircles categories={home.categories} locale={locale as Locale} />
        )}

        {/* ==========================================================
            ۳. نوار خدمات
            موبایل ۲ ستون · دسکتاپ ۴ ستون
            ========================================================== */}
        {/*
          ⚠️ اصلاح‌شده پس از بازبینی چشمی:
             نسخه‌ی قبلی در موبایل دو ستونه بود و متن‌ها با truncate
             بریده می‌شدند: «ارسال را…»، «۷ روز مه…»، «ضمانت ا…» —
             که هیچ اطلاعاتی منتقل نمی‌کرد و شبیه خرابی به نظر می‌رسید.

             حالا در موبایل تک‌ستونه است (فضای کافی برای متن کامل) و
             truncate برداشته شده تا متن در صورت نیاز به خط بعد برود.
        */}
        <ul className="grid grid-cols-1 gap-3 rounded-(--radius-lg) border border-border bg-card p-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {features.map(({ key, Icon }) => (
            <li key={key} className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {t(`features.${key}.title`)}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  {/*
                    ⚠️ فقط کارت «ارسال» پارامتر می‌گیرد؛ بقیه متن ثابت
                       دارند. پاس‌دادن پارامتر اضافه به next-intl بی‌ضرر
                       است، ولی این شرط صریح می‌گوید کدام متن پویاست.
                  */}
                  {key === 'shipping'
                    ? t('features.shipping.desc', freeShipping)
                    : t(`features.${key}.desc`)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {/* ==========================================================
            حالت خطا — وقتی API در دسترس نیست
            ========================================================== */}
        {!home && (
          <div className="flex items-start gap-3 rounded-(--radius-lg) border border-border bg-muted p-5">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {locale === 'fa' ? 'اتصال به سرور برقرار نشد' : 'Could not reach the server'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {locale === 'fa'
                  ? 'بک‌اند لاراول را روی پورت ۸۰۰۱ اجرا کنید: php artisan serve --port=8001'
                  : 'Start the Laravel backend on port 8001: php artisan serve --port=8001'}
              </p>
            </div>
          </div>
        )}

        {/* ==========================================================
            ۴. پیشنهاد شگفت‌انگیز — با تایمر شمارش معکوس
            ========================================================== */}
        {home && (
          <ProductRow
            title={t('sections.flashSale')}
            products={home.onSale}
            locale={locale as Locale}
            viewAllHref="/products?on_sale=1"
            viewAllLabel={tCommon('viewAll')}
            headerExtra={
              flashSaleEndsAt ? <Countdown endsAt={flashSaleEndsAt} /> : undefined
            }
            accent
            priority
          />
        )}

        {/* ==========================================================
            ۵. بنرهای تبلیغاتی میان‌صفحه
            ========================================================== */}
        <PromoBanners banners={banners.promo} />

        {/* ==========================================================
            ۶. پرفروش‌ترین‌ها
            ========================================================== */}
        {home && (
          <ProductRow
            title={t('sections.bestSellers')}
            subtitle={t('sections.bestSellersDesc')}
            products={home.bestSellers}
            locale={locale as Locale}
            viewAllHref="/products?sort=popular"
            viewAllLabel={tCommon('viewAll')}
          />
        )}

        {/* ==========================================================
            ۷. محصولات منتخب
            ========================================================== */}
        {home && (
          <ProductRow
            title={t('sections.featured')}
            subtitle={t('sections.featuredDesc')}
            products={home.featured}
            locale={locale as Locale}
            viewAllHref="/products"
            viewAllLabel={tCommon('viewAll')}
          />
        )}

        {/* ==========================================================
            ۸. تازه‌رسیده‌ها
            ========================================================== */}
        {home && (
          <ProductRow
            title={t('sections.newArrivals')}
            subtitle={t('sections.newArrivalsDesc')}
            products={home.newArrivals}
            locale={locale as Locale}
            viewAllHref="/products?sort=newest"
            viewAllLabel={tCommon('viewAll')}
          />
        )}

        {/* ==========================================================
            ۹. برندهای محبوب
            ========================================================== */}
        {home && home.brands.length > 0 && (
          <section className="rounded-(--radius-lg) border border-border bg-card p-4 sm:p-5">
            <h2 className="mb-4 text-base font-bold text-foreground sm:text-lg">
              {t('sections.brands')}
            </h2>

            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {home.brands.map((brand) => (
                <li key={brand.id}>
                  <Link
                    href={`/products?brand=${brand.slug}`}
                    className="flex h-16 items-center justify-center rounded-(--radius-md) border border-border bg-background px-3 text-center text-sm font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    {brand.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  )
}
