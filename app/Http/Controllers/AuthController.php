<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Lang;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\App;

class AuthController extends Controller
{
    // Show the login page
    public function login()
    {
        return Inertia::render('Auth/Login', [
            'translations' => [
                'login' => trans('login'),
                'validation' => trans('validation'),
                'auth' => trans('auth'),
                'attributes' => trans('attributes')
            ]
        ]);
    }
}
