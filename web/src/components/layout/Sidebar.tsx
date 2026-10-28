import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import './Sidebar.css';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/guesthouses', label: 'Guesthouses' },
  { to: '/admins', label: 'Admins' },
  { to: '/settings', label: 'Settings' },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState('');

  const handleLogout = async () => {
    setLogoutError('');
    try {
      await logout();
      navigate('/login');
    } catch (cause) {
      setLogoutError(
        cause instanceof Error ? cause.message : 'Unable to log out.',
      );
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img className="sidebar-logo" src="/micasa.png" alt="MiCasa SuCasa logo" />
        <h1 className="sidebar-title">Admin Portal</h1>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              isActive ? 'sidebar-link sidebar-link-active' : 'sidebar-link'
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {logoutError && <p role="alert">{logoutError}</p>}
      <button onClick={handleLogout} className="sidebar-logout">Log out</button>
    </aside>
  );
}