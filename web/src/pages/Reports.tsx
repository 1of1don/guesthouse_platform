import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  MessageSquare,
  Star,
  Download,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import { api } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import type { Customer, Guesthouse, Review } from '../types';

const DAY = 24 * 60 * 60 * 1000;

// Last n months as { key: '2026-11', label: 'Nov' }, oldest first
function lastMonths(n: number) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString(undefined, { month: 'short' }),
    };
  });
}

const monthKey = (iso?: string) => (iso ? iso.slice(0, 7) : '');

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="glass-panel rounded-2xl p-5 shadow-xs space-y-4">
      <div>
        <h3 className="font-bold text-sm text-[#231A14] dark:text-[#F7F4EF]">{title}</h3>
        {subtitle && <p className="text-xs text-[#7A6C60] dark:text-[#A69788] mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Bar({ value, max }: { value: number; max: number }) {
  return (
    <div className="w-full bg-black/[0.05] dark:bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
      <div
        className="bg-[#9E7246] dark:bg-[#D6A670] h-full rounded-full transition-all duration-300"
        style={{ width: `${max ? Math.round((value / max) * 100) : 0}%` }}
      />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="py-6 text-center text-xs text-[#7A6C60] dark:text-[#A69788] bg-black/[0.02] dark:bg-white/[0.02] rounded-xl border border-dashed border-black/[0.06] dark:border-white/[0.08]">
      {text}
    </div>
  );
}

