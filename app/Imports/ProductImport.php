<?php
namespace App\Imports;

use App\Models\Product;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\SkipsErrors;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ProductImport implements ToCollection, WithValidation, WithHeadingRow, SkipsOnError, SkipsOnFailure
{
    use SkipsErrors, SkipsFailures;

    private $statusMap = [
        'selling' => 1,
        'out of stock' => 0,
        'discontinued' => 2
    ];

    private $rowNumber = 0;

    // Lưu trữ số cuối cùng đã dùng theo chữ cái đầu
    private $idCounters = [];

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            $this->rowNumber++;

            $newId = $this->generateNewId($row['name']);

            try {
                Product::create([
                    'id' => $newId,
                    'name' => $row['name'],
                    'description' => $row['description'],
                    'price' => $row['price'],
                    'quantity' => $row['quantity'],
                    'image_url' => $row['image'],
                    'is_deleted' => isset($row['deleted_at']) ? Carbon::parse($row['deleted_at'])->format('d/m/Y H:i:s') : '',
                    'status' => $this->statusMap[strtolower($row['status'])] ?? 0,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
            } catch (\Exception $e) {
                throw $e;
            }
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
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:0',
            'image' => 'nullable|url',
            'deleted_at' => 'nullable|date',
            'status' => 'required|string',
        ];
    }

    private function generateNewId($name)
    {
        $validateName = preg_replace('/[^a-zA-Z]/', '', $name);

        $first = strtoupper($validateName[0] ?? 'X');

        if (!isset($this->idCounters[$first])) {
            $lastProduct = Product::where('id', 'LIKE', $first . '%')
                            ->orderBy('id', 'desc')
                            ->first();

            if ($lastProduct) {
                $numberPart = (int)substr($lastProduct->id, 1);
                $this->idCounters[$first] = $numberPart + 1;
            } else {
                $this->idCounters[$first] = 1;
            }
        }

        // Tạo ID mới
        $nextNumber = $this->idCounters[$first]++;
        $newId = $first . str_pad($nextNumber, 8, '0', STR_PAD_LEFT);

        return $newId;
    }
}