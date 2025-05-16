import { User } from '@/types';
import MainLayout from '@/layouts/main-layout';
import { Button } from '@/components/ui/button';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import TablePagination from '@/components/TablePagination';
import axios from 'axios';
import { Bounce, ToastContainer, toast } from 'react-toastify';
import 'react-toastify/ReactToastify.css'
import { router } from '@inertiajs/react'
import EditUserModal from '@/components/EditUserModal';

interface Props {
    auth: {
        user: User;
    },
    translations: Record<string, any>;
    roles: string[];
}

interface UserData {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    group_role: string;
    permissions: string[];
    is_active: boolean;
    is_delete: boolean;
    last_login_at: string | null;
    roles: string[];
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

interface FormData {
    name: string;
    email: string;
    is_active: number;
    group_role: string;
}

export default function Index({ auth, translations, roles }: Props) {
    const searchParams = new URLSearchParams(window.location.search);

    const [currentPage, setCurrentPage] = useState<number>(Number(searchParams.get('page')) || 1);
    const [perPage, setPerPage] = useState<number>(Number(searchParams.get('per_page')) || 10);
    const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');
    const [roleFilter, setRoleFilter] = useState<string>(searchParams.get('role') || '');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [users, setUsers] = useState<UserData[]>([]);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        is_active: 0,
        group_role: 'user'
    });
    const [errors, setErrors] = useState<{ name?: string; email?: string; is_active?: number; group_role?: string }>({});
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('search') || '');
    const [tempSearchTerm, setTempSearchTerm] = useState<string>(searchParams.get('search') || '');
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [tempStatusFilter, setTempStatusFilter] = useState<string>(searchParams.get('status') || '');
    const [tempRoleFilter, setTempRoleFilter] = useState<string>(searchParams.get('role') || '');

    const updateUrlAndFetch = (params: Record<string, any>) => {
        // Lọc ra các tham số có giá trị
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
        setTempStatusFilter(event.target.value);
    };

    const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setTempRoleFilter(event.target.value);
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
            toast.success(translations.user.system_create_success);

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
                toast.error(translations.user.system_create_missing);
            } else {
                toast.error(translations.user.system_create_error);
            }
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (userId: number) => {
        if (window.confirm(translations.user.system_delete_confirm)) {
            setIsDeleting(true);
            try {
                await axios.delete(`/api/users/${userId}`);
                toast.success(translations.user.system_delete_success);

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
                toast.error(translations.user.system_delete_error);
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
        setTempStatusFilter('');
        setTempRoleFilter('');
        setTempSearchTerm('');
        updateUrlAndFetch({
            page: 1,
            per_page: 10
        });
    };

    const handleSearch = () => {
        setStatusFilter(tempStatusFilter);
        setRoleFilter(tempRoleFilter);
        setSearchTerm(tempSearchTerm);
        setCurrentPage(1);
        updateUrlAndFetch({
            page: 1,
            per_page: perPage,
            status: tempStatusFilter,
            role: tempRoleFilter,
            search: tempSearchTerm
        });
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTempSearchTerm(event.target.value);
    };

    const handleEdit = (user: UserData) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
    };

    const handleEditSuccess = async () => {
        // Tải lại danh sách sau khi cập nhật thành công
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
                toast.error(translations.user.system_fetch_error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [currentPage, perPage, statusFilter, roleFilter, searchTerm]);

    return (
        <>
        <Head title={translations.user.head_title} />
        <MainLayout translations={translations.nav} user={auth.user}>
            <div className="py-12">
                <div className="max-w-4/5 mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <section hidden={!auth.user.permissions.includes("create_users")} className="border-b border-gray-200 mb-6">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold">{translations.user.create_title}</h2>
                                    <p className="text-sm text-gray-500 mt-1">{translations.user.create_subtitle}</p>
                                </div>

                                <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4 mb-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{translations.user.create_name} <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder={translations.user.create_placeholder_name}
                                            className={`w-full px-3 py-2 border rounded-md ${
                                                errors.name ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            disabled={!auth.user.permissions.includes("create_users")}
                                        />
                                        {errors.name && (
                                            <p className="mt-1 text-sm text-red-500">
                                                {Array.isArray(errors.name) ? errors.name[0] : errors.name}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{translations.user.create_email} <span className="text-red-500">*</span></label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder={translations.user.create_placeholder_email}
                                            className={`w-full px-3 py-2 border rounded-md ${
                                                errors.email ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            disabled={!auth.user.permissions.includes("create_users")}
                                        />
                                        {errors.email && (
                                            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{translations.user.create_status} <span className="text-red-500">*</span></label>
                                        <select
                                            name="is_active"
                                            value={formData.is_active ? '1' : '0'}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-md ${
                                                errors.is_active ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            disabled={!auth.user.permissions.includes("create_users")}
                                        >
                                            <option value="1">{translations.user.table_item_active}</option>
                                            <option value="0">{translations.user.table_item_inactive}</option>
                                        </select>
                                        {errors.is_active && (
                                            <p className="mt-1 text-sm text-red-500">{errors.is_active}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{translations.user.create_group} <span className="text-red-500">*</span></label>
                                        <select
                                            name="group_role"
                                            value={formData.group_role}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-md ${
                                                errors.group_role ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            disabled={!auth.user.permissions.includes("create_users")}
                                        >
                                            {roles.map((role) => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
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
                                            {isCreating ? translations.user.loading_button : translations.user.create_button}
                                        </Button>
                                    </div>
                                </form>
                            </section>

                            <section>
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold">{translations.user.list_title}</h2>
                                    <p className="text-sm text-gray-500 mt-1">{translations.user.list_subtitle}</p>
                                </div>
                                {meta && (
                                    <div className="mb-4">
                                        <TablePagination translations={translations.pagination}
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

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                    <div className="md:col-span-2 lg:col-span-1">
                                        <label className="block text-sm text-gray-700 mb-1">{translations.user.list_filter_search_title}</label>
                                        <input
                                            type="text"
                                            placeholder={translations.user.list_filter_search_placeholder}
                                            value={tempSearchTerm}
                                            onChange={handleSearchChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-1">{translations.user.list_filter_status_title}</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            value={tempStatusFilter}
                                            onChange={handleStatusChange}
                                        >
                                            <option value="">{translations.user.list_filter_placeholder_all}</option>
                                            <option value="active">{translations.user.table_item_active}</option>
                                            <option value="inactive">{translations.user.table_item_inactive}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-1">{translations.user.list_filter_group_title}</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            value={tempRoleFilter}
                                            onChange={handleRoleChange}
                                        >
                                            <option value="">{translations.user.list_filter_placeholder_all}</option>
                                            {roles.map((role) => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row lg:justify-end md:justify-end justify-center gap-4 mb-6">
                                    <div className="flex justify-end gap-2 mb-6">
                                        <Button
                                            onClick={handleReset}
                                            className="bg-gray-500 hover:bg-gray-600 text-white"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? translations.user.loading_button : translations.user.list_filter_button_reset}
                                        </Button>
                                        <Button
                                            onClick={handleSearch}
                                            className="bg-blue-500 hover:bg-blue-600 text-white"
                                            disabled={isLoading}
                                        >
                                            {translations.user.list_filter_button_search}
                                        </Button>
                                    </div>
                                </div>

                                {isLoading ? (
                                    <div className="text-center py-4">{translations.user.table_isloading}</div>
                                ) : users.length === 0 ? (
                                    <div className="text-center py-8">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">{translations.user.table_no_data}</h3>
                                    <p className="mt-1 text-sm text-gray-500">{translations.user.table_no_data_subtitle}</p>
                                    <div className="mt-6">
                                        <button
                                            onClick={handleReset}
                                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                            </svg>
                                            {translations.user.list_filter_button_reset}
                                        </button>
                                    </div>
                                </div>
                                ) : (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">{translations.user.table_no}</th>
                                                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">{translations.user.table_status}</th>
                                                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">{translations.user.table_name}</th>
                                                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">{translations.user.table_email}</th>
                                                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">{translations.user.table_group}</th>
                                                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">{translations.user.table_action}</th>
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
                                                                        {user.is_active ? translations.user.table_item_active : translations.user.table_item_inactive}
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
                                                                        disabled={!auth.user.permissions.includes("edit_users")}
                                                                    >
                                                                        {translations.user.table_item_button_edit}
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        className="flex items-center gap-1"
                                                                        onClick={() => handleDelete(user.id)}
                                                                        disabled={!auth.user.permissions.includes("delete_users") || isDeleting}
                                                                    >
                                                                        {isDeleting ? translations.user.loading_button : translations.user.table_item_button_delete}
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </section>
                        </div>
                    </div>
                </div>
            </div>
            {isEditModalOpen && editingUser && (
                <EditUserModal
                    user={editingUser}
                    roles={roles}
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditingUser(null);
                    }}
                    onSuccess={handleEditSuccess}
                    translations={translations}
                />
            )}
        </MainLayout>
        </>
    );
}