import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, ChevronLeft, ChevronRight, Plus, Filter, List, Grid3X3 } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchAppointments, fetchDoctors, updateAppointment,
  STATUS_LABELS, STATUS_COLORS, TYPE_LABELS,
  CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_DOT_COLORS,
} from '../../api/appointments.api';
import { toTitleCase } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import NewAppointmentModal from './NewAppointmentModal';

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function fmtDate(d: string): string {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function AgendaPage() {
  const qc = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [doctorFilter, setDoctorFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');

  const month = parseInt(date.split('-')[1]);
  const year = parseInt(date.split('-')[0]);

  const { data: doctors } = useQuery({ queryKey: ['doctors'], queryFn: fetchDoctors });

  // Day view data
  const { data: dayAppointments, isLoading: loadingDay } = useQuery({
    queryKey: ['appointments', date, doctorFilter],
    queryFn: () => fetchAppointments({ date, doctorId: doctorFilter || undefined }),
    enabled: viewMode === 'day',
  });

  // Month view data
  const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
  const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
  const { data: monthAppointments } = useQuery({
    queryKey: ['appointments', 'month', startOfMonth, endOfMonth, doctorFilter],
    queryFn: () => fetchAppointments({ startDate: startOfMonth, endDate: endOfMonth, doctorId: doctorFilter || undefined }),
    enabled: viewMode === 'month',
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateAppointment(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Status atualizado');
    },
  });

  const items = dayAppointments ?? [];
  const isToday = date === new Date().toISOString().split('T')[0];

  // Month grid
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const eventsByDay = new Map<number, typeof monthAppointments>();
  for (const e of (monthAppointments ?? [])) {
    const d = new Date(e.date + 'T12:00:00');
    if (d.getMonth() + 1 === month && d.getFullYear() === year) {
      const day = d.getDate();
      if (!eventsByDay.has(day)) eventsByDay.set(day, []);
      eventsByDay.get(day)!.push(e);
    }
  }

  const todayDate = new Date().getDate();
  const isCurrentMonth = month === new Date().getMonth() + 1 && year === new Date().getFullYear();

  const prevMonth = () => {
    const m = month === 1 ? 12 : month - 1;
    const y = month === 1 ? year - 1 : year;
    setDate(`${y}-${String(m).padStart(2, '0')}-01`);
  };
  const nextMonth = () => {
    const m = month === 12 ? 1 : month + 1;
    const y = month === 12 ? year + 1 : year;
    setDate(`${y}-${String(m).padStart(2, '0')}-01`);
  };

  const switchToDay = (day: number) => {
    setDate(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    setViewMode('day');
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-lilac" />
          <h1 className="text-2xl font-semibold text-navy">Agenda</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('day')}
              className={cn('p-2', viewMode === 'day' ? 'bg-lilac text-white' : 'text-gray-400 hover:bg-gray-50')}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('month')}
              className={cn('p-2', viewMode === 'month' ? 'bg-lilac text-white' : 'text-gray-400 hover:bg-gray-50')}>
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition">
            <Plus className="w-4 h-4" /> Agendar
          </button>
        </div>
      </div>

      {/* Navigation + filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => viewMode === 'day' ? setDate(addDays(date, -1)) : prevMonth()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-center min-w-[200px]">
            {viewMode === 'day' ? (
              <>
                <p className="text-lg font-semibold text-navy">{fmtDate(date)}</p>
                {isToday && <span className="text-xs text-lilac font-medium">Hoje</span>}
              </>
            ) : (
              <p className="text-lg font-semibold text-navy">{MONTHS[month - 1]} {year}</p>
            )}
          </div>
          <button onClick={() => viewMode === 'day' ? setDate(addDays(date, 1)) : nextMonth()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
          {viewMode === 'day' && !isToday && (
            <button onClick={() => setDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-1.5 text-xs text-lilac bg-lilac/10 rounded-lg hover:bg-lilac/20">Hoje</button>
          )}
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lilac/30">
            <option value="">Todos os medicos</option>
            {(doctors ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      {/* Category legend */}
      <div className="flex gap-3 mb-4 flex-wrap">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className={cn('w-2.5 h-2.5 rounded-full', CATEGORY_DOT_COLORS[key])} />
            {label}
          </div>
        ))}
      </div>

      {/* DAY VIEW */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {loadingDay ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <Calendar className="w-12 h-12 mb-3" />
              <p className="font-medium">Nenhum agendamento para este dia</p>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 group">
                  {/* Category dot */}
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

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-gray-500 uppercase py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={i} />;
              const dayEvents = eventsByDay.get(day) ?? [];
              const isTodayCell = isCurrentMonth && day === todayDate;

              return (
                <button key={i} onClick={() => switchToDay(day)}
                  className={cn(
                    'min-h-[80px] p-1.5 rounded-lg border text-left transition hover:bg-gray-50',
                    isTodayCell ? 'border-lilac bg-lilac/5' : 'border-gray-100',
                    dayEvents.length > 0 && !isTodayCell && 'bg-gray-50/50',
                  )}>
                  <span className={cn(
                    'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium',
                    isTodayCell ? 'bg-lilac text-white' : 'text-gray-700',
                  )}>{day}</span>
                  <div className="mt-0.5 space-y-0.5">
                    {dayEvents.slice(0, 3).map((e, j) => (
                      <div key={j} className="flex items-center gap-1">
                        <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', e.category ? CATEGORY_DOT_COLORS[e.category] : 'bg-gray-300')} />
                        <span className="text-[9px] text-gray-600 truncate">{e.startTime?.slice(0, 5)} {e.patientName?.split(' ')[0]}</span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[9px] text-gray-400">+{dayEvents.length - 3}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {modalOpen && <NewAppointmentModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
