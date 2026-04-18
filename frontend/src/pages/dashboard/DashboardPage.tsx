import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Calendar, Stethoscope, AlertTriangle,
  Search, ChevronRight, Plus, Clock,
} from 'lucide-react';
import { fetchPregnancyList, fetchUpcomingBirths } from '../../api/pregnancies.api';
import { fetchAppointments, STATUS_LABELS, STATUS_COLORS, TYPE_LABELS, CATEGORY_LABELS } from '../../api/appointments.api';
import type { AppointmentItem } from '../../api/appointments.api';
import { useAuthStore } from '../../store/auth.store';
import { cn } from '../../utils/cn';
import { toTitleCase } from '../../utils/formatters';
import NewPatientModal from './NewPatientModal';
import NewPatientChooserModal from './NewPatientChooserModal';
import NewPatientBaseModal from './NewPatientBaseModal';
import LongitudinalAlertsSection from './LongitudinalAlertsSection';
import CopilotDashboardCards from './CopilotDashboardCards';
import OnboardingTooltip from '../../components/onboarding/OnboardingTooltip';

type SpecialtyKey = 'obstetrics' | 'gynecology' | 'clinical' | 'ultrasound';

const trimesterFilters = [
  { label: 'Todas', value: 'all' },
  { label: '1º Tri', value: '1' },
  { label: '2º Tri', value: '2' },
  { label: '3º Tri', value: '3' },
  { label: 'Alto Risco', value: 'high_risk' },
];

function getTrimester(weeks: number) {
  if (weeks < 14) return 1;
  if (weeks < 28) return 2;
  return 3;
}

