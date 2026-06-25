import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Syncs the HTML lang + dir attributes with the active i18n language.
 * Wrap this inside the React tree (after I18nextProvider is active).
 */
export default function LanguageProvider({ children }) {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith('en') ? 'en' : 'he';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  }, [lang]);

  // Set initial defaults synchronously on mount
  if (typeof document !== 'undefined' && !document.documentElement.dataset.langInit) {
    document.documentElement.dataset.langInit = '1';
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  }

  return <>{children}</>;
}
