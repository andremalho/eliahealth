import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Home, Calendar, Users2, Settings, HeartPulse, BarChart3,
  BedDouble, MessageSquare, DollarSign,
  ChevronLeft, ChevronRight, LogOut, Menu,
  Baby, Heart, Stethoscope, FileText, Activity,
} from 'lucide-react';
import { SkipLink } from '../ui/SkipLink';
import Logo from '../Logo';
import { useAuthStore } from '../../store/auth.store';
import { fetchMyModules } from '../../api/tenant.api';
import { cn } from '../../utils/cn';
import { toTitleCase } from '../../utils/formatters';

interface NavItem { to: string; icon: React.ElementType; label: string; module?: string }

const clinicalNavItems: NavItem[] = [
  { to: '/dashboard', icon: Home, label: 'Inicio' },
  { to: '/pregnancies', icon: Baby, label: 'Obstetricia', module: 'prenatal' },
  { to: '/gynecology', icon: Heart, label: 'Ginecologia', module: 'gynecology' },
  { to: '/clinical', icon: Stethoscope, label: 'Clinica Medica', module: 'clinical_general' },
  { to: '/ultrasound', icon: FileText, label: 'Ultrassonografia', module: 'ultrasound' },
  { to: '/hospitalization', icon: BedDouble, label: 'Internacoes', module: 'hospitalization' },
  { to: '/chat', icon: MessageSquare, label: 'Mensagens' },
  { to: '/birth-calendar', icon: Calendar, label: 'Calendario' },
  { to: '/billing', icon: DollarSign, label: 'Faturamento', module: 'tiss_billing' },
  { to: '/teams', icon: Users2, label: 'Equipes' },
  { to: '/analytics', icon: BarChart3, label: 'Pesquisa', module: 'research' },
  { to: '/settings', icon: Settings, label: 'Configuracoes' },
];

const receptionNavItems: NavItem[] = [
  { to: '/reception', icon: Home, label: 'Recepcao' },
  { to: '/reception/agenda', icon: Calendar, label: 'Agenda' },
  { to: '/reception/patients', icon: Activity, label: 'Pacientes' },
  { to: '/settings', icon: Settings, label: 'Configuracoes' },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isReceptionist = user?.role === 'receptionist';

  const { data: activeModules } = useQuery({
    queryKey: ['tenant-modules'],
    queryFn: fetchMyModules,
    enabled: !isReceptionist,
    staleTime: 5 * 60 * 1000,
  });

  const baseItems = isReceptionist ? receptionNavItems : clinicalNavItems;
  const modules = activeModules ?? [];
  const navItems = baseItems.filter((item) => {
    if (!item.module) return true;
    if (modules.length === 0) return true; // Show all until modules load
    return modules.includes(item.module);
  });

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
      <SkipLink />
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

        <main id="main-content" className="flex-1 overflow-y-auto" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
