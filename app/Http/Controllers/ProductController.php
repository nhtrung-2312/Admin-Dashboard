<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Product;

class ProductController extends Controller
{

    public function index(Request $request)
    {
        return Inertia::render('Products/index', [
            'filters' => $request->only(['search', 'status', 'priceFrom', 'priceTo', 'per_page', 'page']),
            'translations' => [
                'nav' => __('nav'),
                'product' => __('product'),
                'pagination' => __('pagination')
            ]
        ]);
    }

    public function create()
    {
        return Inertia::render('Products/create', [
            'translations' => [
                'nav' => __('nav'),
                'product' => __('product'),
                'pagination' => __('pagination')
            ]
        ]);
    }
}
