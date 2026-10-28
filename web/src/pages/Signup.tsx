import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';

export default function Signup() {
  return (
    <div className="min-h-screen flex bg-[#F8F6F2] dark:bg-[#0E0C0A] text-[#231A14] dark:text-[#F7F4EF] antialiased">
      {/* Left Column: Visual Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#14100D] flex-col justify-between p-12 text-[#EDE4DA]">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1600&q=80"
            alt="Botswana River Lodge"
            className="w-full h-full object-cover opacity-30 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E0C0A] via-[#14100D]/85 to-[#14100D]/60 backdrop-blur-[2px]" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-[#9E7246]/40 flex items-center justify-center p-1.5 shadow-sm backdrop-blur-md">
            <img
              src="/micasa.png"
              alt="MiCasa SuCasa"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <h2 className="text-[#FAF7F2] font-bold tracking-tight text-lg">
              MiCasa SuCasa
            </h2>
            <p className="text-xs text-[#D6A670] font-medium tracking-wide">
              Security Governance
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-4">
          <p className="text-sm text-[#C5B7A8] leading-relaxed">
            Administrator accounts are restricted to verified operators and platform owners.
          </p>
        </div>

      </div>

      {/* Right Column */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12">
        <div className="max-w-md w-full mx-auto space-y-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#7A6C60] hover:text-[#231A14] dark:text-[#A69788] dark:hover:text-[#F7F4EF] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#9E7246] dark:text-[#D6A670]" />
            <span>Return to Sign In</span>
          </Link>

          <div>
            <div className="w-12 h-12 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-[#9E7246] dark:text-[#D6A670] mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#231A14] dark:text-[#F7F4EF]">
              Admin Account Provisioning
            </h2>
            <p className="text-xs text-[#7A6C60] dark:text-[#A69788] mt-1">
              Instructions for onboarding new managers to the platform.
            </p>
          </div>

          <div className="space-y-3.5 text-xs text-[#524438] dark:text-[#D4BA9E] leading-relaxed">
            <div className="p-4 rounded-2xl glass-card space-y-1.5">
              <p className="font-semibold text-[#231A14] dark:text-[#F7F4EF] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#9E7246] dark:text-[#D6A670]" />
                <span>1. Account Invitation by Owner</span>
              </p>
              <p className="text-[11px] text-[#7A6C60] dark:text-[#A69788]">
                New administrator accounts must be created by the project owner in Firebase Authentication and registered in the Firestore <code>admins</code> collection.
              </p>
            </div>

            <div className="p-4 rounded-2xl glass-card space-y-1.5">
              <p className="font-semibold text-[#231A14] dark:text-[#F7F4EF] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#9E7246] dark:text-[#D6A670]" />
                <span>2. Property Scope Authorization</span>
              </p>
              <p className="text-[11px] text-[#7A6C60] dark:text-[#A69788]">
                Once registered, administrators receive access credentials to manage lodging inventory, photos, nightly rates, and coordinates.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl glass-panel space-y-2.5">
            <p className="text-xs font-semibold text-[#231A14] dark:text-[#F7F4EF]">
              Firebase sign-in setup
            </p>
            <p className="text-[11px] text-[#7A6C60] dark:text-[#A69788]">
              The project owner must create your account in Firebase Authentication and add an <code>admins</code> Firestore document whose ID is your Firebase user UID. Then sign in with that account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
