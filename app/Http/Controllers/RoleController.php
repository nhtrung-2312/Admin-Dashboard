<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;

class RoleController extends Controller
{
    public function index(Request $request)
    {
        $permissions = Permission::pluck('name');
        return Inertia::render('Roles/index', [
            'filters' => $request->only(['search', 'status', 'priceFrom', 'priceTo', 'per_page', 'page']),
            'translations' => [
                'nav' => __('nav'),
                'role' => __('role'),
                'pagination' => __('pagination'),
                'permissions' => __('permissions')
            ],
            'permissions' => $permissions,
        ]);
    }
}
