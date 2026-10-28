import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import CommandMenu from './CommandMenu';
import FloatingChatWidget from '../chat/FloatingChatWidget';
import { api } from '../../services/api';

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [guesthouseCount, setGuesthouseCount] = useState(0);

  useEffect(() => {
    api.getGuesthouses()
      .then((items) => setGuesthouseCount(items.length))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F6F2] dark:bg-[#0E0C0A] text-[#231A14] dark:text-[#F7F4EF] flex flex-col md:flex-row antialiased selection:bg-[#9E7246]/20 selection:text-[#231A14] transition-colors">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:shrink-0 sticky top-0 h-screen z-30">
        <Sidebar guesthouseCount={guesthouseCount} />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#14100D] z-10 animate-in slide-in-from-left duration-200">
            <Sidebar
              onCloseMobile={() => setMobileMenuOpen(false)}
              guesthouseCount={guesthouseCount}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Quick Search (Command Menu) */}
      <CommandMenu isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Floating AI Concierge Chat Widget */}
      <FloatingChatWidget />
    </div>
  );
}
