<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RoleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:50|min:5',
        ];
    }
    
    public function messages(): array
    {
        return [
            'name.required' => __('validation.required', ['attribute' => __('role.table_name')]),
            'name.max' => __('validation.max.string', ['attribute' => __('role.table_name'), 'max' => 50]),
            'name.min' => __('validation.min.string', ['attribute' => __('role.table_name'), 'min' => 5]),
        ];
    }
}
