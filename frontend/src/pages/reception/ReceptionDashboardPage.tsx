import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, Users, CheckCircle, XCircle, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchAppointments, fetchAppointmentSummary, updateAppointment,
  STATUS_LABELS, STATUS_COLORS, TYPE_LABELS,
} from '../../api/appointments.api';
import { useAuthStore } from '../../store/auth.store';
import { toTitleCase } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import NewAppointmentModal from './NewAppointmentModal';

export default function ReceptionDashboardPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const [modalOpen, setModalOpen] = useState(false);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', today],
    queryFn: () => fetchAppointments({ date: today }),
  });

  const { data: summary } = useQuery({
    queryKey: ['appointments', 'summary', today],
    queryFn: () => fetchAppointmentSummary(today),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateAppointment(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Status atualizado');
    },
  });

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  };

  const userName = user?.name ? toTitleCase(user.name) : '';

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-navy">{greeting()}, {userName}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Recepcao — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition">
          <Plus className="w-4 h-4" /> Agendar
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SCard icon={Calendar} color="bg-lilac/10 text-lilac" value={summary?.total ?? 0} label="Consultas hoje" />
        <SCard icon={CheckCircle} color="bg-emerald-50 text-emerald-600" value={summary?.confirmed ?? 0} label="Confirmadas" />
        <SCard icon={Clock} color="bg-blue-50 text-blue-600" value={summary?.scheduled ?? 0} label="Aguardando" />
        <SCard icon={XCircle} color="bg-red-50 text-red-600" value={summary?.cancelled ?? 0} label="Canceladas" />
      </div>

      {/* Appointments list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-navy">Agenda de Hoje</h2>
        </div>

        {isLoading ? (
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
                <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full', STATUS_COLORS[a.status] ?? 'bg-gray-100 text-gray-600')}>
                  {STATUS_LABELS[a.status] ?? a.status}
                </span>
                {/* Quick actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
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
