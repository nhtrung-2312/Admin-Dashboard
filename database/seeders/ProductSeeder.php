<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Product;
class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [];
        $usedCounters = [];

        for ($i = 0; $i < 100; $i++) {
            $word = fake()->unique()->word();
            $id = $this->generateCustomId($word, $usedCounters);

            $products[] = [
                'id' => $id,
                'name' => $word,
                'description' => fake()->sentence(),
                'price' => fake()->numberBetween(50000, 10000000),
                'quantity' => fake()->numberBetween(0, 100),
                'image_url' => null,
                'status' => fake()->numberBetween(0, 2),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // Insert all in one query
        Product::insert($products);
    }

    private function generateCustomId($word, &$counters)
    {
        $firstChar = strtoupper(preg_replace('/[^a-zA-Z]/', '', $word)[0] ?? 'X');

        if (!isset($counters[$firstChar])) {
            $counters[$firstChar] = 1;
        }

        $number = str_pad($counters[$firstChar], 8, '0', STR_PAD_LEFT);
        $counters[$firstChar]++;

        return $firstChar . $number;
    }
}
