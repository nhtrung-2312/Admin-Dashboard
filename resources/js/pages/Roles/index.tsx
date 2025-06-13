import { Head, router } from '@inertiajs/react';
import MainLayout from '@/layouts/main-layout';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Bounce, ToastContainer, toast } from 'react-toastify';
import 'react-toastify/ReactToastify.css';
import axios from 'axios';
import TablePagination from '@/components/TablePagination';
import { User } from '@/types';
import EditRoleModal from '@/components/EditRoleModal';
import { permission } from 'process';
import { group, table } from 'console';

interface Role {
    id: number;
    name: string;
    permissions: string[];
    is_system: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    auth: {
        user: User;
    };
    translations: Record<string, any>;
    permissions: string[];
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

export default function Index({ auth, translations, permissions }: Props) {
    const searchParams = new URLSearchParams(window.location.search);

    // States
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
    const [perPage, setPerPage] = useState(Number(searchParams.get('per_page')) || 10);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [tempSearchTerm, setTempSearchTerm] = useState(searchParams.get('search') || '');
    const groupedPermissions: Record<string, string[]> = {};

    useEffect(() => {
        const newSearchParams = new URLSearchParams(window.location.search);
        setSearchTerm(newSearchParams.get('search') || '');
        setTempSearchTerm(newSearchParams.get('search') || '');
        setCurrentPage(Number(newSearchParams.get('page')) || 1);
        setPerPage(Number(newSearchParams.get('per_page')) || 10);
    }, [window.location.search]);

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

    // Handlers
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        updateUrlAndFetch({
            page,
            per_page: perPage,
            search: searchTerm || null
        });
    };

    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
        updateUrlAndFetch({
            page: 1,
            per_page: newPerPage,
            search: searchTerm || null
        });
    };

    const handleSearch = () => {
        setSearchTerm(tempSearchTerm);
        setCurrentPage(1);
        updateUrlAndFetch({
            page: 1,
            per_page: perPage,
            search: tempSearchTerm || null
        });
    };

    const handleReset = () => {
        setTempSearchTerm('');
        setSearchTerm('');
        setCurrentPage(1);
        setPerPage(10);
        updateUrlAndFetch({
            page: 1,
            per_page: 10
        });
    };

    const handleEdit = (role: Role) => {
        setEditingRole(role);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (roleId: number) => {
        if (window.confirm(translations.role.system_delete_confirm)) {
            try {
                await axios.delete(`/api/roles/${roleId}`);
                toast.success(translations.role.system_delete_success);
                fetchRoles();
            } catch (error: any) {
                const message = error.response.data.message;
                toast.error(message);
            }
        }
    };

    const fetchRoles = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('/api/roles', {
                params: {
                    page: currentPage,
                    per_page: perPage,
                    search: searchTerm
                }
            });
            setRoles(response.data.data);
            setMeta(response.data.meta);
        } catch (error) {
            toast.error(translations.role.system_fetch_error);
        } finally {
            setIsLoading(false);
        }
    };

    roles.forEach((role) => {
        role.permissions.forEach((permissionCode) => {
            const parts = permissionCode.split('_');
            const group = parts.slice(-1)[0];

            if (!groupedPermissions[group]) {
                groupedPermissions[group] = [];
            }

            if(!groupedPermissions[group].includes(permissionCode)) {
                groupedPermissions[group].push(permissionCode);
            }
        });
    });

    useEffect(() => {
        fetchRoles();
    }, [currentPage, perPage, searchTerm]);

    return (
        <>
            <Head title={translations.role.head_title} />
            <MainLayout user={auth.user} translations={translations.nav}>
                <div className="py-12">
                    <div className="max-w-4/5 mx-auto sm:px-6 lg:px-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 text-gray-900">
                                <section>
                                    <div className="mb-6 flex justify-between items-center">
                                        <div>
                                            <h2 className="text-2xl font-bold">{translations.role.list_title}</h2>
                                            <p className="text-sm text-gray-500 mt-1">{translations.role.list_subtitle}</p>
                                        </div>
                                        <Button
                                            onClick={() => setIsEditModalOpen(true)}
                                            className="ml-4 bg-emerald-900 hover:bg-emerald-950 text-white"
                                            disabled={!auth.user.permissions.includes('create_roles')}
                                            hidden={!auth.user.permissions.includes('create_roles')}
                                        >
                                            {translations.role.create_button}
                                        </Button>
                                    </div>

                                    {/* Search and Filter */}
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="w-[300px]">
                                            <input
                                                type="text"
                                                placeholder={translations.role.search_placeholder}
                                                value={tempSearchTerm}
                                                onChange={(e) => setTempSearchTerm(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                disabled={!auth.user.permissions.includes('view_roles')}
                                                hidden={!auth.user.permissions.includes('view_roles')}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={handleSearch}
                                                className="bg-blue-500 hover:bg-blue-600 text-white"
                                                disabled={!auth.user.permissions.includes('view_roles')}
                                                hidden={!auth.user.permissions.includes('view_roles')}
                                            >
                                                {translations.role.search_button}
                                            </Button>
                                            <Button
                                                onClick={handleReset}
                                                className="bg-gray-700 hover:bg-gray-800 text-white"
                                                disabled={!auth.user.permissions.includes('view_roles')}
                                                hidden={!auth.user.permissions.includes('view_roles')}
                                            >
                                                {translations.role.reset_button}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Pagination */}
                                    {(meta && auth.user.permissions.includes('view_roles')) && (
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

                                    {/* Table */}
                                    {(isLoading && auth.user.permissions.includes('view_roles')) ?  (
                                        <div className="text-center py-4">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                            <p className="mt-2 text-gray-600">{translations.role.table_isloading}</p>
                                        </div>
                                    ) : roles.length === 0 ? (
                                        <div className="text-center py-8">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">{translations.role.table_no_data}</h3>
                                            <p className="mt-1 text-sm text-gray-500">{translations.role.table_no_data_subtitle}</p>
                                            <div className="mt-6">
                                                <button
                                                    onClick={handleReset}
                                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                >
                                                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                                    </svg>
                                                    {translations.role.reset_button}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <div className="inline-block min-w-full align-middle">
                                                <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5">
                                                    <table className="min-w-full divide-y divide-gray-300">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th scope="col" className="py-3.5 pl-4 pr-3 text-center text-sm font-semibold text-gray-900 sm:pl-6">{translations.role.table_no}</th>
                                                                <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">{translations.role.table_name}</th>
                                                                <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">{translations.role.table_permissions}</th>
                                                                <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">{translations.role.table_action}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200 bg-white">
                                                            {roles.map((role, index) => (
                                                                <tr key={role.id}>
                                                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-center text-sm font-medium text-gray-900 sm:pl-6">
                                                                        {meta?.from ? meta.from + index : index + 1}
                                                                    </td>
                                                                    <td className={`whitespace-nowrap px-3 py-4 text-center text-sm ${role.is_system == 1 ? 'text-red-500' : 'text-gray-900'}`}>{role.name}</td>
                                                                    <td className="px-3 py-4 text-sm text-gray-700 align-top max-w-[1000px] text-center">
                                                                        <div className="flex flex-col items-center gap-2 max-h-32 overflow-y-auto">
                                                                            {Object.entries(groupedPermissions).map(([group, perms]) => {
                                                                                const rolePerms = perms.filter((perm) => role.permissions.includes(perm));
                                                                                if (rolePerms.length === 0) return null;
                                                                                return (
                                                                                    <div key={group} className="mb-2">
                                                                                        <div className="flex flex-wrap justify-center gap-2">
                                                                                            {rolePerms.map((permission) => (
                                                                                                <span
                                                                                                    key={permission}
                                                                                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                                                                                >
                                                                                                    {translations.permissions?.[permission] || permission}
                                                                                                </span>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                                        <div className="flex justify-center gap-2">
                                                                            <Button
                                                                                size="sm"
                                                                                variant="secondary"
                                                                                onClick={() => handleEdit(role)}
                                                                                disabled={!auth.user.permissions.includes('edit_roles')}
                                                                                className="inline-flex items-center"
                                                                            >
                                                                                {translations.role.table_item_button_edit}
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="destructive"
                                                                                onClick={() => handleDelete(role.id)}
                                                                                disabled={!auth.user.permissions.includes('delete_roles')}
                                                                                className="inline-flex items-center"
                                                                            >
                                                                                {translations.role.table_item_button_delete}
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
                                    )}
                                </section>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Modal */}
                {((isEditModalOpen || editingRole) && (auth.user.permissions.includes('view_roles'))) && (
                    <EditRoleModal
                        role={editingRole}
                        permissions={permissions}
                        isOpen={isEditModalOpen}
                        onClose={() => {
                            setIsEditModalOpen(false);
                            setEditingRole(null);
                        }}
                        onSuccess={() => {
                            fetchRoles();
                            setIsEditModalOpen(false);
                            setEditingRole(null);
                        }}
                        translations={translations}
                    />
                )}
            </MainLayout>
        </>
    );
}
