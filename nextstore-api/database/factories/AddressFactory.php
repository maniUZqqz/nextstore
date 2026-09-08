<?php

namespace Database\Factories;

use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Address> */
class AddressFactory extends Factory
{
    protected $model = Address::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'label' => 'خانه',
            'recipient_name' => fake()->name(),
            /* شماره‌ی موبایل ایرانی — اعتبارسنجی StoreAddressRequest همین را می‌خواهد */
            'recipient_phone' => '0912'.fake()->numerify('#######'),
            'province' => 'تهران',
            'city' => 'تهران',
            'street' => 'خیابان آزمایشی، کوچه‌ی نمونه، پلاک ۱',
            'postal_code' => fake()->numerify('##########'),
            'is_default' => true,
        ];
    }
}
