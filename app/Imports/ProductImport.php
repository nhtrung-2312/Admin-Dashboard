<?php

namespace App\Imports;

use App\Models\Product;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Carbon\Carbon;

class ProductImport implements ToModel, WithValidation, WithHeadingRow
{
    private $statusMap = [
        'đang bán' => 1,
        'hết hàng' => 0,
        'ngưng bán' => 2,
        'in stock' => 1,
        'out of stock' => 0,
        'discontinued' => 2
    ];

    public function model(array $row)
    {
        // Kiểm tra và xử lý dữ liệu trước khi tạo model
        if (empty($row['id']) && empty($row['ma'])) {
            throw new \Exception('ID/Mã sản phẩm không được để trống');
        }

        $status = strtolower(trim($row['status'] ?? $row['trang_thai'] ?? 'đang bán'));
        $statusValue = $this->statusMap[$status] ?? 1;

        return new Product([
            'id' => $row['id'] ?? $row['ma'] ?? null,
            'name' => $row['name'] ?? $row['ten'] ?? '',
            'price' => floatval($row['price'] ?? $row['gia'] ?? 0),
            'description' => $row['description'] ?? $row['mo_ta'] ?? '',
            'quantity' => intval($row['quantity'] ?? $row['so_luong'] ?? 0),
            'is_active' => $statusValue,
            'created_at' => !empty($row['created_at']) ? Carbon::parse($row['created_at']) : Carbon::now(),
            'updated_at' => !empty($row['updated_at']) ? Carbon::parse($row['updated_at']) : Carbon::now(),
        ]);
    }

    public function rules(): array
    {
        return [
            '*.id' => 'required_without:ma|string|max:10',
            '*.ma' => 'required_without:id|string|max:10',
            '*.name' => 'required_without:ten|string|max:255',
            '*.ten' => 'required_without:name|string|max:255',
            '*.price' => 'nullable|numeric|min:0',
            '*.gia' => 'nullable|numeric|min:0',
            '*.quantity' => 'nullable|integer|min:0',
            '*.so_luong' => 'nullable|integer|min:0',
            '*.status' => 'nullable|string|max:20',
            '*.trang_thai' => 'nullable|string|max:20',
            '*.created_at' => 'nullable|date',
            '*.updated_at' => 'nullable|date',
        ];
    }

    public function customValidationMessages()
    {
        return [
            'id.required_without' => 'ID hoặc Mã sản phẩm là bắt buộc',
            'name.required_without' => 'Tên sản phẩm là bắt buộc',
            'price.numeric' => 'Giá phải là số',
            'price.min' => 'Giá không được âm',
            'quantity.integer' => 'Số lượng phải là số nguyên',
            'quantity.min' => 'Số lượng không được âm',
        ];
    }
}