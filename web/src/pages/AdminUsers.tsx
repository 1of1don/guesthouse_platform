import { useEffect, useState } from 'react';
import {
  UserPlus,
  CheckCircle2,
  Shield,
  ShieldCheck,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import type { AdminUser, AdminRole } from '../types';

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const [newAdmin, setNewAdmin] = useState<{
    name: string;
    email: string;
    role: AdminRole;
  }>({
    name: '',
    email: '',
    role: 'Admin',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getAdmins()
      .then(setUsers)
      .catch((cause: unknown) => {
        setError(
          cause instanceof Error ? cause.message : 'Unable to load administrators.',
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await api.createAdmin(newAdmin);
      setUsers((prev) => [created, ...prev]);
      setShowInviteModal(false);
      setNewAdmin({ name: '', email: '', role: 'Admin' });
    } catch (err: any) {
      alert(err.message || 'Failed to add administrator.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#8F7F70] dark:text-[#9E8E80]">
            <span>Governance</span>
            <span aria-hidden="true" className="text-black/20 dark:text-white/20">·</span>
            <span>Platform Administrators</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#231A14] dark:text-[#F7F4EF] mt-1">
            Admin Users
          </h1>
          <p className="text-xs text-[#7A6C60] dark:text-[#A69788] mt-0.5">
            Authorized team members with access rights to manage properties and view platform analytics.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#231A14] hover:bg-[#372A22] dark:bg-[#EAE2D8] dark:text-[#181310] dark:hover:bg-white rounded-xl shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-[#D6A670] dark:text-[#9E7246]" />
          <span>Add Admin User</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-2xl text-xs" role="alert">
          {error}
        </div>
      )}

      {/* Admins Table in Glass Panel */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-black/[0.05] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] text-[#8F7F70] dark:text-[#9E8E80] font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#7A6C60] dark:text-[#A69788] text-xs">
                    Loading admin credentials...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#7A6C60] dark:text-[#A69788] text-xs">
                    No administrators found.
                  </td>
                </tr>
              ) : (
                users.map((admin) => (
                  <tr key={admin._id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] text-[#372A22] dark:text-[#EAE2D8] border border-black/[0.06] dark:border-white/[0.08] font-bold flex items-center justify-center text-xs">
                          {admin.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-[#231A14] dark:text-[#F7F4EF]">{admin.name}</p>
                          <p className="text-[10px] text-[#8F7F70] dark:text-[#9E8E80] font-mono">ID: {admin._id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-[#524438] dark:text-[#D4BA9E] font-mono">
                      {admin.email}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#231A14] dark:text-[#F7F4EF]">
                        {admin.role === 'Owner' ? (
                          <ShieldCheck className="w-3.5 h-3.5 text-[#9E7246] dark:text-[#D6A670]" />
                        ) : (
                          <Shield className="w-3.5 h-3.5 text-[#8F7F70]" />
                        )}
                        <span>{admin.role}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#231A14] dark:text-[#F7F4EF]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#9E7246] dark:text-[#D6A670]" />
                        <span>{admin.status || 'Active'}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap text-[#8F7F70] dark:text-[#9E8E80] font-mono text-[11px]">
                      {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'Active'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Admin Modal with Glassmorphism */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white/95 dark:bg-[#181412]/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/80 dark:border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <h3 className="font-bold text-base text-[#231A14] dark:text-[#F7F4EF]">
                Create Admin Account
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-[#8F7F70] hover:text-[#231A14] dark:hover:text-[#F7F4EF] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#524438] dark:text-[#D4BA9E] mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  placeholder="e.g. Boipelo Molapisi"
                  className="w-full px-3.5 py-2 bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.07] dark:border-white/[0.08] rounded-xl text-[#231A14] dark:text-[#F7F4EF] focus:bg-white dark:focus:bg-[#251E1A] focus:outline-hidden focus:ring-1 focus:ring-[#9E7246]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#524438] dark:text-[#D4BA9E] mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  placeholder="admin@micasa.com"
                  className="w-full px-3.5 py-2 bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.07] dark:border-white/[0.08] rounded-xl text-[#231A14] dark:text-[#F7F4EF] focus:bg-white dark:focus:bg-[#251E1A] focus:outline-hidden focus:ring-1 focus:ring-[#9E7246]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#524438] dark:text-[#D4BA9E] mb-1.5">
                  Role & Permissions *
                </label>
                <select
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value as AdminRole })}
                  className="w-full px-3.5 py-2 bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.07] dark:border-white/[0.08] rounded-xl text-[#231A14] dark:text-[#F7F4EF] font-medium focus:outline-hidden cursor-pointer"
                >
                  <option value="Admin">Admin (Guesthouse Inventory Management)</option>
                  <option value="Owner">Owner (Full Platform Governance)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#7A6C60] dark:text-[#A69788] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#231A14] hover:bg-[#372A22] dark:bg-[#EAE2D8] dark:text-[#181310] dark:hover:bg-white text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  {saving ? 'Creating...' : 'Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
