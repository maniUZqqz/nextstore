<?php

namespace Database\Seeders;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\Address;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * ساخت سفارش‌های نمایشی برای پنل مدیریت.
 * ---------------------------------------------------------------------------
 * چرا این سیدر لازم است؟
 *
 *   پنل مدیریت بدون داده، خالی و شکسته به نظر می‌رسد: نمودار فروش
 *   صاف است، «پرفروش‌ترین محصولات» چیزی ندارد و مهم‌تر از همه فرم
 *   «تغییر وضعیت» هیچ سفارشی برای اقدام ندارد.
 *
 *   تست خودکار هم بدون داده‌ی متنوع، تهی می‌گذرد: فیلتر «پرداخت‌شده»
 *   صفر ردیف برمی‌گرداند و ادعای «همه‌ی ردیف‌ها پرداخت‌شده‌اند»
 *   بی‌آنکه چیزی را بسنجد سبز می‌شود.
 *
 * ⚠️ سه نکته‌ی دقت در این سیدر:
 *
 *   ۱. سفارش‌ها در ۴۵ روز گذشته پخش می‌شوند، نه همه در امروز.
 *      نمودار ۱۴ روزه‌ی داشبورد فقط این‌طور معنا پیدا می‌کند.
 *
 *   ۲. شماره‌ی سفارش با تاریخ *واقعی* سفارش ساخته می‌شود.
 *      متد خودکار مدل از now() استفاده می‌کند و همه‌ی سفارش‌های
 *      قدیمی، شماره‌ی امروز می‌گرفتند — که در فهرست عجیب است.
 *
 *   ۳. نام و قیمت محصول در قلم سفارش *کپی* می‌شود، نه ارجاع.
 *      همان کاری که OrderService در سفارش واقعی می‌کند؛ سند مالی
 *      نباید با تغییر قیمت محصول عوض شود.
 */
class OrderSeeder extends Seeder
{
    /**
     * توزیع وضعیت سفارش‌ها.
     *
     * نسبت‌ها عمداً شبیه یک فروشگاه واقعی است: بیشتر سفارش‌ها به
     * تحویل رسیده‌اند، تعداد کمی در جریان‌اند و درصد کوچکی لغو شده.
     * کلید = وضعیت، مقدار = چند سفارش.
     */
    private const DISTRIBUTION = [
        'delivered' => 14,
        'shipped' => 5,
        'processing' => 4,
        'paid' => 5,
        'pending' => 3,
        'cancelled' => 2,
        'refunded' => 1,
    ];

    /** شهرهایی که مشتری‌های نمایشی از آن‌ها خرید می‌کنند. */
    private const CITIES = [
        ['تهران', 'تهران', 'خیابان ولیعصر، بالاتر از میدان ونک'],
        ['اصفهان', 'اصفهان', 'خیابان چهارباغ عباسی، کوچه شهید رجایی'],
        ['فارس', 'شیراز', 'بلوار زند، نبش خیابان فردوسی'],
        ['خراسان رضوی', 'مشهد', 'بلوار وکیل‌آباد، بین وکیل‌آباد ۱۲ و ۱۴'],
        ['آذربایجان شرقی', 'تبریز', 'خیابان امام خمینی، جنب بازار بزرگ'],
    ];

    public function run(): void
    {
        /* تصاویر از پیش بارگذاری می‌شوند تا حلقه‌ی ساخت اقلام کوئری اضافه نزند */
        $products = Product::query()->with('images')->where('stock', '>', 0)->get();

        if ($products->isEmpty()) {
            $this->command->warn('محصولی برای ساخت سفارش نیست — ابتدا CatalogSeeder را اجرا کنید.');

            return;
        }

        $customers = $this->ensureCustomers();

        $this->command->info('ساخت سفارش‌های نمایشی...');

        foreach (self::DISTRIBUTION as $status => $count) {
            for ($i = 0; $i < $count; $i++) {
                $this->makeOrder(
                    OrderStatus::from($status),
                    $customers->random(),
                    $products,
                );
            }
        }

        $total = array_sum(self::DISTRIBUTION);
        $this->command->info("  {$total} سفارش ساخته شد.");

        $this->diversifyProducts();
    }

