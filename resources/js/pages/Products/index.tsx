import MainLayout from "@/layouts/main-layout";
import { User } from "@/types";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer, Bounce } from "react-toastify";
import "react-toastify/ReactToastify.css";
import TablePagination from "@/components/TablePagination";
import { router } from "@inertiajs/react";
import EditProductModal from '@/components/EditProductModal';
import { Button } from "@/components/ui/button";


interface Props {
    auth: {
        user: User;
    };
}

interface ProductData {
    id: string;
    name: string;
    price: number;
    status: number;
    quantity: number;
    description: string;
    image_url: string;
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
        name: searchParams.get('search') || '',
        status: searchParams.get('status') || '',
        priceFrom: searchParams.get('price_from') || '',
        priceTo: searchParams.get('price_to') || ''
    });

    const [tempFilters, setTempFilters] = useState<Filters>({
        name: searchParams.get('search') || '',
        status: searchParams.get('status') || '',
        priceFrom: searchParams.get('price_from') || '',
        priceTo: searchParams.get('price_to') || ''
    });

    const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const canEdit = auth.user.roles.includes('admin') || auth.user.roles.includes('manager');
    const canDelete = auth.user.roles.includes('admin');
    const canCreate = auth.user.roles.includes('admin') || auth.user.roles.includes('manager');

    useEffect(() => {
        const newSearchParams = new URLSearchParams(window.location.search);
        const newFilters = {
            name: newSearchParams.get('search') || '',
            status: newSearchParams.get('status') || '',
            priceFrom: newSearchParams.get('price_from') || '',
            priceTo: newSearchParams.get('price_to') || ''
        };
        setFilters(newFilters);
        setTempFilters(newFilters);
        setCurrentPage(Number(newSearchParams.get('page')) || 1);
        setPerPage(Number(newSearchParams.get('per_page')) || 10);
    }, [window.location.search]);

    const updateUrlAndFetch = (params: Record<string, any>) => {
        const newParams = new URLSearchParams(window.location.search);

        Object.entries(params).forEach(([key, value]) => {
            if (value) {
                newParams.set(key, String(value));
            } else {
                newParams.delete(key);
            }
        });

        router.get(window.location.pathname, params, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        updateUrlAndFetch({
            page,
            per_page: perPage,
            search: filters.name || null,
            status: filters.status || null,
            price_from: filters.priceFrom || null,
            price_to: filters.priceTo || null
        });
    };

    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
        updateUrlAndFetch({
            page: 1,
            per_page: newPerPage,
            search: filters.name || null,
            status: filters.status || null,
            price_from: filters.priceFrom || null,
            price_to: filters.priceTo || null
        });
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTempFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSearch = () => {
        setFilters(tempFilters);
        setCurrentPage(1);
        updateUrlAndFetch({
            page: 1,
            per_page: perPage,
            search: tempFilters.name || null,
            status: tempFilters.status || null,
            price_from: tempFilters.priceFrom || null,
            price_to: tempFilters.priceTo || null
        });
    };

    const handleReset = () => {
        const resetFilters = {
            name: '',
            status: '',
            priceFrom: '',
            priceTo: ''
        };
        setTempFilters(resetFilters);
        setFilters(resetFilters);
        setCurrentPage(1);
        setPerPage(10);
        updateUrlAndFetch({
            page: 1,
            per_page: 10
        });
    };

    const handleEdit = (product: ProductData) => {
        setSelectedProduct(product);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            if(confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) {
                setIsDeleting(true);
                const response = await axios.delete(`/api/products/${id}`);
                if (response.status === 200) {
                    toast.success('Xóa sản phẩm thành công');
                    fetchProducts();
                } else {
                    toast.error('Xóa sản phẩm thất bại');
                }
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const message = error.response?.data?.message || 'Có lỗi xảy ra';
                toast.error(message);
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const handleUpdateSuccess = () => {
        setIsEditModalOpen(false);
        setSelectedProduct(null);
        fetchProducts();
    };

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('/api/products', {
                params: {
                    page: currentPage,
                    per_page: perPage,
                    search: filters.name || null,
                    status: filters.status || null,
                    price_from: filters.priceFrom || null,
                    price_to: filters.priceTo || null
                }
            });
            setProducts(response.data.data);
            setMeta(response.data.meta);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || 'Không thể tải danh sách sản phẩm.';
                toast.error(errorMessage);
            } else {
                toast.error('Đã xảy ra lỗi không xác định.');
            }
            console.error('Error fetching products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
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
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-semibold">Danh sách sản phẩm</h2>
                                <Button
                                    onClick={() => router.get('/products/create')}
                                    className="bg-blue-500 hover:bg-blue-600 text-white"
                                    disabled={!canCreate}
                                >
                                    Thêm sản phẩm
                                </Button>
                            </div>

                            {meta && (
                                <div className="mb-4">
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
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">Tìm kiếm theo tên</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={tempFilters.name}
                                        onChange={handleFilterChange}
                                        placeholder="Tìm kiếm theo tên"
                                        className="w-full border rounded-md p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">Trạng thái</label>
                                    <select
                                        name="status"
                                        value={tempFilters.status}
                                        onChange={handleFilterChange}
                                        className="w-full border rounded-md p-2"
                                    >
                                        <option value="">Tất cả</option>
                                        <option value="0">Ngừng bán</option>
                                        <option value="1">Đang bán</option>
                                        <option value="2">Hết hàng</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-700 mb-1">Giá từ</label>
                                            <input
                                                type="number"
                                                min={0}
                                                name="priceFrom"
                                                value={tempFilters.priceFrom}
                                                onChange={handleFilterChange}
                                                className="w-full border rounded-md p-2"
                                                placeholder="Giá từ"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-700 mb-1">Giá đến</label>
                                            <input
                                                type="number"
                                                min={Number(tempFilters.priceFrom) || 0}
                                                name="priceTo"
                                                value={tempFilters.priceTo}
                                                onChange={handleFilterChange}
                                                className="w-full border rounded-md p-2"
                                                placeholder="Giá đến"
                                            />
                                        </div>
                                    </div>
                                    {Number(tempFilters.priceFrom) > Number(tempFilters.priceTo) && tempFilters.priceTo && (
                                        <p className="text-red-500 text-sm mt-1">Giá đến phải lớn hơn hoặc bằng giá từ</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mb-6">
                                <button
                                    onClick={handleReset}
                                    className="bg-gray-500 text-white rounded-md px-4 py-2 hover:bg-gray-600 flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Đặt lại
                                </button>
                                <button
                                    onClick={handleSearch}
                                    className="bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600 flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    Tìm kiếm
                                </button>
                            </div>

                            {isLoading ? (
                                <div className="text-center py-4">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                    <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
                                </div>
                            ) : products.length === 0 ? (
                                <div className="text-center py-8">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy sản phẩm</h3>
                                    <p className="mt-1 text-sm text-gray-500">Không có sản phẩm nào phù hợp với điều kiện tìm kiếm của bạn.</p>
                                    <div className="mt-6">
                                        <button
                                            onClick={handleReset}
                                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                            </svg>
                                            Đặt lại bộ lọc
                                        </button>
                                    </div>
                                </div>
                            ) : (
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
                                                        <div className="group relative">
                                                            <span className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                                                                {product.name}
                                                            </span>
                                                            <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-10">
                                                                <div className="bg-white p-2 rounded-lg shadow-lg border border-gray-200">
                                                                    {product.image_url ? (
                                                                        <img 
                                                                            src={`/uploads/${product.image_url}`}
                                                                            alt={product.name}
                                                                            className="w-40 h-40 object-cover rounded"
                                                                            onError={(e) => {
                                                                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMTYwIDE2MCIgZmlsbD0iI2YwZjBmMCI+PHJlY3Qgd2lkdGg9IjE2MCIgaGVpZ2h0PSIxNjAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0Ij5DaXUga8OhIGjhuqNuaA==</dGV4dD48L3N2Zz4=';
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <div className="w-40 h-40 flex items-center justify-center bg-gray-100 rounded">
                                                                            <span className="text-gray-500 text-sm">Không có hình ảnh</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
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
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                        <div className="flex gap-2 justify-center">
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                className="flex items-center gap-1"
                                                                onClick={() => handleEdit(product)}
                                                                disabled={!canEdit}
                                                            >
                                                                Sửa
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                className="flex items-center gap-1"
                                                                onClick={() => handleDelete(product.id)}
                                                                disabled={!canDelete || isDeleting}
                                                            >
                                                                {isDeleting ? 'Đang xóa...' : 'Xóa'}
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}  
                        </div>
                    </div>
                </div>
            </div>
            <EditProductModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                product={selectedProduct}
                onSuccess={handleUpdateSuccess}
            />
        </MainLayout>
    );
}