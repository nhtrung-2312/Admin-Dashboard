import { useState, useRef } from 'react';
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
import { Globe } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Props {
    translations: Record<string, any>;
}

export default function Login({ translations }: Props) {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        remember_token: false
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCheckboxChange = (checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            remember_token: checked
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            const response = await axios.post('/login', formData, {
                headers: {
                    'X-Locale': translations.locale,
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.data.status && response.data.redirect) {
                window.location.href = response.data.redirect;
            }

        } catch (error: any) {
            if (error.response) {
                switch (error.response.status) {
                    case 401:
                        setErrors({
                            password: translations.auth.failed
                        });
                        break;
                    case 406:
                        setErrors({
                            password: translations.auth.failed
                        });
                        break;
                    case 422:
                        setErrors(error.response.data.errors);
                        break;
                    case 500:
                        setErrors({
                            email: translations.system.fail
                        });
                        break;
                    default:
                        setErrors({
                            email: translations.system.fail
                        });
                }
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <Head title={translations.login.title} />

            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="absolute top-4 right-4">
                    <div className="flex items-center space-x-2 bg-white rounded-full px-3 py-1.5 shadow-sm">
                        <LanguageSwitcher />
                    </div>
                </div>

                <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm text-gray-900 shadow-xl rounded-xl border-0">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center text-gray-800">
                            {translations.login.title}
                        </CardTitle>
                        <CardDescription className="text-center text-gray-500">
                            {translations.login.subtitle}
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                    {translations.login.email}
                                </Label>
                                <input
                                    id="email"
                                    name="email" 
                                    type="text"
                                    value={formData.email}
                                    placeholder='example@gmail.com'
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-md ${
                                        errors.name ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    autoComplete="email"
                                    autoCapitalize="none"
                                    spellCheck={false}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-500 mt-1">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                    {translations.login.password}
                                </Label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password" 
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-md ${
                                        errors.name ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder='*******'
                                    autoComplete="current-password"
                                    autoCapitalize="none"
                                    spellCheck={false}
                                />
                                {errors.password && (
                                    <p className="text-sm text-red-500 mt-1">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center space-x-2 mt-2 mb-2">
                                <Checkbox
                                    id="remember"
                                    checked={formData.remember_token}
                                    onCheckedChange={handleCheckboxChange}
                                    className="bg-white/50 border-gray-500 rounded-lg"
                                />
                                <Label htmlFor="remember" className="text-sm text-gray-600">
                                    {translations.login.remember}
                                </Label>
                            </div>
                        </CardContent>

                        <CardFooter>
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-lg py-2"
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