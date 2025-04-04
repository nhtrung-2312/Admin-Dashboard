<?php

use App\Http\Controllers\Api\UserApi;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\Api\ProductApi;
use Illuminate\Support\Facades\Route;

// API Routes
Route::prefix('api')->name('api.')->middleware(['auth'])->group(function () {
    // User routes
    Route::prefix('users')->middleware(['permission:view users'])->group(function () {
        Route::get('/', [UserApi::class, 'index'])->name('users.index');
        
        Route::middleware(['permission:create users'])->group(function () {
            Route::post('/', [UserApi::class, 'store'])->name('users.store');
        });
        
        Route::middleware(['permission:edit users'])->group(function () {
            Route::put('/{user}', [UserApi::class, 'update'])->name('users.update');
        });
        
        Route::middleware(['permission:delete users'])->group(function () {
            Route::delete('/{user}', [UserApi::class, 'destroy'])->name('users.destroy');
        });
    });

    // Product routes
    Route::prefix('products')->middleware(['permission:view products'])->group(function () {
        Route::get('/', [ProductApi::class, 'index'])->name('products.index');

        Route::middleware(['permission:create products'])->group(function () {
            Route::post('/', [ProductApi::class, 'store'])->name('products.store');
        });
        
        Route::middleware(['permission:edit products'])->group(function () {
            Route::put('/{product}', [ProductApi::class, 'update'])->name('products.update');
        });
        
        Route::middleware(['permission:delete products'])->group(function () {
            Route::delete('/{product}', [ProductApi::class, 'destroy'])->name('products.destroy');
        });
    });
});

// Inertia Routes
Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/', [HomeController::class, 'index'])->name('home');
    
    Route::prefix('products')->middleware(['auth', 'check.role:admin,manager'])->group(function () {
        Route::get('/', [ProductController::class, 'index'])->name('products');
        
        Route::middleware(['check.role:admin,manager'])->group(function () {
            Route::get('/create', [ProductController::class, 'create'])->name('products.create');
            Route::post('/', [ProductController::class, 'store'])->name('products.store');
            Route::get('/{product}/edit', [ProductController::class, 'edit'])->name('products.edit');
            Route::put('/{product}', [ProductController::class, 'update'])->name('products.update');
        });
        
        Route::middleware(['check.role:admin'])->group(function () {
            Route::delete('/{product}', [ProductController::class, 'destroy'])->name('products.destroy');
        });
    });
});

// Auth Routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'login'])->name('login');
    Route::post('/login', [AuthController::class, 'authenticate'])->name('login.authenticate');
});

Route::post('/logout', [AuthController::class, 'logout'])->name('logout')->middleware('auth');