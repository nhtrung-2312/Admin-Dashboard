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
import { count } from "console";
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

interface FileHistory {
    id: number;
    user: any;
    file_name: string;
    type: 'import' | 'export';
    table_name: string;
    total_records: number;
    status: string;
    created_at: string;
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
    const [histories, setHistories] = useState<FileHistory[]>([]);
    const [activeTab, setActiveTab] = useState('import');
    const [showErrorDetails, setShowErrorDetails] = useState<FileHistory | null>(null);

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
                    'Content-Type': 'multipart/form-data'
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
                toast.error(error.response.data.message);
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
                responseType: 'blob',
                headers: {
                    'Accept': 'text/csv; charset=utf-8',
                }
            });


            const name = response.headers['x-filename'];

            // Tạo blob với charset UTF-8
            const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });

            // Tạo URL từ blob
            const url = URL.createObjectURL(blob);

            // Tạo link tải xuống
            const link = document.createElement('a');
            link.href = url;
            link.download = name;
            link.style.display = 'none';

            // Thêm vào DOM và kích hoạt click
            document.body.appendChild(link);
            link.click();

            // Dọn dẹp
            setTimeout(() => {
                URL.revokeObjectURL(url);
                link.remove();
            }, 100);

            toast.success(translations.file.export_success);
        } catch (error) {
            console.error('Export error:', error);
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

    const fetchHistories = async () => {
        try {
            const response = await axios.get('/api/files/log');
            if (!response.data.data || response.data.data.length === 0) {
                toast.error('Dữ liệu trống!')
            } else {
                setHistories(response.data.data);
            }
        } catch (error) {
            toast.error('Không thể tải lịch sử file');
        }
    };

    const handleDownload = async (id: number) => {
        try {
            const response = await axios.get(`/api/files/history/${id}/download`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `file_${id}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Không thể tải file');
        }
    };

    return (
        <>
            <Head title={translations.file.head_title} />
            <MainLayout translations={translations.nav} user={auth.user}>
                <ToastContainer
                    position="top-right"
                    autoClose={1500}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="light"
                />
                <div className="py-12">
                    <div className="max-w-4/5 mx-auto sm:px-6 lg:px-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 text-gray-900">
                                <div className="mb-8">
                                    <h2 className="text-3xl font-bold text-gray-900">{translations.file.title}</h2>
                                    <p className="mt-2 text-gray-600">{translations.file.subtitle}</p>
                                </div>

                                {/* Tabs */}
                                <div className="mb-8">
                                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                                        <button
                                            className={`py-4 px-8 text-lg font-medium rounded-xl flex-1 transition-all duration-200 ${
                                                activeTab === 'import'
                                                ? 'bg-blue-50 text-blue-600 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                            }`}
                                            onClick={() => setActiveTab('import')}
                                        >
                                            Import
                                        </button>
                                        <button
                                            className={`py-4 px-8 text-lg font-medium rounded-xl flex-1 transition-all duration-200 ${
                                                activeTab === 'export'
                                                ? 'bg-blue-50 text-blue-600 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                            }`}
                                            onClick={() => setActiveTab('export')}
                                        >
                                            Export
                                        </button>
                                        <button
                                            className={`py-4 px-8 text-lg font-medium rounded-xl flex-1 transition-all duration-200 ${
                                                activeTab === 'history'
                                                ? 'bg-blue-50 text-blue-600 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                            }`}
                                            onClick={() => {
                                                setActiveTab('history');
                                                fetchHistories();
                                            }}
                                        >
                                            Lịch sử
                                        </button>
                                    </div>
                                </div>

                                {/* Import Tab */}
                                {activeTab === 'import' && (
                                    <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all duration-200">
                                        <div className="space-y-8">
                                            <div>
                                                <label className="block text-lg font-medium mb-3 text-gray-900">Chọn bảng</label>
                                                <Select value={selectedImport} onValueChange={setSelectedImport}>
                                                    <SelectTrigger className="w-full h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                                                        <SelectValue placeholder="Chọn bảng" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="users">Users</SelectItem>
                                                        <SelectItem value="products">Products</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <label className="block text-lg font-medium mb-3 text-gray-900">Chọn file</label>
                                                <div className="mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-gray-100 border-dashed rounded-2xl hover:border-blue-500 transition-all duration-200">
                                                    <div className="space-y-4 text-center">
                                                        <div className="text-gray-500">
                                                            <p className="text-lg">Kéo thả file vào đây hoặc</p>
                                                            <label className="mt-2 inline-block px-6 py-3 bg-blue-50 text-blue-600 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors duration-200">
                                                                <span>Tải file lên</span>
                                                                <input
                                                                    type="file"
                                                                    className="sr-only"
                                                                    onChange={handleFileSelect}
                                                                    accept=".xlsx,.xls,.csv"
                                                                />
                                                            </label>
                                                        </div>
                                                        <p className="text-sm text-gray-400">XLSX, XLS, CSV tối đa 10MB</p>
                                                    </div>
                                                </div>
                                                {selectedFileName && (
                                                    <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
                                                        {selectedFileName}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <Checkbox
                                                    id="clean-import"
                                                    checked={cleanImport}
                                                    onCheckedChange={(checked) => setCleanImport(checked as boolean)}
                                                    className="text-blue-600 focus:ring-blue-500"
                                                />
                                                <label htmlFor="clean-import" className="text-base text-gray-700">Xóa dữ liệu cũ</label>
                                            </div>

                                            <Button
                                                onClick={handleImport}
                                                disabled={isLoading || !selectedImport || !selectedFile}
                                                className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 disabled:bg-gray-300"
                                            >
                                                {isLoading ? 'Đang xử lý...' : 'Import'}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Export Tab */}
                                {activeTab === 'export' && (
                                    <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all duration-200">
                                        <div className="space-y-8">
                                            <div>
                                                <label className="block text-lg font-medium mb-3 text-gray-900">Chọn bảng</label>
                                                <Select value={selectedExport} onValueChange={setSelectedExport}>
                                                    <SelectTrigger className="w-full h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                                                        <SelectValue placeholder="Chọn bảng" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="users">Users</SelectItem>
                                                        <SelectItem value="products">Products</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {renderFilterForm()}

                                            <Button
                                                onClick={handleExport}
                                                disabled={isLoading || !selectedExport}
                                                className="w-full h-12 text-base bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all duration-200 disabled:bg-gray-300"
                                            >
                                                {isLoading ? 'Đang xử lý...' : 'Export'}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* History Tab */}
                                {activeTab === 'history' && (
                                    <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all duration-200">
                                        <div className="overflow-x-auto -mx-4 sm:mx-0">
                                            <div className="inline-block min-w-full align-middle">
                                                <div className="overflow-hidden">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th scope="col" className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Time</th>
                                                                <th scope="col" className="px-6 py-4 text-center text-sm font-semibold text-gray-900">File</th>
                                                                <th scope="col" className="px-6 py-4 text-center text-sm font-semibold text-gray-900">User</th>
                                                                <th scope="col" className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Type</th>
                                                                <th scope="col" className="hidden sm:table-cell px-6 py-4 text-center text-sm font-semibold text-gray-900">Table</th>
                                                                <th scope="col" className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Status</th>
                                                                <th scope="col" className="hidden sm:table-cell px-6 py-4 text-center text-sm font-semibold text-gray-900">Total Records</th>
                                                                <th scope="col" className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {histories.map((history) => (
                                                                <tr key={history.id} className="hover:bg-gray-50 transition-colors duration-200">
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        {new Date(history.created_at).toLocaleString()}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        <div className="max-w-[150px] truncate mx-auto" title={history.file_name}>
                                                                            {history.file_name}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        <div className="max-w-[150px] truncate mx-auto">
                                                                            {history.user.name}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                        <span className={`px-4 py-2 text-sm font-medium rounded-full ${
                                                                            history.type === 'import'
                                                                            ? 'bg-blue-50 text-blue-700'
                                                                            : 'bg-green-50 text-green-700'
                                                                        }`}>
                                                                            {history.type}
                                                                        </span>
                                                                    </td>
                                                                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        {history.table_name}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                        <span className={`px-4 py-2 text-sm font-medium rounded-full ${
                                                                            history.status === 'success' ? 'bg-green-50 text-green-700' :
                                                                            history.status === 'error' ? 'bg-red-50 text-red-700' :
                                                                            'bg-yellow-50 text-yellow-700'
                                                                        }`}>
                                                                            {history.status}
                                                                        </span>
                                                                    </td>
                                                                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                        {history.total_records}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 justify-center">
                                                                            <Button
                                                                                size="sm"
                                                                                onClick={() => handleDownload(history.id)}
                                                                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                                                            >
                                                                                Download
                                                                            </Button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </MainLayout>
        </>
    );
}
