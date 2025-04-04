import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    status: number;
    quantity: number;
    image_url: string;
}

interface EditProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    onSuccess: () => void;
}

export default function EditProductModal({ isOpen, onClose, product, onSuccess }: EditProductModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        status: 1,
        quantity: 0,
        image: null as File | null
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                description: product.description,
                price: product.price.toString(),
                status: product.status,
                quantity: product.quantity,
                image: null
            });
            setImagePreview(product.image_url ? `/product/${product.image_url}` : null);
        }
    }, [product]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) {
                setErrors(prev => ({
                    ...prev,
                    image: ['Kích thước file không được vượt quá 2MB']
                }));
                return;
            }
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.image;
                return newErrors;
            });
            setImagePreview(URL.createObjectURL(file));
            if (errors.image) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.image;
                    return newErrors;
                });
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        const formDataToSend = new FormData();
        formDataToSend.append('_method', 'PUT');
        formDataToSend.append('name', formData.name);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('price', formData.price);
        formDataToSend.append('quantity', formData.quantity.toString());
        formDataToSend.append('status', formData.status.toString());
        if (formData.image) {
            formDataToSend.append('image', formData.image);
        }

        try {
            const response = await axios.post(`/api/products/${product?.id}`, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.status === 200) {
                toast.success('Cập nhật sản phẩm thành công');
                onSuccess();
                onClose();
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.data?.errors) {
                    setErrors(error.response.data.errors);
                } else {
                    toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật sản phẩm');
                }
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !product) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-black">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Chỉnh sửa sản phẩm</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tên sản phẩm</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                    errors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                                required
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Giá</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                    errors.price ? 'border-red-500' : 'border-gray-300'
                                }`}
                                required
                                min="0"
                            />
                            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price[0]}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng</label>
                            <input
                                type="number"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                    errors.quantity ? 'border-red-500' : 'border-gray-300'
                                }`}
                                required
                                min="0"
                            />
                            {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity[0]}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                    errors.status ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                <option value="0">Ngừng bán</option>
                                <option value="1">Đang bán</option>
                                <option value="2">Hết hàng</option>
                            </select>
                            {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status[0]}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={4}
                                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                    errors.description ? 'border-red-500' : 'border-gray-300'
                                }`}
                                required
                            />
                            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description[0]}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh</label>
                            <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 rounded-md transition-colors ${
                                errors.image ? 'border-red-500' : 'border-gray-300 border-dashed hover:border-blue-500'
                            }`}>
                                <div className="space-y-1 text-center">
                                    {imagePreview ? (
                                        <div className="relative">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="mx-auto h-48 w-48 object-cover rounded-md"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImagePreview(null);
                                                    setFormData(prev => ({ ...prev, image: null }));
                                                }}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <div className="flex text-sm text-gray-600">
                                                <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                                    <span>Tải lên hình ảnh</span>
                                                    <input
                                                        type="file"
                                                        onChange={handleImageChange}
                                                        accept="image/*"
                                                        className="sr-only"
                                                    />
                                                </label>
                                                <p className="pl-1">hoặc kéo thả</p>
                                            </div>
                                            <p className="text-xs text-gray-500">PNG, JPG, GIF tối đa 2MB</p>
                                        </>
                                    )}
                                </div>
                            </div>
                            {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image[0]}</p>}
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
                                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 