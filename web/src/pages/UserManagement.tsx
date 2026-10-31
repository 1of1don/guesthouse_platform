import { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Trash2,
  Mail,
  User as UserIcon,
} from 'lucide-react';
import { api } from '../services/api';

interface RegularUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  createdAt?: any;
}

export default function UserManagement() {
  const [users, setUsers] = useState<RegularUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getRegularUsers();
      setUsers(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load regular users.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete user "${name || id}"?`)) {
      try {
        setDeletingId(id);
        await api.deleteRegularUser(id);
        setUsers((prev) => prev.filter((u) => u.id !== id));
      } catch (err: any) {
        alert(err.message || 'Failed to delete user.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  // Search filter
  const filteredUsers = users.filter((u) => 
    (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#8F7F70] dark:text-[#9E8E80]">
            <span>Directory</span>
            <span aria-hidden="true" className="text-black/20 dark:text-white/20">·</span>
            <span>Platform Members</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#231A14] dark:text-[#F7F4EF] mt-1">
            User Management
          </h1>
          <p className="text-xs text-[#7A6C60] dark:text-[#A69788] mt-0.5">
            View and manage standard users, guests, and platform members.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#9E7246] dark:text-[#D6A670] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-[#231A14] dark:text-[#F7F4EF] focus:bg-white dark:focus:bg-[#251E1A] focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-2xl text-xs">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-black/[0.05] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] text-[#8F7F70] dark:text-[#9E8E80] font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#7A6C60] dark:text-[#A69788]">
                    Loading users from database...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-[#9E7246] flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-sm text-[#231A14] dark:text-[#F7F4EF]">
                      No regular users found
                    </p>
                    <p className="text-xs text-[#7A6C60] dark:text-[#A69788] mt-1 max-w-sm mx-auto">
                      When people sign up for the platform, they will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] text-[#372A22] dark:text-[#EAE2D8] border border-black/[0.06] dark:border-white/[0.08] font-bold flex items-center justify-center text-xs">
                          {user.name ? user.name.slice(0, 2).toUpperCase() : <UserIcon className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-semibold text-[#231A14] dark:text-[#F7F4EF]">
                            {user.name || 'Anonymous User'}
                          </p>
                          <p className="text-[10px] text-[#8F7F70] dark:text-[#9E8E80] font-mono">
                            ID: {user.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-[#524438] dark:text-[#D4BA9E] font-mono">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#8F7F70]" />
                        {user.email || 'No email provided'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {user.role || 'Guest'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(user.id, user.name || '')}
                        disabled={deletingId === user.id}
                        className="p-2 text-[#8F7F70] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}