function getProgressColor(weeks: number) {
  if (weeks < 14) return 'bg-emerald-400';
  if (weeks < 28) return 'bg-amber-400';
  return 'bg-orange-400';
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={cn('animate-pulse bg-gray-200 rounded', className)} />;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [chooserOpen, setChooserOpen] = useState(false);
  const [obsModalOpen, setObsModalOpen] = useState(false);
  const [baseModalSpecialty, setBaseModalSpecialty] = useState<SpecialtyKey | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const { data: pregnancies, isLoading } = useQuery({
    queryKey: ['pregnancies', 'list', search],
    queryFn: () => fetchPregnancyList({ status: 'active', search: search || undefined }),
  });

  const { data: upcoming } = useQuery({
    queryKey: ['upcoming-births'],
    queryFn: () => fetchUpcomingBirths(30),
  });

  const { data: todayAppointments, isLoading: loadingAppts } = useQuery({
    queryKey: ['appointments', todayStr],
    queryFn: () => fetchAppointments({ date: todayStr }),
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const userName = user?.name ? toTitleCase(user.name) : (user?.email?.split('@')[0] ?? '');
  const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const now = new Date();
  const today = `${dias[now.getDay()]}, ${now.getDate()} de ${meses[now.getMonth()]} de ${now.getFullYear()}`;

  const filtered = (pregnancies ?? []).filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'high_risk') return p.riskLevel === 'high';
    return getTrimester(p.gestationalAge.weeks).toString() === filter;
  });

  const totalActive = pregnancies?.length ?? 0;
  const birthsThisMonth = Array.isArray(upcoming) ? upcoming.length : 0;
  const alertCount = (pregnancies ?? []).filter((p) => p.riskLevel === 'high').length;
  const apptCount = todayAppointments?.length ?? 0;

  const handleAppointmentClick = (appt: AppointmentItem) => {
    if (!appt.patientId) return;
    navigate(`/patients/${appt.patientId}`);
  };

  const handleChooserSelect = (area: SpecialtyKey) => {
    setChooserOpen(false);
    if (area === 'obstetrics') {
      setObsModalOpen(true);
    } else {
      setBaseModalSpecialty(area);
    }
  };

  const handlePatientCreated = (patientId: string, patientName: string) => {
    const spec = baseModalSpecialty;
    setBaseModalSpecialty(null);
    const qs = `?patientId=${patientId}&patientName=${encodeURIComponent(patientName)}&newConsultation=1`;
    if (spec === 'gynecology') {
      navigate(`/gynecology${qs}`);
    } else if (spec === 'clinical') {
      navigate(`/clinical${qs}`);
    } else if (spec === 'ultrasound') {
      navigate(`/ultrasound${qs}`);
    } else {
      navigate(`/patients/${patientId}`);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Onboarding */}
      <OnboardingTooltip flowName="doctor_main" />

      {/* Header editorial */}
      <div id="dashboard-header" className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'rgba(20,22,31,0.55)',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#D97757' }} aria-hidden />
            {today}
          </div>
          <h1
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)',
              fontWeight: 400,
              letterSpacing: '-0.025em',
              color: '#14161F',
              margin: 0,
              lineHeight: 1.08,
            }}
          >
            {greeting()},{' '}
            <span style={{ fontStyle: 'italic', color: '#B85A3D' }}>Dr. {userName}</span>
            <span aria-hidden style={{ color: '#D97757' }}>.</span>
          </h1>
        </div>
        <button
          onClick={() => setChooserOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 22px',
            background: '#14161F',
            color: '#F5EFE6',
            border: 'none',
            borderRadius: 2,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontFamily: "'Figtree', sans-serif",
            transition: 'background 0.3s',
            alignSelf: 'flex-start',
          }}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = '#D97757'}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = '#14161F'}
        >
          <Plus className="w-4 h-4" /> Novo paciente
        </button>
      </div>

      {/* Copilot Dashboard */}
      <div className="mb-6">
        <CopilotDashboardCards />
      </div>

      {/* Longitudinal Alerts */}
      <div className="mb-6">
        <LongitudinalAlertsSection />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard icon={Users} color="bg-lilac/10 text-lilac" value={totalActive} label="gestantes ativas" />
        <SummaryCard icon={Calendar} color="bg-blue-50 text-blue-600" value={birthsThisMonth} label="partos este mês" />
        <SummaryCard icon={Stethoscope} color="bg-emerald-50 text-emerald-600" value={apptCount} label="consultas hoje" />
        <SummaryCard
          icon={AlertTriangle}
          color={alertCount > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}
          value={alertCount}
          label="requerem atenção"
        />
      </div>

      {/* Today's appointments */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
        <div className="p-5 border-b">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-lilac" />
            <h2 className="text-lg font-semibold text-navy">Agenda de Hoje</h2>
          </div>
        </div>
        <div className="divide-y">
          {loadingAppts ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="w-14 h-8 rounded" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24 ml-auto" />
              </div>
            ))
          ) : (todayAppointments ?? []).length === 0 ? (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <Calendar className="w-10 h-10 mb-2" />
              <p className="text-sm">Nenhum agendamento para hoje</p>
            </div>
          ) : (
            (todayAppointments ?? []).map((a) => (
              <div
                key={a.id}
                onClick={() => handleAppointmentClick(a)}
                className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition group"
              >
                <div className="text-center shrink-0 w-14">
                  <p className="text-sm font-bold text-navy">{a.startTime?.slice(0, 5)}</p>
                  <p className="text-[10px] text-gray-400">{a.endTime?.slice(0, 5)}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{a.patientName ? toTitleCase(a.patientName) : '—'}</p>
                  <p className="text-xs text-gray-500">
                    {TYPE_LABELS[a.type] ?? a.type}
                    {a.category ? ` · ${CATEGORY_LABELS[a.category] ?? a.category}` : ''}
                  </p>
                </div>
                <span className={cn('px-2 py-0.5 text-[10px] font-medium rounded-full shrink-0', STATUS_COLORS[a.status])}>
                  {STATUS_LABELS[a.status] ?? a.status}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-lilac transition shrink-0" />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pregnancies list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 border-b">
          <h2 className="text-lg font-semibold text-navy">Gestações Ativas</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar paciente..."
              className="pl-10 pr-4 py-2 border rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac"
            />
          </div>
        </div>

        <div className="flex gap-2 px-5 py-3 border-b overflow-x-auto">
          {trimesterFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition',
                filter === f.value
                  ? 'bg-lilac text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="divide-y">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-5">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-60" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <Users className="w-12 h-12 mb-3" />
              <p className="font-medium">Nenhuma gestante encontrada</p>
              <button
                onClick={() => setChooserOpen(true)}
                className="mt-4 px-4 py-2 bg-lilac text-white text-sm rounded-lg hover:bg-primary-dark transition"
              >
                Cadastrar paciente
              </button>
            </div>
          ) : (
            filtered.map((p) => (
              <PregnancyRow key={p.id} pregnancy={p} onClick={() => navigate(`/pregnancies/${p.id}`)} />
            ))
          )}
        </div>
      </div>

      {chooserOpen && (
        <NewPatientChooserModal
          onClose={() => setChooserOpen(false)}
          onSelect={handleChooserSelect}
        />
      )}
      {obsModalOpen && <NewPatientModal onClose={() => setObsModalOpen(false)} />}
      {baseModalSpecialty && (
        <NewPatientBaseModal
          specialty={baseModalSpecialty}
          onClose={() => setBaseModalSpecialty(null)}
          onCreated={handlePatientCreated}
        />
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  color,
  value,
  label,
}: {
  icon: React.ElementType;
  color: string;
  value: number;
  label: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center mb-3', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-navy">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

function PregnancyRow({ pregnancy: p, onClick }: { pregnancy: { id: string; patientName: string; gestationalAge: { weeks: number; days: number }; edd: string; riskLevel: string }; onClick: () => void }) {
  const ga = p.gestationalAge;
  const progress = Math.min(100, Math.round(((ga.weeks * 7 + ga.days) / 280) * 100));
  const initials = p.patientName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  return (
    <div onClick={onClick} className="flex items-center gap-4 p-5 hover:bg-gray-50 cursor-pointer transition group">
      <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 truncate">{p.patientName}</p>
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
          <span>DPP: {new Date(p.edd).toLocaleDateString('pt-BR')}</span>
          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full', getProgressColor(ga.weeks))} style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
      <span className="px-2.5 py-1 bg-lilac/10 text-lilac text-xs font-semibold rounded-full">
        {ga.weeks}s {ga.days}d
      </span>
      {p.riskLevel === 'high' && (
        <span className="px-2 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full">
          Alto Risco
        </span>
      )}
      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-lilac transition shrink-0" />
    </div>
  );
}
