<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use Illuminate\Support\Facades\Auth;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\RateLimiter;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function __construct()
    {
        $this->middleware('jwt')->except(['login']);
    }
    public function login(LoginRequest $request)
    {
        try {
            //Step 1: Validate login request
            $credentials = $request->only('email', 'password');

            //Check for remember me checkbox
            $remember = $request->boolean('remember', false);

            //Create key for RateLimiter
            $ipAddress = $request->ip();
            $key = 'login:' . $ipAddress;

            //If this key is on throttile timer, not allowed
            if (RateLimiter::tooManyAttempts($key, 5)) {
                $seconds = RateLimiter::availableIn($key);
                return response()->json([
                    'status' => 'error',
                    'retry_after' => $seconds
                ], 429);
            }

            //Step 2: Attemp to login
            if (!$token = Auth::guard('api')->attempt($credentials)) {
                //If false, flag with error
                RateLimiter::hit($key, 60);

                return response()->json([
                    'status' => 'error',
                    'message' => __('auth.not_authorize'),
                ], 401);
            }

            //Step 3: If successs
            $user = Auth::guard('api')->user();

            //Clear out previous false attemp
            RateLimiter::clear($key);

            //Step 4: Assign the user role
            /** @var \App\Models\MstUser $user */
            $user->assignRole([$user->group_role]);

            //Update onLogin infomation
            $updateData = [
                'last_login_at' => Carbon::now(),
                'last_login_ip' => $request->ip(),
            ];

            //Update database
            DB::table('mst_users')
                ->where('id', $user->id)
                ->update($updateData);

            //Step 5: Generate new access token
            return $this->respondWithToken($token);
        } catch (\Exception $e) {
            //If system error
            Log::error('Login error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => __('auth.system.failed')
            ], 500);
        }
    }

    public function logout()
    {
        try {
            Auth::guard('api')->logout();

            return response()->json([
                'status' => 'success',
                'message' => __('auth.logout'),
            ])->withCookie(cookie()->forget('token'));;
        } catch (\Exception $e) {
            Log::error('Logout error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => __('auth.system.failed')
            ], 500);
        }
    }

    public function refresh()
    {
        try {
            $token = JWTAuth::getToken();
            $new_token = JWTAuth::refresh($token);
            return $this->respondWithToken($new_token);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'error' => 'Unauthorized'
            ], 401);
        }
    }

    // Get Authenticated user info
    public function me()
    {
        $user = Auth::guard('api')->user();
        $ttl = JWTAuth::factory()->getTTL();
        $issuedAt = JWTAuth::getPayload()->get('iat');

        $expiresIn = ($issuedAt + ($ttl * 60)) - time();

        return response()->json([
            'status' => 'success',
            'expires_in' => $expiresIn,
            'user' => [
                'name' => $user->name,
                'role' => $user->group_role,
                'is_active' => $user->is_active
            ],
        ]);
    }

    protected function respondWithToken($token)
    {
        $time = JWTAuth::factory()->getTTL();

        $cookie = cookie(
            'token',
            $token,
            $time,
            null,
            null,
            true,
            true,
            false,
            'Strict'
        );

        return response()->json([
            'access_token' => 'generated',
            'expires_in' => $time * 60,
        ])->cookie($cookie);
    }
}