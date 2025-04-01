<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }
    public function rules(): array
    {
        return [
            'email' => 'required|email',
            'password' => 'required'
        ];
    }
    public function messages(): array
    {
        return [
            'email.required' => 'Vui lòng không bỏ trống!',
            'email.email' => 'Email không hợp lệ!',
            'password.required' => 'Vui lòng không bỏ trống!',
            'password.wrong' => 'Mật khẩu không chính xác!'
        ];
    }
}
