import { User } from "@/types"
import MainLayout from '@/layouts/main-layout';
import { Head } from '@inertiajs/react';
import { Link } from '@inertiajs/react';

interface Props {
    auth: {
        user: User;
    }
    translations: any;
    fileLog: {
        id: number;
        file_name: string;
        type: 'import' | 'export';
        table_name: string;
        total_records: number;
        status: boolean;
        created_at: string;
        user: {
            name: string;
        };
        details: {
            id: number;
            row_number: number;
            error_message: string;
        }[];
    };
}

export default function Details({ auth, translations, fileLog }: Props) {
    const t = translations.details;

    return (
        <>
            <Head title={t.title} />
            <MainLayout translations={translations.nav} user={auth.user}>
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 text-gray-900">
                                <div className="mb-8">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-2xl font-bold text-gray-900">{t.title}</h2>
                                        <Link
                                            href={route('files')}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            {t.back}
                                        </Link>
                                    </div>
                                </div>

                                <div className="mb-8 bg-gray-50 p-6 rounded-lg">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">{t.file_name}</p>
                                            <p className="font-medium">{fileLog.file_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">{t.type}</p>
                                            <p className="font-medium">{fileLog.type}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">{t.table}</p>
                                            <p className="font-medium">{fileLog.table_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">{t.user}</p>
                                            <p className="font-medium">{fileLog.user.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">{t.time}</p>
                                            <p className="font-medium">{new Date(fileLog.created_at).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">{t.status}</p>
                                            <p className="font-medium">
                                                <span className={`px-2 py-1 rounded-full text-sm ${
                                                    fileLog.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {fileLog.status ? t.status_success : t.status_error}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                                    {t.row}
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    {t.error}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {fileLog.details.length > 0 ? (
                                                fileLog.details.map((detail) => (
                                                    <tr key={detail.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                            {t.row} {detail.row_number}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-red-600 whitespace-normal break-words max-w-4xl">
                                                            {detail.error_message}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">
                                                        {t.no_errors}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </MainLayout>
        </>
    );
}
