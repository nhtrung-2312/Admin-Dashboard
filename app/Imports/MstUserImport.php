<?php

namespace App\Imports;

use App\Models\MstUser;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Illuminate\Support\Facades\Hash;

class MstUserImport implements ToModel, WithHeadingRow, WithValidation
{
    public function model(array $row)
    {
        return new MstUser([
            'name' => $row['name'],
            'email' => $row['email'],
            'password' => Hash::make($row['password']),
            'group_role' => $row['group_role'],
            'is_active' => $row['is_active'] ?? true,
            'is_delete' => $row['is_delete'] ?? false,
        ]);
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:mst_users,email',
            'password' => 'required|min:6',
            'group_role' => 'required|string',
        ];
    }
}
