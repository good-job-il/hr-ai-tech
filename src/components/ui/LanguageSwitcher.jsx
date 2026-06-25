import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher({ className = '', variant = 'default' }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'he';

  const toggle = () => {
    const next = currentLang === 'he' ? 'en' : 'he';
    i18n.changeLanguage(next);
    // Update document direction and lang attribute
    document.documentElement.lang = next;
    document.documentElement.dir = next === 'he' ? 'rtl' : 'ltr';
  };

  if (variant === 'minimal') {
    return (
      <button
        onClick={toggle}
        className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80 ${className}`}
        title={currentLang === 'he' ? 'Switch to English' : 'עבור לעברית'}
        aria-label="Switch language"
      >
        <Globe className="w-4 h-4" />
        <span>{currentLang === 'he' ? 'EN' : 'עב'}</span>
      </button>
    );
  }

  if (variant === 'badge') {
    return (
      <button
        onClick={toggle}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all hover:shadow-sm ${
          currentLang === 'he'
            ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
        } ${className}`}
        aria-label="Switch language"
      >
        <Globe className="w-3.5 h-3.5" />
        {currentLang === 'he' ? 'English' : 'עברית'}
      </button>
    );
  }

  // Default variant — dropdown-style pill
  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all hover:bg-gray-50 hover:border-gray-300 ${className}`}
      aria-label="Switch language"
    >
      <Globe className="w-4 h-4 text-gray-500" />
      <span className="text-gray-700">{currentLang === 'he' ? 'English' : 'עברית'}</span>
    </button>
  );
}
