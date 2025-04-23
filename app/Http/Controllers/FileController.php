<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class FileController extends Controller
{
    public function index()
    {
        return Inertia::render('File/index', [
            'translations' => [
                'nav' => __('nav'),
                'pagination' => __('pagination'),
                'file' => __('file')
            ]
        ]);
    }
}
