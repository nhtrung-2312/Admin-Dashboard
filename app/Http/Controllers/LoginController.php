<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class LoginController extends Controller
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
