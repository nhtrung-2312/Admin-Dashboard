import { User } from '@/types';
import MainLayout from '@/layouts/main-layout';
import { Button } from '@/components/ui/button';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import TablePagination from '@/components/TablePagination';

interface Props {
    auth: {
        user: User;
    };
    stats: {
        users: {
            data: Array<{
                id: number;
                name: string;
                email: string;
                group_role: string;
                is_active: boolean;
                is_delete: boolean;
            }>;
            meta: {
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
            };
        };
    };
}

export default function Index({ auth, stats }: Props) {
    const [perPage, setPerPage] = useState(stats?.users?.meta?.per_page || 10);
    const [search, setSearch] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handlePerPageChange = (value: number) => {
        setPerPage(value);
        router.get(route('home'), {
            per_page: value,
            search: search
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearch(value);
        router.get(route('home'), {
            search: value,
            per_page: perPage
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleDelete = (userId: number) => {
        if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
            setIsDeleting(true);
            router.delete(route('users.delete', userId), {
                preserveScroll: true,
                onSuccess: () => {
                    setIsDeleting(false);
                },
                onError: () => {
                    setIsDeleting(false);
                },
            });
        }
    };

    return (
        <MainLayout user={auth.user}>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            {/* Phần 1: Form thêm người dùng */}
                            <section>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-semibold">Thêm người dùng mới</h2>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
                                        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                                        <input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Chức vụ</label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                                            <option value="">Chọn chức vụ</option>
                                            <option value="admin">Admin</option>
                                            <option value="user">User</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <Button className="bg-lime-500">Thêm người dùng</Button>
                                    </div>
                                </div>
                            </section>

                            {/* Phần 2: Danh sách người dùng */}
                            <section className="border-t border-gray-200 pt-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-semibold">Danh sách người dùng</h2>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm text-gray-700">Tìm kiếm:</label>
                                            <input
                                                type="text"
                                                placeholder="Tìm theo tên hoặc email..."
                                                className="px-3 py-2 border border-gray-300 rounded-md"
                                                value={search}
                                                onChange={handleSearch}
                                            />
                                        </div>
                                    </div>
                                </div>

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
                                            {stats?.users?.data?.map((user, index) => (
                                                <tr key={user.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <div className="font-medium text-gray-900">
                                                            {stats.users.meta.from + index}
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
                                                            <Button size="sm" variant="secondary" className="flex items-center gap-1">
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

                                {stats?.users?.meta && (
                                    <TablePagination
                                        links={stats.users.meta.links}
                                        from={stats.users.meta.from}
                                        to={stats.users.meta.to}
                                        total={stats.users.meta.total}
                                        perPage={perPage}
                                        onPerPageChange={handlePerPageChange}
                                    />
                                )}
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
