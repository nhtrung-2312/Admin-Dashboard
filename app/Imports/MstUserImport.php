<?php

namespace App\Imports;

use App\Models\MstUser;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\SkipsErrors;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Throwable;
class MstUserImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnError, SkipsOnFailure
{
    use SkipsErrors, SkipsFailures;

    private $rowNumber = 0;

    private $statusMap = [
        'active' => 1,
        'inactive' => 0,
    ];

    public function model(array $row)
    {
        $this->rowNumber++;

        try {
            $user = new MstUser([
                'name' => $row['name'],
                'email' => $row['email'],
                'password' => bcrypt(explode('@', $row['email'])[0]),
                'group_role' => $row['role'],
                'is_active' => $this->statusMap[strtolower($row['status'])] ?? 1,
                'is_delete' => $row['is_delete'] ?? false,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
            return $user;
        } catch (\Exception $e) {
            throw $e;
        }
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:mst_users,email',
            'role' => 'required|string',
            'is_active' => 'nullable|boolean',
            'is_delete' => 'nullable|boolean',
        ];
    }

    public function getRowCount(): int
    {
        return $this->rowNumber;
    }

    public function prepareForValidation($data)
    {
        return array_change_key_case($data, CASE_LOWER);
    }
}
