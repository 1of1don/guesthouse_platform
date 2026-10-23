import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, loginAsDemoAdmin, error: authError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (cause) {
      setSubmitError(
        cause instanceof Error ? cause.message : 'Unable to sign in.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setSubmitError('');
    setIsSubmitting(true);
    try {
      await loginAsDemoAdmin('Owner');
      navigate('/dashboard');
    } catch (cause) {
      setSubmitError('Failed demo login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F8F6F2] dark:bg-[#0E0C0A] text-[#231A14] dark:text-[#F7F4EF] antialiased">
      {/* Left Column: Visual Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#14100D] flex-col justify-between p-12 text-[#EDE4DA]">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1600&q=80"
            alt="Botswana Guesthouse"
            className="w-full h-full object-cover opacity-30 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E0C0A] via-[#14100D]/85 to-[#14100D]/60 backdrop-blur-[2px]" />
        </div>

        {/* Brand Lockup */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-[#9E7246]/40 flex items-center justify-center p-1.5 shadow-sm backdrop-blur-md">
            <img
              src="/micasa.png"
              alt="MiCasa SuCasa logo"
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
              Guesthouse Platform
            </p>
          </div>
        </div>

        {/* Narrative */}
        <div className="relative z-10 max-w-lg space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-[#B8A89A]">
            <Sparkles className="w-3.5 h-3.5 text-[#D6A670]" />
            <span>Admin Portal · Botswana Hospitality Index</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-[#FAF7F2] tracking-tight leading-tight">
            Somewhere new. Somewhere you.
          </h1>

          <p className="text-sm text-[#C5B7A8] leading-relaxed">
            Manage your boutique accommodation inventory across Gaborone, Maun, Kasane, and beyond with real-time property registration, tariffs, and guest rating sync.
          </p>

          <div className="pt-4 border-t border-white/[0.08] flex items-center gap-6 text-xs text-[#A69788]">
            <div>
              <p className="text-xl font-bold text-[#FAF7F2] font-mono tabular-nums">7</p>
              <p className="text-[11px] text-[#A69788]">Registered Hubs</p>
            </div>
            <div className="h-8 w-px bg-white/[0.08]" />
            <div>
              <p className="text-xl font-bold text-[#D6A670] font-mono tabular-nums">4.92 ★</p>
              <p className="text-[11px] text-[#A69788]">Top Guest Rating</p>
            </div>
            <div className="h-8 w-px bg-white/[0.08]" />
            <div>
              <p className="text-xl font-bold text-[#FAF7F2] font-mono tabular-nums">BWP</p>
              <p className="text-[11px] text-[#A69788]">2 Decimals Active</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-[#8F7F70] flex items-center justify-between">
          <span>MiCasa SuCasa Hospitality Network</span>
          <span>Admin Portal</span>
        </div>
      </div>

      {/* Right Column: Authentication Card */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12">
        <div className="max-w-md w-full mx-auto space-y-6">
          <div className="lg:hidden flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] border border-[#9E7246]/40 flex items-center justify-center p-1.5">
              <img src="/micasa.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="font-bold text-[#231A14] dark:text-[#F7F4EF] text-base">MiCasa SuCasa</h2>
              <p className="text-[11px] text-[#9E7246] dark:text-[#D6A670]">Admin Portal</p>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#231A14] dark:text-[#F7F4EF]">
              Admin Sign-In
            </h2>
            <p className="text-xs text-[#7A6C60] dark:text-[#A69788] mt-1">
              Sign in to manage guesthouse registrations, regional tariffs, and team access.
            </p>
          </div>

          {/* Quick Demo Access Glass Card */}
          <div className="p-5 glass-card rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#231A14] dark:text-[#F7F4EF] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#9E7246] dark:text-[#D6A670]" />
                <span>Instant Evaluation Access</span>
              </span>
              <span className="text-[10px] font-mono text-[#9E7246] dark:text-[#D6A670] font-bold">
                1-Click
              </span>
            </div>
            <p className="text-[11px] text-[#6E6258] dark:text-[#A69788] leading-relaxed">
              Sign in directly as <strong>Ontiretse Bagwasi (Administrator)</strong>.
            </p>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isSubmitting}
              className="w-full py-2.5 px-3 text-xs font-bold text-white bg-[#231A14] hover:bg-[#372A22] dark:bg-[#EAE2D8] dark:text-[#181310] dark:hover:bg-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore Dashboard as Admin</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-black/[0.06] dark:bg-white/[0.08]" />
            <span className="text-[10px] uppercase tracking-wider text-[#8F7F70] dark:text-[#9E8E80] font-medium">
              or credentials
            </span>
            <div className="flex-1 h-px bg-black/[0.06] dark:bg-white/[0.08]" />
          </div>

          {(submitError || authError) && (
            <div
              className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs leading-relaxed"
              role="alert"
            >
              {submitError || authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#524438] dark:text-[#D4BA9E] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#9E7246] dark:text-[#D6A670] absolute left-3.5 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="onty@micasa.com"
                  className="w-full pl-10 pr-3.5 py-2 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.07] dark:border-white/[0.08] rounded-xl text-[#231A14] dark:text-[#F7F4EF] focus:bg-white dark:focus:bg-[#251E1A] focus:outline-hidden focus:ring-1 focus:ring-[#9E7246]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#524438] dark:text-[#D4BA9E]">
                  Password
                </label>
                <Link
                  to="/signup"
                  className="text-[11px] text-[#9E7246] dark:text-[#D6A670] hover:underline font-medium"
                >
                  Need access?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#9E7246] dark:text-[#D6A670] absolute left-3.5 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.07] dark:border-white/[0.08] rounded-xl text-[#231A14] dark:text-[#F7F4EF] focus:bg-white dark:focus:bg-[#251E1A] focus:outline-hidden focus:ring-1 focus:ring-[#9E7246]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#231A14] hover:bg-[#372A22] dark:bg-[#EAE2D8] dark:text-[#181310] dark:hover:bg-white disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In to Admin Portal'}
            </button>
          </form>

          <p className="text-center text-xs text-[#7A6C60] dark:text-[#A69788] pt-2">
            Protected admin access ·{' '}
            <Link to="/signup" className="text-[#9E7246] dark:text-[#D6A670] hover:underline font-medium">
              Admin setup notice
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
