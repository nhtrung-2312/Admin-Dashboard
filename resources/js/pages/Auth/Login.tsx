import { useState } from 'react';
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

export default function Login() {
    const { data, setData, post, processing, errors } = useForm<{
        email: string,
        password: string,
        remember: boolean
    }>({
        email: '',
        password: '',
        remember: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <>
            <Head title="Login" />

            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <Card className="w-full max-w-md bg-gray-800 text-white">
                    <CardHeader>
                        <CardTitle className='text-center'>Login</CardTitle>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="email" className="text-white">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    placeholder='example@gmail.com'
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('email', e.target.value)}
                                    className="w-full bg-gray-700 text-white border-gray-600"
                                    required
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-400 mt-1">{errors.email}</p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="password" className="text-white">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder='***********'
                                    value={data.password}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('password', e.target.value)}
                                    className="w-full bg-gray-700 text-white border-gray-600"
                                    required
                                />
                                {errors.password && (
                                    <p className="text-sm text-red-400 mt-1">{errors.password}</p>
                                )}
                            </div>

                            <div className="flex items-center space-x-2 mb-5">
                                <Checkbox
                                    id="remember"
                                    className='bg-white'
                                    checked={data.remember}
                                    onCheckedChange={(checked) => setData('remember', checked as boolean)}
                                />
                                <Label htmlFor="remember" className="text-white">
                                    Remember me
                                </Label>
                            </div>
                        </CardContent>

                        <CardFooter>
                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white-500"
                                disabled={processing}
                            >
                                {processing ? 'Processing...' : 'Login'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </>
    );
}
