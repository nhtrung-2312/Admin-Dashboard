<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Exports\MstUserExport;
use App\Models\FileLog;
use App\Models\FileLogDetail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Storage;
use App\Models\MstUser;

class ExportUserJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $filter;
    protected $fileLog;
    protected $filePath;
    protected $fileType;

    public function __construct($filter, FileLog $fileLog, $filePath, $fileType)
    {
        $this->filter = $filter;
        $this->fileLog = $fileLog;
        $this->filePath = $filePath;
        $this->fileType = $fileType;
    }

    public function handle()
    {
        try {
            DB::beginTransaction();

            $data = $this->UserExport($this->filter);

            if ($data->isEmpty()) {
                $this->fileLog->update([
                    'total_records' => 0,
                    'status' => 0
                ]);

                FileLogDetail::create([
                    'file_log_id' => $this->fileLog->id,
                    'row_number' => 0,
                    'error_message' => 'No data to export'
                ]);

                return;
            }

            $export = new MstUserExport($data);
            Excel::store($export, $this->filePath, 'local', $this->fileType);

            $this->fileLog->update([
                'total_records' => $data->count(),
                'status' => 1 // Success
            ]);

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Export user error: ' . $e->getMessage());

            $this->fileLog->update([
                'status' => 0
            ]);

            FileLogDetail::create([
                'file_log_id' => $this->fileLog->id,
                'row_number' => 0,
                'error_message' => $e->getMessage()
            ]);

            // Xóa file nếu có lỗi
            if (Storage::exists($this->filePath)) {
                Storage::delete($this->filePath);
            }
        }
    }

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
}
