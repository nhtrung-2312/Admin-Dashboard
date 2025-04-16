<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class CheckSession
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check()) {
            return redirect('/login')->with('message', __('auth.session_expired'));
        }
    
        $user = Auth::user()->fresh();

        $message = null;
    
        if ($user->is_delete) {
            $message = __('auth.deleted');
        } elseif (!$user->is_active) {
            $message = __('auth.locked');
        }
    
        if ($message) {
            Auth::logout();
            return redirect('/login')->with('message', $message);
        }
    
        return $next($request);
    }
}
