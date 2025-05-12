<?php

namespace App\Http\Controllers\Api;

use App\Models\FileLog;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class FileLogApi extends Controller
{
    public function index()
    {
        $fileLogs = FileLog::with('user')->orderBy('created_at', 'desc')->get();
        return response()->json([
            'status' => 'success',
            'data' => $fileLogs
        ], 200);
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
