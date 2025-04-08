<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\App;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function prepareForValidation()
    {
        $locale = $this->header('X-Locale') ?? session('locale') ?? config('app.locale');
        App::setLocale($locale);
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
            'password' => ['required'],
            'remember' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => __('validation.required'),
            'email.email' => __('validation.email'),
            'password.required' => __('validation.required')
        ];
    }
}