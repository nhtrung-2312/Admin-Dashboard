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

/**
 * @OA\Tag(
 *     name="Users",
 *     description="API Endpoints for user management"
 * )
 */
class UserApi extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    /**
     * @OA\Get(
     *     path="/users",
     *     summary="Get list of users",
     *     tags={"Users"},
     *     @OA\Parameter(
     *         name="status",
     *         in="query",
     *         description="Filter by user status (active/inactive)",
     *         required=false,
     *         @OA\Schema(type="string", enum={"active", "inactive"})
     *     ),
     *     @OA\Parameter(
     *         name="role",
     *         in="query",
     *         description="Filter by user role",
     *         required=false,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Parameter(
     *         name="search",
     *         in="query",
     *         description="Search by name or email",
     *         required=false,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Parameter(
     *         name="per_page",
     *         in="query",
     *         description="Number of items per page",
     *         required=false,
     *         @OA\Schema(type="integer", default=10)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Successful operation",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(
     *                 @OA\Property(property="id", type="integer"),
     *                 @OA\Property(property="name", type="string"),
     *                 @OA\Property(property="email", type="string"),
     *                 @OA\Property(property="group_role", type="string"),
     *                 @OA\Property(property="is_active", type="boolean"),
     *                 @OA\Property(property="created_at", type="string", format="date-time"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time")
     *             )),
     *             @OA\Property(property="meta", type="object",
     *                 @OA\Property(property="current_page", type="integer"),
     *                 @OA\Property(property="from", type="integer"),
     *                 @OA\Property(property="last_page", type="integer"),
     *                 @OA\Property(property="per_page", type="integer"),
     *                 @OA\Property(property="to", type="integer"),
     *                 @OA\Property(property="total", type="integer")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error"
     *     )
     * )
     */
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

    /**
     * @OA\Post(
     *     path="/users",
     *     summary="Create a new user",
     *     tags={"Users"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name", "email", "group_role", "is_active"},
     *             @OA\Property(property="name", type="string", example="John Doe"),
     *             @OA\Property(property="email", type="string", format="email", example="john@example.com"),
     *             @OA\Property(property="group_role", type="string", example="admin"),
     *             @OA\Property(property="is_active", type="boolean", example=true)
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="User created successfully"
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error"
     *     )
     * )
     */
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

    /**
     * @OA\Put(
     *     path="/users/{id}",
     *     summary="Update an existing user",
     *     tags={"Users"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="User ID",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name", "email", "group_role", "is_active"},
     *             @OA\Property(property="name", type="string", example="John Doe"),
     *             @OA\Property(property="email", type="string", format="email", example="john@example.com"),
     *             @OA\Property(property="group_role", type="string", example="admin"),
     *             @OA\Property(property="is_active", type="boolean", example=true)
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="User updated successfully"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="User not found"
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error"
     *     )
     * )
     */
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

    /**
     * @OA\Delete(
     *     path="/users/{id}",
     *     summary="Delete a user",
     *     tags={"Users"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="User ID",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="User deleted successfully"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="User not found"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error"
     *     )
     * )
     */
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
