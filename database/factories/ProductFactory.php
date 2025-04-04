<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

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
            'id' => strtoupper(substr($word, 0, 1)) . fake()->numerify('#########'),
            'name' => $word,
            'description' => fake()->sentence(),
            'price' => fake()->numberBetween(50000, 10000000),
            'quantity' => fake()->numberBetween(0, 100),
            'image_url' => null,
            'status' => fake()->numberBetween(0, 2),
        ];
    }
}
