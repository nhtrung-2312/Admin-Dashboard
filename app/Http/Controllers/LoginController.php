<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use Illuminate\Http\Request;

class LoginController extends Controller
{
    public function index()
    {
        return View('Login.index');
    }
    public function login(LoginRequest $request)
    {

    }
}
