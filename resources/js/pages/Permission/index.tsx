import TablePagination from "@/components/TablePagination";
import { Button } from "@/components/ui/button";
import MainLayout from "@/layouts/main-layout";
import { User } from "@/types"
import { Head } from "@inertiajs/react";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import useDebounce from "@/hooks/useDebounce";

interface Permissions {
    id: number;
    model_type: string;
    model_id: number;
    permissions: Record<string, string[]>;
    user_name: string;
}

interface Props {
    auth: {
        user: User,
    }
    translations: Record<string, any>;
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

export default function Index({ auth, translations } : Props) {
    const [assign, setAssign] = useState<Permissions[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(10);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [isAssigning, setIsAssigning] = useState<boolean>(false);

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
    };

    const handleDelete = async (id: number) => {
        setIsDeleting(true);
        try {
            const response = await axios.delete(`/api/permissions/${id}`);

            console.log(response);
        } catch (error: any) {
            console.log(error);
        } finally {
            setIsDeleting(false);
        }
    }

    const fetchPersonalPerms = async () => {
        setIsLoading(true);

        try {
            const response = await axios.get('/api/permissions', {
                params: {
                    page: currentPage,
                    per_page: perPage,
                    search: debouncedSearchTerm,
                }
            });

            setAssign(response.data.data);
            console.log(response.data.data);
            setMeta(response.data.meta);
        } catch (error: any) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchPersonalPerms();
    }, [currentPage, perPage, debouncedSearchTerm]);

    return (
        <>
        <Head title={translations.permissions.list_title} />

        <MainLayout translations={translations.nav} user={auth.user}>
            <div className="py-12">
                <div className="max-w-4/5 mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <section>
                                <div className="mb-6">
                                    <h2 className="text-2xl font-semibold">{translations.permissions.list_title}</h2>
                                    <p className="text-sm text-gray-500 mt-1">{translations.permissions.list_subtitle}</p>
                                </div>
                                <div className="mb-4 flex items-center justify-between">
                                    <input
                                        type="text"
                                        placeholder={translations.permissions.search_placeholder}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="flex-1 max-w-[300px] px-3 py-2 border border-gray-300 rounded-md"
                                        disabled={!auth.user.permissions.includes('view_roles')}
                                        hidden={!auth.user.permissions.includes('view_roles')}
                                    />
                                    <Button
                                        // onClick={() => setIsEditModalOpen(true)}
                                        className="ml-4 bg-lime-500 hover:bg-lime-600"
                                        disabled={!auth.user.permissions.includes('create_roles')}
                                        hidden={!auth.user.permissions.includes('create_roles')}
                                    >
                                        {translations.permissions.create_button}
                                    </Button>
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

                                    {(isLoading) ?  (
                                        <div className="text-center py-4">{translations.permissions.table_isloading}</div>
                                    ) : assign.length === 0 ? (
                                        <div className="text-center py-4">{translations.permissions.table_no_data}</div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <div className="inline-block min-w-full align-middle">
                                                <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5">
                                                    <table className="min-w-full divide-y divide-gray-300">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th scope="col" className="py-3.5 pl-4 pr-3 text-center text-sm font-semibold text-gray-900 sm:pl-6">{translations.permissions.table_no}</th>
                                                                <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">{translations.permissions.table_name}</th>
                                                                <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">{translations.permissions.table_permissions}</th>
                                                                <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">{translations.permissions.table_action}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200 bg-white">
                                                            {assign.map((user, index) => (
                                                                <tr key={user.id} className="whitespace-nowrap py-4 pl-4 pr-3 text-center text-sm font-medium text-gray-900 sm:pl-6">
                                                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-center text-sm font-medium text-gray-900 sm:pl-6">
                                                                        {meta?.from ? meta.from + index : index + 1}
                                                                    </td>
                                                                    <td className="whitespace-nowrap px-3 py-4 text-center text-sm">
                                                                        {user.user_name}
                                                                    </td>
                                                                    <td className="px-3 py-4 text-sm text-gray-700 align-top max-w-[1000px] text-center">
                                                                        <div className="flex flex-col items-center gap-2 max-h-32 overflow-y-auto">
                                                                            {Object.entries(user.permissions).map(([group, actions], idx) => (
                                                                                <div key={idx} className="mb-2 w-full">
                                                                                    <div className="flex flex-wrap justify-center gap-2">
                                                                                        {actions.map((action, actionIdx) => (
                                                                                            <span
                                                                                                key={actionIdx}
                                                                                                 className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                                                                            >
                                                                                                {translations.permissions?.[`${action}_${group}`] || `${action}_${group}`}
                                                                                            </span>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-2 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                                        <div className="flex justify-center space-x-1">
                                                                            <Button
                                                                                size="sm"
                                                                                variant="secondary"
                                                                                // onClick={() => handleEdit(role)}
                                                                                // disabled={!auth.user.permissions.includes('edit_roles')}
                                                                                className="inline-flex items-center"
                                                                            >
                                                                                {translations.permissions.edit_button}
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="destructive"
                                                                                onClick={() => handleDelete(user.id)}
                                                                                disabled={!auth.user.permissions.includes('delete_roles')}
                                                                                className="inline-flex items-center"
                                                                            >
                                                                                {translations.permissions.delete_button}
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
        </MainLayout>
        </>
    );
}