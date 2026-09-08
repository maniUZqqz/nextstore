<?php

namespace Database\Factories;

use App\Enums\ProductStatus;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 *
 * ⚠️ قیمت‌ها **عدد صحیح ریال**اند، نه اعشاری. تولید مقدار اعشاری در
 *    فکتوری یعنی تست‌ها روی داده‌ای اجرا می‌شوند که شکل واقعی تولید را
 *    ندارد و خطاهای گِردکردن را پنهان می‌کند.
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'brand_id' => Brand::factory(),
            'name' => ['fa' => 'محصول '.Str::random(5), 'en' => 'Product '.Str::random(5)],
            'slug' => 'product-'.Str::random(10),
            'sku' => 'SKU-'.Str::upper(Str::random(8)),
            /* بین ۱ تا ۵۰ میلیون ریال */
            'price' => fake()->numberBetween(1_000_000, 50_000_000),
            'stock' => 20,
            'low_stock_threshold' => 3,
            'allow_backorder' => false,
            'status' => ProductStatus::Active,
            'published_at' => now(),
        ];
    }

    /** محصول ناموجود. */
    public function outOfStock(): static
    {
        return $this->state(['stock' => 0]);
    }

    /** محصول با موجودی مشخص. */
    public function withStock(int $stock): static
    {
        return $this->state(['stock' => $stock]);
    }
}
