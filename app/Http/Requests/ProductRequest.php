<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;


class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255|min:5',
            'price' => 'required|numeric|min:0|max:2147483647', // int type
            'description' => 'nullable|string',
            'status' => 'required|in:0,1,2',
            'quantity' => 'required|numeric|min:0|max:2147483647', // int type
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'image_url' => 'nullable|string'
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => __('validation.required', ['attribute' => __('product.table_name')]),
            'name.max' => __('validation.max.string', ['attribute' => __('product.table_name'), 'max' => 255]),
            'name.min' => __('validation.min.string', ['attribute' => __('product.table_name'), 'min' => 5]),
            'price.required' => __('validation.required', ['attribute' => __('product.table_price')]),
            'price.numeric' => __('validation.numeric', ['attribute' => __('product.table_price')]),
            'price.min' => __('validation.min.numeric', ['attribute' => __('product.table_price'), 'min' => 0]),
            'price.max' => __('validation.max.numeric', ['attribute' => 'price', 'max' => 2147483647]),
            'status.required' => __('validation.required', ['attribute' => __('product.table_status')]),
            'status.in' => __('validation.in', ['attribute' => __('product.table_status')]),
            'image.image' => __('validation.image', ['attribute' => 'image']),
            'image.mimes' => __('validation.mimes', ['attribute' => 'image', 'values' => 'jpeg,png,jpg']),
            'image.max' => __('validation.max.file', ['attribute' => 'image', 'max' => 2048]),
            'quantity.required' => __('validation.required', ['attribute' => 'quantity']),
            'quantity.numeric' => __('validation.numeric', ['attribute' => 'quantity']),
            'quantity.min' => __('validation.min.numeric', ['attribute' => 'quantity', 'min' => 0]),
            'quantity.max' => __('validation.max.numeric', ['attribute' => 'quantity', 'max' => 2147483647])
        ];
    }
}