<?php

namespace Database\Factories;

use App\Models\ContactMessage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ContactMessage>
 */
class ContactMessageFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'user_id' => null,
            'name' => fake()->name(),
            'email' => fake()->safeEmail(),
            'subject' => fake()->sentence(4),
            'message' => fake()->paragraph(),
            'is_read' => false,
            'read_at' => null,
            'ip' => fake()->ipv4(),
        ];
    }

    /** پیامی که مدیر پیش‌تر خوانده است. */
    public function read(): static
    {
        return $this->state(fn () => [
            'is_read' => true,
            'read_at' => now()->subDay(),
        ]);
    }
}
