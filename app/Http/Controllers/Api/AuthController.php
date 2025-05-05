<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use Illuminate\Support\Facades\Auth;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AuthController extends Controller
{
    public function __construct()
    {
        $this->middleware('jwt')->except(['login']);
    }

    public function login(LoginRequest $request)
    {
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
                'retry_after' => $seconds
            ], 429);
        }

        if (!$token = Auth::guard('api')->attempt($credentials)) {

            RateLimiter::hit($key, 60);

            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 401);
        }

        $user = Auth::guard('api')->user();
        RateLimiter::clear($key);

        $user->assignRole($user->group_role);

        $updateData = [
            'last_login_at' => Carbon::now(),
            'last_login_ip' => $request->ip(),
        ];

        //Update database
        DB::table('mst_users')
            ->where('id', $user->id)
            ->update($updateData);

        return $this->respondWithToken($token);
    }

    public function logout()
    {
        Auth::guard('api')->logout();

        return response()->json([
            'status' => 'success',
            'message' => __('auth.logout'),
        ]);
    }

    public function refresh()
    {
        try {
            $token = JWTAuth::getToken();
            $new_token = JWTAuth::refresh($token);
            return $this->respondWithToken($new_token);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
    }

    public function me()
    {
        return response()->json(Auth::guard('api')->user());
    }

    protected function respondWithToken($token)
    {
        $cookie = cookie(
            'token',
            $token,
            60 * auth()->factory()->getTTL(),
            null,
            null,
            true,
            true,
            false,
            'Strict' // SameSite
        );

        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth()->factory()->getTTL() * 60,
        ])->cookie($cookie);
    }
}