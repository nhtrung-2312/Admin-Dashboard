<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Routing\Controller as BaseController;
use App\Models\MstUser;
use Illuminate\Support\Facades\Auth;

class HomeController extends BaseController
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function index(Request $request)
    {
        $query = MstUser::where('id', '!=', Auth::id());

        // Tìm kiếm theo tên hoặc email
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            })->where('is_delete', '!=', 1);
        }

        // Sắp xếp theo thời gian tạo mới nhất
        $query->orderBy('created_at', 'desc');

        // Phân trang
        $perPage = $request->input('per_page', 10);
        $users = $query->paginate($perPage)->withQueryString();

        return Inertia::render('Home/index', [
            'stats' => [
                'users' => [
                    'data' => $users->items(),
                    'meta' => [
                        'current_page' => $users->currentPage(),
                        'from' => $users->firstItem() ?? 0,
                        'last_page' => $users->lastPage(),
                        'links' => $users->linkCollection()->toArray(),
                        'path' => $users->path(),
                        'per_page' => $users->perPage(),
                        'to' => $users->lastItem() ?? 0,
                        'total' => $users->total(),
                    ]
                ]
            ]
        ]);
    }

    public function store(Request $request)
    {
        dd($request->all());
    }

    public function delete(Request $request, $id)
    {
        try {
            $user = MstUser::findOrFail($id);

            if ($user->id === Auth::id()) {
                return back()->with('error', 'Không thể xóa tài khoản của chính mình.');
            }

            $user->update(['is_delete' => true]);

            return back()->with('success', 'Người dùng đã được xóa thành công.');
        } catch (\Exception $e) {
            return back()->with('error', 'Có lỗi xảy ra khi xóa người dùng.');
        }
    }
}
