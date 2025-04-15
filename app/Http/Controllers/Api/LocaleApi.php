<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class LocaleApi extends Controller
{
    public function index()
    {
        return response()->json([
            'current' => app()->getLocale(),
            'available' => config('app.available_locales')
        ]);
    }

    public function setLocale($locale)
    {
        if ($locale && in_array($locale, config('app.available_locales'))) {
            app()->setLocale($locale);
            session()->put('locale', $locale);
        }
        return redirect()->back();
    }
}
