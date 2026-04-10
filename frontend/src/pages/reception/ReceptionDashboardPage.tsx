import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar, Clock, Users, CheckCircle, XCircle, Plus, Loader2,
  Baby, Stethoscope, Search, AlertTriangle, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchAppointments, fetchAppointmentSummary, updateAppointment,
  STATUS_LABELS, STATUS_COLORS, TYPE_LABELS,
} from '../../api/appointments.api';
import { fetchMyDoctors, fetchPregnanciesForDoctors, fetchGynecologyPatientsForDoctors } from '../../api/secretary.api';
import { useAuthStore } from '../../store/auth.store';
import { toTitleCase } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import NewAppointmentModal from './NewAppointmentModal';

type Tab = 'today' | 'gestantes' | 'ginecologia';

const TRIMESTER_FILTERS = [
  { label: 'Todas', value: 'all' },
  { label: '1o Tri', value: '1' },
  { label: '2o Tri', value: '2' },
  { label: '3o Tri', value: '3' },
  { label: 'Alto Risco', value: 'high_risk' },
];

function getTrimester(weeks: number) { return weeks < 14 ? 1 : weeks < 28 ? 2 : 3; }
function progressColor(weeks: number) { return weeks < 14 ? 'bg-emerald-400' : weeks < 28 ? 'bg-amber-400' : 'bg-orange-400'; }

