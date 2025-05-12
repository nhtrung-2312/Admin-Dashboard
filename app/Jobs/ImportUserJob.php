<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Imports\MstUserImport;
use App\Models\FileLog;
use App\Models\FileLogDetail;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Storage;
use App\Models\MstUser;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ImportUserJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $filePath;
    protected $fileLog;
    protected $clean;

    public function __construct($filePath, $clean = false, FileLog $fileLog)
    {
        $this->filePath = $filePath;
        $this->fileLog = $fileLog;
        $this->clean = $clean;
    }

    public function handle()
    {
        try {
            DB::beginTransaction();

            if($this->clean) {
                MstUser::where('id', '!=', Auth::guard('api')->user()->id)->delete();
            }

            $import = new MstUserImport();
            Excel::import($import, Storage::path($this->filePath));

            $totalRows = $import->getRowCount();
            $failedRows = $import->failures()->count();

            Log::info($totalRows . ' - ' . $failedRows);

            // Cập nhật status dựa trên kết quả import
            if ($failedRows === $totalRows) {
                // Tất cả các dòng đều thất bại
                $status = 0; // Error
            } elseif ($failedRows === 0) {
                // Tất cả các dòng đều thành công
                $status = 1; // Success
            } else {
                // Một số dòng thành công, một số dòng thất bại
                $status = 2; // Partial
            }

            // Lưu thông tin lỗi nếu có
            if ($import->failures()->isNotEmpty()) {
                $errorMap = [];

                foreach ($import->failures() as $failure) {
                    $row = $failure->row();
                    $errors = $failure->errors();

                    if (!isset($errorMap[$row])) {
                        $errorMap[$row] = [];
                    }

                    // Gộp lỗi nhưng loại bỏ trùng lặp
                    $errorMap[$row] = array_unique(array_merge($errorMap[$row], $errors));
                }

                foreach ($errorMap as $row => $messages) {
                    FileLogDetail::create([
                        'file_log_id' => $this->fileLog->id,
                        'row_number' => $row,
                        'error_message' => implode(' - ', $messages),
                    ]);
                }
            }

            DB::commit();

            $this->fileLog->update([
                'total_records' => $totalRows,
                'status' => $status
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            $this->fileLog->update([
                'status' => 0,
                'total_records' => 0
            ]);

            throw $e;
        }
    }
}
