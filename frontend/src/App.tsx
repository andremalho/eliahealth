import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import PrivateRoute from './components/PrivateRoute';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import PregnancyPage from './pages/pregnancy/PregnancyPage';
import { useAuthStore } from './store/auth.store';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-full text-gray-400 text-lg p-12">
      {title} — em construção
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
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Authenticated routes with sidebar layout */}
          <Route
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/pregnancies" element={<Placeholder title="Gestações" />} />
            <Route path="/pregnancies/:pregnancyId" element={<PregnancyPage />} />
            <Route path="/birth-calendar" element={<Placeholder title="Calendário de Partos" />} />
            <Route path="/teams" element={<Placeholder title="Equipes" />} />
            <Route path="/settings" element={<Placeholder title="Configurações" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
