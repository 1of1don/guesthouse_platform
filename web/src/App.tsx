import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Guesthouses from './pages/Guesthouses';
import AddEditGuesthouse from './pages/AddEditGuesthouse';
import AdminUsers from './pages/AdminUsers';

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, status, error } = useAuth();
  if (status === 'loading') return <p>Checking admin access...</p>;
  if (status === 'error') return <p role="alert">{error}</p>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/guesthouses" element={<Guesthouses />} />
            <Route path="/guesthouses/new" element={<AddEditGuesthouse />} />
            <Route path="/guesthouses/:id/edit" element={<AddEditGuesthouse />} />
            <Route path="/admins" element={<AdminUsers />} />
            <Route path="/settings" element={<div>Settings</div>} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}