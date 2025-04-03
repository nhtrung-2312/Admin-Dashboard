import MainLayout from "@/layouts/main-layout";
import { User } from "@/types";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer, Bounce } from "react-toastify";
import "react-toastify/ReactToastify.css";
import TablePagination from "@/components/TablePagination";

interface Props {
    auth: {
        user: User;
    };
}

interface ProductData {
    id: number;
    name: string;
    price: number;
    status: number;
    description: string;
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

    const [products, setProducts] = useState<ProductData[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(Number(searchParams.get('page')) || 1);
    const [perPage, setPerPage] = useState<number>(Number(searchParams.get('per_page')) || 10);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [filters, setFilters] = useState<Filters>({
        name: searchParams.get('name') || '',
        status: searchParams.get('status') || '',
        priceFrom: searchParams.get('priceFrom') || '',
        priceTo: searchParams.get('priceTo') || ''
    });
    const [priceRange, setPriceRange] = useState({
        min: 0,
        max: 10000000
    });

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        updateUrlAndFetch({ page });
    };

    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
        updateUrlAndFetch({ page: 1, per_page: newPerPage });
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSearch = () => {
        setCurrentPage(1);
        updateUrlAndFetch({
            page: 1,
            ...filters
        });
    };

    const handlePriceRangeChange = (type: 'from' | 'to', value: number) => {
        const numValue = Number(value);

        if (type === 'from') {
            if (numValue <= Number(filters.priceTo || priceRange.max)) {
                setFilters(prev => ({
                    ...prev,
                    priceFrom: String(numValue)
                }));
            }
        } else {
            if (numValue >= Number(filters.priceFrom || 0)) {
                setFilters(prev => ({
                    ...prev,
                    priceTo: String(numValue)
                }));
            }
        }
    };

    const handleReset = () => {
        setFilters({
            name: '',
            status: '',
            priceFrom: '',
            priceTo: ''
        });
        setCurrentPage(1);
        setPerPage(10);
        updateUrlAndFetch({
            page: 1,
            per_page: 10
        });
    };

    const setSearchParams = (params: Record<string, any>) => {
        const newParams = new URLSearchParams(searchParams);

        Object.entries(params).forEach(([key, value]) => {
            newParams.set(key, String(value));
        });
    };

    const updateUrlAndFetch = (params: Record<string, any>) => {
        const newParams = new URLSearchParams(searchParams);

        Object.entries(params).forEach(([key, value]) => {
            if (value) {
                newParams.set(key, String(value));
            } else {
                newParams.delete(key);
            }
        });

        setSearchParams(newParams);
    };

    const fetchProducts = async (page: number = 1) => {
        setIsLoading(true);
        try {
            const response = await axios.get('/api/products', {
                params: {
                    page,
                    per_page: perPage,
                    ...filters
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
        const name = searchParams.get('name') || '';
        const status = searchParams.get('status') || '';
        const priceFrom = searchParams.get('priceFrom') || '';
        const priceTo = searchParams.get('priceTo') || '';

        if (page !== currentPage) setCurrentPage(page);
        if (per_page !== perPage) setPerPage(per_page);
        if (name !== filters.name || status !== filters.status ||
            priceFrom !== filters.priceFrom || priceTo !== filters.priceTo) {
            setFilters({
                name,
                status,
                priceFrom,
                priceTo
            });
        }
    }, [searchParams]);

    useEffect(() => {
        fetchProducts(currentPage);
    }, [currentPage, perPage, filters]);

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
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <div>
                                    <label className="block mb-1">Tìm kiếm theo tên</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={filters.name}
                                        onChange={handleFilterChange}
                                        placeholder="Tìm kiếm theo tên"
                                        className="w-full border rounded-md p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1">Trạng thái</label>
                                    <select
                                        name="status"
                                        value={filters.status}
                                        onChange={handleFilterChange}
                                        className="w-full border rounded-md p-2"
                                    >
                                        <option value="">Tất cả</option>
                                        <option value="0">Ngừng bán</option>
                                        <option value="1">Đang bán</option>
                                        <option value="2">Hết hàng</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <div className="px-2">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">Giá từ</label>
                                                <input
                                                    type="number"
                                                    min={priceRange.min}
                                                    max={Number(filters.priceTo || priceRange.max)}
                                                    value={filters.priceFrom || ''}
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);
                                                        if (value <= Number(filters.priceTo || priceRange.max)) {
                                                            setFilters(prev => ({
                                                                ...prev,
                                                                priceFrom: String(value)
                                                            }));
                                                        }
                                                    }}
                                                    className="w-full border rounded-md p-2"
                                                    placeholder="Giá từ"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">Giá đến</label>
                                                <input
                                                    type="number"
                                                    min={Number(filters.priceFrom || 0)}
                                                    max={priceRange.max}
                                                    value={filters.priceTo || ''}
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);
                                                        if (value >= Number(filters.priceFrom || 0)) {
                                                            setFilters(prev => ({
                                                                ...prev,
                                                                priceTo: String(value)
                                                            }));
                                                        }
                                                    }}
                                                    className="w-full border rounded-md p-2"
                                                    placeholder="Giá đến"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between mb-6">
                                <button
                                    onClick={handleReset}
                                    className="bg-gray-500 text-white rounded-md px-4 py-2 hover:bg-gray-600"
                                >
                                    Đặt lại
                                </button>
                                <button
                                    onClick={() => fetchProducts(currentPage)}
                                    className="bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600"
                                >
                                    Tìm kiếm
                                </button>
                            </div>

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