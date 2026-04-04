import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from './pages/auth/LoginPage';
import PrivateRoute from './components/PrivateRoute';
import Logo from './components/Logo';
import { useAuthStore } from './store/auth.store';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function DashboardPlaceholder() {
  const { user, logout } = useAuthStore();
  return (
    <div className="min-h-screen bg-cream-light flex flex-col items-center justify-center gap-6">
      <Logo size="md" />
      <p className="text-gray-600">Dashboard em construção</p>
      <p className="text-sm text-gray-400">Logado como: {user?.email}</p>
      <button
        onClick={logout}
        className="px-6 py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition"
      >
        Sair
      </button>
    </div>
  );
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPlaceholder />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
