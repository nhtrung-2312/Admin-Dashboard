<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class LocalizationController extends Controller
{
    public function getTranslations($lang)
    {
        $translations = Lang::get('messages', $lang);
        app()->setLocale($lang);
        return response()->json($translations);
    }
}
