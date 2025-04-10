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

class AuthenticationApi extends Controller
{
    public function login(LoginRequest $request)
    {
        try {
            $credentials = $request->validated();
            $remember = $request->boolean('remember_token', false);

            if (Auth::attempt($credentials, $remember)) {
                $user = Auth::user();

                if ($user->is_delete) {
                    Auth::logout();
                    return response()->json([
                        'message' => 'Tài khoản đã bị xóa'
                    ], 406);
                }

                $user->assignRole($user->group_role);

                $updateData = [
                    'last_login_at' => Carbon::now(),
                    'last_login_ip' => $request->ip(),
                ];

                if ($remember) {
                    $updateData['remember_token'] = Str::random(50);
                }

                DB::table('mst_users')
                    ->where('id', $user->id)
                    ->update($updateData);

                $request->session()->regenerate();

                return response()->json([
                    'status' => true,
                    'redirect' => '/'
                ], 200);
            }

            return response()->json([
                'message' => 'Thông tin đăng nhập không chính xác'
            ], 401);

        } catch (\Exception $e) {
            Log::error('Lỗi khi đăng nhập: ' . $e->getMessage());
            return response()->json([
                'message' => 'Lỗi hệ thống'
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        try {
            if (Auth::check()) {
                DB::table('mst_users')
                    ->where('id', Auth::id())
                    ->update(['remember_token' => null]);
            }

            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json([
                'status' => true,
                'redirect' => '/login'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Lỗi khi đăng xuất: ' . $e->getMessage());
            return response()->json([
                'message' => 'Lỗi hệ thống'
            ], 500);
        }
    }
}
