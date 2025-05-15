import { Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { User } from '@/types';
import { useEffect, useState } from 'react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { usePage } from '@inertiajs/react';
import Pusher from 'pusher-js';

interface MainLayoutProps {
    children: React.ReactNode;
    user: User;
    translations: Record<string, any>;
}

export default function MainLayout({ children, user, translations }: MainLayoutProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { flash } = usePage().props as any;

    Pusher.logToConsole = true;

    const pusher = new Pusher('fe95ea79e77bdc5b6a83', {
        cluster: 'ap1',
        forceTLS: true,
    });

    const channel = pusher.subscribe('notify-event');

    channel.bind('notify-message', function (data: any) {
        console.log('Received notification:', data);
        if (data.status === 'success') {
            toast.success(data.message);
        } else {
            toast.error(data.message);
        }
    });

    useEffect(() => {
        if (flash.success) {
            toast.success(flash.success);
        }
        if (flash.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleLogout = async () => {
        try {
            const response = await axios.post('/logout', null, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            router.visit('/login');

        } catch (error: any) {
            console.error(translations.auth.error);
        }
    };

    return (
        <>
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-4/5 mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <Link href="/">
                                    <span className="text-xl font-bold text-gray-900">{translations.dashboard} </span>
                                </Link>
                            </div>
                            <div className="hidden lg:ml-6 lg:flex lg:space-x-8">
                                <Link
                                    hidden={!user.permissions.includes("view_users")}
                                    href={route('home')}
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                                        route().current('home')
                                            ? 'border-indigo-500 text-gray-900'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                                >
                                    {translations.user}
                                </Link>
                                <Link
                                    hidden={!user.permissions.includes("view_products")}
                                    href={route('products')}
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                                        route().current('products') || route().current('products.create')
                                            ? 'border-indigo-500 text-gray-900'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                                >
                                    {translations.products}
                                </Link>
                                <Link
                                    hidden={!user.permissions.includes("view_roles")}
                                    href={route('roles')}
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                                        route().current('roles')
                                            ? 'border-indigo-500 text-gray-900'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                                >
                                    {translations.roles}
                                </Link>
                                <Link
                                    // hidden={!user.permissions.includes("view_roles")}
                                    href={route('files')}
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                                        route().current('files')
                                            ? 'border-indigo-500 text-gray-900'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                                >
                                    {translations.files}
                                </Link>
                            </div>
                        </div>
                        <div className="hidden lg:flex sm:items-center">
                            <div className="sm:ml-6 sm:flex sm:items-center">
                                <div className="flex items-center space-x-4">
                                    <LanguageSwitcher />
                                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                                        <span className="text-sm font-medium text-gray-600">
                                            {user.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="text-sm text-gray-700">{translations.hello}, {user.name}</span>
                                    <button
                                        onClick={handleLogout}
                                        className="text-sm text-red-600 hover:text-red-800"
                                    >
                                        {translations.logout}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="lg:hidden flex items-center justify-center">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                            >
                                <span className="sr-only">Open main menu</span>
                                <svg
                                    className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6 text-gray-400`}
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                                <svg
                                    className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6 text-gray-400`}
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} lg:hidden`}>
                    <div className="pt-2 pb-3 space-y-1">
                        <Link
                            href={route('home')}
                            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                                route().current('home')
                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                            }`}
                        >
                            {translations.user}
                        </Link>
                        <Link
                            href={route('products')}
                            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                                route().current('products')
                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                            }`}
                        >
                            {translations.products}
                        </Link>
                        <Link
                            href={route('roles')}
                            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                                route().current('roles')
                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                            }`}
                        >
                            {translations.roles}
                        </Link>
                        <Link
                            href={route('files')}
                            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                                route().current('files')
                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                            }`}
                        >
                            {translations.files}
                        </Link>
                    </div>
                    <div className="pt-4 pb-3 border-t border-gray-200">
                        <div className="flex items-center px-4">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-600">
                                        {user.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div className="ml-3 flex items-center justify-between w-full">
                                <div className="text-base font-medium text-gray-800">{user.name}</div>
                                <LanguageSwitcher />
                            </div>
                        </div>
                        <div className="mt-3 space-y-1">
                            <button
                                onClick={handleLogout}
                                className="block w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:bg-gray-100 hover:text-red-800"
                            >
                                {translations.logout}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main>{children}</main>
        </div>
        </>
    );
}
