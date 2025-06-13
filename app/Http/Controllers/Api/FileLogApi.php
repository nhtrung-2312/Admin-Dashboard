<?php

namespace App\Http\Controllers\Api;

use App\Models\FileLog;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class FileLogApi extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = FileLog::query();

            if ($request->has('search')) {
                $query->where('file_name', 'like', '%' . $request->input('search') . '%');
            }

            // Thêm các filter khác
            if ($request->has('status')) {
                $status = $request->input('status');
                $query->where('status', $status);
            }

            $query->orderBy('updated_at', 'desc');

            // Step 7: Paginate the results (default by 10)
            $perPage = $request->input('per_page', 10);
            $products = $query->paginate($perPage)->withQueryString();

            // Step 8: Return the response
            return response()->json([
                'data' => $products->items(),
                'meta' => [
                    'current_page' => $products->currentPage(),
                    'from' => $products->firstItem() ?? 0,
                    'last_page' => $products->lastPage(),
                    'links' => $products->linkCollection()->toArray(),
                    'path' => $products->path(),
                    'per_page' => $products->perPage(),
                    'to' => $products->lastItem() ?? 0,
                    'total' => $products->total(),
                ]
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error when trying to access log page: . ', $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => __('product.system_fetch_error')
            ], 500);
        }
    }

    public function download($id)
    {
        try {
            $fileLog = FileLog::find($id);
            if (!$fileLog) {
                return response()->json(['status' => 'error', 'message' => 'File not found'], 404);
            }

            // Logic to handle file download
            $filePath = storage_path('app/private/' . $fileLog->type . 's/' . $fileLog->file_name);
            Log::info($filePath);

            if (!file_exists($filePath)) {
                return response()->json(['status' => 'error', 'message' => 'File does not exist'], 404);
            }

            return response()->file($filePath, [
                'Content-Type' => mime_content_type($filePath),
                'X-Filename' => $fileLog->file_name,
            ]);

        } catch (\Exception $e) {
            Log::error('Download error: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Error when trying to download'
            ], 500);
        }
    }
}
