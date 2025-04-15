<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\MstUser;
use App\Models\Role;

class HomeController extends Controller
{
    //Keep the URL when user interact with the page
    public function index(Request $request)
    {
        $roles = Role::pluck('name')->toArray();
        return Inertia::render('Home/index', [
            'filters' => $request->only(['search', 'status', 'role', 'per_page', 'page']),
            'translations' => [
                'nav' => __('nav'),
                'user' => __('user'),
                'pagination' => __('pagination')
            ],
            'roles' => $roles,
        ]);
    }
}
