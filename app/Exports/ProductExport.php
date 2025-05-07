<?php

namespace App\Exports;

use App\Models\Product;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithCustomCsvSettings;
use Maatwebsite\Excel\Events\BeforeExport;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
class ProductExport implements FromCollection, WithHeadings, WithMapping, WithStyles, WithColumnWidths, WithCustomCsvSettings
{
    protected $products;

    public function __construct($products)
    {
        $this->products = $products;
    }

    public function collection()
    {
        return $this->products;
    }

    public function headings(): array
    {
        return [
            'ID',
            'Name',
            'Description',
            'Price',
            'Quantity',
            'Image',
            'Delete Status',
            'Status',
            'Created At',
            'Last Updated',
        ];
    }

    public function map($product): array
    {
        return [
            $product->id,
            $product->name,
            $product->description,
            $product->price,
            $product->quantity,
            $product->image_url,
            $product->is_deleted ? 'Deleted' : '',
            $product->status === 0 ? 'Stopped' : ($product->status === 1 ? 'Selling' : 'Out of stock'),
            $product->created_at->format('d/m/Y H:i:s'),
            $product->updated_at->format('d/m/Y H:i:s')
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true],
                'alignment' => [
                    'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                    'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
                ],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'E2EFDA']
                ],
            ]
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 10,  // ID
            'B' => 30,  // Tên
            'C' => 40,  // Mô tả
            'D' => 20,  // Giá
            'E' => 20,  // Số lượng
            'F' => 40,  // Hình ảnh
            'G' => 20,  // Trạng thái xoá
            'H' => 20,  // Trạng thái
            'I' => 20,  // Ngày tạo
            'J' => 20,  // Cập nhật lần cuối
        ];
    }

    public function getCsvSettings(): array
    {
        return [
            'use_bom' => true,
            'delimiter' => ',',
            'enclosure' => '"',
            'line_ending' => "\r\n",
            'encoding' => 'UTF-8',
            'excel_compatibility' => false,
        ];
    }

    public function registerEvents(): array
    {
        return [
            BeforeExport::class => function(BeforeExport $event) {
                $event->writer->setIncludeBOM(true);
            },
        ];
    }
}
