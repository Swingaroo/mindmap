import React, { createContext, useContext, ReactNode, FC, useState, useEffect, useCallback, useMemo } from 'react';

// Helper function to get nested keys from the translations object
const get = (obj: any, path: string): string | undefined => {
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    if (result === undefined) return undefined;
    result = result[key];
  }
  return result;
};

export type TFunction = (key: string, options?: { [key: string]: string | number }) => string;

interface I18nContextType {
  t: TFunction;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [translations, setTranslations] = useState<any | null>(null);

  useEffect(() => {
    fetch('/locales/en.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setTranslations(data);
      })
      .catch(error => {
        console.error("Error fetching translations:", error);
        setTranslations({}); // Set to empty object to prevent infinite loading state
      });
  }, []);

  const t: TFunction = useCallback((key, options) => {
    if (!translations) {
      return key; // Return key as fallback during load
    }
    let text = get(translations, key);
    if (text === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    if (options) {
      Object.keys(options).forEach(optKey => {
        text = text!.replace(`{{${optKey}}}`, String(options[optKey]));
      });
    }
    return text;
  }, [translations]);
  
  const value = useMemo(() => ({ t }), [t]);

  if (!translations) {
    return null; // Don't render children until translations are loaded
  }

  // The file is a .ts file, which does not allow JSX syntax. Replaced the JSX with React.createElement to resolve parsing errors.
  return React.createElement(I18nContext.Provider, { value: value }, children);
};

export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
