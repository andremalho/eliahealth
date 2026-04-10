import api from './client';

export type AppointmentCategory = 'primeira_consulta' | 'retorno' | 'particular' | 'convenio' | 'urgencia' | 'encaixe';

export interface AppointmentItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
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
  urgencia: 'Urgencia',
  encaixe: 'Encaixe',
};

export const CATEGORY_COLORS: Record<string, string> = {
  primeira_consulta: 'bg-blue-100 text-blue-700',
  retorno: 'bg-emerald-100 text-emerald-700',
  particular: 'bg-amber-100 text-amber-800',
  convenio: 'bg-violet-100 text-violet-700',
  urgencia: 'bg-red-100 text-red-700',
  encaixe: 'bg-orange-100 text-orange-700',
};

export const CATEGORY_DOT_COLORS: Record<string, string> = {
  primeira_consulta: 'bg-blue-500',
  retorno: 'bg-emerald-500',
  particular: 'bg-amber-500',
  convenio: 'bg-violet-500',
  urgencia: 'bg-red-500',
  encaixe: 'bg-orange-500',
};
