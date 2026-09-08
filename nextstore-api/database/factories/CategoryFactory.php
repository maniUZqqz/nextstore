<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Category> */
class CategoryFactory extends Factory
{
    protected $model = Category::class;

    public function definition(): array
    {
        $slug = 'cat-'.Str::random(8);

        return [
            /* فیلدهای متنی شیء دوزبانه‌اند — همان الگوی HasTranslations */
            'name' => ['fa' => 'دسته '.Str::random(4), 'en' => 'Category '.Str::random(4)],
            'slug' => $slug,
            'is_active' => true,
        ];
    }
}
