// THEME STATE (shared by every screen): which theme is picked, saved on the phone.
// Screens read the colours with:  const colors = useColors();
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Colors, DEFAULT_THEME, THEMES } from '../theme';

type Ctx = {
  themeKey: string;
  colors: Colors;
  setTheme: (key: string) => void;
};
const ThemeContext = createContext<Ctx | null>(null);
const KEY = 'micasa:theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKey] = useState(DEFAULT_THEME);

  // Load the theme the user picked last time.
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((saved) => { if (saved && THEMES[saved]) setThemeKey(saved); })
      .catch(() => {});
  }, []);

  const setTheme = useCallback((key: string) => {
    if (!THEMES[key]) return;
    setThemeKey(key);
    AsyncStorage.setItem(KEY, key).catch(() => {});
  }, []);

  const value = useMemo<Ctx>(
    () => ({ themeKey, colors: THEMES[themeKey].colors, setTheme }),
    [themeKey, setTheme],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const c = useContext(ThemeContext);
  if (!c) throw new Error('useTheme must be used inside ThemeProvider');
  return c;
};

// Shortcut for screens that only need the colours.
export const useColors = () => useTheme().colors;
