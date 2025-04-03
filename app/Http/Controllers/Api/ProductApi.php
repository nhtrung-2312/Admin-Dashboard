<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;

class ProductApi extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Step 1: Get all products
        $query = Product::query();


        // Step 2: Filter by status
        if ($request->has('status')) {
            $status = $request->input('status');
            if ($status === 'active') {
                $query->where('status', 1);
            } elseif ($status === 'inactive') {
                $query->where('status', 0);
            } elseif ($status === 'out_of_stock') {
                $query->where('status', 2);
            }
        }

        // Step 3: Filter by price
        if ($request->has('price_from')) {
            $query->where('price', '>=', $request->input('price_from'));
        }

        if ($request->has('price_to')) {
            $query->where('price', '<=', $request->input('price_to'));
        }

        // Step 4: Filter by search
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->input('search') . '%');
        }

        // Step 5: Paginate (Choose how many products per page)
        if ($request->has('per_page')) {
            $perPage = $request->input('per_page');
            $query->paginate($perPage);
        }

        // Step 6: Sort by date added
        $query->orderBy('created_at', 'desc');

        // Step 7: Paginate the results (default by 10)
        $perPage = $request->input('per_page', 10);
        $products = $query->paginate($perPage)->withQueryString();

        // Step 8: Return the response
        return response()->json([
            'data' => $products->items(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'from' => $products->firstItem() ?? 0,
                'last_page' => $products->lastPage(),
                'links' => $products->linkCollection()->toArray(),
                'path' => $products->path(),
                'per_page' => $products->perPage(),
                'to' => $products->lastItem() ?? 0,
                'total' => $products->total(),
            ]
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
