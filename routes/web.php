<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\HomeController;
use Illuminate\Support\Facades\Route;

Route::prefix('/')->group(function () {
    Route::get('/', [HomeController::class, 'index'])->name('home');
    Route::delete('/{id}', [HomeController::class, 'delete'])->name('users.delete');
});

Route::get('/products', [HomeController::class, 'product'])->name('products');

Route::prefix('login')->group(function () {
    Route::get('/', [AuthController::class, 'login'])
        ->name('login')
        ->middleware('guest');

    Route::post('/', [AuthController::class, 'authenticate'])
        ->name('login.authenticate')
        ->middleware('guest');
});

Route::post('/logout', [AuthController::class, 'logout'])
    ->name('logout')
    ->middleware('auth');
