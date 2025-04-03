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

export default function Index({ auth }: Props) {
    const searchParams = new URLSearchParams(window.location.search);

    const [currentPage, setCurrentPage] = useState<number>(Number(searchParams.get('page')) || 1);
    const [perPage, setPerPage] = useState<number>(Number(searchParams.get('per_page')) || 10);
    const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');
    const [roleFilter, setRoleFilter] = useState<string>(searchParams.get('role') || '');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [users, setUsers] = useState<UserData[]>([]);
    const [formData, setFormData] = useState<{   name: string; email: string; is_active: number; group_role: string }>({
        name: '',
        email: '',
        is_active: 0,
        group_role: 'user'
    });
    const [errors, setErrors] = useState<{ name?: string; email?: string; is_active?: number; group_role?: string }>({});
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('search') || '');
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);

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
            status: statusFilter,
            role: roleFilter
        });
    };

    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
        updateUrlAndFetch({
            page: 1,
            per_page: newPerPage,
            status: statusFilter,
            role: roleFilter
        });
    };

    const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = event.target.value;
        setStatusFilter(newStatus);
        setCurrentPage(1);
        updateUrlAndFetch({
            page: 1,
            per_page: perPage,
            status: newStatus,
            role: roleFilter
        });
    };

    const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newRole = event.target.value;
        setRoleFilter(newRole);
        setCurrentPage(1);
        updateUrlAndFetch({
            page: 1,
            per_page: perPage,
            status: statusFilter,
            role: newRole
        });
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = event.target;
        if (name === 'is_active') {
            setFormData({ ...formData, [name]: parseInt(value) });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsCreating(true);
        try {
            const response = await axios.post('/api/users', formData);
            toast.success('Người dùng đã được thêm thành công!');

            // Reset form và load lại danh sách
            setFormData({
                name: '',
                email: '',
                is_active: 0,
                group_role: 'user'
            });
            setErrors({});

            // Tải lại danh sách người dùng
            const usersResponse = await axios.get('/api/users', {
                params: {
                    page: currentPage,
                    per_page: perPage,
                    status: statusFilter,
                    role: roleFilter,
                    search: searchTerm
                }
            });
            setUsers(usersResponse.data.data);
            setMeta(usersResponse.data.meta);

        } catch (error: any) {
            if (error.response?.status === 422) {
                // Xử lý lỗi validation
                setErrors(error.response.data.errors || {});
                toast.error('Vui lòng kiểm tra lại thông tin nhập vào');
            } else {
                console.error(error);
                toast.error('Có lỗi xảy ra khi thêm người dùng.');
            }
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (userId: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
            setIsDeleting(true);
            try {
                await axios.delete(`/api/users/${userId}`);
                toast.success('Xóa người dùng thành công');

                // Tải lại dữ liệu sau khi xóa
                const response = await axios.get('/api/users', {
                    params: {
                        page: currentPage,
                        per_page: perPage,
                        status: statusFilter,
                        role: roleFilter,
                        search: searchTerm
                    }
                });

                // Nếu trang hiện tại không còn dữ liệu (đã xóa item cuối cùng của trang), quay về trang trước
                if (response.data.data.length === 0 && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                    updateUrlAndFetch({
                        page: currentPage - 1,
                        per_page: perPage,
                        status: statusFilter,
                        role: roleFilter,
                        search: searchTerm
                    });
                } else {
                    setUsers(response.data.data);
                    setMeta(response.data.meta);
                }
            } catch (error) {
                toast.error('Có lỗi xảy ra khi xóa người dùng');
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const handleReset = () => {
        setCurrentPage(1);
        setPerPage(10);
        setStatusFilter('');
        setRoleFilter('');
        setSearchTerm('');
        updateUrlAndFetch({
            page: 1,
            per_page: 10
        });
    };

    const handleSearch = useMemo(() => {
        return debounce((value: string) => {
            updateUrlAndFetch({
                page: 1,
                per_page: perPage,
                status: statusFilter,
                role: roleFilter,
                search: value
            });
        }, 500);
    }, []);

    const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);
        setCurrentPage(1);
        handleSearch(value);
    };

    const handleEdit = (user: UserData) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            is_active: user.is_active ? 1 : 0,
            group_role: user.group_role
        });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editingUser) return;

        try {
            await axios.put(`/api/users/${editingUser.id}`, formData);
            toast.success('Cập nhật người dùng thành công!');
            setIsEditModalOpen(false);

            // Tải lại danh sách
            const response = await axios.get('/api/users', {
                params: {
                    page: currentPage,
                    per_page: perPage,
                    status: statusFilter,
                    role: roleFilter,
                    search: searchTerm
                }
            });
            setUsers(response.data.data);
            setMeta(response.data.meta);
        } catch (error: any) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {});
                toast.error('Vui lòng kiểm tra lại thông tin nhập vào');
            } else {
                toast.error('Có lỗi xảy ra khi cập nhật người dùng');
            }
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get('/api/users', {
                    params: {
                        page: currentPage,
                        per_page: perPage,
                        status: statusFilter,
                        role: roleFilter,
                        search: searchTerm
                    }
                });
                setUsers(response.data.data);
                setMeta(response.data.meta);
            } catch (error) {
                toast.error('Không thể tải danh sách người dùng.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [currentPage, perPage, statusFilter, roleFilter, searchTerm]);

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
                            <section>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-semibold">Thêm người dùng mới</h2>
                                </div>

                                <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4 mb-8">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-md ${
                                                errors.name ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        />
                                        {errors.name && (
                                            <p className="mt-1 text-sm text-red-500">
                                                {Array.isArray(errors.name) ? errors.name[0] : errors.name}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-md ${
                                                errors.email ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        />
                                        {errors.email && (
                                            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái hoạt động</label>
                                        <select
                                            name="is_active"
                                            value={formData.is_active ? '1' : '0'}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-md ${
                                                errors.is_active ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        >
                                            <option value="1">Hoạt động</option>
                                            <option value="0">Không hoạt động</option>
                                        </select>
                                        {errors.is_active && (
                                            <p className="mt-1 text-sm text-red-500">{errors.is_active}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Chức vụ</label>
                                        <select
                                            name="group_role"
                                            value={formData.group_role}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-md ${
                                                errors.group_role ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        {errors.group_role && (
                                            <p className="mt-1 text-sm text-red-500">{errors.group_role}</p>
                                        )}
                                    </div>
                                    <div className="col-span-2">
                                        <Button
                                            type="submit"
                                            disabled={isCreating}
                                            className="bg-lime-500 hover:bg-lime-600"
                                        >
                                            {isCreating ? 'Đang tạo...' : 'Thêm người dùng'}
                                        </Button>
                                    </div>
                                </form>
                            </section>

                            <section className="border-t border-gray-200 pt-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-semibold">Danh sách người dùng</h2>
                                    <Button
                                        onClick={handleReset}
                                        className="bg-blue-500 hover:bg-blue-600 text-white"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Đang tải...' : 'Làm mới'}
                                    </Button>
                                </div>
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                placeholder="Tìm kiếm theo tên, email..."
                                                value={searchTerm}
                                                onChange={onSearchChange}
                                                className="px-3 py-2 border border-gray-300 rounded-md w-64"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm text-gray-700">Trạng thái:</label>
                                            <select
                                                className="px-3 py-2 border border-gray-300 rounded-md"
                                                value={statusFilter}
                                                onChange={handleStatusChange}
                                            >
                                                <option value="">Tất cả</option>
                                                <option value="active">Đang hoạt động</option>
                                                <option value="inactive">Không hoạt động</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm text-gray-700">Chức vụ:</label>
                                            <select
                                                className="px-3 py-2 border border-gray-300 rounded-md"
                                                value={roleFilter}
                                                onChange={handleRoleChange}
                                            >
                                                <option value="">Tất cả</option>
                                                <option value="admin">Admin</option>
                                                <option value="user">User</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {isLoading ? (
                                    <div className="text-center py-4">Đang tải dữ liệu...</div>
                                ) : users.length === 0 ? (
                                    <div className="text-center py-4">
                                        Không có dữ liệu để hiển thị
                                    </div>
                                ) : (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">STT</th>
                                                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Hoạt động</th>
                                                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Tên</th>
                                                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Email</th>
                                                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Chức vụ</th>
                                                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Thao tác</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {users.map((user, index) => (
                                                        <tr key={user.id}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                <div className="font-medium text-gray-900">
                                                                    {meta?.from ? meta.from + index : index + 1}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                <div className="flex items-center gap-2 justify-center">
                                                                    <div className={`h-2.5 w-2.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                                    <span className="text-sm text-gray-500">
                                                                        {user.is_active ? 'Đang hoạt động' : 'Không hoạt động'}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                <div className="font-medium text-gray-900">{user.name}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                <div className="text-gray-500">{user.email}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                <div className="text-gray-500">{user.group_role}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                                <div className="flex gap-2 justify-center">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="secondary"
                                                                        className="flex items-center gap-1"
                                                                        onClick={() => handleEdit(user)}
                                                                    >
                                                                        Sửa
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        className="flex items-center gap-1"
                                                                        onClick={() => handleDelete(user.id)}
                                                                        disabled={isDeleting}
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

                                        {meta && (
                                            <TablePagination
                                                links={meta.links}
                                                from={meta.from}
                                                to={meta.to}
                                                total={meta.total}
                                                perPage={perPage}
                                                currentPage={currentPage}
                                                onPerPageChange={handlePerPageChange}
                                                onPageChange={handlePageChange}
                                            />
                                        )}
                                    </>
                                )}
                            </section>
                        </div>
                    </div>
                </div>
            </div>
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-black">
                    <div className="bg-white p-6 rounded-lg w-[500px]">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Cập nhật thông tin người dùng</h2>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-md ${
                                        errors.name ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {Array.isArray(errors.name) ? errors.name[0] : errors.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-md ${
                                        errors.email ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Trạng thái hoạt động
                                </label>
                                <select
                                    name="is_active"
                                    value={formData.is_active ? '1' : '0'}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-md ${
                                        errors.is_active ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="1">Hoạt động</option>
                                    <option value="0">Không hoạt động</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Chức vụ</label>
                                <select
                                    name="group_role"
                                    value={formData.group_role}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-md ${
                                        errors.group_role ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <Button
                                    type="button"
                                    className="bg-red-500 hover:bg-red-600 text-white"
                                    onClick={() => setIsEditModalOpen(false)}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-blue-500 hover:bg-blue-600 text-white"
                                >
                                    Cập nhật
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}