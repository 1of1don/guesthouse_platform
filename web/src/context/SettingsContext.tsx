
// SETTINGS CONTEXT (CURRENCY FORMATTING & THEME APPEARANCE)

// This file manages platform preferences that apply to the whole app:
// 1. Currency selection (Botswana Pula BWP, USD, ZAR, EUR, GBP)
// 2. Formatting prices strictly to 2 decimal places (e.g. "P 920.00")
// 3. Theme mode (Light Powder Cream, Dark Espresso, or System auto)


import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// Blueprint for a supported currency
export interface CurrencyConfig {
  code: string;    // 3-letter currency code (e.g. 'BWP')
  symbol: string;  // Symbol (e.g. 'P', '$', 'R')
  name: string;    // Human-readable name
  rate: number;    // Conversion rate relative to 1 BWP
}

// Supported Currencies List

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  BWP: {
    code: 'BWP',
    symbol: 'P',
    name: 'Botswana Pula (P)',
    rate: 1.0,     // Base currency is Botswana Pula
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar ($)',
    rate: 0.075,
  },
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    name: 'South African Rand (R)',
    rate: 1.38,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro (€)',
    rate: 0.069,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound (£)',
    rate: 0.058,
  },
};

export type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsContextType {
  currencyCode: string;
  currency: CurrencyConfig;
  setCurrencyCode: (code: string) => void;
  formatPrice: (amountInBwp: number | undefined | null) => string;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  detectedLocationCurrency: string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Helper function that peeks at the browser's timezone to suggest a local currency
function detectLocationCurrency(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const lang = navigator.language || '';

    if (tz.includes('Gaborone') || lang.includes('BW')) {
      return 'BWP';
    }
    if (tz.includes('Johannesburg') || lang.includes('ZA')) {
      return 'ZAR';
    }
    if (tz.includes('London') || lang.includes('GB')) {
      return 'GBP';
    }
    if (
      tz.includes('Europe') ||
      tz.includes('Paris') ||
      tz.includes('Berlin') ||
      tz.includes('Madrid') ||
      tz.includes('Rome')
    ) {
      return 'EUR';
    }
    if (tz.includes('America') || lang.includes('US') || lang.includes('CA')) {
      return 'USD';
    }
  } catch {
    // If detection fails, default to Botswana Pula
  }
  return 'BWP';
}

const STORAGE_KEY_CURRENCY = 'micasa_currency_setting';
const STORAGE_KEY_THEME = 'micasa_theme_setting';

export function SettingsProvider({ children }: { children: ReactNode }) {
  // Detected local currency is shown as a suggestion; BWP remains the initial default.
  const [detectedLocationCurrency] = useState<string>(() => detectLocationCurrency());

  // Active currency state, loaded from LocalStorage
  const [currencyCode, setCurrencyCodeState] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CURRENCY);
    if (saved && SUPPORTED_CURRENCIES[saved]) {
      return saved;
    }
    return 'BWP';
  });

  // Active theme state ('light', 'dark', or 'system')
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
    return 'light';
  });

  // Change currency and save choice to browser localStorage
  const setCurrencyCode = (code: string) => {
    if (SUPPORTED_CURRENCIES[code]) {
      setCurrencyCodeState(code);
      localStorage.setItem(STORAGE_KEY_CURRENCY, code);
    }
  };

  // Change theme mode and save choice to browser localStorage
  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY_THEME, newTheme);
  };


  // Applies the 'dark' CSS class to the HTML document element

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme]);

  const currency = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.BWP;


  // formatPrice Helper Function
  // Converts price from base BWP to the active currency, formatted to 2 decimals
  // Example: 920 becomes "P 920.00"

  const formatPrice = (amountInBwp: number | undefined | null): string => {
    const val = Number(amountInBwp) || 0;
    const converted = val * currency.rate;
    const formattedNum = converted.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${currency.symbol} ${formattedNum}`;
  };

  return (
    <SettingsContext.Provider
      value={{
        currencyCode,
        currency,
        setCurrencyCode,
        formatPrice,
        theme,
        setTheme,
        detectedLocationCurrency,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

// Custom hook to easily access settings anywhere in the app
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
