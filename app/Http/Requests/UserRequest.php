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
            'name.required' => 'Tên người dùng là bắt buộc',
            'name.string' => 'Tên người dùng phải là chuỗi',
            'name.max' => 'Tên người dùng không được vượt quá 255 ký tự',
            'email.required' => 'Email là bắt buộc',
            'email.email' => 'Email không hợp lệ',
            'email.max' => 'Email không được vượt quá 255 ký tự',
            'email.unique' => 'Email đã tồn tại',
            'group_role.required' => 'Vai trò là bắt buộc',
            'group_role.in' => 'Vai trò không hợp lệ',
            'is_active.required' => 'Trạng thái là bắt buộc',
            'is_active.boolean' => 'Trạng thái không hợp lệ',
        ];
    }
}
