import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, MapPin, X, ArrowRight, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import type { Guesthouse } from '../../types';
import { api } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandMenu({ isOpen, onClose }: CommandMenuProps) {
  const { formatPrice } = useSettings();
  const [query, setQuery] = useState('');
  const [guesthouses, setGuesthouses] = useState<Guesthouse[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      api.getGuesthouses().then(setGuesthouses).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = guesthouses.filter(
    (g) =>
      g.name.toLowerCase().includes(query.toLowerCase()) ||
      g.city.toLowerCase().includes(query.toLowerCase()) ||
      g.amenities.some((a) => a.toLowerCase().includes(query.toLowerCase())),
  );

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white/95 dark:bg-[#181412]/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/80 dark:border-white/10 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-black/[0.06] dark:border-white/[0.08]">
          <Search className="w-4 h-4 text-[#9E7246] dark:text-[#D6A670] shrink-0" />
          <input
            type="text"
            placeholder="Search properties by name, city, amenity..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full text-xs bg-transparent border-0 outline-hidden placeholder:text-[#8F7F70] text-[#231A14] dark:text-[#F7F4EF]"
          />
          <button
            onClick={onClose}
            className="p-1 text-[#8F7F70] hover:text-[#231A14] dark:text-[#A69788] dark:hover:text-[#F7F4EF] rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1">
          {query.trim() === '' && (
            <div className="px-3 py-1.5 text-[10px] font-semibold text-[#8F7F70] dark:text-[#9E8E80] uppercase tracking-wider">
              Navigation
            </div>
          )}

          {query.trim() === '' && (
            <>
              <button
                onClick={() => handleSelect('/dashboard')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl text-[#372A22] dark:text-[#EAE2D8] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors group text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-[#9E7246]" />
                  <span className="font-medium">Dashboard Overview</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-black/20 dark:text-white/20" />
              </button>

              <button
                onClick={() => handleSelect('/guesthouses')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl text-[#372A22] dark:text-[#EAE2D8] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors group text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-[#9E7246]" />
                  <span className="font-medium">All Guesthouses</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-black/20 dark:text-white/20" />
              </button>

              <button
                onClick={() => handleSelect('/admins')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl text-[#372A22] dark:text-[#EAE2D8] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors group text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#9E7246]" />
                  <span className="font-medium">Admin Users</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-black/20 dark:text-white/20" />
              </button>

              <button
                onClick={() => handleSelect('/settings')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl text-[#372A22] dark:text-[#EAE2D8] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors group text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <SlidersHorizontal className="w-4 h-4 text-[#9E7246]" />
                  <span className="font-medium">Settings (Currency & Theme)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-black/20 dark:text-white/20" />
              </button>
            </>
          )}

          {/* Matched Guesthouses */}
          <div className="px-3 pt-2 pb-1 text-[10px] font-semibold text-[#8F7F70] dark:text-[#9E8E80] uppercase tracking-wider">
            {query.trim() === '' ? 'Properties' : 'Matching Properties'}
          </div>

          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#7A6C60] dark:text-[#A69788]">
              No properties matching "{query}"
            </div>
          ) : (
            filtered.map((g) => (
              <button
                key={g._id}
                onClick={() => handleSelect(`/guesthouses/${g._id}/edit`)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl text-[#231A14] dark:text-[#F7F4EF] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors group text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={
                      g.logo ||
                      (g.gallery && g.gallery[0]) ||
                      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=80&q=80'
                    }
                    alt={g.name}
                    className="w-7 h-7 rounded-lg object-cover bg-black/[0.04] shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{g.name}</p>
                    <p className="text-[11px] text-[#7A6C60] dark:text-[#A69788] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#9E7246]" />
                      <span>{g.city}</span>
                    </p>
                  </div>
                </div>
                <span className="font-mono tabular-nums text-xs font-semibold text-[#231A14] dark:text-[#F7F4EF] shrink-0 ml-2">
                  {formatPrice(g.pricePerNight)}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
