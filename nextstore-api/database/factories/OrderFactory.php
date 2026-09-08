<?php

namespace Database\Factories;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 *
 * ⚠️ `shipping_address` یک **عکس لحظه‌ای** است نه ارجاع به جدول آدرس.
 *    فکتوری هم همان شکل را می‌سازد تا تست‌ها روی داده‌ای اجرا شوند که
 *    ساختار واقعی تولید را دارد.
 */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        $subtotal = fake()->numberBetween(1_000_000, 50_000_000);

        return [
            'order_number' => 'NS-'.now()->format('ymd').'-'.fake()->unique()->numerify('####'),
            'user_id' => User::factory(),
            'status' => OrderStatus::Pending,
            'shipping_address' => [
                'recipientName' => fake()->name(),
                'recipientPhone' => '0912'.fake()->numerify('#######'),
                'province' => 'تهران',
                'city' => 'تهران',
                'street' => 'خیابان آزمایشی، پلاک '.fake()->numberBetween(1, 200),
                'postalCode' => fake()->numerify('##########'),
                'buildingNo' => null,
                'unit' => null,
            ],
            'subtotal' => $subtotal,
            'discount' => 0,
            'shipping_cost' => 0,
            'tax' => 0,
            'total' => $subtotal,
            'shipping_method' => 'standard',
        ];
    }

    /** سفارش پرداخت‌شده. */
    public function paid(): static
    {
        return $this->state([
            'status' => OrderStatus::Paid,
            'paid_at' => now(),
        ]);
    }
}
