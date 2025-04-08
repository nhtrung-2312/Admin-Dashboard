import { useState, useRef, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface Props {
    translations: {
        login: {
            title: string;
            email: string;
            password: string;
            remember: string;
            login: string;
        };
        validation: {
            required: string;
            email: string;
        };
        attributes: {
            email: string;
            password: string;
        };
        auth: {
            fail: string;
            error: string;
            deleted_account: string;
        };
        locale: string;
        system: {
            fail: string;
        };
    };
}

export default function Login({ translations }: Props) {
    const emailErrorRef = useRef<HTMLParagraphElement>(null);
    const passwordErrorRef = useRef<HTMLParagraphElement>(null);
    const { data, setData, post, processing, errors } = useForm<{
        email: string,
        password: string,
        remember: boolean
    }>({
        email: '',
        password: '',
        remember: false,
    });

    // useEffect(() => {
    //     if (errors.email && emailErrorRef.current) {
    //         const errorMessage = translations.validation.email.replace(':attribute', translations.attributes.email);
    //         emailErrorRef.current.textContent = errorMessage;
    //     }
    //     if (errors.password && passwordErrorRef.current) {
    //         const errorMessage = translations.validation.required.replace(':attribute', translations.attributes.password); 
    //         passwordErrorRef.current.textContent = errorMessage;
    //     }
    // }, [errors, translations]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login', {
            headers: {
                'X-Locale': translations.locale
            },
            onSuccess: (response: any) => {
                if (response.errors) {
                    return;
                }
                window.location.href = '/';
            },
            onError: (response: any) => {
                console.log(response);
            }
        });
    };

    return (
        <>
            <Head title={translations.login.title} />

            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <Card className="w-full max-w-md bg-gray-800 text-white">
                    <CardHeader className="relative">
                        <div className="absolute right-2 top-2 z-10">
                            <LanguageSwitcher />
                        </div>
                        <CardTitle className='text-center pt-4'>{translations.login.title}</CardTitle>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="email" className="text-white">
                                    {translations.login.email}
                                </Label>
                                <Input
                                    id="email"
                                    type="text"
                                    value={data.email}
                                    placeholder='example@gmail.com'
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full bg-gray-700 text-white border-gray-600"
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-400 mt-1" ref={emailErrorRef}>
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="password" className="text-white">
                                    {translations.login.password}
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="w-full bg-gray-700 text-white border-gray-600"
                                    placeholder='*******'
                                />
                                {errors.password && (
                                    <p className="text-sm text-red-400 mt-1" ref={passwordErrorRef}>
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center space-x-2 mt-3 mb-3">
                                <Checkbox
                                    id="remember"
                                    checked={data.remember}
                                    onCheckedChange={(checked) => setData('remember', checked as boolean)}
                                    className="bg-gray-700 border-gray-600"
                                />
                                <Label htmlFor="remember" className="text-white">
                                    {translations.login.remember}
                                </Label>
                            </div>
                        </CardContent>

                        <CardFooter>
                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                disabled={processing}
                            >
                                {processing ? 'Processing...' : translations.login.login}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </>
    );
}