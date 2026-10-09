import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { AdminUser } from '../types';
import './Dashboard.css';
import './AdminUsers.css';

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getAdmins()
      .then(setUsers)
      .catch((cause: unknown) => {
        setError(
          cause instanceof Error ? cause.message : 'Unable to load admins.',
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="page-title">Admin Users</h1>
      <p className="admin-setup-notice">
        This list is read-only for now. To add or remove an admin, manage the
        account in Firebase Authentication and its matching document in the
        Firestore <code>admins</code> collection.
      </p>

      {error && <p className="admin-load-error" role="alert">{error}</p>}
      {loading ? (
        <p>Loading admins...</p>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th></tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td className="td-strong">{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                </tr>
              ))}
              {!users.length && (
                <tr><td colSpan={3}>No admins found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}