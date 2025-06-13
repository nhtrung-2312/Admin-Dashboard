import { User } from "@/types"
import MainLayout from '@/layouts/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Head, router } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/ReactToastify.css';
import axios from 'axios';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Transgender } from "lucide-react";
import TablePagination from '@/components/TablePagination';
import useDebounce from '@/hooks/useDebounce';

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
        file_type: string;
        start_date: string;
        end_date: string;
        sort_field: string;
        sort_direction: string;
    };
    products: {
        status: number;
        price_from: number;
        price_to: number;
        file_type: string;
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
    status: number;
    created_at: string;
}

interface LogFilters {
    search: string;
    start_date: string;
    end_date: string;
    type: string;
    status: string;
}

interface PaginationMeta {
    current_page: number;
    from: number;
    last_page: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    path: string;
    per_page: number;
    to: number;
    total: number;
}

export default function Index({auth, roles, translations} : Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedExport, setSelectedExport] = useState<string>('');
    const [selectedImport, setSelectedImport] = useState<string>('');
    const [cleanImport, setCleanImport] = useState(false);
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        users: {
            is_active: 0,
            group_role: '',
            start_date: '',
            file_type: 'csv',
            end_date: '',
            sort_field: 'id',
            sort_direction: 'asc'
        },
        products: {
            status: -1,
            price_from: 0,
            price_to: 0,
            file_type: 'csv',
            start_date: '',
            end_date: '',
            sort_field: 'id',
            sort_direction: 'asc'
        }
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedFileName, setSelectedFileName] = useState<string>('');
    const [histories, setHistories] = useState<FileHistory[]>([]);
    const [activeTab, setActiveTab] = useState('import');

    const searchParams = new URLSearchParams(window.location.search);

    const [logFilters, setLogFilters] = useState<LogFilters>({
        search: searchParams.get('search') || '',
        start_date: searchParams.get('start_date') || '',
        end_date: searchParams.get('end_date') || '',
        type: searchParams.get('type') || 'all',
        status: searchParams.get('status') || 'all'
    });

    const [tempLogFilters, setTempLogFilters] = useState<LogFilters>({
        search: searchParams.get('search') || '',
        start_date: searchParams.get('start_date') || '',
        end_date: searchParams.get('end_date') || '',
        type: searchParams.get('type') || 'all',
        status: searchParams.get('status') || 'all'
    });

    const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
    const [perPage, setPerPage] = useState(Number(searchParams.get('per_page')) || 10);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);

    const debouncedSearch = useDebounce(tempLogFilters.search, 500);

    useEffect(() => {
        const newSearchParams = new URLSearchParams(window.location.search);
        setLogFilters({
            search: newSearchParams.get('search') || '',
            start_date: newSearchParams.get('start_date') || '',
            end_date: newSearchParams.get('end_date') || '',
            type: newSearchParams.get('type') || 'all',
            status: newSearchParams.get('status') || 'all'
        });
        setTempLogFilters({
            search: newSearchParams.get('search') || '',
            start_date: newSearchParams.get('start_date') || '',
            end_date: newSearchParams.get('end_date') || '',
            type: newSearchParams.get('type') || 'all',
            status: newSearchParams.get('status') || 'all'
        });
        setCurrentPage(Number(newSearchParams.get('page')) || 1);
        setPerPage(Number(newSearchParams.get('per_page')) || 10);
    }, [window.location.search]);

    useEffect(() => {
        if (activeTab === 'history') {
            handleLogSearch();
        }
    }, [debouncedSearch]);

    const updateUrlAndFetch = (params: Record<string, any>) => {
        const filteredParams = Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, any>);

        router.get(window.location.pathname, filteredParams, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    const handleLogFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTempLogFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleLogSearch = () => {
        setIsSearching(true);
        setLogFilters(tempLogFilters);
        setCurrentPage(1);
        updateUrlAndFetch({
            page: 1,
            per_page: perPage,
            search: tempLogFilters.search,
            start_date: tempLogFilters.start_date,
            end_date: tempLogFilters.end_date,
            type: tempLogFilters.type,
            status: tempLogFilters.status
        });
    };

    const handleLogReset = () => {
        const resetFilters = {
            search: '',
            start_date: '',
            end_date: '',
            type: 'all',
            status: 'all'
        };
        setTempLogFilters(resetFilters);
        setLogFilters(resetFilters);
        setCurrentPage(1);
        setPerPage(10);
        updateUrlAndFetch({
            page: 1,
            per_page: 10
        });
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        updateUrlAndFetch({
            page,
            per_page: perPage,
            search: logFilters.search,
            start_date: logFilters.start_date,
            end_date: logFilters.end_date,
            type: logFilters.type,
            status: logFilters.status
        });
    };

    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
        updateUrlAndFetch({
            page: 1,
            per_page: newPerPage,
            search: logFilters.search,
            start_date: logFilters.start_date,
            end_date: logFilters.end_date,
            type: logFilters.type,
            status: logFilters.status
        });
    };

    const handleImport = async () => {
        if (!auth.user.permissions.includes('import_files')) {
            toast.error('Bạn không có quyền thực hiện chức năng này');
            return;
        }

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
        if (!auth.user.permissions.includes('export_files')) {
            toast.error('Bạn không có quyền thực hiện chức năng này');
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post('/api/files/export', {
                table: selectedExport,
                filter: { ...filterOptions[selectedExport as keyof FilterOptions] }
            });

            if(response.status === 201) {
                toast.success(response.data.message)
            }
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
                                <SelectTrigger className="w-full h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
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
                                <SelectTrigger className="w-full h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
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

                        <div>
                            <label className="block text-sm font-medium mb-2">{translations.file.export_file_type_placeholder}</label>
                            <Select
                                value={filterOptions.users.file_type}
                                onValueChange={(value) =>
                                    setFilterOptions(prev => ({
                                        ...prev,
                                        users: { ...prev.users, file_type: value }
                                    }))
                                }
                            >
                                <SelectTrigger className="w-full h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem key="csv" value="csv">CSV</SelectItem>
                                    <SelectItem key="xlsx" value="xlsx">XLSX</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
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
                                <SelectTrigger className="w-full h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
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
                                    className="w-full h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
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
                                    className="w-full h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
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

                        <div>
                            <label className="block text-sm font-medium mb-2">{translations.file.export_file_type_placeholder}</label>
                            <Select
                                value={filterOptions.products.file_type}
                                onValueChange={(value) =>
                                    setFilterOptions(prev => ({
                                        ...prev,
                                        products: { ...prev.products, file_type: value }
                                    }))
                                }
                            >
                                <SelectTrigger className="w-full h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem key="csv" value="csv">CSV</SelectItem>
                                    <SelectItem key="xlsx" value="xlsx">XLSX</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                );
        }
    };

    const fetchHistories = async () => {
        if (!auth.user.permissions.includes('view_files')) {
            toast.error('Bạn không có quyền thực hiện chức năng này');
            return;
        }

        try {
            const response = await axios.get('/api/files/log', {
                params: {
                    page: currentPage,
                    per_page: perPage,
                    search: logFilters.search,
                    start_date: logFilters.start_date,
                    end_date: logFilters.end_date,
                    type: logFilters.type,
                    status: logFilters.status
                }
            });
            if (!response.data.data || response.data.data.length === 0) {
                setHistories([]);
                setMeta(response.data.meta);
            } else {
                setHistories(response.data.data);
                setMeta(response.data.meta);
            }
        } catch (error) {
            toast.error('Không thể tải lịch sử file');
        } finally {
            setIsSearching(false);
        }
    };

    const handleDownload = async (id: number) => {
        if (!auth.user.permissions.includes('download_files')) {
            toast.error('Bạn không có quyền thực hiện chức năng này');
            return;
        }

        try {
            const response = await axios.get(`/api/files/download/${id}`, {
                responseType: 'blob'
            });

            const name = response.headers['x-filename'];
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');

            link.href = url;
            link.setAttribute('download', name);
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
                <div className="py-12">
                    <div className="max-w-4/5 mx-auto sm:px-6 lg:px-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 text-gray-900">
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold text-gray-900">{translations.file.title}</h2>
                                    <p className="text-sm mt-2 text-gray-600">{translations.file.subtitle}</p>
                                </div>

                                {/* Tabs */}
                                <div className="mb-8">
                                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                                        <button
                                            className={`py-4 px-8 text-md font-medium rounded-xl flex-1 transition-all duration-200 ${
                                                activeTab === 'import'
                                                ? 'bg-blue-50 text-blue-600 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                            }`}
                                            onClick={() => setActiveTab('import')}
                                            hidden={!auth.user.permissions.includes('import_files')}
                                        >
                                            Import
                                        </button>
                                        <button
                                            className={`py-4 px-8 text-md font-medium rounded-xl flex-1 transition-all duration-200 ${
                                                activeTab === 'export'
                                                ? 'bg-blue-50 text-blue-600 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                            }`}
                                            onClick={() => setActiveTab('export')}
                                            hidden={!auth.user.permissions.includes('export_files')}
                                        >
                                            Export
                                        </button>
                                        <button
                                            className={`py-4 px-8 text-md font-medium rounded-xl flex-1 transition-all duration-200 ${
                                                activeTab === 'history'
                                                ? 'bg-blue-50 text-blue-600 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                            }`}
                                            onClick={() => {
                                                setActiveTab('history');
                                                fetchHistories();
                                            }}
                                            hidden={!auth.user.permissions.includes('view_files')}
                                        >
                                            Log
                                        </button>
                                    </div>
                                </div>

                                {/* Import Tab */}
                                {activeTab === 'import' && auth.user.permissions.includes('import_files') && (
                                    <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all duration-200">
                                        <div className="space-y-8">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">{translations.file.table}</label>
                                                <Select value={selectedImport} onValueChange={setSelectedImport}>
                                                    <SelectTrigger className="w-facll h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                                                        <SelectValue placeholder={translations.file.table_placeholder} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="users">{translations.file.table_user}</SelectItem>
                                                        <SelectItem value="products">{translations.file.table_product}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <label className="block text-lg font-medium mb-3 text-gray-900">Chọn file</label>
                                                <div className="mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-gray-100 border-dashed rounded-2xl hover:border-blue-500 transition-all duration-200">
                                                    <div className="space-y-4 text-center">
                                                        <div className="text-gray-500">
                                                            <p className="text-lg">{translations.file.import_subtitle}</p>
                                                            <label className="mt-2 inline-block px-6 py-3 bg-blue-50 text-blue-600 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors duration-200">
                                                                <span>{translations.file.import_button}</span>
                                                                <input
                                                                    type="file"
                                                                    className="sr-only"
                                                                    onChange={handleFileSelect}
                                                                    accept=".xlsx,.xls,.csv"
                                                                />
                                                            </label>
                                                        </div>
                                                        <p className="text-sm text-gray-400">{translations.file.import_file_subtitle}</p>
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
                                                <label htmlFor="clean-import" className="text-base text-gray-700">{translations.file.import_clean}</label>
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
                                {activeTab === 'export' && auth.user.permissions.includes('export_files') && (
                                    <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all duration-200">
                                        <div className="space-y-8">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">{translations.file.table}</label>
                                                <Select value={selectedExport} onValueChange={setSelectedExport}>
                                                    <SelectTrigger className="w-full h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                                                        <SelectValue placeholder={translations.file.table_placeholder} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="users">{translations.file.table_user}</SelectItem>
                                                        <SelectItem value="products">{translations.file.table_product}</SelectItem>
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
                                {activeTab === 'history' && auth.user.permissions.includes('view_files') && (
                                    <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all duration-200">
                                        <div className="mb-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">{translations.file.log_search}</label>
                                                    <div className="relative">
                                                        <Input
                                                            type="text"
                                                            name="search"
                                                            value={tempLogFilters.search}
                                                            onChange={handleLogFilterChange}
                                                            placeholder={translations.file.log_search_placeholder}
                                                            className="w-full pr-10"
                                                        />
                                                        {isSearching && (
                                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">{translations.file.log_type}</label>
                                                    <Select
                                                        value={tempLogFilters.type}
                                                        onValueChange={(value) => setTempLogFilters(prev => ({ ...prev, type: value }))}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder={translations.file.log_type_placeholder} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">{translations.file.log_type_all}</SelectItem>
                                                            <SelectItem value="import">{translations.file.log_type_import}</SelectItem>
                                                            <SelectItem value="export">{translations.file.log_type_export}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">{translations.file.log_status}</label>
                                                    <Select
                                                        value={tempLogFilters.status}
                                                        onValueChange={(value) => setTempLogFilters(prev => ({ ...prev, status: value }))}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder={translations.file.log_status_placeholder} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">{translations.file.log_status_all}</SelectItem>
                                                            <SelectItem value="1">{translations.file.log_status_success}</SelectItem>
                                                            <SelectItem value="2">{translations.file.log_status_partial}</SelectItem>
                                                            <SelectItem value="0">{translations.file.log_status_error}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">{translations.file.log_date_range}</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <Input
                                                            type="date"
                                                            name="start_date"
                                                            value={tempLogFilters.start_date}
                                                            onChange={handleLogFilterChange}
                                                            className="w-full"
                                                        />
                                                        <Input
                                                            type="date"
                                                            name="end_date"
                                                            value={tempLogFilters.end_date}
                                                            onChange={handleLogFilterChange}
                                                            className="w-full"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    onClick={handleLogReset}
                                                    className="bg-gray-700 hover:bg-gray-800 text-white"
                                                    disabled={isSearching}
                                                >
                                                    {translations.file.log_reset}
                                                </Button>
                                                <Button
                                                    onClick={handleLogSearch}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white"
                                                    disabled={isSearching}
                                                >
                                                    {translations.file.log_search_button}
                                                </Button>
                                            </div>
                                        </div>

                                        {meta && (
                                            <div className="mb-4">
                                                <TablePagination
                                                    translations={translations.pagination}
                                                    links={meta.links}
                                                    from={meta.from}
                                                    to={meta.to}
                                                    total={meta.total}
                                                    perPage={perPage}
                                                    currentPage={currentPage}
                                                    onPerPageChange={handlePerPageChange}
                                                    onPageChange={handlePageChange}
                                                />
                                            </div>
                                        )}

                                        <div className="overflow-x-auto -mx-4 sm:mx-0">
                                            <div className="inline-block min-w-full align-middle">
                                                <div className="overflow-hidden">
                                                    {isSearching ? (
                                                        <div className="text-center py-8">
                                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                                            <p className="mt-2 text-gray-500">Đang tìm kiếm...</p>
                                                        </div>
                                                    ) : histories.length === 0 ? (
                                                        <div className="text-center py-8">
                                                            <p className="text-gray-500">Không tìm thấy kết quả nào</p>
                                                        </div>
                                                    ) : (
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
                                                                                history.status === 1 ? 'bg-green-50 text-green-700' :
                                                                                    history.status === 0 ? 'bg-red-50 text-red-700' :
                                                                                    history.status === 2 ? 'bg-yellow-50 text-yellow-700' :
                                                                                    history.status === 3 ? 'bg-blue-50 text-blue-700' : ''
                                                                            }`}>
                                                                                {history.status === 1 ? 'Success' :
                                                                                 history.status === 0 ? 'Error' :
                                                                                 history.status === 2 ? 'Partial' :
                                                                                 history.status === 3 ? 'On working' : ''}
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
                                                                                    className="w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm text-center"
                                                                                    hidden={!auth.user.permissions.includes('download_files')}
                                                                                >
                                                                                    Download
                                                                                </Button>
                                                                                <Button
                                                                                    size="sm"
                                                                                    onClick={() => router.visit(`/files/details/${history.id}`)}
                                                                                    className="w-full sm:w-auto px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm text-center"
                                                                                    hidden={!auth.user.permissions.includes('view_files')}
                                                                                >
                                                                                    Details
                                                                                </Button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    )}
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
