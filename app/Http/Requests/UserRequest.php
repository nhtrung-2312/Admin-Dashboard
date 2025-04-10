<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserRequest extends FormRequest
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
        $rules = [
            'name' => 'required|string|max:255',
            'is_active' => 'required|boolean',
            'group_role' => 'required|string|in:admin,user',
        ];

        // Nếu là request update
        if ($this->isMethod('put') || $this->isMethod('patch')) {
            $userId = $this->route('user')->id;
            
            // Chỉ validate email nếu email mới khác với email cũ
            if ($this->input('email') !== $this->route('user')->email) {
                $rules['email'] = [
                    'required',
                    'email',
                    'max:255',
                    Rule::unique('mst_users')->ignore($userId),
                ];
            }
        } else {
            // Nếu là request create
            $rules['email'] = 'required|email|max:255|unique:mst_users';
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'name.required' => __('validation.required', ['attribute' => __('user.create_name')]),
            'name.string' => __('validation.string', ['attribute' => __('user.create_name')]),
            'name.max' => __('validation.max.string', ['attribute' => __('user.create_name'), 'max' => 255]),
            'email.required' => __('validation.required', ['attribute' => __('user.create_email')]),
            'email.email' => __('validation.email', ['attribute' => __('user.create_email')]),
            'email.max' => __('validation.max.string', ['attribute' => __('user.create_email'), 'max' => 255]),
            'email.unique' => __('validation.unique', ['attribute' => __('user.create_email')]),
            'group_role.required' => __('validation.required', ['attribute' => __('user.create_group')]),
            'group_role.in' => __('validation.in', ['attribute' => __('user.create_group')]),
            'is_active.required' => __('validation.required', ['attribute' => __('user.create_status')]),
            'is_active.boolean' => __('validation.boolean', ['attribute' => __('user.create_status')]),
        ];
    }
}
