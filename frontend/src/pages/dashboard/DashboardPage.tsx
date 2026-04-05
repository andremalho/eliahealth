import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Calendar, Stethoscope, AlertTriangle,
  Search, ChevronRight, Plus,
} from 'lucide-react';
import { fetchPregnancyList, fetchUpcomingBirths } from '../../api/pregnancies.api';
import { useAuthStore } from '../../store/auth.store';
import { cn } from '../../utils/cn';
import { toTitleCase } from '../../utils/formatters';
import NewPatientModal from './NewPatientModal';

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
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);

  const { data: pregnancies, isLoading } = useQuery({
    queryKey: ['pregnancies', 'list', search],
    queryFn: () => fetchPregnancyList({ status: 'active', search: search || undefined }),
  });

  const { data: upcoming } = useQuery({
    queryKey: ['upcoming-births'],
    queryFn: () => fetchUpcomingBirths(30),
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

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-navy">
            {greeting()}, Dr. {userName}
          </h1>
          <p className="text-sm text-gray-500">{today}</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition"
        >
          <Plus className="w-4 h-4" /> Nova Gestante
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard icon={Users} color="bg-lilac/10 text-lilac" value={totalActive} label="gestantes ativas" />
        <SummaryCard icon={Calendar} color="bg-blue-50 text-blue-600" value={birthsThisMonth} label="partos este mês" />
        <SummaryCard icon={Stethoscope} color="bg-emerald-50 text-emerald-600" value={0} label="consultas hoje" />
        <SummaryCard
          icon={AlertTriangle}
          color={alertCount > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}
          value={alertCount}
          label="requerem atenção"
        />
      </div>

      {/* Pregnancies list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* List header */}
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

        {/* Filters */}
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

        {/* List */}
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
                onClick={() => setModalOpen(true)}
                className="mt-4 px-4 py-2 bg-lilac text-white text-sm rounded-lg hover:bg-primary-dark transition"
              >
                Cadastrar gestante
              </button>
            </div>
          ) : (
            filtered.map((p) => (
              <PregnancyRow key={p.id} pregnancy={p} />
            ))
          )}
        </div>
      </div>

      {modalOpen && <NewPatientModal onClose={() => setModalOpen(false)} />}
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

function PregnancyRow({ pregnancy: p }: { pregnancy: { id: string; patientName: string; gestationalAge: { weeks: number; days: number }; edd: string; riskLevel: string } }) {
  const ga = p.gestationalAge;
  const progress = Math.min(100, Math.round(((ga.weeks * 7 + ga.days) / 280) * 100));
  const initials = p.patientName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  return (
    <div className="flex items-center gap-4 p-5 hover:bg-gray-50 cursor-pointer transition group">
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
