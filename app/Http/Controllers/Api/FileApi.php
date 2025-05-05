<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MstUser;
use App\Imports\MstUserImport;
use App\Exports\MstUserExport;
use App\Exports\ProductExport;
use App\Exports\TestExport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use App\Models\Product;
use App\Imports\ProductImport;
use OpenApi\Annotations as OA;

/**
 * @OA\Info(
 *     title="Laravel File API",
 *     version="1.0.0",
 *     description="API documentation for File Management"
 * )
 * @OA\Server(
 *     url=L5_SWAGGER_CONST_HOST,
 *     description="API Server"
 * )
 */
class FileApi extends Controller
{
    /**
     * @OA\Post(
     *     path="/files/import",
     *     summary="Import data from Excel file",
     *     tags={"Files"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\MediaType(
     *             mediaType="multipart/form-data",
     *             @OA\Schema(
     *                 @OA\Property(
     *                     property="file",
     *                     type="file",
     *                     description="Excel file to import"
     *                 ),
     *                 @OA\Property(
     *                     property="table",
     *                     type="string",
     *                     enum={"products", "users"},
     *                     description="Table name to import data"
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Import successful",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Import dữ liệu thành công")
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Lỗi validation dữ liệu"),
     *             @OA\Property(
     *                 property="errors",
     *                 type="array",
     *                 @OA\Items(type="string")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Có lỗi xảy ra khi import")
     *         )
     *     )
     * )
     */
    public function import(Request $request)
    {
        Log::info($request->all());
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:10240', // max 10MB
            'table' => 'required|string'
        ]);

        try {
            $file = $request->file('file');

            // Xử lý import dựa trên loại bảng
            switch($request->table) {
                case 'products':
                    Excel::import(new ProductImport, $file);
                    break;
                // Thêm các case khác nếu cần
                default:
                    return response()->json([
                        'message' => 'Loại bảng không hợp lệ'
                    ], 400);
            }

            return response()->json([
                'message' => 'Import dữ liệu thành công'
            ]);

        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
            $failures = $e->failures();
            $errors = [];

            foreach ($failures as $failure) {
                $errors[] = "Dòng {$failure->row()}: {$failure->errors()[0]}";
            }

            return response()->json([
                'message' => 'Lỗi validation dữ liệu',
                'errors' => $errors
            ], 422);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Có lỗi xảy ra khi import: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/files/export",
     *     summary="Export data to Excel file",
     *     tags={"Files"},
     *     @OA\Parameter(
     *         name="table",
     *         in="query",
     *         required=true,
     *         @OA\Schema(
     *             type="string",
     *             enum={"products", "users"}
     *         ),
     *         description="Table name to export data"
     *     ),
     *     @OA\Parameter(
     *         name="filter",
     *         in="query",
     *         required=false,
     *         @OA\Schema(
     *             type="object",
     *             @OA\Property(property="is_active", type="boolean"),
     *             @OA\Property(property="status", type="integer"),
     *             @OA\Property(property="start_date", type="string", format="date"),
     *             @OA\Property(property="end_date", type="string", format="date"),
     *             @OA\Property(property="price_from", type="number"),
     *             @OA\Property(property="price_to", type="number"),
     *             @OA\Property(property="quantity_from", type="integer"),
     *             @OA\Property(property="quantity_to", type="integer"),
     *             @OA\Property(property="sort_field", type="string"),
     *             @OA\Property(property="sort_direction", type="string", enum={"asc", "desc"})
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Export successful",
     *         @OA\MediaType(
     *             mediaType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
     *             @OA\Schema(type="string", format="binary")
     *         )
     *     ),
     *     @OA\Response(
     *         response=400,
     *         description="Invalid table",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Bảng không hợp lệ")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Export thất bại")
     *         )
     *     )
     * )
     */
    public function export(Request $request)
    {
        Log::info($request->all());
        try {
            $table = $request->input('table');
            $filter = $request->input('filter');
            $fileName = '';
            $data = null;

            switch($table) {
                case 'users':
                    $data = $this->UserExport($filter);
                    $fileName = 'users_' . now()->format('Y-m-d_His') . '.xlsx';
                    $export = new MstUserExport($data);
                    break;

                case 'products':
                    $data = $this->ProductExport($filter);
                    $fileName = 'products_' . now()->format('Y-m-d_His') . '.xlsx';
                    $export = new ProductExport($data);
                    break;

                default:
                    return response()->json(['message' => 'Bảng không hợp lệ'], 400);
            }

            return Excel::download($export, $fileName, \Maatwebsite\Excel\Excel::XLSX, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ]);

        } catch (\Exception $e) {
            Log::error('Export error: ' . $e->getMessage());
            return response()->json(['message' => 'Export thất bại: ' . $e->getMessage()], 500);
        }
    }

    public function UserExport($filter)
    {
        $query = MstUser::query();

        if($filter) {
            // Lọc theo trạng thái
            if ($filter['is_active']) {
                $query->where('is_active', filter_var($filter['is_active'], FILTER_VALIDATE_BOOLEAN));
            }

            // Lọc theo nhóm quyền
            if ($filter['group_role']) {
                $query->where('group_role', $filter['group_role']);
            }

            // Lọc theo khoảng thời gian
            if ($filter['start_date'] && $filter['end_date']) {
                $query->whereBetween('created_at', [
                    $filter['start_date'],
                    $filter['end_date']
                ]);
            }
        }

        // Sắp xếp
        $sortField = $filter['sort_field'] ?? 'created_at';
        $sortDirection = $filter['sort_direction'] ?? 'desc';
        $query->orderBy($sortField, $sortDirection);

        // Lấy dữ liệu
        return $query->get();
    }

    // Thêm method xử lý export Product
    public function ProductExport($filter)
    {
        $query = Product::query();

        // Lọc theo trạng thái
        if (isset($filter['status']) && $filter['status'] != -1) {
            $query->where('status', $filter['status']);
        }

        // Lọc theo khoảng giá
        if (isset($filter['price_from']) && isset($filter['price_to']) && $filter['price_to'] != 0) {
            $query->whereBetween('price', [
                $filter['price_from'],
                $filter['price_to']
            ]);
        }

        // Lọc theo số lượng
        if (isset($filter['quantity_from']) && isset($filter['quantity_to'])) {
            $query->whereBetween('quantity', [
                $filter['quantity_from'],
                $filter['quantity_to']
            ]);
        }

        // Lọc theo thời gian
        if (isset($filter['start_date']) && isset($filter['end_date'])) {
            $query->whereBetween('created_at', [
                $filter['start_date'],
                $filter['end_date']
            ]);
        }

        // Sắp xếp
        $sortField = $filter['sort_field'] ?? 'created_at';
        $sortDirection = $filter['sort_direction'] ?? 'desc';
        $query->orderBy($sortField, $sortDirection);

        return $query->get();
    }
}
