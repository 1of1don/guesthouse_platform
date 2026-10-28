import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  ShieldCheck,
  SlidersHorizontal,
  LogOut,
  MapPin,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';

interface SidebarProps {
  onCloseMobile?: () => void;
  guesthouseCount?: number;
}

// Navigation links config
const navLinks = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/guesthouses',
    label: 'Guesthouses',
    icon: Building2,
    badge: 'count',
  },
  {
    to: '/assistant',
    label: 'AI Concierge',
    icon: Sparkles,
  },
  {
    to: '/admins',
    label: 'Admins',
    icon: ShieldCheck,
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: SlidersHorizontal,
  },
];

export default function Sidebar({ onCloseMobile, guesthouseCount = 0 }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState('');

  const handleLogout = async () => {
    setLogoutError('');
    try {
      await logout();
      navigate('/login');
    } catch (cause) {
      setLogoutError(cause instanceof Error ? cause.message : 'Unable to log out.');
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'OB';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <aside className="w-64 bg-[#14100D]/90 dark:bg-[#0D0B09]/95 backdrop-blur-2xl text-[#EDE4DA] flex flex-col h-full border-r border-white/[0.07] select-none shadow-[4px_0_24px_rgba(0,0,0,0.15)]">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-[#9E7246]/40 flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-inner backdrop-blur-sm">
            <img
              src="/micasa.png"
              alt="MiCasa SuCasa logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-[#FAF7F2] tracking-tight text-base truncate">
                MiCasa SuCasa
              </h1>
            </div>
            <p className="text-[11px] text-[#A69788] truncate flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-[#B58752] shrink-0" />
              <span>Botswana Admin Portal</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-[#8F7F70] uppercase">
          Navigation
        </div>

        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-white/[0.09] text-[#FAF7F2] font-semibold border border-white/[0.12] shadow-xs backdrop-blur-md'
                    : 'text-[#B8A89A] hover:text-[#FAF7F2] hover:bg-white/[0.04]'
                }`
              }
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className="w-4 h-4 shrink-0 text-[#B58752]" />
                <span className="truncate">{link.label}</span>
              </div>

              {link.badge === 'count' && (
                <span className="text-[11px] font-mono tabular-nums px-2 py-0.5 rounded-full bg-white/[0.06] text-[#D8C6B2] border border-white/[0.08]">
                  {guesthouseCount}
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Quick Shortcut */}
        <div className="pt-6 px-3 pb-2 text-[10px] font-semibold tracking-wider text-[#8F7F70] uppercase">
          Quick Actions
        </div>

        <NavLink
          to="/guesthouses/new"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#B8A89A] hover:text-[#FAF7F2] hover:bg-white/[0.05] transition-colors"
        >
          <div className="w-5 h-5 rounded-md bg-[#9E7246]/20 border border-[#9E7246]/40 flex items-center justify-center">
            <Plus className="w-3 h-3 text-[#D6A670]" />
          </div>
          <span>Register Guesthouse</span>
        </NavLink>
      </div>

      {/* User Profile Card */}
      <div className="p-3 border-t border-white/[0.07] bg-black/20">
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#845A32] to-[#B58752] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
              {getInitials(user?.displayName || 'Ontiretse Bagwasi')}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#FAF7F2] truncate leading-tight">
                {user?.displayName || 'Ontiretse Bagwasi'}
              </p>
              <p className="text-[11px] text-[#A69788] truncate mt-0.5">
                {user?.email || 'onty@micasa.com'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 text-[#A69788] hover:text-rose-400 hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {logoutError && (
          <p className="text-[11px] text-rose-400 mt-1 px-1" role="alert">
            {logoutError}
          </p>
        )}
      </div>
    </aside>
  );
}
