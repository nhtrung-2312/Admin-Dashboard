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

class UserApi extends Controller
{
    /**
     * Show users list with pagination
     */
    public function index(Request $request)
    {
        $query = MstUser::where('id', '!=', Auth::id())
                       ->where('is_delete', '!=', 1);

        if ($request->has('status')) {
            $status = $request->input('status');
            if ($status === 'active') {
                $query->where('is_active', true);
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        if ($request->has('role')) {
            $role = $request->input('role');
            if (!empty($role)) {
                $query->where('group_role', $role);
            }
        }

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $query->orderBy('created_at', 'desc');

        $perPage = $request->input('per_page', 10);
        $users = $query->paginate($perPage)->withQueryString();

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
        ]);
    }

    /**
     * Create new users
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:mst_users'],
            'group_role' => ['required', 'string', 'in:admin,user'],
            'is_active' => ['required', 'boolean']
        ]);

        $password = Str::afterLast($validated['email'], '@');

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

        return response()->json([
            'message' => 'Tạo người dùng thành công'
        ], 201);
    }

    /**
     * Show user details
     */
    public function show(MstUser $user)
    {
        return response()->json([
            'data' => $user
        ]);
    }

    /**
     * Update user data
     */
    public function update(Request $request, MstUser $user)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('mst_users')->ignore($user->id)],
            'group_role' => ['required', 'string'],
            'is_active' => ['required', 'boolean'],
        ]);

        $validated['updated_at'] = now();
        $user->update($validated);

        return response()->json([
            'message' => 'Cập nhật người dùng thành công'
        ]);
    }

    /**
     * Soft delete user
     */
    public function destroy(MstUser $user)
    {
        if ($user->id === Auth::id()) {
            return response()->json([
                'message' => 'Không thể xóa tài khoản của chính mình'
            ], 403);
        }

        $user->update(['is_delete' => true]);

        return response()->json([
            'message' => 'Xóa người dùng thành công'
        ]);
    }
}
