import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { directionForLanguage } from '@/domain/agency/rmAcceptance';

/**
 * Syncs the HTML lang + dir attributes with the active i18n language.
 * Wrap this inside the React tree (after I18nextProvider is active).
 */
export default function LanguageProvider({ children }) {
  const { i18n } = useTranslation();
  const direction = directionForLanguage(i18n.language);
  const lang = direction === 'ltr' ? 'en' : 'he';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = direction;
  }, [direction, lang]);

  // Set initial defaults synchronously on mount
  if (typeof document !== 'undefined' && !document.documentElement.dataset.langInit) {
    document.documentElement.dataset.langInit = '1';
    document.documentElement.lang = lang;
    document.documentElement.dir = direction;
  }

  return <>{children}</>;
}
