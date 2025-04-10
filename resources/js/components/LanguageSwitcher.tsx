import { useState, useEffect } from 'react';
import axios from 'axios';
import { Language } from '@/types';
import { Globe, ChevronDown, Check } from 'lucide-react';

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
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white/80 hover:bg-white text-gray-700 text-sm border border-gray-200 shadow-sm transition-all duration-200"
            >
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{currentLang.toUpperCase()}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 py-2 w-48 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg z-50 border border-gray-200">
                    {Object.values(languages).map((language) => (
                        <button
                            key={language.code}
                            onClick={() => {
                                handleLanguageChange(language.code);
                                setIsOpen(false);
                            }}
                            className={`flex items-center justify-between w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-200
                                ${currentLang === language.code ? 'bg-blue-50 text-blue-600' : ''}`}
                        >
                            <div className="flex items-center space-x-2">
                                <span className="font-medium">{language.code.toUpperCase()}</span>
                                <span className="text-gray-500 text-sm">{language.name}</span>
                            </div>
                            {currentLang === language.code && (
                                <Check className="w-4 h-4 text-blue-600" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LanguageSwitcher;