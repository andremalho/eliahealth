import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, ChevronLeft, ChevronRight, Plus, Filter } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchAppointments, fetchDoctors, updateAppointment,
  STATUS_LABELS, STATUS_COLORS, TYPE_LABELS,
} from '../../api/appointments.api';
import { toTitleCase } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import NewAppointmentModal from './NewAppointmentModal';

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

  const { data: doctors } = useQuery({ queryKey: ['doctors'], queryFn: fetchDoctors });

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', date, doctorFilter],
    queryFn: () => fetchAppointments({ date, doctorId: doctorFilter || undefined }),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateAppointment(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Status atualizado');
    },
  });

  const items = appointments ?? [];
  const isToday = date === new Date().toISOString().split('T')[0];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-lilac" />
          <h1 className="text-2xl font-semibold text-navy">Agenda</h1>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition">
          <Plus className="w-4 h-4" /> Agendar
        </button>
      </div>

      {/* Date navigation + doctor filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setDate(addDays(date, -1))} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-center min-w-[180px]">
            <p className="text-lg font-semibold text-navy">{fmtDate(date)}</p>
            {isToday && <span className="text-xs text-lilac font-medium">Hoje</span>}
          </div>
          <button onClick={() => setDate(addDays(date, 1))} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
          {!isToday && (
            <button onClick={() => setDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-1.5 text-xs text-lilac bg-lilac/10 rounded-lg hover:bg-lilac/20">Hoje</button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lilac/30">
            <option value="">Todos os medicos</option>
            {(doctors ?? []).map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Appointments */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <Calendar className="w-12 h-12 mb-3" />
            <p className="font-medium">Nenhum agendamento para este dia</p>
          </div>
        ) : (
          <div className="divide-y">
            {items.map((a) => (
              <div key={a.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 group">
                <div className="text-center shrink-0 w-16">
                  <p className="text-lg font-bold text-navy">{a.startTime?.slice(0, 5)}</p>
                  <p className="text-[10px] text-gray-400">{a.endTime?.slice(0, 5)}</p>
                </div>
                <div className="h-10 w-0.5 bg-lilac/30 rounded shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{a.patientName ? toTitleCase(a.patientName) : '—'}</p>
                  <p className="text-xs text-gray-500">{a.doctorName ?? '—'} · {TYPE_LABELS[a.type] ?? a.type}</p>
                  {a.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">{a.notes}</p>}
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

      {modalOpen && <NewAppointmentModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
