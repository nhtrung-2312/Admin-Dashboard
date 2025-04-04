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
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'status' => 'required|in:0,1,2',
            'quantity' => 'required|numeric|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'image_url' => 'nullable|string'
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Tên sản phẩm là bắt buộc',
            'name.max' => 'Tên sản phẩm không được vượt quá 255 ký tự',
            'name.min' => 'Tên sản phẩm phải có ít nhất 5 ký tự',
            'price.required' => 'Giá sản phẩm là bắt buộc',
            'price.numeric' => 'Giá sản phẩm phải là số',
            'price.min' => 'Giá sản phẩm không được âm',
            'status.required' => 'Trạng thái sản phẩm là bắt buộc',
            'status.in' => 'Trạng thái sản phẩm không hợp lệ',
            'image.image' => 'File phải là hình ảnh',
            'image.mimes' => 'Định dạng hình ảnh không hợp lệ',
            'image.max' => 'Kích thước hình ảnh không được vượt quá 2MB',
            'quantity.required' => 'Số lượng sản phẩm là bắt buộc',
            'quantity.numeric' => 'Số lượng sản phẩm phải là số',
            'quantity.min' => 'Số lượng sản phẩm không được âm'
        ];
    }
}