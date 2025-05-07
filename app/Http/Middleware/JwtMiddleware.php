<?php

namespace App\Http\Middleware;

use Closure;
use Exception;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class JwtMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        try {
            // Nếu không có Bearer token, nhưng có cookie 'token'
            if (!$request->bearerToken() && $request->hasCookie('token')) {
                // Thêm Authorization header thủ công từ cookie
                $request->headers->set('Authorization', 'Bearer ' . $request->cookie('token'));
            }

            JWTAuth::parseToken()->authenticate();
        } catch (Exception $e) {
            return redirect()->route('login')->withErrors(['message' => __('auth.session_expired')]);
        }

        return $next($request);
    }
}