export default function Reports() {
  const { formatPrice } = useSettings();
  const [guesthouses, setGuesthouses] = useState<Guesthouse[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.getGuesthouses(), api.getReviews(), api.getCustomers()])
      .then(([listings, ratings, people]) => {
        setGuesthouses(listings);
        setReviews(ratings);
        setCustomers(people);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load reports.'))
      .finally(() => setLoading(false));
  }, []);

  const report = useMemo(() => {
    const visible = reviews.filter((r) => !r.isHidden);
    const recentCutoff = Date.now() - 30 * DAY;
    const months = lastMonths(6);

    const scoreCounts = [5, 4, 3, 2, 1].map((score) => ({
      score,
      count: visible.filter((r) => r.score === score).length,
    }));

    const rated = guesthouses.filter((g) => (g.ratingCount ?? 0) > 0);
    const byRating = [...rated].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

    return {
      active: guesthouses.filter((g) => !g.isSuspended).length,
      suspended: guesthouses.filter((g) => g.isSuspended).length,
      suspendedCustomers: customers.filter((c) => c.isSuspended).length,
      newCustomers: customers.filter((c) => c.createdAt && Date.parse(c.createdAt) >= recentCutoff).length,
      hiddenReviews: reviews.length - visible.length,
      recentReviews: visible.filter((r) => r.createdAt && Date.parse(r.createdAt) >= recentCutoff).length,
      platformRating: visible.length ? visible.reduce((sum, r) => sum + r.score, 0) / visible.length : 0,
      scoreCounts,
      topRated: byRating.slice(0, 5),
      // Low average with at least one rating, like Airbnb flagging listings that keep getting bad stays
      needsAttention: byRating.filter((g) => (g.rating ?? 0) < 3).reverse().slice(0, 5),
      mostReviewed: [...rated].sort((a, b) => (b.ratingCount ?? 0) - (a.ratingCount ?? 0)).slice(0, 5),
      noReviews: guesthouses.filter((g) => !g.isSuspended && !(g.ratingCount ?? 0)).length,
      monthly: months.map((m) => ({
        ...m,
        reviews: reviews.filter((r) => monthKey(r.createdAt) === m.key).length,
        signups: customers.filter((c) => monthKey(c.createdAt) === m.key).length,
        listings: guesthouses.filter((g) => monthKey(g.createdAt) === m.key).length,
      })),
    };
  }, [guesthouses, reviews, customers]);

  const exportGuesthouses = () => {
    downloadCsv(`guesthouse-report-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Name', 'City', 'Status', 'Price per night (BWP)', 'Average rating', 'Ratings', 'Added'],
      ...guesthouses.map((g) => [
        g.name,
        g.city,
        g.isSuspended ? 'Suspended' : 'Active',
        g.pricePerNight,
        g.rating ? g.rating.toFixed(2) : '',
        g.ratingCount ?? 0,
        g.createdAt ? g.createdAt.slice(0, 10) : '',
      ]),
    ]);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" role="status" aria-label="Loading reports">
        <div className="h-10 bg-black/[0.04] dark:bg-white/[0.05] rounded-2xl w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl" />
          <div className="h-64 bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl" />
        </div>
      </div>
    );
  }

  const maxScore = Math.max(...report.scoreCounts.map((s) => s.count), 1);
  const maxMonthly = Math.max(...report.monthly.flatMap((m) => [m.reviews, m.signups, m.listings]), 1);
  const listRow = 'flex items-center justify-between gap-3 py-2 text-xs';

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#8F7F70] dark:text-[#9E8E80]">
            <span>Insights</span>
            <span aria-hidden="true" className="text-black/20 dark:text-white/20">·</span>
            <span>Platform Health</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#231A14] dark:text-[#F7F4EF] mt-1">
            Reports
          </h1>
          <p className="text-xs text-[#7A6C60] dark:text-[#A69788] mt-0.5">
            How listings, guests and reviews are doing across the platform.
          </p>
        </div>
        <button
          onClick={exportGuesthouses}
          disabled={guesthouses.length === 0}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#231A14] hover:bg-[#372A22] dark:bg-[#EAE2D8] dark:text-[#181310] dark:hover:bg-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5 text-[#D6A670] dark:text-[#9E7246]" />
          <span>Export CSV</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-2xl text-xs" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Live Listings"
          value={report.active}
          subtitle={`${report.suspended} suspended · ${report.noReviews} without reviews`}
          icon={Building2}
        />
        <StatCard
          title="Customers"
          value={customers.length}
          subtitle={`${report.newCustomers} new in 30 days · ${report.suspendedCustomers} suspended`}
          icon={Users}
          trend={report.newCustomers > 0 ? { text: 'Growing', positive: true } : undefined}
        />
        <StatCard
          title="Reviews"
          value={reviews.length - report.hiddenReviews}
          subtitle={`${report.recentReviews} in 30 days · ${report.hiddenReviews} hidden`}
          icon={MessageSquare}
        />
        <StatCard
          title="Platform Rating"
          value={report.platformRating ? `${report.platformRating.toFixed(2)} ★` : '—'}
          subtitle="Average of all visible reviews"
          icon={Star}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Rating breakdown" subtitle="How guests score their stays (hidden reviews left out).">
          {reviews.length === 0 ? (
            <Empty text="No reviews yet. They show up here once guests rate on the mobile app." />
          ) : (
            <div className="space-y-2.5">
              {report.scoreCounts.map(({ score, count }) => (
                <div key={score} className="flex items-center gap-3 text-xs">
                  <span className="w-8 font-semibold text-[#231A14] dark:text-[#F7F4EF] flex items-center gap-0.5">
                    {score} <Star className="w-3 h-3 fill-[#9E7246] text-[#9E7246]" />
                  </span>
                  <div className="flex-1"><Bar value={count} max={maxScore} /></div>
                  <span className="w-8 text-right font-mono tabular-nums text-[#524438] dark:text-[#D4BA9E]">{count}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Last 6 months" subtitle="New reviews, customer sign-ups and listings per month.">
          <div className="space-y-3">
            {report.monthly.map((m) => (
              <div key={m.key} className="grid grid-cols-[2.5rem_1fr] gap-3 items-center text-[11px]">
                <span className="font-semibold text-[#231A14] dark:text-[#F7F4EF]">{m.label}</span>
                <div className="space-y-1">
                  {([['Reviews', m.reviews], ['Sign-ups', m.signups], ['Listings', m.listings]] as const).map(([label, value]) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="w-14 text-[#8F7F70] dark:text-[#9E8E80]">{label}</span>
                      <div className="flex-1"><Bar value={value} max={maxMonthly} /></div>
                      <span className="w-6 text-right font-mono tabular-nums text-[#524438] dark:text-[#D4BA9E]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Panel title="Top rated" subtitle="Highest average rating.">
          {report.topRated.length === 0 ? <Empty text="No rated guesthouses yet." /> : (
            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
              {report.topRated.map((g) => (
                <div key={g._id} className={listRow}>
                  <span className="truncate text-[#231A14] dark:text-[#F7F4EF] font-medium">{g.name}</span>
                  <span className="font-mono tabular-nums font-semibold text-[#231A14] dark:text-[#F7F4EF] shrink-0">
                    {(g.rating ?? 0).toFixed(2)} ★
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Most reviewed" subtitle="Where guests are leaving the most feedback.">
          {report.mostReviewed.length === 0 ? <Empty text="No reviews yet." /> : (
            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
              {report.mostReviewed.map((g) => (
                <div key={g._id} className={listRow}>
                  <span className="truncate text-[#231A14] dark:text-[#F7F4EF] font-medium">{g.name}</span>
                  <span className="text-[#524438] dark:text-[#D4BA9E] shrink-0 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-[#9E7246]" /> {g.ratingCount} reviews
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Needs attention" subtitle="Average below 3 stars. Check the reviews or contact the host.">
          {report.needsAttention.length === 0 ? <Empty text="Nothing below 3 stars. Nice." /> : (
            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
              {report.needsAttention.map((g) => (
                <div key={g._id} className={listRow}>
                  <span className="truncate text-[#231A14] dark:text-[#F7F4EF] font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    {g.name}
                  </span>
                  <span className="font-mono tabular-nums text-amber-700 dark:text-amber-400 shrink-0">
                    {(g.rating ?? 0).toFixed(2)} ★
                  </span>
                </div>
              ))}
              <Link to="/users" className="block pt-3 text-xs font-semibold text-[#9E7246] hover:text-[#845A32] dark:text-[#D6A670]">
                Review comments →
              </Link>
            </div>
          )}
        </Panel>
      </div>

      <p className="text-[11px] text-[#8F7F70] dark:text-[#9E8E80]">
        Average nightly price across live listings:{' '}
        {formatPrice(
          report.active
            ? Math.round(
              guesthouses.filter((g) => !g.isSuspended).reduce((sum, g) => sum + g.pricePerNight, 0) / report.active,
            )
            : 0,
        )}
      </p>
    </div>
  );
}
