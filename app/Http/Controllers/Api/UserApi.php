<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MstUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Http\Requests\UserRequest;

class UserApi extends Controller
{
    //
    //  Get user list with filter
    //
    public function index(Request $request)
    {
        try {
            //Step 1: Get all users except current user and not deleted
            $query = MstUser::where('id', '!=', Auth::id())
                ->where('is_delete', '!=', 1);

            //Step 2: Filter by status
            if ($request->has('status')) {
                $status = $request->input('status');
                if ($status === 'active') {
                    $query->where('is_active', true);
                } elseif ($status === 'inactive') {
                    $query->where('is_active', false);
                }
            }

            //Step 3: Filter by role
            if ($request->has('role')) {
                $role = $request->input('role');
                if (!empty($role)) {
                    $query->where('group_role', $role);
                }
            }

            //Step 4: Filter by search
            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
                });
            }

            //Step 5: Order by created_at
            $query->orderBy('created_at', 'desc');

            //Step 6: Paginate
            $perPage = $request->input('per_page', 10);
            $users = $query->paginate($perPage)->withQueryString();

            //Step 7: Return response
            return response()->json([
                'data' => $users->items(),
                'meta' => [
                    'current_page' => $users->currentPage(),
                    'from' => $users->firstItem() ?? 0,
                    'last_page' => $users->lastPage(),
                    'links' => $users->linkCollection()->toArray(),
                    'path' => $users->path(),
                    'per_page' => $users->perPage(),
                    'to' => $users->lastItem() ?? 0,
                    'total' => $users->total(),
                ]
            ], 200);
        } catch (\Exception $e) {
            //Step 8: Log error and return error response
            // Log::error($e->getMessage());
            return response()->json([
                'message' => __('user.system_fetch_error')
            ], 500);
        }
    }

    public function store(UserRequest $request)
    {
        try {
            //Step 1: Validate request
            $validated = $request->validated();

            //Step 2: Set the default passsword with email
            $password = '123123123';

            //Step 3: Create new user
            $user = MstUser::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($password),
                'group_role' => $validated['group_role'],
                'is_active' => $validated['is_active'],
                'is_delete' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            //Step 4: Return response
            return response()->json([
                'message' => __('user.system_create_success')
            ], 201);
        } catch (\Exception $e) {
            //Step 5: Log error and return error response
            // Log::error($e->getMessage());
            return response()->json([
                'message' => __('user.system_create_error')
            ], 500);
        }
    }

    public function update(UserRequest $request, MstUser $user)
    {
        //Try to find the user
        // $user = MstUser::find($id);

        // if(!$user) {
        //     return response()->json([
        //         'message' => __('user.system_user_not_found')
        //     ], 404);
        // }

        try {
            //Step 1: Validate request
            $validated = $request->validated();

            //Step 2: Update user data
            $validated['updated_at'] = now();
            $user->update($validated);

            //Step 3: Return response
            return response()->json([
                'message' => __('user.system_update_success')
            ], 200);
        } catch (\Exception $e) {
            //Step 4: Log error and return error response
            // Log::error($e->getMessage());
            return response()->json([
                'message' => __('user.system_update_error')
            ], 500);
        }
    }

    public function destroy(string $id)
    {
        $user = MstUser::find($id);

        if(!$user) {
            return response()->json([
                'message' => __('user.system_user_not_found')
            ], 404);
        }

        try {
            //Step 1: Soft delete user
            $user->update(['is_delete' => 1]);

            //Step 2: Return response
            return response()->json([
                'message' => __('user.system_delete_success')
            ], 200);
        } catch (\Exception $e) {
            //Step 3: Log error and return error response
            // Log::error($e->getMessage());
            return response()->json([
                'message' => __('user.system_delete_error')
            ], 500);
        }
    }
}
