<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Role;
use App\Models\MstUser;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Http\Requests\RoleRequest;
use Illuminate\Validation\Rule;


class RoleApi extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Role::query();

        // Xử lý tìm kiếm
        if ($request->has('search') && !empty($request->search)) {
            $query->where('name', 'LIKE', '%' . $request->search . '%');
        }

        // Xử lý phân trang
        $perPage = $request->input('per_page', 10);
        $roles = $query->paginate($perPage);

        // Format lại data trước khi trả về
        $formattedData = $roles->through(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->getAllPermissions()->pluck('name'),
                'is_system' => $role->is_system,
                'created_at' => $role->created_at,
                'updated_at' => $role->updated_at,
            ];
        });

        return response()->json([
            'data' => $formattedData->items(),
            'meta' => [
                'current_page' => $roles->currentPage(),
                'from' => $roles->firstItem(),
                'last_page' => $roles->lastPage(),
                'links' => $roles->linkCollection()->toArray(),
                'path' => $roles->path(),
                'per_page' => $roles->perPage(),
                'to' => $roles->lastItem(),
                'total' => $roles->total(),
            ]
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(RoleRequest $request)
    {
        // Validate dữ liệu
        try {
            $request->validated();

            $role = Role::create([
                'name' => $request->name,
                'guard_name' => 'web'
            ]);

            // Gán permissions cho role
            $role->syncPermissions($request->permissions);

            return response()->json([], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create role',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $role = Role::with('permissions')->findOrFail($id);
        return response()->json($role);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(RoleRequest $request, string $id)
    {
        $role = Role::find($id);
        if(!$role) {
            return response()->json([
                'message' => __('role.system_form_not_found')
            ], 404);
        }

        try {
            $request->validated();

            // Cập nhật role
            $role->update([
                'name' => $request->name,
                'updated_at' => now(),
            ]);

            // Sync permissions
            $role->syncPermissions($request->permissions);

            return response()->json([
                'message' => __('role.system.update.success')
            ], 201);

        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'message' => __('role.system.update.error'),
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $role = Role::find($id);
        if(!$role) {
            return response()->json([
                'message' => __('role.system_form_not_found')
            ], 404);
        }

        try {
            if($role->is_system == 1) {
                return response()->json([
                    'message' => __('role.system_delete_is_system')
                ], 405);
            }

            $exist = MstUser::where('group_role', $role->name)->exists();

            if ($exist) {
                return response()->json([
                    'message' => __('role.system_delete_member_exist')
                ], 405);
            }

            $role->delete();
            return response()->json([], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => __('role.system_delete_error')
            ], 500);
        }
    }

    public function getAllPermissions()
    {
        $permissions = Permission::pluck('name');
        return response()->json([
            'permissions' => $permissions,
        ], 201);
    }
}
