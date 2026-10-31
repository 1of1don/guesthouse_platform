import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { useAuth } from './context/useAuth';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Guesthouses from './pages/Guesthouses';
import AddEditGuesthouse from './pages/AddEditGuesthouse';
import AdminUsers from './pages/AdminUsers';
import Settings from './pages/Settings';
import Assistant from './pages/Assistant';
import UserManagement from './pages/UserManagement';

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, status, error } = useAuth();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] dark:bg-[#14110F] text-[#2C1F16] dark:text-[#F8F5EE]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#A57C52] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif text-sm font-semibold tracking-wide text-[#2C1F16] dark:text-[#F8F5EE]">
            MiCasa SuCasa
          </p>
          <p className="text-xs text-[#7A695C] dark:text-[#A8988B]">
            Connecting to Firebase and verifying access...
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] dark:bg-[#14110F] p-4 text-[#2C1F16] dark:text-[#F8F5EE]">
        <div className="max-w-md w-full bg-white dark:bg-[#1D1714] p-6 rounded-2xl border border-[#E8D8C3] dark:border-[#382B22] text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#F3EDE4] dark:bg-[#281F19] text-[#A57C52] flex items-center justify-center mx-auto text-lg font-serif font-bold">
            !
          </div>
          <h2 className="font-serif font-bold text-[#2C1F16] dark:text-[#F8F5EE] text-base">Authentication Verification Error</h2>
          <p className="text-xs text-[#7A695C] dark:text-[#A8988B]">{error || 'Unable to verify administrative credentials.'}</p>
          <a
            href="/login"
            className="inline-block px-5 py-2.5 bg-[#2C1F16] hover:bg-[#3F2E23] dark:bg-[#A57C52] dark:hover:bg-[#8F6B45] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            Return to Login
          </a>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <SettingsProvider>
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
              <Route path="/settings" element={<Settings />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/users" element={<UserManagement />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </SettingsProvider>
  );
}
