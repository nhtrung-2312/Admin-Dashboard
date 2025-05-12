<?php

namespace App\Imports;

use App\Models\Product;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\SkipsErrors;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Illuminate\Support\Facades\Log;

class ProductImport implements ToModel, WithValidation, WithHeadingRow, SkipsOnError, SkipsOnFailure
{
    use SkipsErrors, SkipsFailures;

    private $statusMap = [
        'selling' => 1,
        'out of stock' => 0,
        'discontinued' => 2
    ];

    private $rowNumber = 0;

    public function model(array $row)
    {
        $this->rowNumber++;

        try {
            $product = new Product([
                'id' => $row['id'],
                'name' => $row['name'],
                'description' => $row['description'],
                'price' => $row['price'],
                'quantity' => $row['quantity'],
                'image_url' => $row['image'],
                'is_deleted' => isset($row['deleted_at']) ? $row['deleted_at']->format('d/m/Y H:i:s') : '',
                'status' => $this->statusMap[strtolower($row['status'])] ?? 0,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
            return $product;

        } catch (\Exception $e) {
            throw $e;
        }
    }

    public function getRowCount(): int
    {
        return $this->rowNumber;
    }

    public function prepareForValidation($data, $index)
    {
        return array_change_key_case($data, CASE_LOWER);
    }

    public function rules(): array
    {
        return [
            'id' => 'required|string|unique:product,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:0',
            'image' => 'nullable|url',
            'deleted_at' => 'nullable|date',
            'status' => 'required|string',
        ];
    }
}