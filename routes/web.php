<?php

use App\Http\Controllers\LoginController;
use Illuminate\Support\Facades\Route;

Route::prefix('login')->group(function () {
    Route::get('/', [LoginController::class, 'index'])->name('login.index');
});