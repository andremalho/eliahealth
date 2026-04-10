import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { createAppointment, fetchDoctors, TYPE_LABELS } from '../../api/appointments.api';
import api from '../../api/client';
import { toTitleCase } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface Props {
  preSelectedPatient?: { id: string; fullName: string };
  onClose: () => void;
}

const TIMES = Array.from({ length: 25 }, (_, i) => {
  const h = 7 + Math.floor(i / 2);
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
}).filter((t) => t <= '19:00');

async function searchPatients(q: string) {
  if (!q || q.length < 2) return [];
  const { data } = await api.get('/patients', { params: { search: q, limit: 6 } });
  return (data?.data ?? data ?? []) as { id: string; fullName: string; cpf: string }[];
}

export default function NewAppointmentModal({ preSelectedPatient, onClose }: Props) {
  const qc = useQueryClient();
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(preSelectedPatient ?? null);
  const [showResults, setShowResults] = useState(false);

  const { data: doctors } = useQuery({ queryKey: ['doctors'], queryFn: fetchDoctors });
  const { data: patientResults } = useQuery({
    queryKey: ['patient-search-appt', patientSearch],
    queryFn: () => searchPatients(patientSearch),
    enabled: patientSearch.length >= 2 && !selectedPatient,
  });

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      startTime: '08:00',
      endTime: '08:30',
      doctorId: '',
      type: 'consultation',
      notes: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => createAppointment({
      patientId: selectedPatient!.id,
      doctorId: data.doctorId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      type: data.type,
      notes: data.notes || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Consulta agendada');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao agendar');
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-navy">Novo Agendamento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          {/* Patient selector */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Paciente *</label>
            {selectedPatient ? (
              <div className="flex items-center justify-between px-3 py-2.5 bg-lilac/5 border border-lilac/20 rounded-lg">
                <span className="text-sm font-medium text-navy">{toTitleCase(selectedPatient.fullName)}</span>
                <button type="button" onClick={() => { setSelectedPatient(null); setPatientSearch(''); }} className="text-xs text-gray-400 hover:text-gray-600">Trocar</button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={patientSearch}
                  onChange={(e) => { setPatientSearch(e.target.value); setShowResults(true); }}
                  placeholder="Buscar por nome ou CPF..."
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac"
                />
                {showResults && patientResults && patientResults.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {patientResults.map((p) => (
                      <button key={p.id} type="button" onClick={() => { setSelectedPatient(p); setShowResults(false); }}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm">
                        <span className="font-medium text-gray-800">{toTitleCase(p.fullName)}</span>
                        <span className="text-gray-400 ml-2 text-xs">{p.cpf}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Doctor */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Medico(a) *</label>
            <select {...register('doctorId', { required: true })} className={iCn}>
              <option value="">Selecione...</option>
              {(doctors ?? []).map((d) => (
                <option key={d.id} value={d.id}>{d.name}{d.specialty ? ` — ${d.specialty}` : ''}</option>
              ))}
            </select>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data *</label>
              <input {...register('date', { required: true })} type="date" className={iCn} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Inicio *</label>
              <select {...register('startTime', { required: true })} className={iCn}>
                {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fim *</label>
              <select {...register('endTime', { required: true })} className={iCn}>
                {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
            <select {...register('type')} className={iCn}>
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Observacoes</label>
            <textarea {...register('notes')} rows={2} placeholder="Observacoes opcionais..." className={cn(iCn, 'resize-none')} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button type="submit" disabled={!selectedPatient || isSubmitting || mutation.isPending}
              className="px-4 py-2 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-60 flex items-center gap-2">
              {(isSubmitting || mutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />} Agendar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const iCn = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac';
