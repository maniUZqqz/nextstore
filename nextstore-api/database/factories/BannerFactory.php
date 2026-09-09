<?php

namespace Database\Factories;

use App\Models\Banner;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Banner>
 */
class BannerFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'placement' => 'hero',
            'badge' => ['fa' => 'برچسب', 'en' => 'Badge'],
            'title' => ['fa' => 'عنوان بنر', 'en' => 'Banner title'],
            'subtitle' => ['fa' => 'زیرعنوان بنر', 'en' => 'Banner subtitle'],
            'cta_label' => ['fa' => 'مشاهده', 'en' => 'View'],
            'href' => '/products',
            'theme' => 'primary',
            'icon' => null,
            'sort_order' => 0,
            'is_active' => true,
            'starts_at' => null,
            'ends_at' => null,
        ];
    }

    /** بنری که خاموش است. */
    public function disabled(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
