import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import PublicCardPage from './pages/public/PublicCardPage';
import PortalLoginPage from './pages/portal/PortalLoginPage';
import PortalHomePage from './pages/portal/PortalHomePage';
import PortalOnboardingPage from './pages/portal/PortalOnboardingPage';
import { usePatientAuthStore } from './store/patientAuth.store';
import PrivateRoute from './components/PrivateRoute';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import PregnancyPage from './pages/pregnancy/PregnancyPage';
import PregnanciesListPage from './pages/pregnancies/PregnanciesListPage';
import PatientsListPage from './pages/patients/PatientsListPage';
import PatientPage from './pages/patients/PatientPage';
import BirthCalendarPage from './pages/calendar/BirthCalendarPage';
import TeamsPage from './pages/teams/TeamsPage';
import SettingsPage from './pages/settings/SettingsPage';
import { useAuthStore } from './store/auth.store';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function PortalProtected({ children }: { children: React.ReactNode }) {
  const isAuth = usePatientAuthStore((s) => s.isAuthenticated);
  if (!isAuth) return <Navigate to="/portal/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-center" richColors closeButton />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/cartao" element={<PublicCardPage />} />
          <Route path="/portal/login" element={<PortalLoginPage />} />
          <Route
            path="/portal"
            element={<PortalProtected><PortalHomePage /></PortalProtected>}
          />
          <Route
            path="/portal/onboarding"
            element={<PortalProtected><PortalOnboardingPage /></PortalProtected>}
          />

          {/* Authenticated routes with sidebar layout */}
          <Route
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/pregnancies" element={<PregnanciesListPage />} />
            <Route path="/pregnancies/:pregnancyId" element={<PregnancyPage />} />
            <Route path="/patients" element={<PatientsListPage />} />
            <Route path="/patients/:patientId" element={<PatientPage />} />
            <Route path="/birth-calendar" element={<BirthCalendarPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
