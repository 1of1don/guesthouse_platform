import { useState } from 'react';
import {
  Coins,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  MapPin,
  Check,
} from 'lucide-react';
import { useSettings, SUPPORTED_CURRENCIES, type ThemeMode } from '../context/SettingsContext';

export default function Settings() {
  const {
    currencyCode,
    setCurrencyCode,
    theme,
    setTheme,
    detectedLocationCurrency,
  } = useSettings();

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleCurrencySelect = (code: string) => {
    setCurrencyCode(code);
    triggerSaveNotice();
  };

  const handleThemeSelect = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    triggerSaveNotice();
  };

  const triggerSaveNotice = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const detectedConfig = SUPPORTED_CURRENCIES[detectedLocationCurrency] || SUPPORTED_CURRENCIES.BWP;

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#8F7F70] dark:text-[#9E8E80]">
            <span>Preferences</span>
            <span aria-hidden="true" className="text-black/20 dark:text-white/20">·</span>
            <span>Platform Configuration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#231A14] dark:text-[#F7F4EF] mt-1">
            Platform Settings
          </h1>
          <p className="text-xs text-[#7A6C60] dark:text-[#A69788] mt-0.5">
            Configure currency conversion rates and platform appearance.
          </p>
        </div>

        {savedSuccess && (
          <div className="px-3.5 py-1.5 glass-card text-[#231A14] dark:text-[#F7F4EF] text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-[#9E7246] dark:text-[#D6A670]" />
            <span>Preferences saved</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* 1. Currency Configuration */}
        <div className="glass-panel p-6 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#231A14] dark:text-[#F7F4EF] flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#9E7246] dark:text-[#D6A670]" />
                <span>Currency & Price Display</span>
              </h2>
              <p className="text-xs text-[#7A6C60] dark:text-[#A69788] mt-1 leading-relaxed">
                Select the base active currency. All rates and metrics are formatted strictly to 2 decimal places.
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-flex items-center gap-1.5 text-xs text-[#524438] dark:text-[#D4BA9E] px-2.5 py-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/[0.07]">
                <MapPin className="w-3.5 h-3.5 text-[#9E7246] dark:text-[#D6A670]" />
                <span>Local: <strong>{detectedConfig.code}</strong></span>
              </span>
            </div>
          </div>

          {/* Currency Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {Object.values(SUPPORTED_CURRENCIES).map((curr) => {
              const isSelected = currencyCode === curr.code;
              return (
                <button
                  key={curr.code}
                  type="button"
                  onClick={() => handleCurrencySelect(curr.code)}
                  className={`p-4 rounded-2xl text-left border transition-all relative cursor-pointer ${
                    isSelected
                      ? 'bg-black/[0.04] dark:bg-white/[0.07] border-[#9E7246] text-[#231A14] dark:text-[#F7F4EF] shadow-xs'
                      : 'bg-black/[0.01] dark:bg-white/[0.02] border-black/[0.06] dark:border-white/[0.07] text-[#6E6258] dark:text-[#B5A596] hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-base font-bold text-[#231A14] dark:text-[#F7F4EF]">
                      {curr.symbol} {curr.code}
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#231A14] dark:bg-[#EAE2D8] text-white dark:text-[#181310] flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#7A6C60] dark:text-[#9E8E80] truncate">
                    {curr.name}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Theme Switch Option */}
        <div className="glass-panel p-6 rounded-3xl shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-[#231A14] dark:text-[#F7F4EF] flex items-center gap-2">
              <Sun className="w-4 h-4 text-[#9E7246] dark:text-[#D6A670]" />
              <span>Appearance & Color Scheme</span>
            </h2>
            <p className="text-xs text-[#7A6C60] dark:text-[#A69788] mt-1 leading-relaxed">
              Switch between Light Warm Alabaster, Dark Obsidian Charcoal, or sync with your system preferences.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* Light Theme */}
            <button
              type="button"
              onClick={() => handleThemeSelect('light')}
              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-black/[0.04] dark:bg-white/[0.07] border-[#9E7246] shadow-xs'
                  : 'bg-black/[0.01] dark:bg-white/[0.02] border-black/[0.06] dark:border-white/[0.07] hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
                  <Sun className="w-4 h-4" />
                </div>
                {theme === 'light' && (
                  <span className="w-5 h-5 rounded-full bg-[#231A14] dark:bg-[#EAE2D8] text-white dark:text-[#181310] flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-xs text-[#231A14] dark:text-[#F7F4EF]">
                Light Alabaster
              </h3>
              <p className="text-[11px] text-[#7A6C60] dark:text-[#9E8E80] mt-0.5">
                Warm sand and frosted glass
              </p>
            </button>

            {/* Dark Theme */}
            <button
              type="button"
              onClick={() => handleThemeSelect('dark')}
              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-black/[0.04] dark:bg-white/[0.07] border-[#9E7246] shadow-xs'
                  : 'bg-black/[0.01] dark:bg-white/[0.02] border-black/[0.06] dark:border-white/[0.07] hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#1E1713] text-[#D6A670] flex items-center justify-center border border-[#3E2E23]">
                  <Moon className="w-4 h-4" />
                </div>
                {theme === 'dark' && (
                  <span className="w-5 h-5 rounded-full bg-[#231A14] dark:bg-[#EAE2D8] text-white dark:text-[#181310] flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-xs text-[#231A14] dark:text-[#F7F4EF]">
                Dark Obsidian
              </h3>
              <p className="text-[11px] text-[#7A6C60] dark:text-[#9E8E80] mt-0.5">
                Deep espresso and warm accents
              </p>
            </button>

            {/* System */}
            <button
              type="button"
              onClick={() => handleThemeSelect('system')}
              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                theme === 'system'
                  ? 'bg-black/[0.04] dark:bg-white/[0.07] border-[#9E7246] shadow-xs'
                  : 'bg-black/[0.01] dark:bg-white/[0.02] border-black/[0.06] dark:border-white/[0.07] hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-[#7A6C60] dark:text-[#B5A596] flex items-center justify-center border border-black/[0.06] dark:border-white/[0.08]">
                  <Laptop className="w-4 h-4" />
                </div>
                {theme === 'system' && (
                  <span className="w-5 h-5 rounded-full bg-[#231A14] dark:bg-[#EAE2D8] text-white dark:text-[#181310] flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-xs text-[#231A14] dark:text-[#F7F4EF]">
                System Preference
              </h3>
              <p className="text-[11px] text-[#7A6C60] dark:text-[#9E8E80] mt-0.5">
                Synchronize with OS
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
