<?php

/**
 * داده‌ی نمونه‌ی مقالات مجله.
 * ---------------------------------------------------------------------------
 * ⚠️ متن‌ها عمداً لورم هستند، نه محتوای واقعی.
 *
 *    این فایل فقط برای پر کردن صفحات در محیط توسعه است تا بشود
 *    چیدمان، صفحه‌بندی و حالت‌های خالی را دید. محتوای واقعی از
 *    پنل مدیریت وارد می‌شود، نه از اینجا.
 *
 *    به همین دلیل متن هم تولید می‌شود نه تایپ: نوشتن ده مقاله‌ی
 *    دوزبانه دستی، هزاران خط داده‌ی بی‌ارزش می‌سازد که هیچ‌کس
 *    نمی‌خواندش و نگهداری‌اش هزینه دارد.
 *
 * ⚠️ نامک‌ها اختیاری نیستند: باید دقیقاً با نام فایل‌های کاور در
 *    public/posts/<slug>.svg یکی باشند.
 */

/** واژگان لورم فارسی. */
$faWords = [
    'لورم', 'ایپسوم', 'متن', 'ساختگی', 'با', 'تولید', 'سادگی', 'نامفهوم',
    'از', 'صنعت', 'چاپ', 'و', 'استفاده', 'طراحان', 'گرافیک', 'است',
    'چاپگرها', 'متون', 'بلکه', 'روزنامه', 'مجله', 'در', 'ستون', 'سطرآنچنان',
    'لازم', 'شرایط', 'فعلی', 'تکنولوژی', 'مورد', 'نیاز', 'کاربردهای', 'متنوع',
];

/** واژگان لورم انگلیسی. */
$enWords = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
    'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et',
    'dolore', 'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis',
    'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea',
];

/**
 * ساخت یک جمله از واژگان داده‌شده.
 *
 * بذر ثابت می‌گیرد تا خروجی بین اجراها یکسان بماند — وگرنه هر
 * migrate:fresh متن‌ها را عوض می‌کند و مقایسه‌ی اسکرین‌شات‌ها
 * بی‌معنا می‌شود.
 *
 * @param  list<string>  $words
 */
$sentence = static function (array $words, int $count, int $seed): string {
    mt_srand($seed);
    $picked = [];

    for ($i = 0; $i < $count; $i++) {
        $picked[] = $words[mt_rand(0, count($words) - 1)];
    }

    return implode(' ', $picked);
};

/**
 * ساخت بدنه‌ی HTML یک مقاله.
 *
 * ساختار عمداً متنوع است (تیتر، پاراگراف، فهرست، نقل‌قول) تا
 * استایل‌های صفحه‌ی مقاله در همه‌ی حالت‌ها دیده و آزمایش شوند —
 * نه اینکه فقط چند پاراگراف پشت هم باشد.
 *
 * @param  list<string>  $words
 */
$body = static function (array $words, int $seed, bool $rtl) use ($sentence): string {
    $h2 = $rtl ? 'عنوان بخش' : 'Section heading';
    $quote = $rtl ? 'نقل‌قول نمونه برای آزمودن استایل' : 'A sample pull quote for styling';

    $html = '<p>'.$sentence($words, 45, $seed).'</p>';

    for ($section = 1; $section <= 3; $section++) {
        $html .= '<h2>'.$h2.' '.$section.'</h2>';
        $html .= '<p>'.$sentence($words, 60, $seed + $section).'</p>';

        if ($section === 1) {
            $html .= '<ul>';
            for ($item = 0; $item < 4; $item++) {
                $html .= '<li>'.$sentence($words, 8, $seed + 100 + $item).'</li>';
            }
            $html .= '</ul>';
        }

        if ($section === 2) {
            $html .= '<blockquote>'.$quote.'</blockquote>';
        }

        $html .= '<p>'.$sentence($words, 40, $seed + 200 + $section).'</p>';
    }

    return $html;
};

/**
 * مقالات.
 * قالب: [نامک, دسته, عنوان فارسی, عنوان انگلیسی, نویسنده]
 *
 * نامک‌ها از روی کاورهای موجود در public/posts گرفته شده‌اند.
 */
$definitions = [
    ['how-to-choose-a-phone',   'buying-guides',        'چطور گوشی مناسب انتخاب کنیم', 'How to choose the right phone',   'سارا محمدی'],
    ['laptop-buying-guide',     'buying-guides',        'راهنمای خرید لپ‌تاپ',          'Laptop buying guide',             'علی رضایی'],
    ['headphone-types',         'technology',           'انواع هدفون و کاربردشان',      'Headphone types and their uses',  'مریم حسینی'],
    ['smartwatch-fitness',      'technology',           'ساعت هوشمند و تناسب اندام',    'Smartwatches and fitness',        'رضا کریمی'],
    ['kitchen-appliances-care', 'care-and-maintenance', 'مراقبت از لوازم آشپزخانه',     'Caring for kitchen appliances',   'زهرا نوری'],
    ['running-shoes-guide',     'lifestyle',            'انتخاب کفش دویدن',             'Choosing running shoes',          'محمد صادقی'],
    ['skincare-routine',        'lifestyle',            'روتین مراقبت از پوست',         'A simple skincare routine',       'فاطمه احمدی'],
    ['reading-habit',           'lifestyle',            'ساختن عادت کتاب‌خوانی',        'Building a reading habit',        'امیر جعفری'],
    ['safe-online-shopping',    'shopping-tips',        'خرید اینترنتی امن',            'Shopping online safely',          'نگین رستمی'],
    ['gift-guide',              'buying-guides',        'راهنمای انتخاب هدیه',          'A guide to choosing gifts',       'حسین موسوی'],
];

$posts = [];

foreach ($definitions as $index => [$slug, $category, $titleFa, $titleEn, $author]) {
    $seed = 1000 + $index * 17;

    $posts[] = [
        'slug' => $slug,
        'category' => $category,
        'author' => $author,

        'title_fa' => $titleFa,
        'title_en' => $titleEn,

        'excerpt_fa' => $sentence($faWords, 22, $seed),
        'excerpt_en' => $sentence($enWords, 22, $seed),

        'body_fa' => $body($faWords, $seed, true),
        'body_en' => $body($enWords, $seed, false),
    ];
}

return $posts;
