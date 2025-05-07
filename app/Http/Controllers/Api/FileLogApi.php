<?php

namespace App\Http\Controllers\Api;

use App\Models\FileLog;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;

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
}
