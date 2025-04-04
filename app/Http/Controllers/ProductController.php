<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductController extends Controller
{

    public function index(Request $request)
    {
        return Inertia::render('Products/index', [
            'filters' => $request->only(['search', 'status', 'priceFrom', 'priceTo', 'per_page', 'page'])
        ]);
    }

    public function create()
    {
        return Inertia::render('Products/create');
    }
}
