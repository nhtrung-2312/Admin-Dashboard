<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login()
    {
        return Inertia::render('Auth/Login');
    }

    public function authenticate(LoginRequest $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $remember = $request->boolean('remember', false);

        if (Auth::attempt($credentials, $remember)) {
            $user = Auth::user();

            if (!$user->is_active) {
                Auth::logout();
                return back()->withErrors([
                    'email' => 'Tài khoản của bạn đã bị vô hiệu hóa.',
                ]);
            }

            if ($user->is_delete) {
                Auth::logout();
                return back()->withErrors([
                    'email' => 'Tài khoản không tồn tại.',
                ]);
            }

            // Cập nhật thông tin đăng nhập và remember token
            $updateData = [
                'last_login_at' => Carbon::now(),
                'last_login_ip' => $request->ip(),
            ];

            if ($remember) {
                $updateData['remember_token'] = Str::random(60);
            }

            DB::table('mst_users')
                ->where('id', $user->id)
                ->update($updateData);

            $request->session()->regenerate();
            return redirect()->intended('/');
        }

        return back()->withErrors([
            'email' => 'Thông tin đăng nhập không chính xác.',
        ]);
    }

    public function logout(Request $request)
    {
        if (Auth::check()) {
            DB::table('mst_users')
                ->where('id', Auth::id())
                ->update(['remember_token' => null]);
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }
}
