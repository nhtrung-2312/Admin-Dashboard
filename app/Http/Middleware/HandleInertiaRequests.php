<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): string|null
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return array_merge(parent::share($request), [
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'group_role' => $request->user()->group_role,
                    'is_active' => $request->user()->is_active,
                    'is_delete' => $request->user()->is_delete,
                    'last_login_at' => $request->user()->last_login_at,
                    'created_at' => $request->user()->created_at,
                    'updated_at' => $request->user()->updated_at,
                    'roles' => $request->user()->getRoleNames()->toArray(),
                ] : null,
            ],
            'flash' => fn () => [
                'message' => $request->session()->get('message'),
                'error' => $request->session()->get('error'),
                'success' => $request->session()->get('success'),
                'warning' => $request->session()->get('warning'),
                'info' => $request->session()->get('info'),
            ],
            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen' => $request->cookie('sidebar_state') === 'true',
        ]);
    }
}
