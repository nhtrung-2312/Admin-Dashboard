<?php

use App\Http\Controllers\Api\UserApi;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\Api\ProductApi;
use Illuminate\Support\Facades\Route;

// API Routes
Route::prefix('api')->name('api.')->middleware('auth')->group(function () {
    Route::get('/users', [UserApi::class, 'index'])->name('users.index');
    Route::post('/users', [UserApi::class, 'store'])->name('users.store');
    Route::get('/users/{user}', [UserApi::class, 'show'])->name('users.show');
    Route::put('/users/{user}', [UserApi::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [UserApi::class, 'destroy'])->name('users.destroy');

    Route::get('/products', [ProductApi::class, 'index'])->name('products.index');
});

// Inertia Routes
Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/', [HomeController::class, 'index'])->name('home');
    Route::get('/products', [ProductController::class, 'index'])->name('products');
});

// Auth Routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'login'])->name('login');
    Route::post('/login', [AuthController::class, 'authenticate'])->name('login.authenticate');
});

Route::post('/logout', [AuthController::class, 'logout'])->name('logout')->middleware('auth');
