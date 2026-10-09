import { useEffect, useState } from 'react';
import StatCard from '../components/ui/StatCard';
import { api } from '../services/api';
import type { DashboardStats } from '../types';
import './Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDashboardStats()
      .then(setStats)
      .catch((cause: unknown) => {
        setError(
          cause instanceof Error ? cause.message : 'Unable to load dashboard.',
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!stats) return <p role="alert">Dashboard data is unavailable.</p>;

  return (
    <div>
      <h1 className="page-title">Dashboard Overview</h1>

      <div className="stats-grid">
        <StatCard title="Total Guesthouses" value={stats.totalGuesthouses} />
        <StatCard
          title="Top City"
          value={stats.topCity.name}
          subtitle={`(${stats.topCity.count})`}
        />
        <StatCard
          title="Highest Rated"
          value={stats.highestRated.name}
          subtitle={`★ ${stats.highestRated.rating}`}
        />
        <StatCard title="Added This Month" value={stats.addedThisMonth} />
      </div>

      <h2 className="section-title">Recent Guesthouses</h2>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>City</th>
              <th>Price/night</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {stats.recent.map((g) => (
              <tr key={g._id}>
                <td className="td-strong">{g.name}</td>
                <td>{g.city}</td>
                <td>P{g.pricePerNight}</td>
                <td>{g.rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}