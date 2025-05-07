<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => 'required|mimes:xlsx,xls,csv',
            'table' => 'required|string'
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => __('validation.required', ['attribute' => __('file.import_file_required')]),
            'file.mimes' => __('validation.mimes', ['attribute' => __('file.import_file_required'), 'values' => 'xlsx, xls, csv']),
            'table.required' => __('validation.required', ['attribute' => __('file.import_table_required')]),
            'table.string' => __('validation.string', ['attribute' => __('file.import_table_string')]),
        ];
    }
}
