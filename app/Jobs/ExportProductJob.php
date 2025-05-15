<?php

namespace App\Jobs;

use App\Events\NotifyEvent;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Exports\MstUserExport;
use App\Exports\ProductExport;
use App\Models\FileLog;
use App\Models\FileLogDetail;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Storage;

class ExportProductJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $filter;
    protected $fileLog;
    protected $filePath;
    protected $fileType;
    /**
     * Create a new job instance.
     */
    public function __construct($filter, FileLog $fileLog, $filePath, $fileType)
    {
        $this->filter = $filter;
        $this->fileLog = $fileLog;
        $this->filePath = $filePath;
        $this->fileType = $fileType;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            DB::beginTransaction();

            $data = $this->ProductExport($this->filter);

            if ($data->isEmpty()) {
                $this->fileLog->update([
                    'total_records' => 0,
                    'status' => 0 // Error - Không có dữ liệu để export
                ]);

                FileLogDetail::create([
                    'file_log_id' => $this->fileLog->id,
                    'row_number' => 0,
                    'error_message' => 'No data to export'
                ]);

                return;
            }

            $export = new ProductExport($data);
            Excel::store($export, $this->filePath, 'local', $this->fileType);

            $this->fileLog->update([
                'total_records' => $data->count(),
                'status' => 1 // Success
            ]);

            DB::commit();

            broadcast(new NotifyEvent('Successfully export products', 'success'));

        } catch (\Exception $e) {
            DB::rollBack();

            broadcast(new NotifyEvent('Product export failed', 'failed'));

            Log::error('Export product error: ' . $e->getMessage());

            $this->fileLog->update([
                'status' => 0,
                'error_message' => $e->getMessage()
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
}
