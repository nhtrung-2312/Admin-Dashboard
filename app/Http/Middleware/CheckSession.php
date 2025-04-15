<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CheckSession
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if(Auth::check()) {
            $user = Auth::user();

            if ($user->is_deleted == 1 || $user->is_active == 0) {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
                
                return redirect()->route('login')->with('error', 'This account have been blocked, try login again');
            }
            return $next($request);
        }

        return redirect()->route('login')->with('error', 'An error occured, please login again');
    }
}
