// ==============================================================================
// CONTEXT BARREL EXPORT
// ==============================================================================
// This file cleanly re-exports all Auth and Settings contexts and hooks
// so you can simply write:
//   import { useAuth, useSettings } from '../context';
// ==============================================================================

export { AuthProvider } from './AuthContext';
export { AuthContext } from './auth-context';
export type { AuthUser, AuthContextType } from './auth-context';
export { useAuth } from './useAuth';

export { SettingsProvider, useSettings, SUPPORTED_CURRENCIES } from './SettingsContext';
export type { CurrencyConfig, ThemeMode } from './SettingsContext';
