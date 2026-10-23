import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  Plus,
  Search,
  ChevronRight,
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
}

export default function Header({ onOpenMobileMenu, onOpenSearch }: HeaderProps) {
  const location = useLocation();

  // Search bar only shows on Dashboard and Guesthouses catalog
  const showSearch =
    location.pathname === '/dashboard' || location.pathname === '/guesthouses';

  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/dashboard') {
      return { section: 'Admin', current: 'Dashboard Overview' };
    }
    if (path === '/guesthouses') {
      return { section: 'Listings', current: 'Guesthouses' };
    }
    if (path === '/guesthouses/new') {
      return { section: 'Listings', current: 'Register Guesthouse' };
    }
    if (path.includes('/edit')) {
      return { section: 'Listings', current: 'Edit Guesthouse' };
    }
    if (path === '/admins') {
      return { section: 'Governance', current: 'Admin Users' };
    }
    if (path === '/assistant') {
      return { section: 'Concierge', current: 'AI Assistant' };
    }
    if (path === '/settings') {
      return { section: 'Preferences', current: 'Platform Settings' };
    }
    return { section: 'MiCasa', current: 'Portal' };
  };

  const { section, current } = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-20 bg-white/75 dark:bg-[#120F0D]/75 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.08] px-4 sm:px-6 py-3 transition-colors">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Mobile Hamburger + Breadcrumb */}
        <div className="flex items-center gap-3 shrink-0 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 text-[#6E6258] hover:text-[#231A14] dark:text-[#A69788] dark:hover:text-[#F7F4EF] hover:bg-black/[0.04] dark:hover:bg-white/[0.05] rounded-xl transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#8F7F70] dark:text-[#9E8E80] min-w-0">
            <span className="font-medium text-[#9E8E80] dark:text-[#7A6C60] hidden sm:inline">{section}</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#C7B5A0] dark:text-[#524438] hidden sm:inline shrink-0" />
            <h2 className="text-sm font-bold text-[#231A14] dark:text-[#F7F4EF] tracking-tight truncate">
              {current}
            </h2>
          </nav>
        </div>

        {/* Global Search Bar (Only on Dashboard and Guesthouses pages) */}
        {showSearch ? (
          <div className="flex-1 max-w-md hidden md:block">
            <button
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between px-3.5 py-1.5 bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-xs text-[#7A6C60] dark:text-[#B5A596] transition-all group cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-[#9E7246] dark:text-[#D6A670] transition-colors" />
                <span className="truncate">Search properties by name, city, amenity...</span>
              </div>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-[#7A6C60] dark:text-[#9E8E80] bg-white/80 dark:bg-white/[0.08] border border-black/[0.08] dark:border-white/[0.1] rounded shadow-xs">
                ⌘K
              </kbd>
            </button>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Actions (Search button on mobile if enabled, and Register Guesthouse) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {showSearch && (
            <button
              onClick={onOpenSearch}
              className="md:hidden p-2 text-[#6E6258] hover:text-[#231A14] dark:text-[#A69788] dark:hover:text-[#F7F4EF] hover:bg-black/[0.04] dark:hover:bg-white/[0.05] rounded-xl transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          <Link
            to="/guesthouses/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#231A14] hover:bg-[#372A22] dark:bg-[#EAE2D8] dark:text-[#181310] dark:hover:bg-white rounded-xl shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-[#D6A670] dark:text-[#9E7246]" />
            <span>Add Guesthouse</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
