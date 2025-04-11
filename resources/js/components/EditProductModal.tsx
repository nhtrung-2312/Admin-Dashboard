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
    translations: Record<string, any>;
}

export default function EditProductModal({ isOpen, onClose, product, onSuccess, translations }: EditProductModalProps) {
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
                price: formatPrice(product.price.toString()),
                status: product.status,
                quantity: product.quantity,
                image: null
            });
            setImagePreview(product.image_url ? `/uploads/${product.image_url}` : null);
        }
    }, [product]);

    const formatPrice = (value: string) => {
        const numericValue = value.replace(/[^\d]/g, '');
        return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const validateQuantity = (value: string) => {
        const numValue = parseInt(value);
        if (isNaN(numValue) || numValue < 0) {
            return false;
        }
        return true;
    };

    const validatePrice = (value: string) => {
        const numericValue = value.replace(/[^\d]/g, '');
        const numValue = parseInt(numericValue);
        if (isNaN(numValue) || numValue < 0) {
            return false;
        }
        return true;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'price') {
            const numericValue = value.replace(/[^\d]/g, '');
            
            if (numericValue === '' || parseInt(numericValue) < 0) {
                setFormData(prev => ({
                    ...prev,
                    [name]: '0'
                }));
                return;
            }

            const formattedValue = formatPrice(numericValue);
            
            setFormData(prev => ({
                ...prev,
                [name]: formattedValue
            }));
            
            if (errors.price) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.price;
                    return newErrors;
                });
            }
        } else if (name === 'quantity') {
            const numericValue = parseInt(value.replace(/[^\d]/g, '')) || 0;
            
            setFormData(prev => ({
                ...prev,
                [name]: numericValue
            }));
            
            if (errors.quantity) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.quantity;
                    return newErrors;
                });
            }
        } else {
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
            setFormData(prev => ({
                ...prev,
                image: file
            }));
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
        formDataToSend.append('price', formData.price.replace(/[^\d]/g, ''));
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
                toast.success(translations.product.system_update_success);
                onSuccess();
                onClose();
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.data?.errors) {
                    setErrors(error.response.data.errors);
                } else {
                    toast.error(error.response?.data?.message || translations.product.system_update_error);
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
                    <h2 className="text-2xl font-bold">{translations.product.edit_title}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{translations.product.edit_form_name} <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder={translations.product.edit_form_placeholder_name}
                                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                    errors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{translations.product.edit_form_price} <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="price"
                                value={formData.price}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                    errors.price ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder={translations.product.edit_form_placeholder_price}
                            />
                            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price[0]}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{translations.product.edit_form_quantity} <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                    errors.quantity ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Nhập số lượng đang có"
                            />
                            {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity[0]}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{translations.product.edit_form_status} <span className="text-red-500">*</span></label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                    errors.status ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                <option value="0">{translations.product.edit_form_placeholder_status_stop}</option>
                                <option value="1">{translations.product.edit_form_placeholder_status_selling}</option>
                                <option value="2">{translations.product.edit_form_placeholder_status_out}</option>
                            </select>
                            {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status[0]}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">{translations.product.edit_form_desc}</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder={translations.product.edit_form_placeholder_desc}
                                rows={4}
                                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                    errors.description ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description[0]}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">{translations.product.edit_form_image}</label>
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
                                                    <span>{translations.product.edit_form_placeholder_image_title}</span>
                                                    <input
                                                        type="file"
                                                        onChange={handleImageChange}
                                                        accept="image/*"
                                                        className="sr-only"
                                                    />
                                                </label>
                                                <p className="pl-1">{translations.product.edit_form_placeholder_image_subtitle}</p>
                                            </div>
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
                            {translations.product.edit_button_back}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
                                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            {isSubmitting ? translations.product.table_isloading : translations.product.edit_button_submit}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 