<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Lang;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\App;

class AuthController extends Controller
{
    // Show the login page
    public function login()
    {
        return Inertia::render('Auth/Login', [
            'translations' => [
                'login' => trans('login'),
                'validation' => trans('validation'),
                'auth' => trans('auth'),
                'attributes' => trans('attributes')
            ],
            'locale' => app()->getLocale()
        ]);
    }

    // Handle login
    public function authenticate(LoginRequest $request)
    {
        try {
            // Step 1: Validate user input
            $credentials = $request->validate([
                'email' => ['required', 'email'],
                'password' => ['required'],
            ]);

            $remember = $request->boolean('remember', false);

            // Step 2: Compare the data in database
            if (Auth::attempt($credentials, $remember)) {
                $user = Auth::user();

                //if the account is on soft delete, cant login
                if ($user->is_delete) {
                    Auth::logout();
                    return back()->withErrors([
                        'email' => trans('auth.failed')
                    ], 500);
                }

                // Gán role cho user dựa trên group_role
                $user->assignRole($user->group_role);

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
            } else {
                return back()->withErrors([
                    'password' => trans('auth.failed')
                ]);
            }
        } catch (\Exception $e) {
            //Step 5: if system failed, return error
            Log::error('Lỗi khi đăng nhập: ' . $e->getMessage());
            return back()->withErrors([
                'message' => trans('system.failed')
            ]);
        }
    }

    // Handle logout
    public function logout(Request $request)
    {
        try {
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

        } catch (\Exception $e) {
            Log::error('Lỗi khi đăng xuất: ' . $e->getMessage());
            return back()->withErrors([
                'message' => 'Có lỗi xảy ra khi đăng xuất',
            ], 500);
        }
    }
}
