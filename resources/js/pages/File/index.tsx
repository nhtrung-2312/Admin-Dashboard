import { User } from "@/types"
import MainLayout from '@/layouts/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Head } from '@inertiajs/react';
import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/ReactToastify.css';
import axios from 'axios';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCurrentTimestamp } from '@/hooks/getCurrentTimeStamp';

interface Props {
    auth: {
        user: User;
    }
    translations: any;
    roles: string[];
}
interface FilterOptions {
    users: {
        is_active: number;
        group_role: string;
        start_date: string;
        end_date: string;
        sort_field: string;
        sort_direction: string;
    };
    products: {
        status: number;
        price_from: number;
        price_to: number;
        start_date: string;
        end_date: string;
        sort_field: string;
        sort_direction: string;
    };
}

export default function Index({auth, roles, translations} : Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedExport, setSelectedExport] = useState<string>('');
    const [selectedImport, setSelectedImport] = useState<string>('');
    const [cleanImport, setCleanImport] = useState(false);
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        users: {
            is_active: 0,
            group_role: '',
            start_date: '',
            end_date: '',
            sort_field: 'created_at',
            sort_direction: 'desc'
        },
        products: {
            status: -1,
            price_from: 0,
            price_to: 0,
            start_date: '',
            end_date: '',
            sort_field: 'created_at',
            sort_direction: 'desc'
        }
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedFileName, setSelectedFileName] = useState<string>('');

    const handleImport = async () => {
        if (!selectedImport || !selectedFile) {
            toast.error('Vui lòng chọn bảng và file!');
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post('/api/files/import', {
                file: selectedFile,
                table: selectedImport,
                clean: cleanImport.toString()
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            toast.success(response.data.message || translations.file.import_success);
            setSelectedFile(null);
            setSelectedFileName('');

        } catch (error: any) {
            // Xử lý các loại lỗi khác nhau
            if (error.response?.status === 422) {
                // Lỗi validation
                const errors = error.response.data.errors;
                if (Array.isArray(errors)) {
                    errors.forEach((err: string) => toast.error(err));
                } else {
                    toast.error(error.response.data.message || translations.file.import_error);
                }
            } else {
                console.log(error.response.data.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        setSelectedFileName(file.name);
    };

    const handleExport = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post('/api/files/export', {
                table: selectedExport,
                filter: { ...filterOptions[selectedExport as keyof FilterOptions] }
            }, {
                responseType: 'blob'
            });

            const contentType = response.headers['content-type'];
            if (contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                // Tạo URL từ blob
                const url = window.URL.createObjectURL(new Blob([response.data], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                }));

                // Tạo link tải xuống
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${selectedExport}_${getCurrentTimestamp()}.xlsx`);
                document.body.appendChild(link);
                link.click();

                // Dọn dẹp
                window.URL.revokeObjectURL(url);
                document.body.removeChild(link);

                toast.success(translations.file.export_success);
            } else {
                // Xử lý lỗi
                const reader = new FileReader();
                reader.onload = () => {
                    const errorResponse = JSON.parse(reader.result as string);
                    toast.error(errorResponse.message || translations.file.export_error);
                };
                reader.readAsText(response.data);
            }
        } catch (error) {
            toast.error(translations.file.export_error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderFilterForm = () => {
        if (!selectedExport) return null;

        switch(selectedExport) {
            case 'users':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">{translations.file.export_status}</label>
                            <Select
                                value={filterOptions.users.is_active.toString()}
                                onValueChange={(value) =>
                                    setFilterOptions((prev: FilterOptions) => ({
                                        ...prev,
                                        users: { ...prev.users, is_active: parseInt(value) }
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={translations.file.export_status_placeholder} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">{translations.file.export_status_all}</SelectItem>
                                    <SelectItem value="1">{translations.file.export_status_online}</SelectItem>
                                    <SelectItem value="2">{translations.file.export_status_offline}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">{translations.file.export_role}</label>
                            <Select
                                value={filterOptions.users.group_role}
                                onValueChange={(value) =>
                                    setFilterOptions(prev => ({
                                        ...prev,
                                        users: { ...prev.users, group_role: value }
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={translations.file.export_role_placeholder} />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem key={role} value={role}>
                                            {role.charAt(0).toUpperCase() + role.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Thêm các filter khác cho user */}
                    </div>
                );

            case 'products':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">{translations.file.export_status}</label>
                            <Select
                                value={filterOptions.products.status.toString()}
                                onValueChange={(value) =>
                                    setFilterOptions(prev => ({
                                        ...prev,
                                        products: { ...prev.products, status: parseInt(value) }
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="-1">{translations.file.export_status_all}</SelectItem>
                                    <SelectItem value="0">{translations.file.export_product_stop}</SelectItem>
                                    <SelectItem value="1">{translations.file.export_product_sell}</SelectItem>
                                    <SelectItem value="2">{translations.file.export_product_out}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">{translations.file.export_price_range_min}</label>
                                <Input
                                    type="text"
                                    min="0"
                                    maxLength={10}
                                    value={filterOptions.products.price_from || ''}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value);
                                        setFilterOptions(prev => ({
                                            ...prev,
                                            products: {
                                                ...prev.products,
                                                price_from: isNaN(value) ? 0 : value
                                            }
                                        }));
                                    }}
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">{translations.file.export_price_range_max}</label>
                                <Input
                                    type="text"
                                    min="0"
                                    maxLength={10}
                                    value={filterOptions.products.price_to || ''}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value);
                                        setFilterOptions(prev => ({
                                            ...prev,
                                            products: {
                                                ...prev.products,
                                                price_to: isNaN(value) ? 0 : value
                                            }
                                        }));
                                    }}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        {/* Thêm các filter khác cho product */}
                    </div>
                );
        }
    };

    return (
        <>
            <Head title={translations.file.head_title} />
            <MainLayout translations={translations.nav} user={auth.user}>
                <ToastContainer />
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 text-gray-900">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-semibold">{translations.file.title}</h2>
                                    <p className="text-sm text-gray-500 mt-1">{translations.file.subtitle}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Import Section */}
                                    <div className="border rounded-lg p-6 shadow-lg">
                                        <h3 className="text-lg font-semibold mb-4">{translations.file.import_title}</h3>
                                        <p className="text-sm text-gray-500 mb-6">{translations.file.import_description}</p>

                                        <div className="space-y-6">
                                            {/* Table Select */}
                                            <div>
                                                <label className="block text-sm font-medium mb-2">{translations.file.table_import}</label>
                                                <Select value={selectedImport} onValueChange={setSelectedImport}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={translations.file.table_placeholder} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="users">{translations.file.table_user}</SelectItem>
                                                        <SelectItem value="products">{translations.file.table_product}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* File Input */}
                                            <div>
                                                <label htmlFor="file-upload" className="block text-sm font-medium mb-2">
                                                    {translations.file.input_title}
                                                </label>
                                                <div className="flex items-center space-x-4">
                                                    <input
                                                        type="file"
                                                        id="file-upload"
                                                        onChange={handleFileSelect}
                                                        accept=".xlsx,.xls,.csv"
                                                        disabled={isLoading}
                                                        className="file-input file-input-bordered file-input-primary w-full"
                                                    />
                                                    {selectedFileName && (
                                                        <span className="text-xs text-gray-500">{selectedFileName}</span>
                                                    )}
                                                </div>
                                                <p className="mt-2 text-xs text-gray-400" id="file_input_help">
                                                    {translations.file.import_file_subtitle}
                                                </p>
                                            </div>

                                            {/* Clean Import Checkbox */}
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="clean-import"
                                                    checked={cleanImport}
                                                    onCheckedChange={(checked) => setCleanImport(checked as boolean)}
                                                    className="text-blue-600"
                                                />
                                                <label htmlFor="clean-import" className="text-sm">{translations.file.import_clean}</label>
                                            </div>

                                            {/* Import Button */}
                                            <div>
                                                <Button
                                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
                                                    disabled={isLoading || !selectedImport || !selectedFileName}
                                                    onClick={handleImport}
                                                >
                                                    {isLoading ? translations.file.loading : translations.file.import_button}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Export Section */}
                                    <div className="border rounded-lg p-6 shadow-lg">
                                        <h3 className="text-lg font-semibold mb-4">{translations.file.export_title}</h3>
                                        <p className="text-sm text-gray-500 mb-6">{translations.file.export_description}</p>

                                        <div className="space-y-6">
                                            {/* Table Select */}
                                            <div>
                                                <label className="block text-sm font-medium mb-2">{translations.file.table_export}</label>
                                                <Select value={selectedExport} onValueChange={setSelectedExport}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={translations.file.table_placeholder} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="users">{translations.file.table_user}</SelectItem>
                                                        <SelectItem value="products">{translations.file.table_product}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Render Filter Form */}
                                            {renderFilterForm()}

                                            {/* Export Button */}
                                            <div>
                                                <Button
                                                    onClick={handleExport}
                                                    disabled={isLoading || !selectedExport}
                                                    className={`w-full py-2 rounded-lg ${isLoading ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-700'} text-white`}
                                                >
                                                    {isLoading ? translations.file.loading : translations.file.export_button}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </MainLayout>
        </>
    )}
