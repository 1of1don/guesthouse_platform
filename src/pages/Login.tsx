import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, error: authError } = useAuth();
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

  return (
    <div className="min-h-screen flex bg-[#F8F6F2] dark:bg-[#0E0C0A] text-[#231A14] dark:text-[#F7F4EF] antialiased">

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
              Sign in to manage guesthouse registrations, regional prices, and team access.
            </p>
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
                  placeholder="example@email.com"
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
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.07] dark:border-white/[0.08] rounded-xl text-[#231A14] dark:text-[#F7F4EF] focus:bg-white dark:focus:bg-[#251E1A] focus:outline-hidden focus:ring-1 focus:ring-[#9E7246]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute right-3.5 top-2 text-[#8F7F70] hover:text-[#231A14] dark:text-[#A69788] dark:hover:text-[#F7F4EF] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
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