export default function ReceptionDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const [tab, setTab] = useState<Tab>('today');
  const [modalOpen, setModalOpen] = useState(false);
  const [triFilter, setTriFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Fetch assigned doctors
  const { data: myDoctors } = useQuery({
    queryKey: ['my-doctors'],
    queryFn: fetchMyDoctors,
  });
  const doctorIds = (myDoctors ?? []).map((d) => d.doctorId);
  const hasAssignment = doctorIds.length > 0;

  // Today's appointments
  const { data: appointments, isLoading: loadingAppts } = useQuery({
    queryKey: ['appointments', today],
    queryFn: () => fetchAppointments({ date: today }),
    enabled: tab === 'today',
  });

  const { data: summary } = useQuery({
    queryKey: ['appointments', 'summary', today],
    queryFn: () => fetchAppointmentSummary(today),
  });

  // Pregnancies
  const { data: pregnancies, isLoading: loadingPreg } = useQuery({
    queryKey: ['secretary-pregnancies', doctorIds, search],
    queryFn: () => fetchPregnanciesForDoctors(doctorIds, 'active', search || undefined),
    enabled: tab === 'gestantes' && hasAssignment,
  });

  // Gynecology patients
  const { data: gynPatients, isLoading: loadingGyn } = useQuery({
    queryKey: ['secretary-gyn-patients', doctorIds],
    queryFn: () => fetchGynecologyPatientsForDoctors(doctorIds),
    enabled: tab === 'ginecologia' && hasAssignment,
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateAppointment(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Status atualizado');
    },
  });

  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };
  const userName = user?.name ? toTitleCase(user.name) : '';

  // Filter pregnancies by trimester
  const filteredPregnancies = (pregnancies ?? []).filter((p: any) => {
    if (triFilter === 'all') return true;
    if (triFilter === 'high_risk') return p.riskLevel === 'high';
    return getTrimester(p.gestationalAge?.weeks ?? 0).toString() === triFilter;
  });

  const tabs: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: 'today', label: 'Hoje', icon: Calendar, count: summary?.total },
    { key: 'gestantes', label: 'Gestantes', icon: Baby, count: pregnancies?.length },
    { key: 'ginecologia', label: 'Ginecologia', icon: Stethoscope, count: gynPatients?.length },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-navy">{greeting()}, {userName}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            {hasAssignment && <> · {doctorIds.length} medico{doctorIds.length > 1 ? 's' : ''}</>}
          </p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition">
          <Plus className="w-4 h-4" /> Agendar
        </button>
      </div>

      {!hasAssignment && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-amber-700">Voce ainda nao foi vinculada a nenhum medico</p>
          <p className="text-xs text-amber-600 mt-1">Solicite ao medico ou administrador que vincule sua conta.</p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SCard icon={Calendar} color="bg-lilac/10 text-lilac" value={summary?.total ?? 0} label="Consultas hoje" />
        <SCard icon={CheckCircle} color="bg-emerald-50 text-emerald-600" value={summary?.confirmed ?? 0} label="Confirmadas" />
        <SCard icon={Clock} color="bg-blue-50 text-blue-600" value={summary?.scheduled ?? 0} label="Aguardando" />
        <SCard icon={XCircle} color="bg-red-50 text-red-600" value={(summary?.cancelled ?? 0) + (summary?.noShow ?? 0)} label="Canceladas/Faltas" />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn(
                  'flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition',
                  tab === t.key ? 'border-lilac text-lilac bg-lilac/5' : 'border-transparent text-gray-500 hover:text-navy hover:bg-gray-50',
                )}>
                <Icon className="w-4 h-4" />
                {t.label}
                {t.count != null && t.count > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600 rounded-full">{t.count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab: Today */}
        {tab === 'today' && (
          <div>
            {loadingAppts ? (
              <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>
            ) : !appointments || appointments.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-gray-400">
                <Calendar className="w-12 h-12 mb-3" />
                <p className="font-medium">Nenhuma consulta agendada para hoje</p>
              </div>
            ) : (
              <div className="divide-y">
                {appointments.map((a) => (
                  <div key={a.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 group">
                    <div className="text-center shrink-0 w-16">
                      <p className="text-lg font-bold text-navy">{a.startTime?.slice(0, 5)}</p>
                      <p className="text-[10px] text-gray-400">{a.endTime?.slice(0, 5)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{a.patientName ? toTitleCase(a.patientName) : '—'}</p>
                      <p className="text-xs text-gray-500">{a.doctorName ?? '—'} · {TYPE_LABELS[a.type] ?? a.type}</p>
                    </div>
                    <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full shrink-0', STATUS_COLORS[a.status])}>
                      {STATUS_LABELS[a.status] ?? a.status}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                      {a.status === 'scheduled' && (
                        <button onClick={() => statusMut.mutate({ id: a.id, status: 'confirmed' })}
                          className="px-2 py-1 text-[10px] bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100">Confirmar</button>
                      )}
                      {(a.status === 'scheduled' || a.status === 'confirmed') && (
                        <button onClick={() => statusMut.mutate({ id: a.id, status: 'arrived' })}
                          className="px-2 py-1 text-[10px] bg-violet-50 text-violet-700 rounded hover:bg-violet-100">Chegou</button>
                      )}
                      {a.status !== 'cancelled' && a.status !== 'completed' && a.status !== 'no_show' && (
                        <button onClick={() => statusMut.mutate({ id: a.id, status: 'cancelled' })}
                          className="px-2 py-1 text-[10px] bg-red-50 text-red-600 rounded hover:bg-red-100">Cancelar</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Gestantes */}
        {tab === 'gestantes' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b">
              <div className="flex gap-2 overflow-x-auto">
                {TRIMESTER_FILTERS.map((f) => (
                  <button key={f.value} onClick={() => setTriFilter(f.value)}
                    className={cn('px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition',
                      triFilter === f.value ? 'bg-lilac text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="relative sm:ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar gestante..."
                  className="pl-10 pr-4 py-2 border rounded-lg text-sm w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac" />
              </div>
            </div>

            {loadingPreg ? (
              <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>
            ) : filteredPregnancies.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-gray-400">
                <Baby className="w-12 h-12 mb-3" />
                <p className="font-medium">Nenhuma gestante encontrada</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredPregnancies.map((p: any) => {
                  const ga = p.gestationalAge ?? { weeks: 0, days: 0 };
                  const progress = Math.min(100, Math.round(((ga.weeks * 7 + ga.days) / 280) * 100));
                  const initials = (p.patientName ?? '').split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join('');
                  return (
                    <div key={p.id} onClick={() => navigate(`/pregnancies/${p.id}`)}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer group">
                      <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold shrink-0">{initials}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{toTitleCase(p.patientName ?? '')}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span>DPP: {p.edd ? new Date(p.edd + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</span>
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full', progressColor(ga.weeks))} style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-lilac/10 text-lilac text-xs font-semibold rounded-full">{ga.weeks}s {ga.days}d</span>
                      {p.riskLevel === 'high' && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full">
                          <AlertTriangle className="w-3 h-3" /> AR
                        </span>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-lilac shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Ginecologia */}
        {tab === 'ginecologia' && (
          <div>
            {loadingGyn ? (
              <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>
            ) : !gynPatients || gynPatients.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-gray-400">
                <Stethoscope className="w-12 h-12 mb-3" />
                <p className="font-medium">Nenhuma paciente ginecologica</p>
              </div>
            ) : (
              <div className="divide-y">
                {gynPatients.map((p: any) => {
                  const initials = (p.fullName ?? '').split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join('');
                  return (
                    <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 group">
                      <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold shrink-0">{initials}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{toTitleCase(p.fullName)}</p>
                        <p className="text-xs text-gray-400">{p.cpf}{p.phone ? ` · ${p.phone}` : ''}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {modalOpen && <NewAppointmentModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}

function SCard({ icon: Icon, color, value, label }: { icon: any; color: string; value: number; label: string }) {
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
