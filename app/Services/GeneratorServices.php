<?php

namespace App\Services;

use App\Models\Product;

class GeneratorServices
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function generateValidId($name)
    {
        //Keep the character base on regex, remove the rest
        $validateName = preg_replace('/[^a-zA-Z]/', '', $name);

        //Get the first letter, default on 'X'
        $first = strtoupper($validateName[0] ?? 'X');

        //Find the product_id match the first letter, then get the last number
        $usedNumbers = Product::where('id', 'like', "{$first}%")
            ->pluck('id')
            ->map(fn($id) => (int) substr($id, 1))
            ->sort()
            ->values();

        $nextNumber = ($usedNumbers->last() ?? 0) + 1;

        //Create id with correct format
        $newId = $first . str_pad($nextNumber, 8, '0', STR_PAD_LEFT);

        return $newId;
    }
}
