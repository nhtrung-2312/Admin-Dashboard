<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;

class AuthenticationApi extends Controller
{
    public function login(LoginRequest $request)
    {
        try {
            $credentials = $request->only('email', 'password');
            $remember = $request->boolean('remember', false);

            $ipAddress = $request->ip();
            $key = 'login:' . $ipAddress;

            if (RateLimiter::tooManyAttempts($key, 5)) {
                $seconds = RateLimiter::availableIn($key);
                return response()->json([
                    'retry_after' => $seconds
                ], 429);
            }

            if (Auth::attempt($credentials, $remember)) {
                $user = Auth::user();

                if ($user->is_delete == 1 || $user->is_active == 0) {
                    Auth::logout();
                    return response()->json([
                        'message' => __('auth.failed')
                    ], 405);
                }

                $user->assignRole($user->group_role);

                $updateData = [
                    'last_login_at' => Carbon::now(),
                    'last_login_ip' => $request->ip(),
                ];

                DB::table('mst_users')
                    ->where('id', $user->id)
                    ->update($updateData);

                $request->session()->regenerate();

                RateLimiter::clear($key);

                return response()->json([
                    'status' => true,
                    'redirect' => '/'
                ], 200);
            }

            RateLimiter::hit($key, 60);

            return response()->json([
                'message' => __('auth.failed')
            ], 405);

        } catch (\Exception $e) {
            Log::error('Lỗi khi đăng nhập: ' . $e->getMessage());
            return response()->json([
                'message' => 'Lỗi hệ thống'
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        $userId = Auth::id();

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        DB::table('mst_users')
        ->where('id', $userId)
        ->update(['remember_token' => null]);

        return response()->json([
            'status' => true,
            'redirect' => '/login'
        ], 200);
    }
}
