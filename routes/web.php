<?php

use App\Http\Controllers\Api\UserApi;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\Api\ProductApi;
use App\Http\Controllers\Api\AuthenticationApi;
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


    Route::prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'index'])->name('products');
        Route::get('/create', [ProductController::class, 'create'])->name('products.create');
    });

});

// Auth Routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'login'])->name('login');
    Route::post('/login', [AuthenticationApi::class, 'login'])->name('login.authenticate');
});

Route::post('/logout', [AuthenticationApi::class, 'logout'])->name('logout');

Route::get('/api/languages', function () {
    return response()->json([
        'current' => app()->getLocale(),
        'available' => config('app.available_locales')
    ]);
});

Route::get('/lang/{locale?}', function ($locale = null) {
    if ($locale && in_array($locale, config('app.available_locales'))) {
        app()->setLocale($locale);
        session()->put('locale', $locale);
    }
    return redirect()->back();
});