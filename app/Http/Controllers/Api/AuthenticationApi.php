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
    //Authenticate the user
    public function login(LoginRequest $request)
    {
        try {

            //Step 1: Validate the credentials
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

            //Step 2: Try to authenticate the user
            if (Auth::attempt($credentials, $remember)) {
                $user = Auth::user();

                //Check for account status
                if ($user->is_delete == 1 || $user->is_active == 0) {
                    Auth::logout();
                    return response()->json([
                        'message' => __('auth.failed')
                    ], 405);
                }

                // Step 3: Assign the role
                $user->assignRole($user->group_role);

                //Check if the user has any permissions
                if ($user->getAllPermissions()->isEmpty()) {
                    Auth::logout();
                    return response()->json([
                        'message' => __('auth.no_permission')
                    ], 403);
                }

                //Update information
                $updateData = [
                    'last_login_at' => Carbon::now(),
                    'last_login_ip' => $request->ip(),
                ];

                //Update database
                DB::table('mst_users')
                    ->where('id', $user->id)
                    ->update($updateData);

                //Generate new session
                $request->session()->regenerate();

                //Clear the RateLimiter
                RateLimiter::clear($key);

                return response()->json([
                    'status' => true,
                    'redirect' => '/'
                ], 200);
            }

            //Step 4: If failed to authenticate, flag for RateLimiter
            RateLimiter::hit($key, 60);

            //And return message
            return response()->json([
                'message' => __('auth.failed')
            ], 405);

        } catch (\Exception $e) {
            //Step 5: If system error, return message
            return response()->json([
                'message' => __('auth.system_failed')
            ], 500);
        }
    }

    //Logout function
    public function logout(Request $request)
    {
        try {
            //Get the current user
            $userId = Auth::id();

            //Logout and refresh new session
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            //Update the remember token
            DB::table('mst_users')
            ->where('id', $userId)
            ->update(['remember_token' => null]);

            return response()->json([
                'status' => true,
                'redirect' => '/login'
            ], 200);
        } catch (\Exception $e) {
            // Log::error($e->getMessage());
            return response()->json([
                'message' => __('auth.system_failed')
            ], 500);
        }
    }
}
