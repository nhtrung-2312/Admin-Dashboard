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
    //Get the Role list with paginate
    public function index(Request $request)
    {
        try {
            $query = Role::query();

            // Step 1: Handle on search
            if ($request->has('search') && !empty($request->search)) {
                $query->where('name', 'LIKE', '%' . $request->search . '%');
            }
    
            // Paginate
            $perPage = $request->input('per_page', 10);
            $roles = $query->paginate($perPage);
    
            // Format the data with permissions
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
            ], 200);
        } catch (\Exception $e) {
            //Log the error if needed
            // Log::error($e->getMessage());
            return response()->json([
                'message' => __('role.system_fetch_error')
            ], 404);
        }
    }

    //Create a new role
    public function store(RoleRequest $request)
    {
        try {
            //Validate the requests
            $request->validated();

            //Create a role
            $role = Role::create([
                'name' => $request->name,
                'guard_name' => 'web'
            ]);

            // Assign the permissions
            $role->syncPermissions($request->permissions);

            return response()->json([
                'message' => __('role.system_create_success')
            ], 201);

        } catch (\Exception $e) {
            //Log the error if needed
            //Log::error($e->getMessage());
            return response()->json([
                'message' => __('product.system_create_error')
            ], 500);
        }
    }

    //Update the role
    public function update(RoleRequest $request, string $id)
    {
        //Try to find the role
        $role = Role::find($id);

        if(!$role) {
            return response()->json([
                'message' => __('role.system_form_not_found')
            ], 404);
        }

        try {
            //Validate the request
            $request->validated();

            // Update the role
            $role->update([
                'name' => $request->name,
                'updated_at' => now(),
            ]);

            // Assign permissions
            $role->syncPermissions($request->permissions);

            return response()->json([
                'message' => __('role.system.update.success')
            ], 201);

        } catch (\Exception $e) {
            //Log the error if needed
            // Log::error($e->getMessage());
            return response()->json([
                'message' => __('role.system.update.error'),
            ], 500);
        }
    }

    //Remove a role
    public function destroy(string $id)
    {
        //Try to find the role
        $role = Role::find($id);

        if(!$role) {
            return response()->json([
                'message' => __('role.system_form_not_found')
            ], 404);
        }

        try {
            //If the role is system, cant be deleted
            if($role->is_system == 1) {
                return response()->json([
                    'message' => __('role.system_delete_is_system')
                ], 405);
            }

            //Check if any users is using this role
            $exist = MstUser::where('group_role', $role->name)->exists();

            //If exist, return error
            if ($exist) {
                return response()->json([
                    'message' => __('role.system_delete_member_exist')
                ], 405);
            }

            //Remove the role
            $role->delete();

            return response()->json([
                'message' => 'role.system_delete_success'
            ], 201);

        } catch (\Exception $e) {
            // Log the error if needed
            // Log::error($e->getMessage());
            return response()->json([
                'message' => __('role.system_delete_error')
            ], 500);
        }
    }
}
