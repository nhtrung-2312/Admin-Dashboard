<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MstUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;

class PermissionApi extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 10);

            // Step 1: Lấy toàn bộ permissions đã join user + permission name
            $rawData = DB::table('model_has_permissions')
                ->join('permissions', 'model_has_permissions.permission_id', '=', 'permissions.id')
                ->join('mst_users', 'model_has_permissions.model_id', '=', 'mst_users.id')
                ->where('model_has_permissions.model_type', MstUser::class)
                ->select(
                    'model_has_permissions.model_id',
                    'model_has_permissions.model_type',
                    'mst_users.name as user_name',
                    'permissions.name as permission_name'
                )
                ->get();

            // Step 2: Group theo user_name
            $grouped = $rawData->groupBy('user_name')->map(function ($items, $userName) {
                $first = $items->first();

                $groupedPerms = [];

                //Group perm theo group
                foreach ($items as $item) {
                    $sliced = explode('_', $item->permission_name);
                    $action = array_shift($sliced);
                    $group = implode('_', $sliced);

                    if (!isset($groupedPerms[$group])) {
                        $groupedPerms[$group] = [];
                    }

                    $groupedPerms[$group][] = $action;
                }

                return [
                    'user_name' => $userName,
                    'model_id' => $first->model_id,
                    'model_type' => $first->model_type,
                    'permissions' => $groupedPerms,
                ];
            })->values();

            // Step 3: Paginate thủ công
            $page = $request->input('page', 1);
            $total = $grouped->count();
            $items = $grouped->slice(($page - 1) * $perPage, $perPage)->values();

            return response()->json([
                'data' => $items,
                'meta' => [
                    'current_page' => (int) $page,
                    'from' => ($total > 0) ? (($page - 1) * $perPage + 1) : 0,
                    'last_page' => (int) ceil($total / $perPage),
                    'links' => [], // Nếu cần link phân trang, có thể xử lý thêm
                    'path' => $request->url(),
                    'per_page' => $perPage,
                    'to' => ($page * $perPage > $total) ? $total : $page * $perPage,
                    'total' => $total,
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Lỗi khi lấy dữ liệu permissions',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
