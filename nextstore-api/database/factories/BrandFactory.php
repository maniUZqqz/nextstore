<?php

namespace Database\Factories;

use App\Models\Brand;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Brand> */
class BrandFactory extends Factory
{
    protected $model = Brand::class;

    public function definition(): array
    {
        return [
            'name' => ['fa' => 'برند '.Str::random(4), 'en' => 'Brand '.Str::random(4)],
            'slug' => 'brand-'.Str::random(8),
            'is_active' => true,
        ];
    }
}
