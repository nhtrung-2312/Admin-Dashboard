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
    // Show the login page
    public function login()
    {
        return Inertia::render('Auth/Login');
    }

    // Handle login
    public function authenticate(LoginRequest $request)
    {
        // Step 1: Validate user input
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $remember = $request->boolean('remember', false);

        // Step 2: Compare the data in database
        if (Auth::attempt($credentials, $remember)) {
            $user = Auth::user();

            //If account is online, cant login
            if (!$user->is_active) {
                Auth::logout();
                return back()->withErrors([
                    'email' => 'Tài khoản của bạn đang hoạt động.',
                ]);
            }

            //if the account is on soft delete, cant login
            if ($user->is_delete) {
                Auth::logout();
                return back()->withErrors([
                    'email' => 'Tài khoản không tồn tại.',
                ]);
            }

            //update if login success
            $updateData = [
                'last_login_at' => Carbon::now(),
                'last_login_ip' => $request->ip(),
            ];

            //if checkbox, create remember token for this account
            if ($remember) {
                $updateData['remember_token'] = Str::random(60);
            }

            //save lasted data
            DB::table('mst_users')
                ->where('id', $user->id)
                ->update($updateData);

            // Step 3: Generate new session and redirect to main page
            $request->session()->regenerate();
            return redirect()->intended('/');
        }

        //Step 3.5: Return error if data not correct with the database
        return back()->withErrors([
            'email' => 'Thông tin đăng nhập không chính xác.',
        ]);
    }

    // Handle logout
    public function logout(Request $request)
    {
        //Step 1: Check for which account is logon then remove remember token
        if (Auth::check()) {
            DB::table('mst_users')
                ->where('id', Auth::id())
                ->update(['remember_token' => null]);
        }

        //Step 2: Destroy this session
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }
}
