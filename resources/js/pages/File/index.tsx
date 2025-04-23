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
import { get } from "lodash";

interface Props {
    auth: {
        user: User;
    }
    translations: any;
}

interface FilePreview {
    rows: number;
    columns: number;
    headers: string[];
    previewData: any[];
}

export default function Index({auth, translations} : Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedExport, setSelectedExport] = useState<string>('');
    const [selectedImport, setSelectedImport] = useState<string>('');
    const [cleanImport, setCleanImport] = useState(false);
    const [filePreview, setFilePreview] = useState<FilePreview | null>(null);

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        try {
            console.log(file);


            // const response = await axios.post('/api/files/import', file, {
            //     headers: {
            //         'Content-Type': 'multipart/form-data'
            //     }
            // });
            // setFilePreview(response.data);

            toast.success(translations.file.import_success);
        } catch (error) {
            toast.error(translations.file.import_error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        try {
            console.log(file);


            // const response = await axios.post('/api/files/import', file, {
            //     headers: {
            //         'Content-Type': 'multipart/form-data'
            //     }
            // });
            // setFilePreview(response.data);

            toast.success(translations.file.import_success);
        } catch (error) {
            toast.error(translations.file.import_error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleExport = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post('/api/files/export', {
                table: selectedExport
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
                link.setAttribute('download', `users_${getCurrentTimestamp()}.xlsx`);
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
            console.error('Export error:', error);
            toast.error(translations.file.export_error);
        } finally {
            setIsLoading(false);
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
                                    <div className="border rounded-lg p-6">
                                        <h3 className="text-lg font-medium mb-4">{translations.file.import_title}</h3>
                                        <p className="text-sm text-gray-500 mb-4">{translations.file.import_description}</p>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Chọn bảng</label>
                                                <Select value={selectedImport} onValueChange={setSelectedImport}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Chọn bảng" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="users">Users</SelectItem>
                                                        <SelectItem value="products">Products</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="w-full">
                                                <label htmlFor="file-upload" className="block text-sm font-medium mb-2">
                                                    {translations.file.input_title}
                                                </label>
                                                <input
                                                    type="file"
                                                    id="file-upload"
                                                    onChange={handleFileSelect}
                                                    accept=".xlsx,.xls,.csv"
                                                    disabled={isLoading}
                                                />
                                                <p className="mt-1 text-sm text-red-600 dark:text-red-600" id="file_input_help">
                                                    Only .xlsx, .xls, .csv file. Max: 10MB.
                                                </p>

                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="clean-import"
                                                        checked={cleanImport}
                                                        onCheckedChange={(checked) => setCleanImport(checked as boolean)}
                                                    />
                                                    <label htmlFor="clean-import">Clean Import (Remove old data)</label>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Button 
                                                    className="bg-blue-500 hover:bg-blue-600 text-white"
                                                    disabled={isLoading || !selectedImport}
                                                >
                                                    {isLoading ? translations.file.loading : translations.file.import_button}
                                                </Button>
                                            </div>

                                        </div>
                                    </div>

                                    {/* Export Section */}
                                    <div className="border rounded-lg p-6">
                                        <h3 className="text-lg font-medium mb-4">{translations.file.export_title}</h3>
                                        <p className="text-sm text-gray-500 mb-4">{translations.file.export_description}</p>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Chọn bảng</label>
                                                <Select value={selectedExport} onValueChange={setSelectedExport}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Chọn bảng" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="users">Users</SelectItem>
                                                        <SelectItem value="products">Products</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <Button
                                                onClick={handleExport}
                                                disabled={isLoading || !selectedExport}
                                                className="bg-green-500 hover:bg-green-600 text-white"
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
            </MainLayout>
        </>
    )}
