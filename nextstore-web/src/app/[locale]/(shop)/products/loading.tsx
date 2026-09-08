/**
 * اسکلتون بارگذاری فهرست محصولات
 * ---------------------------------------------------------------------------
 * Next.js این فایل را خودکار هنگام بارگذاری صفحه نمایش می‌دهد.
 *
 * چرا اسکلتون و نه اسپینر وسط صفحه؟
 *   اسکلتونی که هم‌شکل محتوای واقعی است، پرش چیدمان (CLS) را حذف
 *   می‌کند و به کاربر حس سرعت بیشتری می‌دهد — چون از قبل می‌فهمد
 *   چه چیزی قرار است بیاید.
 */

export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-(--container-content) px-4 py-4 sm:px-6 lg:px-8">
      {/* اسکلتون مسیر راهنما */}
      <div className="mb-4 h-4 w-40 animate-pulse rounded bg-muted" />

      <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
        {/* اسکلتون پنل فیلتر */}
        <div className="hidden w-60 shrink-0 lg:block">
          <div className="h-96 animate-pulse rounded-(--radius-lg) border border-border bg-muted" />
        </div>

        <div className="min-w-0 flex-1">
          {/* اسکلتون نوار عنوان */}
          <div className="mb-4 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-10 w-36 animate-pulse rounded-(--radius-md) bg-muted" />
          </div>

          {/* اسکلتون کارت‌های محصول — هم‌ابعاد کارت واقعی */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-(--radius-lg) border border-border bg-card"
              >
                {/* ناحیه تصویر */}
                <div className="aspect-square animate-pulse bg-muted" />

                {/* ناحیه اطلاعات */}
                <div className="space-y-2 p-3">
                  <div className="h-3 w-12 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="flex items-center justify-between pt-2">
                    <div className="h-5 w-20 animate-pulse rounded bg-muted" />
                    <div className="size-9 animate-pulse rounded-(--radius-md) bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
