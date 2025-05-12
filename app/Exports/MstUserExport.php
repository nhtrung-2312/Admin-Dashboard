<?php

namespace App\Exports;

use App\Models\MstUser;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithCustomCsvSettings;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class MstUserExport implements FromCollection, WithHeadings, WithMapping, WithStyles, WithColumnWidths, WithCustomCsvSettings
{
    protected $users;
    protected $index = 0;

    public function __construct($users)
    {
        $this->users = $users;
    }

    public function collection()
    {
        return $this->users;
    }

    public function headings(): array
    {
        return [
            'No.',
            'Name',
            'Email',
            'Role',
            'Status',
            'Created At',
            'Updated At'
        ];
    }

    public function map($user): array
    {
        $this->index++;
        return [
            $this->index,
            $user->name,
            $user->email,
            $user->group_role,
            $user->is_active ? 'Active' : 'Inactive',
            $user->created_at->format('d/m/Y h:i:s A'),
            $user->updated_at->format('d/m/Y h:i:s A')
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
            'C' => 40,  // Email
            'D' => 20,  // Nhóm quyền
            'E' => 20,  // Trạng thái
            'F' => 20,  // Ngày tạo
            'G' => 20,  // Ngày cập nhật
        ];
    }

    public function getCsvSettings(): array
    {
        return [
            'use_bom' => true,
            'output_encoding' => 'UTF-8'
        ];
    }
}
