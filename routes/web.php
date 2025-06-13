<?php

use App\Http\Controllers\Api\UserApi;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\Api\ProductApi;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FileApi;
use App\Http\Controllers\Api\FileLogApi;
use App\Http\Controllers\Api\GCPApi;
use App\Http\Controllers\Api\PermissionApi;
use App\Http\Controllers\Api\RoleApi;
use App\Http\Controllers\FileController;
use App\Http\Controllers\PermissionController;
use App\Models\MstUser;
use App\Http\Controllers\LoginController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

//API Routes
Route::prefix('api')->name('api.')->middleware(['jwt'])->group(function () {
    // User routes
    Route::prefix('users')->middleware(['permission:view_users'])->group(function () {
        Route::get('/', [UserApi::class, 'index'])->name('users.index');

        Route::middleware(['permission:create_users'])->group(function () {
            Route::post('/', [UserApi::class, 'store'])->name('users.store');
        });

        Route::middleware(['permission:edit_users'])->group(function () {
            Route::put('/{user}', [UserApi::class, 'update'])->name('users.update');
        });

        Route::middleware(['permission:delete_users'])->group(function () {
            Route::delete('/{user}', [UserApi::class, 'destroy'])->name('users.destroy');
        });
    });

    // Product routes
    Route::prefix('products')->middleware(['permission:view_products'])->group(function () {
        Route::get('/', [ProductApi::class, 'index'])->name('products.index');

        Route::middleware(['permission:create_products'])->group(function () {
            Route::post('/', [ProductApi::class, 'store'])->name('products.store');
        });

        Route::middleware(['permission:edit_products'])->group(function () {
            Route::put('/{product}', [ProductApi::class, 'update'])->name('products.update');
        });

        Route::middleware(['permission:delete_products'])->group(function () {
            Route::delete('/{product}', [ProductApi::class, 'destroy'])->name('products.destroy');
        });
    });

    // Role routes
    Route::prefix('roles')->middleware(['permission:view_roles'])->group(function () {
        Route::get('/', [RoleApi::class, 'index'])->name('roles.index');

        Route::middleware(['permission:create_roles'])->group(function () {
            Route::post('/', [RoleApi::class, 'store'])->name('roles.store');
        });

        Route::middleware(['permission:edit_roles'])->group(function () {
            Route::put('/{role}', [RoleApi::class, 'update'])->name('roles.update');
        });

        Route::middleware(['permission:delete_roles'])->group(function () {
            Route::delete('/{role}', [RoleApi::class, 'destroy'])->name('roles.destroy');
        });
    });

    // File routes
    Route::prefix('files')->middleware(['permission:view_files'])->group(function () {
        Route::middleware(['permission:import_files'])->group(function () {
            Route::post('/import', [FileApi::class, 'import'])->name('file.import');
        });
        Route::middleware(['permission:export_files'])->group(function () {
            Route::post('/export', [FileApi::class, 'export'])->name('file.export');
        });

        Route::prefix('log')->group(function() {
            Route::get('/', [FileLogApi::class, 'index'])->name('file.log');
        });

        Route::prefix('details')->group(function() {
            Route::get('/', [FileLogApi::class, 'index'])->name('file.details');
        });

        Route::get('/download/{id}', [FileLogApi::class, 'download'])->name('file.download')->middleware(['permission:download_files']);
    });



    Route::get('languages', function () {
        return response()->json([
            'current' => app()->getLocale(),
            'available' => config('app.available_locales')
        ]);
    });

    Route::get('/search', [GCPApi::class, 'search']);
});

// Inertia Routes
Route::middleware(['web', 'jwt'])->group(function () {
    Route::prefix('/')->group(function () {
        Route::get('/', [HomeController::class, 'index'])->name('home');
    });

    Route::prefix('products')->middleware(['permission:view_products'])->group(function () {
        Route::get('/', [ProductController::class, 'index'])->name('products');
        Route::get('/create', [ProductController::class, 'create'])->middleware(['permission:create_products'])->name('products.create');
    });

    Route::prefix('roles')->middleware(['permission:view_roles'])->group(function () {
        Route::get('/', [RoleController::class, 'index'])->name('roles');
    });

    Route::prefix('files')->group(function () {
        Route::get('/', [FileController::class, 'index'])->name('files');
        Route::get('/details/{id}', [FileController::class, 'details'])->name('files.details');
    });

    Route::get('/me', [AuthController::class, 'me'])->name('me');
    Route::get('/refresh', [AuthController::class, 'refresh'])->name('refresh');
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    Route::get('/lang/{locale?}', function ($locale = null) {
        if ($locale && in_array($locale, config('app.available_locales'))) {
            app()->setLocale($locale);
            session()->put('locale', $locale);
        }
        return redirect()->back();
    });
});

// Guest Routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'login'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('auth.login');
});