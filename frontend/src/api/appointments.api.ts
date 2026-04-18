import api from './client';

export type AppointmentCategory = 'primeira_consulta' | 'retorno' | 'particular' | 'convenio' | 'urgência' | 'encaixe';

export type AppointmentSpecialty = 'obstetrics' | 'gynecology' | 'clinical' | 'ultrasound';

export const SPECIALTY_LABELS: Record<AppointmentSpecialty, string> = {
  obstetrics: 'Obstetricia',
  gynecology: 'Ginecologia',
  clinical: 'Clínica Médica',
  ultrasound: 'Ultrassonografia',
};

export interface AppointmentItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  specialty: AppointmentSpecialty | null;
  status: string;
  category: AppointmentCategory | null;
  notes: string | null;
  cancellationReason: string | null;
  patientId: string;
  patientName: string | null;
  doctorId: string;
  doctorName: string | null;
}

export interface AppointmentSummary {
  total: number;
  scheduled: number;
  confirmed: number;
  arrived: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

export const fetchAppointments = async (params: {
  date?: string;
  startDate?: string;
  endDate?: string;
  doctorId?: string;
}) => (await api.get<AppointmentItem[]>('/appointments', { params })).data;

export const fetchAppointmentSummary = async (date: string) =>
  (await api.get<AppointmentSummary>('/appointments/summary', { params: { date } })).data;

export const fetchPatientAppointments = async (patientId: string) =>
  (await api.get('/appointments/patient/' + patientId)).data;

export const createAppointment = async (dto: {
  patientId: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  type?: string;
  specialty?: string;
  category?: string;
  notes?: string;
}) => (await api.post('/appointments', dto)).data;

export const updateAppointment = async (id: string, dto: Record<string, unknown>) =>
  (await api.patch(`/appointments/${id}`, dto)).data;

export const cancelAppointment = async (id: string, reason?: string) =>
  (await api.delete(`/appointments/${id}`, { data: { reason } })).data;

export const fetchDoctors = async () =>
  (await api.get<{ id: string; name: string; email: string; specialty: string | null }[]>('/auth/doctors')).data;

export const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Agendada',
  confirmed: 'Confirmada',
  arrived: 'Chegou',
  in_progress: 'Em atendimento',
  completed: 'Concluida',
  cancelled: 'Cancelada',
  no_show: 'Faltou',
};

export const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-700',
  confirmed: 'bg-emerald-50 text-emerald-700',
  arrived: 'bg-violet-50 text-violet-700',
  in_progress: 'bg-amber-50 text-amber-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-50 text-red-700',
  no_show: 'bg-red-50 text-red-600',
};

export const TYPE_LABELS: Record<string, string> = {
  consultation: 'Consulta',
  follow_up: 'Retorno',
  exam: 'Exame',
  procedure: 'Procedimento',
  other: 'Outro',
};

export const CATEGORY_LABELS: Record<string, string> = {
  primeira_consulta: '1a consulta',
  retorno: 'Retorno',
  particular: 'Particular',
  convenio: 'Convenio',
  urgência: 'Urgência',
  encaixe: 'Encaixe',
};

export const CATEGORY_COLORS: Record<string, string> = {
  primeira_consulta: 'bg-blue-100 text-blue-700',
  retorno: 'bg-emerald-100 text-emerald-700',
  particular: 'bg-amber-100 text-amber-800',
  convenio: 'bg-violet-100 text-violet-700',
  urgência: 'bg-red-100 text-red-700',
  encaixe: 'bg-orange-100 text-orange-700',
};

export const fetchProceduresCalendar = async (month: number, year: number, doctorId?: string) => {
  const params: Record<string, string | number> = { month, year };
  if (doctorId) params.doctorId = doctorId;
  const { data } = await api.get('/appointments/procedures', { params });
  return data as { date: string; type: string; label: string; patient_name: string; patient_id: string; doctor_name: string | null }[];
};

export const PROCEDURE_LABELS: Record<string, string> = {
  egg_retrieval: 'Coleta',
  embryo_transfer: 'Transferencia',
  iui: 'IIU',
  trigger: 'Trigger',
  beta_hcg: 'Beta HCG',
  stimulation_start: 'Estimulação',
  gyn_procedure: 'Procedimento',
  return: 'Retorno',
};

export const PROCEDURE_COLORS: Record<string, string> = {
  egg_retrieval: 'bg-pink-100 text-pink-700',
  embryo_transfer: 'bg-violet-100 text-violet-700',
  iui: 'bg-blue-100 text-blue-700',
  trigger: 'bg-amber-100 text-amber-700',
  beta_hcg: 'bg-emerald-100 text-emerald-700',
  stimulation_start: 'bg-cyan-100 text-cyan-700',
  gyn_procedure: 'bg-red-100 text-red-700',
  return: 'bg-gray-100 text-gray-600',
};

export const PROCEDURE_DOT_COLORS: Record<string, string> = {
  egg_retrieval: 'bg-pink-500',
  embryo_transfer: 'bg-violet-500',
  iui: 'bg-blue-500',
  trigger: 'bg-amber-500',
  beta_hcg: 'bg-emerald-500',
  stimulation_start: 'bg-cyan-500',
  gyn_procedure: 'bg-red-500',
  return: 'bg-gray-400',
};

export const CATEGORY_DOT_COLORS: Record<string, string> = {
  primeira_consulta: 'bg-blue-500',
  retorno: 'bg-emerald-500',
  particular: 'bg-amber-500',
  convenio: 'bg-violet-500',
  urgência: 'bg-red-500',
  encaixe: 'bg-orange-500',
};
