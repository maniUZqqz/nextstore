<?php

namespace Database\Factories;

use App\Enums\CouponType;
use App\Models\Coupon;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Coupon> */
class CouponFactory extends Factory
{
    protected $model = Coupon::class;

    public function definition(): array
    {
        return [
            'code' => 'TEST'.Str::upper(Str::random(6)),
            'type' => CouponType::Percent,
            'value' => 10,
            'max_discount' => null,
            'min_order_total' => 0,
            'usage_limit' => null,
            'per_user_limit' => 1,
            'starts_at' => null,
            'expires_at' => null,
            'is_active' => true,
        ];
    }

    /** کوپن مبلغ ثابت — مقدار به ریال. */
    public function fixed(int $rials): static
    {
        return $this->state(['type' => CouponType::Fixed, 'value' => $rials]);
    }

    /** کوپن منقضی‌شده. */
    public function expired(): static
    {
        return $this->state(['expires_at' => now()->subDay()]);
    }

    /** کوپنی که هنوز شروع نشده. */
    public function scheduled(): static
    {
        return $this->state(['starts_at' => now()->addWeek()]);
    }

    /** کوپنی که ظرفیتش پر شده. */
    public function exhausted(): static
    {
        return $this->state(['usage_limit' => 5])
            ->afterCreating(fn (Coupon $c) => $c->forceFill(['used_count' => 5])->save());
    }
}
