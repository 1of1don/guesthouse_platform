import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Star,
  Plus,
  ArrowUpRight,
  Eye,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import PropertyDetailModal from '../components/ui/PropertyDetailModal';
import { api } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import type { DashboardStats, Guesthouse } from '../types';

export default function Dashboard() {
  const { formatPrice, currency } = useSettings();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [previewProperty, setPreviewProperty] = useState<Guesthouse | null>(null);

  useEffect(() => {
    api.getDashboardStats()
      .then(setStats)
      .catch((cause: unknown) => {
        setError(
          cause instanceof Error ? cause.message : 'Unable to load dashboard data.',
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-black/[0.04] dark:bg-white/[0.05] rounded-2xl w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl" />
          ))}
        </div>
        <div className="h-72 bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-6 rounded-2xl border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300">
        <h3 className="font-semibold text-sm">Dashboard Error</h3>
        <p className="text-xs mt-1">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 px-3.5 py-1.5 bg-[#231A14] text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const recentList = selectedCity === 'all'
    ? stats.recent
    : stats.recent.filter((g) => g.city.toLowerCase() === selectedCity.toLowerCase());

  const availableCities = Array.from(new Set(stats.recent.map((g) => g.city)));

  // Calculate highest count for distribution visual bar
  const maxCityCount = Math.max(...stats.cityDistribution.map((c) => c.count), 1);

  return (
    <div className="space-y-8">
      {/* Executive Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#8F7F70] dark:text-[#9E8E80]">
            <span>Portfolio Operations</span>
            <span aria-hidden="true" className="text-black/20 dark:text-white/20">·</span>
            <span>Botswana Accommodation Index</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#231A14] dark:text-[#F7F4EF] mt-1">
            Dashboard Overview
          </h1>
          <p className="text-xs text-[#7A6C60] dark:text-[#A69788] mt-0.5">
            Real-time inventory metrics, regional price distribution, and accommodation management across Botswana.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/guesthouses"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#231A14] dark:text-[#F7F4EF] glass-card hover:bg-white dark:hover:bg-[#201A16] rounded-xl transition-all shadow-xs"
          >
            <Building2 className="w-3.5 h-3.5 text-[#9E7246] dark:text-[#D6A670]" />
            <span>Browse Catalog ({stats.totalGuesthouses})</span>
          </Link>
          <Link
            to="/guesthouses/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#231A14] hover:bg-[#372A22] dark:bg-[#EAE2D8] dark:text-[#181310] dark:hover:bg-white rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#D6A670] dark:text-[#9E7246]" />
            <span>Register Guesthouse</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Guesthouses"
          value={stats.totalGuesthouses}
          subtitle={
            stats.addedThisMonth > 0
              ? `+${stats.addedThisMonth} added this month`
              : 'Live inventory on platform'
          }
          icon={Building2}
          trend={
            stats.addedThisMonth > 0
              ? { text: 'Active Growth', positive: true }
              : undefined
          }
        />

        <StatCard
          title="Top Destination Hub"
          value={stats.topCity.name}
          subtitle={`${stats.topCity.count} registered ${stats.topCity.count === 1 ? 'property' : 'properties'}`}
          icon={MapPin}
        />

        <StatCard
          title="Average Nightly Tariff"
          value={formatPrice(stats.averagePrice)}
          subtitle={`Calculated in ${currency.code} (2 decimals)`}
          icon={SlidersHorizontal}
        />

        <StatCard
          title="Mobile Guest Ratings"
          value={
            stats.highestRated.rating > 0
              ? `${stats.highestRated.rating.toFixed(2)} ★`
              : '—'
          }
          subtitle={
            stats.highestRated.rating > 0
              ? `Top: ${stats.highestRated.name}`
              : 'Awaiting mobile app reviews'
          }
          icon={Star}
        />
      </div>

      {/* Two-Column Structured Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left (2/3): Recent Guesthouse Listings Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#231A14] dark:text-[#F7F4EF] tracking-tight">
                Recent Guesthouse Inventory
              </h2>
              <p className="text-xs text-[#7A6C60] dark:text-[#A69788] mt-0.5">
                Latest accommodation properties registered to the MiCasa SuCasa network.
              </p>
            </div>

            {/* City Filter Segmented Tabs */}
            {availableCities.length > 0 && (
              <div className="flex items-center gap-1 p-1 bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.06] rounded-xl overflow-x-auto text-xs">
                <button
                  onClick={() => setSelectedCity('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                    selectedCity === 'all'
                      ? 'bg-white dark:bg-[#251E1A] text-[#231A14] dark:text-[#F7F4EF] shadow-xs'
                      : 'text-[#7A6C60] dark:text-[#A69788] hover:text-[#231A14] dark:hover:text-[#F7F4EF]'
                  }`}
                >
                  All ({stats.recent.length})
                </button>
                {availableCities.map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                      selectedCity.toLowerCase() === city.toLowerCase()
                        ? 'bg-white dark:bg-[#251E1A] text-[#231A14] dark:text-[#F7F4EF] shadow-xs'
                        : 'text-[#7A6C60] dark:text-[#A69788] hover:text-[#231A14] dark:hover:text-[#F7F4EF]'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Table Container in Glass Panel */}
          <div className="glass-panel rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-black/[0.05] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] text-[#8F7F70] dark:text-[#9E8E80] font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Guesthouse</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4 text-right">Tariff / Night ({currency.code})</th>
                    <th className="py-3 px-4 text-center">Mobile Rating</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
                  {recentList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-14 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-[#9E7246] dark:text-[#D6A670] flex items-center justify-center mx-auto mb-3">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-sm text-[#231A14] dark:text-[#F7F4EF]">
                          No guesthouses registered yet
                        </p>
                        <p className="text-xs text-[#7A6C60] dark:text-[#A69788] mt-1 max-w-sm mx-auto leading-relaxed">
                          Your guesthouse directory is empty. Add a guesthouse from the registration form to start monitoring your portfolio.
                        </p>
                        <Link
                          to="/guesthouses/new"
                          className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-[#231A14] hover:bg-[#372A22] dark:bg-[#EAE2D8] dark:text-[#181310] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#D6A670] dark:text-[#9E7246]" />
                          <span>Register First Guesthouse</span>
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    recentList.map((g) => {
                      const thumb =
                        g.logo ||
                        (g.gallery && g.gallery[0]) ||
                        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=150&q=80';
                      return (
                        <tr
                          key={g._id}
                          className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors group"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={thumb}
                                alt={g.name}
                                className="w-10 h-10 rounded-xl object-cover bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] shrink-0"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=150&q=80';
                                }}
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-[#231A14] dark:text-[#F7F4EF] truncate max-w-xs group-hover:text-[#9E7246] dark:group-hover:text-[#D6A670] transition-colors">
                                  {g.name}
                                </p>
                                <p className="text-[11px] text-[#7A6C60] dark:text-[#A69788] truncate mt-0.5">
                                  {g.contactDetails}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap text-[#524438] dark:text-[#D4BA9E]">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#9E7246] dark:text-[#D6A670]" />
                              <span>{g.city}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right whitespace-nowrap font-mono tabular-nums font-semibold text-[#231A14] dark:text-[#F7F4EF]">
                            {formatPrice(g.pricePerNight)}
                          </td>

                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {g.rating && g.rating > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[#231A14] dark:text-[#F7F4EF] font-semibold font-mono tabular-nums">
                                <Star className="w-3.5 h-3.5 fill-[#9E7246] text-[#9E7246]" />
                                {g.rating.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-[#8F7F70] dark:text-[#7A6C60] font-mono text-[11px]">
                                —
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                            <button
                              onClick={() => setPreviewProperty(g)}
                              className="p-1.5 text-[#7A6C60] hover:text-[#231A14] dark:text-[#A69788] dark:hover:text-[#F7F4EF] hover:bg-black/[0.04] dark:hover:bg-white/[0.05] rounded-lg transition-colors cursor-pointer"
                              title="Quick Dossier"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <Link
                              to={`/guesthouses/${g._id}/edit`}
                              className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-[#372A22] dark:text-[#EAE2D8] bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border border-black/[0.06] dark:border-white/[0.08] rounded-lg transition-colors"
                            >
                              Edit
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3.5 border-t border-black/[0.05] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.01] flex items-center justify-between text-xs text-[#7A6C60] dark:text-[#A69788]">
              <span>Showing {recentList.length} of {stats.totalGuesthouses} properties</span>
              <Link
                to="/guesthouses"
                className="font-semibold text-[#9E7246] hover:text-[#845A32] dark:text-[#D6A670] dark:hover:text-[#E8C59A] flex items-center gap-1"
              >
                <span>Browse entire catalog</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right (1/3): Location Breakdown & Regional Tariffs */}
        <div className="space-y-6">
          {/* Average Price & Regional Distribution */}
          <div className="glass-panel rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#231A14] dark:text-[#F7F4EF]">
                Regional Price & Inventory Index
              </h3>
              <span className="text-[11px] text-[#9E7246] dark:text-[#D6A670] font-mono font-medium">
                {currency.code}
              </span>
            </div>

            <p className="text-xs text-[#7A6C60] dark:text-[#A69788] leading-relaxed">
              Distribution of properties and average nightly rates across Botswana destinations.
            </p>

            {stats.cityDistribution.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#7A6C60] dark:text-[#A69788] bg-black/[0.02] dark:bg-white/[0.02] rounded-xl border border-dashed border-black/[0.06] dark:border-white/[0.08]">
                No regional data yet. Register your first guesthouse to populate this distribution.
              </div>
            ) : (
              <div className="space-y-3.5 divide-y divide-black/[0.04] dark:divide-white/[0.05]">
                {stats.cityDistribution.map((item) => (
                  <div key={item.city} className="pt-3.5 first:pt-0 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-[#231A14] dark:text-[#F7F4EF] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#9E7246] dark:text-[#D6A670]" />
                        <span>{item.city}</span>
                      </p>
                      <span className="font-mono tabular-nums font-semibold text-[#231A14] dark:text-[#F7F4EF]">
                        {formatPrice(item.avgPrice)}
                      </span>
                    </div>

                    {/* Proportional visual distribution bar */}
                    <div className="w-full bg-black/[0.05] dark:bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#9E7246] dark:bg-[#D6A670] h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.round((item.count / maxCityCount) * 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#8F7F70] dark:text-[#9E8E80]">
                      <span>{item.count} {item.count === 1 ? 'property' : 'properties'}</span>
                      <span>avg / night</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Registration Glass Card */}
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#9E7246] dark:text-[#D6A670]">
              <Sparkles className="w-4 h-4" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#372A22] dark:text-[#EAE2D8]">
                Inventory Management
              </h4>
            </div>
            <p className="text-xs text-[#524438] dark:text-[#B5A596] leading-relaxed">
              Register a new accommodation property with coordinates, photography, room amenities, and custom tariffs.
            </p>
            <Link
              to="/guesthouses/new"
              className="inline-flex items-center justify-center w-full py-2.5 px-3 text-xs font-semibold text-white bg-[#231A14] hover:bg-[#372A22] dark:bg-[#EAE2D8] dark:text-[#181310] dark:hover:bg-white rounded-xl shadow-xs transition-colors"
            >
              + Register New Property
            </Link>
          </div>
        </div>
      </div>

      {/* Property Detail Modal */}
      <PropertyDetailModal
        property={previewProperty}
        onClose={() => setPreviewProperty(null)}
      />
    </div>
  );
}
