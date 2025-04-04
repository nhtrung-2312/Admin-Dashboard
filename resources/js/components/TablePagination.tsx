import { ChevronLeftIcon, ChevronRightIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline';

interface TablePaginationProps {
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    from: number;
    to: number;
    total: number;
    perPage: number;
    currentPage: number;
    onPerPageChange: (value: number) => void;
    onPageChange: (page: number) => void;
}

export default function TablePagination({
    links,
    from,
    to,
    total,
    perPage,
    currentPage,
    onPerPageChange,
    onPageChange
}: TablePaginationProps) {
    const handlePageClick = (page: number) => {
        if (page !== currentPage) {
            onPageChange(page);
        }
    };

    const renderPageNumbers = () => {
        const pageNumbers = [];
        const totalPages = Math.ceil(total / perPage);
        
        // Hiển thị 2 trang trước và sau trang hiện tại
        for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
            pageNumbers.push(
                <button
                    key={i}
                    onClick={() => handlePageClick(i)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        currentPage === i
                            ? 'z-10 bg-indigo-600 text-white'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                    }`}
                >
                    {i}
                </button>
            );
        }

        return pageNumbers;
    };

    return (
        <div className="flex flex-col border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <p className="text-sm text-gray-700">
                        <span className="md:inline">Hiển thị </span>
                        <span className="md:inline font-medium">{from}</span>
                        <span className="md:inline">~</span>
                        <span className="md:inline font-medium">{to}</span>
                        <span className="md:inline"> trong </span>
                        <span className="md:inline font-medium">{total}</span>
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700">Hiển thị:</label>
                    <select
                        className="rounded-md border-gray-300 text-sm"
                        value={perPage}
                        onChange={(e) => onPerPageChange(Number(e.target.value))}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>

                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm justify-center" aria-label="Pagination">
                    <button
                        onClick={() => handlePageClick(1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="sr-only">Đầu trang</span>
                        <ChevronDoubleLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </button>

                    <button
                        onClick={() => handlePageClick(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="sr-only">Trang trước</span>
                        <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </button>

                    {renderPageNumbers()}

                    <button
                        onClick={() => handlePageClick(currentPage + 1)}
                        disabled={currentPage === Math.ceil(total / perPage)}
                        className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="sr-only">Trang sau</span>
                        <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                    </button>

                    <button
                        onClick={() => handlePageClick(Math.ceil(total / perPage))}
                        disabled={currentPage === Math.ceil(total / perPage)}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="sr-only">Cuối trang</span>
                        <ChevronDoubleRightIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                </nav>
            </div>
        </div>
    );
}
