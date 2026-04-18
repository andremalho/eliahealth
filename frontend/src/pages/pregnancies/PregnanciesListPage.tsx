import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronRight, Users, Plus, AlertTriangle } from 'lucide-react';
import { fetchPregnancyList } from '../../api/pregnancies.api';
import { cn } from '../../utils/cn';
import NewPatientModal from '../dashboard/NewPatientModal';

const STATUS_FILTERS = [
  { label: 'Ativas', value: 'active' },
  { label: 'Concluídas', value: 'completed' },
  { label: 'Todas', value: '' },
];

function getTrimester(weeks: number) {
  if (weeks < 14) return 1;
  if (weeks < 28) return 2;
  return 3;
}

function progressColor(weeks: number) {
  if (weeks < 14) return 'bg-emerald-400';
  if (weeks < 28) return 'bg-amber-400';
  return 'bg-orange-400';
}

const TRIMESTER_FILTERS = [
  { label: 'Todas', value: 'all' },
  { label: '1º Tri', value: '1' },
  { label: '2º Tri', value: '2' },
  { label: '3º Tri', value: '3' },
  { label: 'Alto Risco', value: 'high_risk' },
];

export default function PregnanciesListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');
  const [trimesterFilter, setTrimesterFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);

  const { data: pregnancies, isLoading } = useQuery({
    queryKey: ['pregnancies', 'list', status, search],
    queryFn: () => fetchPregnancyList({ status: status || undefined, search: search || undefined }),
  });

  const allItems = pregnancies ?? [];
  const items = status === 'active' ? allItems.filter((p) => {
    if (trimesterFilter === 'all') return true;
    if (trimesterFilter === 'high_risk') return p.riskLevel === 'high';
    return getTrimester(p.gestationalAge?.weeks ?? 0).toString() === trimesterFilter;
  }) : allItems;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Gestações</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} gestação{items.length !== 1 ? 'es' : ''}</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition"
        >
          <Plus className="w-4 h-4" /> Nova
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b">
          <div className="flex gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatus(f.value)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-full transition',
                  status === f.value ? 'bg-lilac text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar paciente..."
              className="pl-10 pr-4 py-2 border rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac"
            />
          </div>
        </div>

        {status === 'active' && (
          <div className="flex gap-2 px-4 py-3 border-b overflow-x-auto">
            {TRIMESTER_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setTrimesterFilter(f.value)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition',
                  trimesterFilter === f.value ? 'bg-lilac text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        <div className="divide-y">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-5">
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                <div className="flex-1 space-y-2"><div className="h-4 w-40 bg-gray-200 rounded animate-pulse" /><div className="h-3 w-60 bg-gray-200 rounded animate-pulse" /></div>
              </div>
            ))
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <Users className="w-12 h-12 mb-3" />
              <p className="font-medium">Nenhuma gestação encontrada</p>
            </div>
          ) : (
            items.map((p) => {
              const ga = p.gestationalAge ?? { weeks: 0, days: 0 };
              const progress = Math.min(100, Math.round(((ga.weeks * 7 + ga.days) / 280) * 100));
              const initials = p.patientName.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');

              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/pregnancies/${p.id}`)}
                  className="flex items-center gap-4 p-5 hover:bg-gray-50 cursor-pointer transition group"
                >
                  <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{p.patientName}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span>DPP: {new Date(p.edd + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                      {p.status === 'active' && (
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full', progressColor(ga.weeks))} style={{ width: `${progress}%` }} />
                        </div>
                      )}
                      {p.status === 'completed' && <span className="text-emerald-600 font-medium">Concluida</span>}
                    </div>
                  </div>
                  {p.status === 'active' && (
                    <span className="px-2.5 py-1 bg-lilac/10 text-lilac text-xs font-semibold rounded-full">
                      {ga.weeks}s {ga.days}d
                    </span>
                  )}
                  {p.riskLevel === 'high' && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full">
                      <AlertTriangle className="w-3 h-3" /> Alto Risco
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-lilac transition shrink-0" />
                </div>
              );
            })
          )}
        </div>
      </div>

      {modalOpen && <NewPatientModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
