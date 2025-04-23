<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MstUser;
use App\Imports\MstUserImport;
use App\Exports\MstUserExport;
use App\Exports\TestExport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class FileApi extends Controller
{
    /**
     * Import users from Excel file
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function import(Request $request)
    {
        try {
            if (!$request->hasFile('file')) {
                return response()->json(['message' => 'Không tìm thấy file'], 400);
            }

            $file = $request->file('file');
            Excel::import(new MstUserImport, $file);

            return response()->json(['message' => 'Import thành công']);
        } catch (\Exception $e) {
            Log::error('Import error: ' . $e->getMessage());
            return response()->json(['message' => 'Import thất bại: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Export users to Excel file with filters
     *
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
     */
    public function export(Request $request)
    {
        try {
            $query = MstUser::query();

            // Lọc theo trạng thái
            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            // Lọc theo nhóm quyền
            if ($request->has('group_role')) {
                $query->where('group_role', $request->input('group_role'));
            }

            // Lọc theo khoảng thời gian
            if ($request->has('start_date') && $request->has('end_date')) {
                $query->whereBetween('created_at', [
                    $request->input('start_date'),
                    $request->input('end_date')
                ]);
            }

            // Lọc theo từ khóa tìm kiếm
            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            // Sắp xếp
            $sortField = $request->input('sort_field', 'created_at');
            $sortDirection = $request->input('sort_direction', 'desc');
            $query->orderBy($sortField, $sortDirection);

            // Lấy dữ liệu
            $users = $query->get();

            // Tạo tên file với timestamp
            $fileName = 'users_' . now()->format('Y-m-d_His') . '.xlsx';

            // Tạo file Excel
            $export = new MstUserExport($users);

            // Tạo response với headers phù hợp
            return Excel::download($export, $fileName, \Maatwebsite\Excel\Excel::XLSX, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ]);
        } catch (\Exception $e) {
            Log::error('Export error: ' . $e->getMessage());
            return response()->json(['message' => 'Export thất bại: ' . $e->getMessage()], 500);
        }
    }
    public function test()
    {
        return Excel::download(new TestExport, 'test.xlsx');
    }
}
