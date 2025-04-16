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
            'description' => 'nullable|string|max:255',
            'status' => 'required|in:0,1,2',
            'quantity' => 'required|numeric|min:0|max:2147483647', // int type
            'image' => 'nullable|image|mimes:png,jpg,jpeg|max:2048',
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
            'price.max' => __('validation.max.numeric', ['attribute' => __('product.table_price'), 'max' => 2147483647]),
            'description.max' => __('validation.max.string', ['attribute' => __('product.table_desc'), 'max' => 255]),
            'status.required' => __('validation.required', ['attribute' => __('product.table_status')]),
            'status.in' => __('validation.in', ['attribute' => __('product.table_status')]),
            'image.mimes' => __('validation.mimes', ['attribute' => __('product.table_image'), 'values' => 'jpeg,png,jpg']),
            'image.max' => __('validation.max.file', ['attribute' => __('product.table_image'), 'max' => 2048]),
            'image.image' => __('validation.image', ['attribute' => __('product.table_image')]),
            'quantity.required' => __('validation.required', ['attribute' => __('product.table_quantity')]),
            'quantity.numeric' => __('validation.numeric', ['attribute' => __('product.table_quantity')]),
            'quantity.min' => __('validation.min.numeric', ['attribute' => __('product.table_quantity'), 'min' => 0]),
            'quantity.max' => __('validation.max.numeric', ['attribute' => __('product.table_quantity'), 'max' => 2147483647])
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $file = $this->file('image');
    
            if ($file) {
                $allowedMimes = ['image/jpeg', 'image/png'];
                $allowedExts  = ['jpg', 'jpeg', 'png'];
    
                $mime = $file->getMimeType();
                $ext  = strtolower($file->getClientOriginalExtension());
    
                if (!in_array($mime, $allowedMimes) || !in_array($ext, $allowedExts)) {
                    $validator->errors()->add(
                        'image',
                        __('validation.mimes', ['attribute' => __('product.table_image'), 'values' => 'jpeg,png,jpg'])
                    );
                }
            }
        });
    }
}