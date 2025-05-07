<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MstUser;
use App\Models\FileLog;
use App\Models\FileLogDetail;
use App\Exports\MstUserExport;
use App\Exports\ProductExport;
use App\Http\Requests\FileRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use App\Models\Product;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class FileApi extends Controller
{
    public function import(FileRequest $request)
    {
        $data = $request->validated();
        try {
            $file = $data['file'];
            $clean = $data['clean'] ?? false;
            $now = Carbon::now('Asia/Ho_Chi_Minh');
            $fileName = $file->getClientOriginalName();
            $filePath = 'imports/' . $now->format('Y_m_d_g_i_s_A') . '_' . $fileName;

            // Lưu file
            Storage::put($filePath, file_get_contents($file));

            // Tạo file log
            $fileLog = FileLog::create([
                'file_name' => $fileName,
                'type' => 'import',
                'table_name' => $request->table,
                'status' => 'success',
                'user_id' => Auth::guard('api')->user()->id,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            // Handle table case
            switch($request->table) {
                case 'users':
                    break;
                case 'products':
                    $this->ProductImport($file, $clean, $fileLog);
                    break;
                default:
                    $fileLog->update([
                        'status' => 'failed',
                        'error_message' => __('file.import_error')
                    ]);
                    return response()->json([
                        'status' => 'error',
                        'message' => __('file.import_error')
                    ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => __('file.import_success'),
                'log_id' => $fileLog->id
            ], 200);

        } catch (\Exception $e) {
            // Lưu log lỗi
            if (isset($fileLog)) {
                $fileLog->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage()
                ]);

                // Lưu chi tiết lỗi
                FileLogDetail::create([
                    'file_log_id' => $fileLog->id,
                    'row_number' => 0,
                    'error_message' => $e->getMessage()
                ]);
            }

            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function export(Request $request)
    {
        try {
            $table = $request->input('table');
            $filter = $request->input('filter');
            $now = Carbon::now('Asia/Ho_Chi_Minh');
            $fileName = $table . '_' . $now->format('Y_m_d_g_i_s_A') . '.csv';
            $filePath = 'exports/' . $fileName;
            $data = null;

            DB::beginTransaction();

            // Tạo file log
            $fileLog = FileLog::create([
                'file_name' => $fileName,
                'type' => 'export',
                'table_name' => $table,
                'status' => 'success',
                'user_id' => Auth::guard('api')->user()->id,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            switch($table) {
                case 'users':
                    $data = $this->UserExport($filter);
                    $export = new MstUserExport($data);
                    break;

                case 'products':
                    $data = $this->ProductExport($filter);
                    $export = new ProductExport($data);
                    break;

                default:
                    $fileLog->update([
                        'status' => 'failed',
                        'error_message' => 'Bảng không hợp lệ'
                    ]);
                    throw new \Exception('Bảng không hợp lệ');
            }

            // Cập nhật số lượng bản ghi
            $fileLog->update([
                'total_records' => $data->count()
            ]);

            // Lưu file
            Excel::store($export, $filePath, 'local', \Maatwebsite\Excel\Excel::CSV);

            DB::commit();

            return Excel::download($export, $fileName, \Maatwebsite\Excel\Excel::CSV, [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment',
                'X-Filename' => $fileName,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Export error: ' . $e->getMessage());

            // Lưu log lỗi
            if (isset($fileLog)) {
                $fileLog->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage()
                ]);

                // Lưu chi tiết lỗi
                FileLogDetail::create([
                    'file_log_id' => $fileLog->id,
                    'row_number' => 0,
                    'error_message' => $e->getMessage()
                ]);
            }

            return response()->json([
                'status' => 'error',
                'message' => 'Export thất bại: ' . $e->getMessage()
            ], 500);
        }
    }

    // Handle User export
    public function UserExport($filter)
    {
        try {
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
            $sortField = $filter['sort_field'] ?? 'id';
            $sortDirection = $filter['sort_direction'] ?? 'asc';
            $query->orderBy($sortField, $sortDirection);

            // Lấy dữ liệu
            return $query->get();
        } catch (\Exception $e) {
            throw new \Exception('User export error: ' . $e->getMessage());
        }
    }

    // Handle Product export
    public function ProductExport($filter)
    {
        try {
            $query = Product::query();

            // Lọc theo trạng thái
            if (isset($filter['status']) && $filter['status'] != -1) {
                $query->where('status', $filter['status']);
            }

            // Lọc theo khoảng giá
            if (isset($filter['price_from']) || isset($filter['price_to'])) {
                $priceFrom = $filter['price_from'] ?? 0;
                $priceTo = $filter['price_to'] ?? 0;

                if ($priceFrom !== 0 && $priceTo !== 0) {
                    $query->whereBetween('price', [$priceFrom, $priceTo]);
                } elseif ($priceFrom !== 0) {
                    $query->where('price', '>=', $priceFrom);
                } elseif ($priceTo !== 0) {
                    $query->where('price', '<=', $priceTo);
                }
            }

            // Sắp xếp
            $sortField = $filter['sort_field'] ?? 'id';
            $sortDirection = $filter['sort_direction'] ?? 'asc';
            $query->orderBy($sortField, $sortDirection);

            $data = $query->get();

            return $data;
        } catch (\Exception $e) {
            throw new \Exception('Product export error: ' . $e->getMessage());
        }
    }

    //Handle User import
    protected function ProductImport($file, $clean, $fileLog)
    {
        DB::beginTransaction();

        try {
            if($clean) {
                Product::query()->delete();
            }

            $collection = Excel::toCollection(null, $file)[0];
            $validRows = [];
            $errors = [];

            if ($collection->isEmpty()) {
                throw new \Exception('File rỗng hoặc không hợp lệ.');
            }

            $fileLog->update(['total_records' => $collection->count() - 1]);

            foreach ($collection as $index => $row) {
                if ($index === 0) continue;

                try {
                    $validator = Validator::make($row->toArray(), [
                        'name' => 'required|string|max:255',
                        'price' => 'required|numeric|min:0',
                        'quantity' => 'required|integer|min:0',
                        'status' => 'required|in:0,1,2',
                    ]);

                    if ($validator->fails()) {
                        // Lưu chi tiết lỗi validation
                        FileLogDetail::create([
                            'file_log_id' => $fileLog->id,
                            'row_number' => $index + 1,
                            'error_message' => 'Lỗi validation: ' . implode(', ', $validator->errors()->all())
                        ]);

                        $errors[] = [
                            'row' => $index + 1,
                            'errors' => $validator->errors()->all(),
                            'data' => $row->toArray()
                        ];
                    } else {
                        // Thử insert dữ liệu
                        try {
                            $validRows[] = $row->toArray();
                        } catch (\Exception $e) {
                            // Lưu chi tiết lỗi khi insert
                            FileLogDetail::create([
                                'file_log_id' => $fileLog->id,
                                'row_number' => $index + 1,
                                'error_message' => 'Lỗi khi insert dữ liệu: ' . $e->getMessage()
                            ]);
                        }
                    }
                } catch (\Exception $e) {
                    // Lưu chi tiết lỗi không xác định
                    FileLogDetail::create([
                        'file_log_id' => $fileLog->id,
                        'row_number' => $index + 1,
                        'error_message' => 'Lỗi không xác định: ' . $e->getMessage()
                    ]);
                }
            }

            if (!empty($validRows)) {
                try {
                    Product::insert($validRows);
                    $fileLog->update(['total_records' => count($validRows)]);
                } catch (\Exception $e) {
                    throw new \Exception('Lỗi khi insert dữ liệu: ' . $e->getMessage());
                }
            }

            // Cập nhật trạng thái tổng thể
            $failedRecords = FileLogDetail::where('file_log_id', $fileLog->id)->count();
            $fileLog->update([
                'status' => $failedRecords > 0 ? 'partial' : 'success'
            ]);

            DB::commit();
            return $fileLog;

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}

