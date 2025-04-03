import { User } from '@/types';
import MainLayout from '@/layouts/main-layout';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import TablePagination from '@/components/TablePagination';
import axios from 'axios';
import { Bounce, ToastContainer, toast } from 'react-toastify';
import 'react-toastify/ReactToastify.css'
import { router } from '@inertiajs/react'
import { usePage } from '@inertiajs/react'
import { debounce } from 'lodash';

interface Props {
    auth: {
        user: User;
    };
}

interface UserData {
    id: number;
    name: string;
    email: string;
    group_role: string;
    is_active: boolean;
    is_delete: boolean;
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

interface Filters {
    name: string;
    status: string;
    priceFrom: string;
    priceTo: string;
}

export default function Index({ auth }: Props) {
    const searchParams = new URLSearchParams(window.location.search);

    const [currentPage, setCurrentPage] = useState<number>(Number(searchParams.get('page')) || 1);
    const [perPage, setPerPage] = useState<number>(Number(searchParams.get('per_page')) || 10);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
    };

    const fetchProducts = async (page: number = 1) => {
        setIsLoading(true);
        try {
            const response = await axios.get('/api/products', {
                params: {
                    page,
                    per_page: perPage
                }
            });
            setProducts(response.data.data);
            setMeta(response.data.meta);
        } catch (error) {
            toast.error('Không thể tải danh sách sản phẩm.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts(currentPage);
    }, []);

    useEffect(() => {
        const page = Number(searchParams.get('page')) || 1;
        const per_page = Number(searchParams.get('per_page')) || 10;

        if (page !== currentPage) setCurrentPage(page);
        if (per_page !== perPage) setPerPage(per_page);
    }, [searchParams]);

    useEffect(() => {
        fetchProducts(currentPage);
    }, [currentPage, perPage]);

    return (
        <MainLayout user={auth.user}>
            <ToastContainer
                position="top-right"
                autoClose={3000}
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
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h1 className="text-2xl font-bold mb-6">Sản phẩm</h1>

                            {isLoading ? (
                                <div className="text-center py-4">Đang tải...</div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        STT
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Tên sản phẩm
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Mô tả
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Giá
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Trạng thái
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Thao tác
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {products.map((product, index) => (
                                                    <tr key={product.id}>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {meta?.from ? meta.from + index : index + 1}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {product.name}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {product.description}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {product.price.toLocaleString('vi-VN')} VNĐ
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                product.status === 1
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : product.status === 0
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                                {product.status === 1 ? 'Đang bán' : product.status === 0 ? 'Ngừng bán' : 'Hết hàng'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <button className="bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600 mr-2">
                                                                Sửa
                                                            </button>
                                                            <button className="bg-red-500 text-white rounded-md px-4 py-2 hover:bg-red-600">
                                                                Xóa
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {meta && (
                                        <TablePagination
                                            currentPage={currentPage}
                                            perPage={perPage}
                                            total={meta.total}
                                            from={meta.from}
                                            to={meta.to}
                                            links={meta.links}
                                            onPageChange={handlePageChange}
                                            onPerPageChange={handlePerPageChange}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}