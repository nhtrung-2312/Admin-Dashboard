import MainLayout from "@/layouts/main-layout";
import { User } from "@/types";
import { useState } from "react";
import axios from "axios";
import { toast, ToastContainer, Bounce } from "react-toastify";
import "react-toastify/ReactToastify.css";
import { router } from "@inertiajs/react";

interface Props {
    auth: {
        user: User;
    };
    translations: Record<string, any>;
}

interface FormErrors {
    name?: string[];
    description?: string[];
    price?: string[];
    quantity?: string[];
    status?: string[];
    image?: string[];
}

export default function Create({ auth, translations }: Props) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        quantity: 0,
        status: 1,
        image: null as File | null
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

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
            if (value === '' || parseInt(value.replace(/[^\d]/g, '')) < 0) {
                setFormData(prev => ({
                    ...prev,
                    [name]: '0'
                }));
                return;
            }

            const numericValue = value.replace(/[^\d]/g, '').replace(/^0+/, '') || '0';
            const formattedValue = formatPrice(numericValue);
            
            setFormData(prev => ({
                ...prev,
                [name]: formattedValue
            }));
            
            if (errors.price) {
                setErrors(prev => ({
                    ...prev,
                    price: undefined
                }));
            }
        } else if (name === 'quantity') {
            if (value === '' || parseInt(value) < 0) {
                setFormData(prev => ({
                    ...prev,
                    [name]: 0
                }));
            }

            const numericValue = parseInt(value.replace(/^0+/, '')) || 0;
            
            if (errors.quantity) {
                setErrors(prev => ({
                    ...prev,
                    quantity: undefined
                }));
            }
            
            setFormData(prev => ({
                ...prev,
                [name]: numericValue
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));

            if (errors[name as keyof FormErrors]) {
                setErrors(prev => ({
                    ...prev,
                    [name]: undefined
                }));
            }
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) {
                setErrors(prev => ({
                    ...prev,
                    image: [translations.product.create_form_placeholder_image_subtitle]
                }));
                return;
            }
            setFormData(prev => ({
                ...prev,
                image: file
            }));
            setImagePreview(URL.createObjectURL(file));
            
            if (errors.image) {
                setErrors(prev => ({
                    ...prev,
                    image: undefined
                }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('price', formData.price.replace(/[^\d]/g, ''));
        formDataToSend.append('quantity', formData.quantity.toString());
        formDataToSend.append('status', formData.status.toString());
        if (formData.image) {
            formDataToSend.append('image', formData.image);
        }

        try {
            const response = await axios.post('/api/products', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.status === 200) {
                toast.success(translations.product.system_create_success, {
                    onClose: () => {
                        router.get('/products');
                    }
                });
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                toast.error(translations.product.system_create_error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <MainLayout user={auth.user} translations={translations.nav}>
            <ToastContainer
                position="top-right"
                autoClose={1000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
                transition={Bounce}
            />
            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-8 text-gray-900">
                            <div className="flex justify-between items-center mb-8">
                                <h1 className="text-2xl font-bold text-gray-800">{translations.product.create_title}</h1>
                                <button
                                    onClick={() => router.get('/products')}
                                    className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    {translations.product.create_button_back}
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">{translations.product.create_form_name} <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                                    errors.name ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                placeholder={translations.product.create_form_placeholder_name}
                                            />
                                            {errors.name && (
                                                <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">{translations.product.create_form_desc}</label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleInputChange}
                                                rows={4}
                                                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                                    errors.description ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                placeholder={translations.product.create_form_placeholder_desc}
                                            />
                                            {errors.description && (
                                                <p className="mt-1 text-sm text-red-600">{errors.description[0]}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">{translations.product.create_form_price} <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                name="price"
                                                value={formData.price}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                                    errors.price ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                placeholder={translations.product.create_form_placeholder_price}
                                            />
                                            {errors.price && (
                                                <p className="mt-1 text-sm text-red-600">{errors.price[0]}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">{translations.product.create_form_quantity} <span className="text-red-500">*</span></label>
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
                                            {errors.quantity && (
                                                <p className="mt-1 text-sm text-red-600">{errors.quantity[0]}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">{translations.product.create_form_status} <span className="text-red-500">*</span></label>
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                                    errors.status ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            >
                                                <option value="1">{translations.product.create_form_placeholder_status_selling}</option>
                                                <option value="0">{translations.product.create_form_placeholder_status_stop}</option>
                                                <option value="2">{translations.product.create_form_placeholder_status_out}</option>
                                            </select>
                                            {errors.status && (
                                                <p className="mt-1 text-sm text-red-600">{errors.status[0]}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">{translations.product.create_form_image}</label>
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
                                                                    if (errors.image) {
                                                                        setErrors(prev => ({
                                                                            ...prev,
                                                                            image: undefined
                                                                        }));
                                                                    }
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
                                                            <div className="flex text-sm text-gray-600 items-center justify-center">
                                                                <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                                                    <p>{translations.product.create_form_placeholder_image_title}</p>
                                                                    <input
                                                                        type="file"
                                                                        onChange={handleImageChange}
                                                                        accept="image/*"
                                                                        className="sr-only"
                                                                    />
                                                                </label>
                                                            </div>
                                                            <p className="text-xs text-gray-500">{translations.product.create_form_placeholder_image_subtitle}</p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            {errors.image && (
                                                <p className="mt-1 text-sm text-red-600">{errors.image[0]}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-6">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors ${
                                            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                {translations.product.table_isloading}
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                {translations.product.create_button_submit}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
