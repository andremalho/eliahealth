import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, Plus, Phone, Mail, ChevronRight } from 'lucide-react';
import api from '../../api/client';
import { toTitleCase, formatCPF, formatPhone } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import { fetchPatientAppointments } from '../../api/appointments.api';
import NewAppointmentModal from './NewAppointmentModal';

async function fetchPatients(search?: string) {
  const { data } = await api.get('/patients', { params: { search, limit: 50 } });
  return (data?.data ?? data ?? []) as any[];
}

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export default function ReceptionPatientsPage() {
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [appointmentModal, setAppointmentModal] = useState(false);

  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients-reception', search],
    queryFn: () => fetchPatients(search || undefined),
  });

  const { data: patientAppts } = useQuery({
    queryKey: ['patient-appointments', selectedPatient?.id],
    queryFn: () => fetchPatientAppointments(selectedPatient!.id),
    enabled: !!selectedPatient?.id,
  });

  const items = patients ?? [];
  const appts = Array.isArray(patientAppts) ? patientAppts : [];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-navy">Pacientes</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Patient list */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou CPF..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac" />
            </div>
          </div>

          <div className="divide-y max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400">Carregando...</div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-gray-400">
                <Users className="w-10 h-10 mb-3" />
                <p>Nenhuma paciente encontrada</p>
              </div>
            ) : (
              items.map((p: any) => {
                const age = calcAge(p.dateOfBirth);
                const isSelected = selectedPatient?.id === p.id;
                return (
                  <button key={p.id} onClick={() => setSelectedPatient(p)}
                    className={cn('w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition',
                      isSelected && 'bg-lilac/5 border-l-2 border-lilac')}>
                    <div className="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {p.fullName?.split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{toTitleCase(p.fullName)}</p>
                      <p className="text-xs text-gray-400">{formatCPF(p.cpf)}{age != null ? ` · ${age} anos` : ''}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Patient detail sidebar */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {!selectedPatient ? (
            <div className="flex flex-col items-center py-20 text-gray-400">
              <Users className="w-10 h-10 mb-3" />
              <p className="text-sm">Selecione uma paciente</p>
            </div>
          ) : (
            <>
              <div className="p-5 border-b">
                <h2 className="text-lg font-semibold text-navy">{toTitleCase(selectedPatient.fullName)}</h2>
                <div className="mt-2 space-y-1 text-xs text-gray-600">
                  <p>CPF: {formatCPF(selectedPatient.cpf)}</p>
                  {selectedPatient.phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {formatPhone(selectedPatient.phone)}</p>}
                  {selectedPatient.email && <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedPatient.email}</p>}
                  {selectedPatient.dateOfBirth && <p>Nascimento: {new Date(selectedPatient.dateOfBirth + 'T12:00:00').toLocaleDateString('pt-BR')}</p>}
                </div>
                <button onClick={() => setAppointmentModal(true)}
                  className="mt-3 flex items-center gap-1.5 px-3 py-2 bg-lilac text-white text-xs font-medium rounded-lg hover:bg-primary-dark w-full justify-center">
                  <Plus className="w-3.5 h-3.5" /> Agendar consulta
                </button>
              </div>

              <div className="p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Historico de agendamentos</h3>
                {appts.length === 0 ? (
                  <p className="text-xs text-gray-400">Nenhum agendamento</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {appts.map((a: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs border-b border-gray-100 pb-2 last:border-0">
                        <div>
                          <p className="text-gray-700">{new Date(a.date + 'T12:00:00').toLocaleDateString('pt-BR')} · {a.startTime?.slice(0, 5)}</p>
                          <p className="text-gray-400">{a.doctorName ?? '—'}</p>
                        </div>
                        <span className={cn('px-2 py-0.5 text-[10px] font-medium rounded-full',
                          a.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                          a.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                          'bg-blue-50 text-blue-700')}>
                          {a.status === 'completed' ? 'Concluida' : a.status === 'cancelled' ? 'Cancelada' : 'Agendada'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {appointmentModal && selectedPatient && (
        <NewAppointmentModal
          preSelectedPatient={{ id: selectedPatient.id, fullName: selectedPatient.fullName }}
          onClose={() => setAppointmentModal(false)}
        />
      )}
    </div>
  );
}
