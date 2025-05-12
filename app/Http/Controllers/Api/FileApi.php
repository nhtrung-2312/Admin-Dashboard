<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MstUser;
use App\Models\FileLog;
use App\Models\FileLogDetail;
use App\Exports\MstUserExport;
use App\Exports\ProductExport;
use App\Http\Requests\FileRequest;
use App\Jobs\ImportProductJob;
use App\Jobs\ExportProductJob;
use App\Jobs\ExportUserJob;
use App\Jobs\ImportUserJob;
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
                'status' => 3,
                'user_id' => Auth::guard('api')->user()->id,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            // Handle table case
            switch($request->table) {
                case 'users':
                    ImportUserJob::dispatch($filePath, $clean, $fileLog);
                    break;
                case 'products':
                    ImportProductJob::dispatch($filePath, $clean, $fileLog);
                    break;
                default:
                    throw new \Exception('Table not found');
            }

            return response()->json([
                'status' => 'success',
                'message' => __('file.import_success'),
                'log_id' => $fileLog->id
            ], 200);

        } catch (\Exception $e) {
            Log::error($e->getMessage());
            if (isset($fileLog)) {
                $fileLog->update([
                    'status' => 0,
                ]);

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
            $now = Carbon::now();
            $fileType = $this->getWriterType($filter['file_type']);
            $fileExtension = $filter['file_type'];
            $fileName = $table . '_' . $now->format('Y_m_d_g_i_s_A') . '.' . $fileExtension;
            $filePath = 'exports/' . $fileName;

            // Tạo file log
            $fileLog = FileLog::create([
                'file_name' => $fileName,
                'type' => 'export',
                'table_name' => $table,
                'status' => 3,
                'user_id' => Auth::guard('api')->user()->id,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            switch($table) {
                case 'users':
                    ExportUserJob::dispatch($filter, $fileLog, $filePath, $fileType);
                    break;
                case 'products':
                    ExportProductJob::dispatch($filter, $fileLog, $filePath, $fileType);
                    break;
                default:
                    throw new \Exception('Invalid table!');
            }

            return response()->json([
                'status' => 'success',
                'message' => __('file.export_started'),
                'log_id' => $fileLog->id
            ], 201);

        } catch (\Exception $e) {
            if (isset($fileLog)) {
                $fileLog->update([
                    'status' => 0,
                ]);

                FileLogDetail::create([
                    'file_log_id' => $fileLog->id,
                    'row_number' => 0,
                    'error_message' => $e->getMessage()
                ]);
            }

            if (isset($filePath) && Storage::exists($filePath)) {
                Storage::delete($filePath);
            }

            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    protected function getWriterType($fileType)
    {
        return match(strtolower($fileType)) {
            'csv' => \Maatwebsite\Excel\Excel::CSV,
            'xlsx' => \Maatwebsite\Excel\Excel::XLSX,
            'xls' => \Maatwebsite\Excel\Excel::XLS,
            default => throw new \Exception('Định dạng file không được hỗ trợ. Chỉ hỗ trợ: csv, xlsx, xls')
        };
    }
}

