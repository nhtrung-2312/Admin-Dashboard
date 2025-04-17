import { Head } from '@inertiajs/react';
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
import { group } from 'console';

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
    // States
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const groupedPermissions: Record<string, string[]> = {};

    // Handlers
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
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

    console.log(roles)

    useEffect(() => {
        fetchRoles();
    }, [currentPage, perPage, searchTerm]);

    return (
        <>
            <Head title={translations.role.head_title} />
            
            <MainLayout user={auth.user} translations={translations.nav}>
                <ToastContainer
                    position="top-right"
                    autoClose={1200}
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
                    <div className="max-w-4/5 mx-auto sm:px-6 lg:px-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 text-gray-900">
                                <section>
                                    <div className="mb-6">
                                        <h2 className="text-2xl font-semibold">{translations.role.list_title}</h2>
                                        <p className="text-sm text-gray-500 mt-1">{translations.role.list_subtitle}</p>
                                    </div>

                                    {/* Search and Filter */}
                                    <div className="mb-4 flex gap-4">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                placeholder={translations.role.search_placeholder}
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <Button
                                            onClick={() => setIsEditModalOpen(true)}
                                            className="bg-lime-500 hover:bg-lime-600"
                                            disabled={!auth.user.permissions.includes('create_roles')}
                                        >
                                            {translations.role.create_button}
                                        </Button>
                                    </div>

                                    {/* Pagination */}
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

                                    {/* Table */}
                                    {isLoading ? (
                                        <div className="text-center py-4">{translations.role.table_isloading}</div>
                                    ) : roles.length === 0 ? (
                                        <div className="text-center py-4">{translations.role.table_no_data}</div>
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
                                                                    <td className="px-3 py-4 text-sm text-gray-700 align-top max-w-[700px] text-center">
                                                                        <div className="flex flex-col items-center gap-3 max-h-32 overflow-y-auto">
                                                                            {Object.entries(groupedPermissions).map(([group, perms]) => {
                                                                                const rolePerms = perms.filter((perm) => role.permissions.includes(perm));
                                                                                if (rolePerms.length === 0) return null;

                                                                                return (
                                                                                    <div key={group} className="mb-2">
                                                                                        {/* <div className="text-xs font-bold text-gray-800 mb-1 capitalize">
                                                                                            {group}
                                                                                        </div> */}
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
                {(isEditModalOpen || editingRole) && (
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
