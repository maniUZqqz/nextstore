/**
 * نگاشت نام آیکون دسته‌بندی به کامپوننت Lucide
 * ---------------------------------------------------------------------------
 * ستون `icon` در جدول categories یک *رشته* است (مثلاً "smartphone").
 * این فایل آن رشته را به کامپوننت واقعی تبدیل می‌کند.
 *
 * ⚠️ چرا نگاشت دستی و نه import داینامیک؟
 *    `import(\`lucide-react/\${name}\`)` باعث می‌شود باندلر نتواند
 *    تشخیص دهد کدام آیکون‌ها لازم‌اند و **کل کتابخانه** (بیش از
 *    هزار آیکون) وارد باندل شود. با نگاشت صریح، فقط همین بیست
 *    آیکون وارد می‌شوند.
 *
 * ⚠️ این نگاشت پیش‌تر داخل CategoryCircles بود و فقط ۶ آیکون داشت،
 *    در حالی که سیدر ۲۰ نام مختلف می‌سازد. نتیجه: بیشتر دسته‌ها
 *    آیکون عمومی «جعبه» می‌گرفتند و صفحه‌ی دسته‌بندی‌ها بیست کارت
 *    با آیکون یکسان بود. حالا همه پوشش داده شده‌اند و هر صفحه‌ای
 *    که به آیکون دسته نیاز دارد از همین منبع می‌خواند.
 */

import {
  AirVent, Book, BookOpen, Briefcase, CookingPot, Droplet, Dumbbell,
  Footprints, Headphones, Laptop, Package, Pencil, Scissors, Shirt,
  Smartphone, Sparkles, SprayCan, Tablet, Tent, WashingMachine, Watch,
  type LucideIcon,
} from 'lucide-react'

/**
 * کلیدها دقیقاً همان رشته‌هایی هستند که در CatalogSeeder نوشته شده‌اند.
 * افزودن دسته‌ی جدید با آیکون تازه، نیازمند افزودن یک ردیف اینجاست.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  'air-vent': AirVent,
  book: Book,
  'book-open': BookOpen,
  briefcase: Briefcase,
  'cooking-pot': CookingPot,
  droplet: Droplet,
  dumbbell: Dumbbell,
  footprints: Footprints,
  headphones: Headphones,
  laptop: Laptop,
  pencil: Pencil,
  scissors: Scissors,
  shirt: Shirt,
  smartphone: Smartphone,
  sparkles: Sparkles,
  'spray-can': SprayCan,
  tablet: Tablet,
  tent: Tent,
  'washing-machine': WashingMachine,
  watch: Watch,
}

/**
 * آیکون یک دسته را برمی‌گرداند.
 *
 * اگر نام ناشناخته باشد (دسته‌ای که ادمین ساخته و نامش در نگاشت
 * نیست) آیکون عمومی جعبه برمی‌گردد — صفحه هرگز به‌خاطر یک نام
 * اشتباه نمی‌شکند.
 */
export function categoryIcon(name: string | null | undefined): LucideIcon {
  return ICON_MAP[name ?? ''] ?? Package
}
