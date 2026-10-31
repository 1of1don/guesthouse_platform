export const CURRENCIES = ['BWP', 'USD', 'EUR', 'GBP', 'ZAR', 'NAD', 'KES', 'ZMW'] as const;

export const SYMBOLS: Record<string, string> = {
  BWP: 'P', USD: '$', EUR: '€', GBP: '£', ZAR: 'R', NAD: 'N$', KES: 'KSh ', ZMW: 'ZK ',
};

export const COUNTRY_CURRENCY: Record<string, string> = {
  BW: 'BWP', US: 'USD', GB: 'GBP', ZA: 'ZAR', NA: 'NAD', KE: 'KES', ZM: 'ZMW',
  DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', PT: 'EUR',
};

// Placeholder rates (1 BWP = x). Used offline; live rates replace them when available.
export const FALLBACK_RATES: Record<string, number> = {
  BWP: 1, USD: 0.073, EUR: 0.063, GBP: 0.054, ZAR: 1.3, NAD: 1.3, KES: 9.4, ZMW: 1.9,
};

export function formatMoney(bwp: number, currency: string, rates: Record<string, number>) {
  const value = bwp * (rates[currency] ?? 1);
  const rounded = Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${SYMBOLS[currency] ?? currency + ' '}${rounded}`;
}
