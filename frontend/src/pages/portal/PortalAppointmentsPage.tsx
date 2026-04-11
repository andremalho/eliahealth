import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, X, Loader2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchMyAppointments, fetchAvailableSlots, bookAppointment, cancelMyAppointment,
} from '../../api/portal-appointments.api';
import { fetchDoctors } from '../../api/appointments.api';
import { cn } from '../../utils/cn';

function fmtDate(d: string) {
  try { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }); }
  catch { return d; }
}

export default function PortalAppointmentsPage({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [step, setStep] = useState<'list' | 'doctor' | 'date' | 'slot'>('list');
  const [selectedDoctor, setSelectedDoctor] = useState<{ id: string; name: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: appointments } = useQuery({
    queryKey: ['portal-appointments'],
    queryFn: fetchMyAppointments,
  });

  const { data: doctors } = useQuery({
    queryKey: ['portal-doctors'],
    queryFn: fetchDoctors,
    enabled: step === 'doctor',
  });

  const { data: slots } = useQuery({
    queryKey: ['portal-slots', selectedDoctor?.id, selectedDate],
    queryFn: () => fetchAvailableSlots(selectedDoctor!.id, selectedDate),
    enabled: step === 'slot' && !!selectedDoctor?.id,
  });

  const bookMut = useMutation({
    mutationFn: (slot: { startTime: string; endTime: string }) =>
      bookAppointment({
        doctorId: selectedDoctor!.id,
        date: selectedDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-appointments'] });
      toast.success('Consulta agendada com sucesso!');
      setStep('list');
    },
    onError: () => toast.error('Horario nao disponivel'),
  });

  const cancelMut = useMutation({
    mutationFn: cancelMyAppointment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-appointments'] });
      toast.success('Consulta cancelada');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Erro ao cancelar'),
  });

  const apptList = Array.isArray(appointments) ? appointments : [];
  const futureAppts = apptList.filter((a: any) => new Date(a.date) >= new Date());
  const availableSlots = (slots ?? []).filter((s: any) => s.available);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-md mx-auto max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-navy">
            {step === 'list' ? 'Meus Agendamentos' : step === 'doctor' ? 'Escolher Medico' : step === 'date' ? 'Escolher Data' : 'Horarios Disponiveis'}
          </h2>
          <button onClick={onClose} className="text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6">
          {/* LIST */}
          {step === 'list' && (
            <>
              <button onClick={() => setStep('doctor')}
                className="w-full py-3 bg-lilac text-white font-medium rounded-lg mb-4 flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" /> Agendar nova consulta
              </button>

              {futureAppts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Nenhuma consulta agendada</p>
              ) : (
                <div className="space-y-2">
                  {futureAppts.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-navy">{fmtDate(a.date)} · {(a.start_time ?? a.startTime)?.slice(0, 5)}</p>
                        <p className="text-xs text-gray-500">{a.doctor_name ?? a.doctorName}</p>
                      </div>
                      <button onClick={() => cancelMut.mutate(a.id)}
                        className="px-2 py-1 text-[10px] bg-red-50 text-red-600 rounded hover:bg-red-100">Cancelar</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* DOCTOR SELECT */}
          {step === 'doctor' && (
            <>
              <button onClick={() => setStep('list')} className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                <ChevronLeft className="w-3 h-3" /> Voltar
              </button>
              <div className="space-y-2">
                {(doctors ?? []).map((d: any) => (
                  <button key={d.id} onClick={() => { setSelectedDoctor({ id: d.id, name: d.name }); setStep('slot'); }}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-lilac/5 text-left">
                    <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold">
                      {d.name?.split(' ').slice(0, 2).map((w: string) => w[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy">{d.name}</p>
                      {d.specialty && <p className="text-xs text-gray-400">{d.specialty}</p>}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* SLOT SELECT */}
          {step === 'slot' && (
            <>
              <button onClick={() => setStep('doctor')} className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                <ChevronLeft className="w-3 h-3" /> Trocar medico
              </button>
              <p className="text-sm text-gray-600 mb-3">Dr(a) {selectedDoctor?.name}</p>

              {/* Date navigation */}
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                  className="p-2 hover:bg-gray-100 rounded"><ChevronLeft className="w-4 h-4" /></button>
                <p className="text-sm font-semibold text-navy">{fmtDate(selectedDate)}</p>
                <button onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                  className="p-2 hover:bg-gray-100 rounded"><ChevronRight className="w-4 h-4" /></button>
              </div>

              {availableSlots.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Nenhum horario disponivel neste dia</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((s: any) => (
                    <button key={s.startTime} onClick={() => bookMut.mutate(s)}
                      disabled={bookMut.isPending}
                      className="px-3 py-3 border border-gray-200 rounded-lg text-sm font-medium text-navy hover:border-lilac hover:bg-lilac/5 transition flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3 text-lilac" /> {s.startTime}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
