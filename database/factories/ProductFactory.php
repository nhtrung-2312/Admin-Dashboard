<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Product;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $word = fake()->unique()->word();
        return [
            'id' => $this->generateValidId($word),
            'name' => $word,
            'description' => fake()->sentence(),
            'price' => fake()->numberBetween(50000, 10000000),
            'quantity' => fake()->numberBetween(0, 100),
            'image_url' => null,
            'status' => fake()->numberBetween(0, 2),
        ];
    }

    private function generateValidId($name)
    {
        $validateName = preg_replace('/[^a-zA-Z]/', '', $name);
        $first = strtoupper($validateName[0]);

        $usedNumbers = Product::where('id', 'like', "{$first}%")
            ->pluck('id')
            ->map(fn($id) => (int) substr($id, 1))
            ->sort()
            ->values();
    
        $nextNumber = 1;
        foreach ($usedNumbers as $number) {
            if ($number !== $nextNumber) break;
            $nextNumber++;
        }

        $newId = $first . str_pad($nextNumber, 8, '0', STR_PAD_LEFT);

        return $newId;
    }
}
