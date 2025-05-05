<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;
class FileController extends Controller
{
    public function index()
    {
        $roles = Role::pluck('name')->toArray();
        return Inertia::render('File/index', [
            'translations' => [
                'nav' => __('nav'),
                'pagination' => __('pagination'),
                'file' => __('file')
            ],
            'roles' => $roles,
        ]);
    }
}
