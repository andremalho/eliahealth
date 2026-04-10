import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Home, Users, Calendar, Users2, Settings, HeartPulse, Stethoscope, BarChart3,
  ChevronLeft, ChevronRight, LogOut, Menu,
} from 'lucide-react';
import Logo from '../Logo';
import { useAuthStore } from '../../store/auth.store';
import { cn } from '../../utils/cn';
import { toTitleCase } from '../../utils/formatters';

const clinicalNavItems = [
  { to: '/dashboard', icon: Home, label: 'Início' },
  { to: '/gynecology', icon: Stethoscope, label: 'Ginecologia' },
  { to: '/pregnancies', icon: Users, label: 'Gestações' },
  { to: '/birth-calendar', icon: Calendar, label: 'Calendário' },
  { to: '/analytics', icon: BarChart3, label: 'Pesquisa' },
  { to: '/teams', icon: Users2, label: 'Equipes' },
  { to: '/settings', icon: Settings, label: 'Configurações' },
];

const receptionNavItems = [
  { to: '/reception', icon: Home, label: 'Recepção' },
  { to: '/reception/agenda', icon: Calendar, label: 'Agenda' },
  { to: '/reception/patients', icon: HeartPulse, label: 'Pacientes' },
  { to: '/settings', icon: Settings, label: 'Configurações' },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navItems = user?.role === 'receptionist' ? receptionNavItems : clinicalNavItems;
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.name ? toTitleCase(user.name) : (user?.email?.toLowerCase() ?? '');
  const initials = (user?.name ?? user?.email ?? '?')
    .split(/[\s@]/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-navy text-white transition-all duration-200',
          collapsed ? 'w-16' : 'w-60',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center h-16 px-4', collapsed ? 'justify-center' : 'gap-2')}>
          {collapsed ? (
            <span className="font-bold text-xl text-white">e</span>
          ) : (
            <Logo size="sm" className="!text-white [&_*]:!text-white" />
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition',
                  collapsed && 'justify-center',
                  isActive
                    ? 'bg-lilac text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10',
                )
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle (desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center h-10 text-white/50 hover:text-white border-t border-white/10"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* User */}
        <div className={cn('flex items-center gap-3 px-4 py-3 border-t border-white/10', collapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-lilac flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <button onClick={handleLogout} className="text-xs text-white/50 hover:text-white flex items-center gap-1">
                <LogOut className="w-3 h-3" /> Sair
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center h-14 px-4 bg-white border-b">
          <button onClick={() => setMobileOpen(true)}>
            <Menu className="w-6 h-6 text-navy" />
          </button>
          <Logo size="sm" className="ml-3" />
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
