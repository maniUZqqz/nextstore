<?php

namespace Database\Factories;

use App\Enums\NotificationType;
use App\Models\Notification;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Notification>
 */
class NotificationFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'type' => NotificationType::OrderStatus,
            'data' => [
                'orderNumber' => 'NS-260101-0001',
                'statusLabel' => 'ارسال شد',
            ],
            'link' => '/account/orders/NS-260101-0001',
            'read_at' => null,
        ];
    }

    /** اعلانی که کاربر پیش‌تر دیده است. */
    public function read(): static
    {
        return $this->state(fn () => ['read_at' => now()->subHour()]);
    }
}
