import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import * as Location from 'expo-location';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { COUNTRY_CURRENCY, FALLBACK_RATES, formatMoney } from '../utils/currency';

type Ctx = {
  currency: string;
  setCurrency: (c: string) => void;
  detectFromLocation: () => Promise<string>; // returns a human-readable result
  formatPrice: (bwp: number) => string;
};
const SettingsContext = createContext<Ctx | null>(null);
const KEY = 'micasa:currency';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState('BWP');
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);

  const setCurrency = useCallback((c: string) => {
    setCurrencyState(c);
    AsyncStorage.setItem(KEY, c).catch(() => {});
  }, []);

  const detectFromLocation = useCallback(async () => {
    let country: string | null = null;
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.granted) {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        const [place] = await Location.reverseGeocodeAsync(pos.coords);
        country = place?.isoCountryCode ?? null;
      }
    } catch {}
    const fromDevice = country === null;
    country = country ?? Localization.getLocales()[0]?.regionCode ?? null;
    const code = (country && COUNTRY_CURRENCY[country]) || 'BWP';
    setCurrency(code);
    return fromDevice
      ? `Location unavailable. Using your device region: ${code}.`
      : `Detected from your location: ${code}.`;
  }, [setCurrency]);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(KEY).catch(() => null);
      if (stored) setCurrencyState(stored);
      else await detectFromLocation();
    })();
    fetch('https://open.er-api.com/v6/latest/BWP')
      .then((r) => r.json())
      .then((j) => j?.rates && setRates({ ...FALLBACK_RATES, ...j.rates }))
      .catch(() => {}); // keep fallback rates offline
  }, [detectFromLocation]);

  const value = useMemo<Ctx>(
    () => ({ currency, setCurrency, detectFromLocation, formatPrice: (bwp) => formatMoney(bwp, currency, rates) }),
    [currency, rates, setCurrency, detectFromLocation],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => {
  const c = useContext(SettingsContext);
  if (!c) throw new Error('useSettings must be used inside SettingsProvider');
  return c;
};
