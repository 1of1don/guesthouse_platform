import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
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

      <button onClick={handleLogout} className="sidebar-logout">
        Log out
      </button>
    </aside>
  );
}