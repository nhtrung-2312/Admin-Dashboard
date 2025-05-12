<?php

namespace App\Jobs;

use App\Imports\ProductImport;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Product;
use App\Models\FileLog;
use App\Models\FileLogDetail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Facades\Excel;

class ImportProductJob implements ShouldQueue
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
        DB::beginTransaction();

        try {

            if($this->clean) {
                Product::query()->delete();
            }

            $import = new ProductImport();
            Excel::import($import, Storage::path($this->filePath));

            $totalRows = $import->getRowCount();
            $failedRows = $import->failures()->count();

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

                foreach($import->failures() as $failure) {
                    $row = $failure->row();
                    $messages = $failure->errors();

                    if (!isset($errorMap[$row])) {
                        $errorMap[$row] = [];
                    }

                    $errorMap[$row] = array_merge($errorMap[$row], $messages);
                }

                foreach ($errorMap as $row => $messages) {
                    FileLogDetail::create([
                        'file_log_id' => $this->fileLog->id,
                        'row_number' => $row,
                        'error_message' => implode(', ', $messages),
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
