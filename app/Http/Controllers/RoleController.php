<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;

class RoleController extends Controller
{
    public function index()
    {
        $permissions = Permission::pluck('name');
        return Inertia::render('Roles/index', [
            'translations' => [
                'nav' => __('nav'),
                'role' => __('role'),
                'pagination' => __('pagination')
            ],
            'permissions' => $permissions,
        ]);
    }
}
