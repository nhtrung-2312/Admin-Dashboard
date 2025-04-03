<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\MstUser;
use Illuminate\Support\Facades\Auth;

class HomeController extends Controller
{
    //Keep the URL when user interact with the page
    public function index(Request $request)
    {
        return Inertia::render('Home/index', [
            'filters' => $request->only(['search', 'status', 'role', 'per_page', 'page'])
        ]);
    }
}