    /**
     * اطمینان از وجود چند مشتری با آدرس.
     *
     * سفارش‌های یک مشتری واحد، فهرست ادمین را بی‌معنا می‌کند؛
     * ستون «مشتری» همه‌جا یک نام تکراری می‌شود.
     */
    private function ensureCustomers()
    {
        $names = [
            ['سارا محمدی', 'sara@demo.dev', '09121110001'],
            ['رضا کریمی', 'reza@demo.dev', '09121110002'],
            ['مریم حسینی', 'maryam@demo.dev', '09121110003'],
            ['امیر رضایی', 'amir@demo.dev', '09121110004'],
        ];

        foreach ($names as $index => [$name, $email, $phone]) {
            /* firstOrCreate تا اجرای دوباره‌ی سیدر خطای یکتایی ندهد */
            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'phone' => $phone,
                    'password' => 'password',
                    'role' => UserRole::Customer,
                    'email_verified_at' => now(),
                    'is_active' => true,
                ],
            );

            [$province, $city, $street] = self::CITIES[$index % count(self::CITIES)];

            Address::firstOrCreate(
                ['user_id' => $user->id, 'label' => 'خانه'],
                [
                    'recipient_name' => $name,
                    'recipient_phone' => $phone,
                    'province' => $province,
                    'city' => $city,
                    'street' => $street,
                    'postal_code' => (string) random_int(1000000000, 9999999999),
                    'building_no' => (string) random_int(1, 90),
                    'unit' => (string) random_int(1, 12),
                    'is_default' => true,
                ],
            );
        }

        /*
         * ⚠️ فقط مشتری‌هایی که آدرس دارند برگردانده می‌شوند.
         *    دیتابیس ممکن است کاربرانی از تست‌های قبلی داشته باشد که
         *    هرگز آدرس ثبت نکرده‌اند؛ بدون این شرط، ساخت سفارش با
         *    خطای «خواندن ویژگی روی null» متوقف می‌شد.
         */
        return User::where('role', UserRole::Customer)
            ->has('addresses')
            ->with('addresses')
            ->get();
    }

    /** ساخت یک سفارش کامل با اقلام، پرداخت و زمان‌های درست. */
    private function makeOrder(OrderStatus $status, User $customer, $products): void
    {
        /* سفارش در ۴۵ روز گذشته، با تمرکز بیشتر روی روزهای اخیر */
        $placedAt = Carbon::now()
            ->subDays(random_int(0, 45))
            ->setTime(random_int(8, 22), random_int(0, 59));

        $address = $customer->addresses->first();

        /* یک تا چهار قلم، بدون تکرار محصول */
        $picked = $products->random(min(random_int(1, 4), $products->count()));
        $picked = $picked instanceof Product ? collect([$picked]) : $picked;

        $lines = $picked->map(function (Product $product) {
            $quantity = random_int(1, 3);
            /* قیمت از final_price خوانده می‌شود — همان چیزی که مشتری می‌پرداخت */
            $unitPrice = (int) $product->final_price;

            return [
                'product' => $product,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'line_total' => $unitPrice * $quantity,
            ];
        });

        $subtotal = (int) $lines->sum('line_total');

        /*
         * ⚠️ نرخ‌ها از همان config می‌آیند که تسویه‌حساب واقعی استفاده
         *    می‌کند. نسخه‌ی قبلی اعداد را دستی نوشته بود (۴۵۰٬۰۰۰ و
         *    ۵۰٬۰۰۰٬۰۰۰) که با منطق واقعی نمی‌خواند؛ یعنی سفارش‌های
         *    نمایشی هزینه‌ای داشتند که سیستم هرگز تولید نمی‌کند.
         */
        $rates = config('shop.shipping');
        $shipping = $subtotal >= $rates['free_threshold'] ? 0 : $rates['standard'];
        $tax = (int) round($subtotal * config('shop.tax.rate'));
        $total = $subtotal + $shipping + $tax;

        $order = new Order([
            'user_id' => $customer->id,
            'status' => $status,

            /* عکس لحظه‌ای آدرس — کلیدها camelCase چون در API همین‌طور خوانده می‌شوند */
            'shipping_address' => [
                'recipientName' => $address->recipient_name,
                'recipientPhone' => $address->recipient_phone,
                'province' => $address->province,
                'city' => $address->city,
                'street' => $address->street,
                'postalCode' => $address->postal_code,
                'buildingNo' => $address->building_no,
                'unit' => $address->unit,
            ],

            'subtotal' => $subtotal,
            'discount' => 0,
            'shipping_cost' => $shipping,
            'tax' => $tax,
            'total' => $total,

            'shipping_method' => random_int(0, 3) === 0 ? 'express' : 'standard',
        ]);

        /*
         * شماره سفارش با تاریخ خودِ سفارش، نه امروز.
         * اگر این خط نبود، متد boot مدل شماره را با now() می‌ساخت.
         */
        $order->order_number = 'NS-'.$placedAt->format('ymd').'-'.random_int(1000, 9999);

        /* زمان‌های چرخه‌ی سفارش، متناسب با وضعیت */
        $this->applyTimestamps($order, $status, $placedAt);

        $order->created_at = $placedAt;
        $order->updated_at = $placedAt;
        $order->save();

        foreach ($lines as $line) {
            /** @var Product $product */
            $product = $line['product'];

            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                /* نام کپی می‌شود، نه ارجاع — سند مالی ثابت می‌ماند */
                'product_name' => $product->getTranslations('name'),
                'product_sku' => $product->sku,
                'product_image' => $product->images->first()?->url,
                'unit_price' => $line['unit_price'],
                'quantity' => $line['quantity'],
                'line_total' => $line['line_total'],
            ]);
        }

        /* پرداخت فقط برای سفارش‌هایی که واقعاً پرداخت شده‌اند */
        if ($order->paid_at) {
            Payment::create([
                'order_id' => $order->id,
                'gateway' => 'mock',
                'status' => $status === OrderStatus::Refunded
                    ? PaymentStatus::Refunded
                    : PaymentStatus::Succeeded,
                'amount' => $total,
                'reference_id' => 'REF-'.strtoupper(bin2hex(random_bytes(6))),
                'tracking_number' => (string) random_int(100000000, 999999999),
                'paid_at' => $order->paid_at,
            ]);
        }
    }

    /**
     * پر کردن زمان‌های چرخه‌ی سفارش بر اساس وضعیت.
     *
     * هر وضعیت، زمان‌های وضعیت‌های *پیش از خودش* را هم دارد:
     * سفارش تحویل‌شده باید paid_at و shipped_at داشته باشد، وگرنه
     * بخش «زمان‌بندی سفارش» در پنل ناقص و مشکوک به نظر می‌رسد.
     */
    private function applyTimestamps(Order $order, OrderStatus $status, Carbon $placedAt): void
    {
        $paidAt = (clone $placedAt)->addMinutes(random_int(2, 90));
        $shippedAt = (clone $paidAt)->addDays(random_int(1, 3));
        $deliveredAt = (clone $shippedAt)->addDays(random_int(1, 4));

        match ($status) {
            OrderStatus::Pending => null,

            OrderStatus::Cancelled => $order->cancelled_at =
                (clone $placedAt)->addHours(random_int(1, 48)),

            OrderStatus::Paid, OrderStatus::Processing => $order->paid_at = $paidAt,

            OrderStatus::Shipped => tap($order, function (Order $o) use ($paidAt, $shippedAt) {
                $o->paid_at = $paidAt;
                $o->shipped_at = $shippedAt;
                $o->tracking_code = 'IR'.random_int(100000000, 999999999);
            }),

            OrderStatus::Delivered => tap($order, function (Order $o) use ($paidAt, $shippedAt, $deliveredAt) {
                $o->paid_at = $paidAt;
                $o->shipped_at = $shippedAt;
                $o->delivered_at = $deliveredAt;
                $o->tracking_code = 'IR'.random_int(100000000, 999999999);
            }),

            OrderStatus::Refunded => tap($order, function (Order $o) use ($paidAt, $placedAt) {
                $o->paid_at = $paidAt;
                $o->cancelled_at = (clone $placedAt)->addDays(random_int(3, 10));
            }),
        };
    }

    /**
     * متنوع کردن وضعیت انتشار چند محصول.
     *
     * همه‌ی محصولات سیدر «منتشرشده»اند، پس فیلترهای «پیش‌نویس» و
     * «بایگانی» در پنل هیچ‌وقت چیزی نشان نمی‌دادند و تست‌شان روی
     * مجموعه‌ی تهی سبز می‌شد.
     */
    private function diversifyProducts(): void
    {
        /* دو محصول پیش‌نویس — نباید در فروشگاه دیده شوند */
        Product::query()
            ->where('is_featured', false)
            ->latest('id')
            ->limit(2)
            ->update(['status' => 'draft', 'published_at' => null]);

        /* یک محصول بایگانی‌شده — دیگر فروخته نمی‌شود اما سوابق می‌ماند */
        Product::query()
            ->where('is_featured', false)
            ->where('status', 'active')
            ->oldest('id')
            ->limit(1)
            ->update(['status' => 'archived']);

        $this->command->info('  وضعیت انتشار چند محصول متنوع شد (پیش‌نویس/بایگانی).');
    }
}
