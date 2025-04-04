<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json(['message' => 'Vui lòng đăng nhập'], 401);
        }

        // Admin có toàn quyền
        if ($user->group_role === 'admin') {
            return $next($request);
        }

        // Manager chỉ có quyền xem
        if ($user->group_role === 'manager') {
            if ($request->isMethod('GET')) {
                return $next($request);
            }
            return response()->json(['message' => 'Bạn không có quyền thực hiện thao tác này'], 403);
        }

        // User không có quyền truy cập
        if ($user->group_role === 'user') {
            return response()->json(['message' => 'Bạn không có quyền truy cập'], 403);
        }

        return $next($request);
    }
}