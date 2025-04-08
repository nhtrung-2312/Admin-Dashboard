import { useState, useEffect } from 'react';
import axios from 'axios';
import { Language } from '@/types';

const LanguageSwitcher = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentLang, setCurrentLang] = useState<string>('');
    const [languages, setLanguages] = useState<Record<string, Language>>({});

    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const response = await axios.get('/api/languages');
                const availableLocales = response.data.available;
                
                const formattedLanguages: Record<string, Language> = {};
                Object.entries(availableLocales).forEach(([name, config]) => {
                    formattedLanguages[name] = {
                        name: name,
                        code: config as string
                    };
                });

                setLanguages(formattedLanguages);
                setCurrentLang(response.data.current);
            } catch (error) {
                console.error('Error fetching languages:', error);
            }
        };

        fetchLanguages();
    }, []);

    const handleLanguageChange = async (langCode: string) => {
        try {
            await axios.get(`/lang/${langCode}`);
            window.location.reload();
        } catch (error) {
            console.error('Error changing language:', error);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-100 text-sm border border-gray-600"
            >
                <span>{currentLang}</span>
                <svg
                    className={`w-4 h-4 transition-transform text-gray-300 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 py-2 w-48 bg-gray-700 rounded-lg shadow-xl z-50 border border-gray-600">
                    {Object.values(languages).map((language) => (
                        <button
                            key={language.code}
                            onClick={() => {
                                handleLanguageChange(language.code);
                                setIsOpen(false);
                            }}
                            className={`flex items-center w-full px-4 py-2 text-left text-gray-100 hover:bg-gray-600
                                ${currentLang === language.code ? 'bg-gray-600' : ''}`}
                        >
                            <span className="mr-2">{language.code}</span>
                            <span>{language.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LanguageSwitcher;