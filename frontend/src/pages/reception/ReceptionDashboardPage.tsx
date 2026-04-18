import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar, Clock, Users, CheckCircle, XCircle, Plus, Loader2,
  Baby, Stethoscope, Search, AlertTriangle, ChevronRight,
  List, Grid3X3, ChevronLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchAppointments, fetchAppointmentSummary, updateAppointment,
  STATUS_LABELS, STATUS_COLORS, TYPE_LABELS,
  CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_DOT_COLORS,
  fetchProceduresCalendar, PROCEDURE_LABELS, PROCEDURE_COLORS, PROCEDURE_DOT_COLORS,
} from '../../api/appointments.api';
import { fetchUpcomingBirths } from '../../api/pregnancies.api';
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
  const [gestView, setGestView] = useState<'list' | 'calendar'>('list');
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [gynView, setGynView] = useState<'patients' | 'procedures'>('patients');
  const [procMonth, setProcMonth] = useState(new Date().getMonth() + 1);
  const [procYear, setProcYear] = useState(new Date().getFullYear());

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

  // Upcoming births for calendar
  const { data: upcomingBirths } = useQuery({
    queryKey: ['upcoming-births-secretary'],
    queryFn: () => fetchUpcomingBirths(120),
    enabled: tab === 'gestantes' && gestView === 'calendar',
  });

  // Procedures calendar
  const { data: procedures } = useQuery({
    queryKey: ['procedures-calendar', procMonth, procYear],
    queryFn: () => fetchProceduresCalendar(procMonth, procYear),
    enabled: tab === 'ginecologia' && gynView === 'procedures',
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
            {hasAssignment && <> · {doctorIds.length} médico{doctorIds.length > 1 ? 's' : ''}</>}
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
          <p className="text-sm font-medium text-amber-700">Você ainda não foi vinculada a nenhum médico</p>
          <p className="text-xs text-amber-600 mt-1">Solicite ao médico ou administrador que vincule sua conta.</p>
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
                  <div key={a.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 group">
                    <div className={cn('w-1 h-12 rounded-full shrink-0', a.category ? CATEGORY_DOT_COLORS[a.category] : 'bg-gray-200')} />
                    <div className="text-center shrink-0 w-14">
                      <p className="text-base font-bold text-navy">{a.startTime?.slice(0, 5)}</p>
                      <p className="text-[10px] text-gray-400">{a.endTime?.slice(0, 5)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{a.patientName ? toTitleCase(a.patientName) : '—'}</p>
                      <p className="text-xs text-gray-500">{a.doctorName ?? '—'} · {TYPE_LABELS[a.type] ?? a.type}</p>
                    </div>
                    {a.category && (
                      <span className={cn('px-2 py-0.5 text-[10px] font-medium rounded-full shrink-0', CATEGORY_COLORS[a.category])}>
                        {CATEGORY_LABELS[a.category]}
                      </span>
                    )}
                    <span className={cn('px-2 py-0.5 text-[10px] font-medium rounded-full shrink-0', STATUS_COLORS[a.status])}>
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
              <div className="flex border rounded-lg overflow-hidden mr-2">
                <button onClick={() => setGestView('list')}
                  className={cn('p-1.5', gestView === 'list' ? 'bg-lilac text-white' : 'text-gray-400')}>
                  <List className="w-4 h-4" />
                </button>
                <button onClick={() => setGestView('calendar')}
                  className={cn('p-1.5', gestView === 'calendar' ? 'bg-lilac text-white' : 'text-gray-400')}>
                  <Grid3X3 className="w-4 h-4" />
                </button>
              </div>
              {gestView === 'list' && (
                <>
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
                </>
              )}
            </div>

            {gestView === 'calendar' ? (
              /* Birth calendar grid */
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => { if (calMonth === 1) { setCalMonth(12); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }}
                    className="p-1.5 hover:bg-gray-100 rounded"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
                  <p className="text-sm font-semibold text-navy">{['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][calMonth - 1]} {calYear}</p>
                  <button onClick={() => { if (calMonth === 12) { setCalMonth(1); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }}
                    className="p-1.5 hover:bg-gray-100 rounded"><ChevronRight className="w-4 h-4 text-gray-600" /></button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {['D','S','T','Q','Q','S','S'].map((d, i) => (
                    <div key={i} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
                  ))}
                </div>
                {(() => {
                  const fd = new Date(calYear, calMonth - 1, 1).getDay();
                  const dim = new Date(calYear, calMonth, 0).getDate();
                  const c: (number | null)[] = [];
                  for (let i = 0; i < fd; i++) c.push(null);
                  for (let d = 1; d <= dim; d++) c.push(d);

                  const births = (Array.isArray(upcomingBirths) ? upcomingBirths : []) as any[];
                  const birthsByDay = new Map<number, any[]>();
                  for (const b of births) {
                    const bd = new Date(b.edd + 'T12:00:00');
                    if (bd.getMonth() + 1 === calMonth && bd.getFullYear() === calYear) {
                      const day = bd.getDate();
                      if (!birthsByDay.has(day)) birthsByDay.set(day, []);
                      birthsByDay.get(day)!.push(b);
                    }
                  }
                  const td = new Date();
                  const isCurMonth = calMonth === td.getMonth() + 1 && calYear === td.getFullYear();

                  return (
                    <div className="grid grid-cols-7 gap-1">
                      {c.map((day, i) => {
                        if (day === null) return <div key={i} />;
                        const evts = birthsByDay.get(day) ?? [];
                        const isT = isCurMonth && day === td.getDate();
                        return (
                          <div key={i} className={cn('min-h-[64px] p-1 rounded-lg border text-xs',
                            isT ? 'border-lilac bg-lilac/5' : 'border-gray-100',
                            evts.length > 0 && 'bg-pink-50/50')}>
                            <span className={cn('inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-medium',
                              isT ? 'bg-lilac text-white' : 'text-gray-600')}>{day}</span>
                            {evts.slice(0, 2).map((b: any, j: number) => (
                              <div key={j} onClick={() => navigate(`/pregnancies/${b.pregnancyId}`)}
                                className="mt-0.5 px-1 py-0.5 bg-pink-100 text-pink-700 text-[9px] font-medium rounded truncate cursor-pointer hover:bg-pink-200">
                                {b.patientName?.split(' ')[0]} · {b.gaWeeks}s
                              </div>
                            ))}
                            {evts.length > 2 && <span className="text-[9px] text-gray-400">+{evts.length - 2}</span>}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            ) : loadingPreg ? (
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
            <div className="flex items-center gap-3 p-4 border-b">
              <div className="flex border rounded-lg overflow-hidden">
                <button onClick={() => setGynView('patients')}
                  className={cn('px-3 py-1.5 text-xs font-medium', gynView === 'patients' ? 'bg-lilac text-white' : 'text-gray-500 hover:bg-gray-50')}>
                  Pacientes
                </button>
                <button onClick={() => setGynView('procedures')}
                  className={cn('px-3 py-1.5 text-xs font-medium', gynView === 'procedures' ? 'bg-lilac text-white' : 'text-gray-500 hover:bg-gray-50')}>
                  Procedimentos
                </button>
              </div>
            </div>

            {gynView === 'patients' ? (
              <>
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
              </>
            ) : (
              /* Procedures calendar */
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => { if (procMonth === 1) { setProcMonth(12); setProcYear(procYear - 1); } else setProcMonth(procMonth - 1); }}
                    className="p-1.5 hover:bg-gray-100 rounded"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
                  <p className="text-sm font-semibold text-navy">
                    {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][procMonth - 1]} {procYear}
                  </p>
                  <button onClick={() => { if (procMonth === 12) { setProcMonth(1); setProcYear(procYear + 1); } else setProcMonth(procMonth + 1); }}
                    className="p-1.5 hover:bg-gray-100 rounded"><ChevronRight className="w-4 h-4 text-gray-600" /></button>
                </div>

                {/* Procedure legend */}
                <div className="flex gap-3 mb-3 flex-wrap">
                  {Object.entries(PROCEDURE_LABELS).filter(([k]) => k !== 'return').map(([key, label]) => (
                    <div key={key} className="flex items-center gap-1.5 text-[10px] text-gray-600">
                      <div className={cn('w-2 h-2 rounded-full', PROCEDURE_DOT_COLORS[key])} />
                      {label}
                    </div>
                  ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {['D','S','T','Q','Q','S','S'].map((d, i) => (
                    <div key={i} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
                  ))}
                </div>
                {(() => {
                  const fd = new Date(procYear, procMonth - 1, 1).getDay();
                  const dim = new Date(procYear, procMonth, 0).getDate();
                  const c: (number | null)[] = [];
                  for (let i = 0; i < fd; i++) c.push(null);
                  for (let d = 1; d <= dim; d++) c.push(d);

                  const procs = procedures ?? [];
                  const procsByDay = new Map<number, any[]>();
                  for (const p of procs) {
                    const pd = new Date(p.date + 'T12:00:00');
                    if (pd.getMonth() + 1 === procMonth && pd.getFullYear() === procYear) {
                      const day = pd.getDate();
                      if (!procsByDay.has(day)) procsByDay.set(day, []);
                      procsByDay.get(day)!.push(p);
                    }
                  }
                  const td = new Date();
                  const isCurMonth = procMonth === td.getMonth() + 1 && procYear === td.getFullYear();

                  return (
                    <div className="grid grid-cols-7 gap-1">
                      {c.map((day, i) => {
                        if (day === null) return <div key={i} />;
                        const evts = procsByDay.get(day) ?? [];
                        const isT = isCurMonth && day === td.getDate();
                        return (
                          <div key={i} className={cn('min-h-[70px] p-1 rounded-lg border text-xs',
                            isT ? 'border-lilac bg-lilac/5' : 'border-gray-100',
                            evts.length > 0 && 'bg-gray-50/50')}>
                            <span className={cn('inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-medium',
                              isT ? 'bg-lilac text-white' : 'text-gray-600')}>{day}</span>
                            {evts.slice(0, 3).map((e: any, j: number) => (
                              <div key={j} className={cn('mt-0.5 px-1 py-0.5 text-[9px] font-medium rounded truncate', PROCEDURE_COLORS[e.type] ?? 'bg-gray-100 text-gray-600')}>
                                {e.label?.split(' ')[0]} · {e.patient_name?.split(' ')[0]}
                              </div>
                            ))}
                            {evts.length > 3 && <span className="text-[9px] text-gray-400">+{evts.length - 3}</span>}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
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
