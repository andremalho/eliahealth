import api from './client';

export interface TelemedicineSession {
  id: string;
  roomName: string;
  roomUrl: string | null;
  doctorToken: string | null;
  patientToken: string | null;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  notes: string | null;
  patient?: { fullName: string };
  doctor?: { name: string };
}

export const createSession = async (patientId: string, appointmentId?: string) =>
  (await api.post<TelemedicineSession>('/telemedicine/sessions', { patientId, appointmentId })).data;

export const fetchMySessions = async () =>
  (await api.get<TelemedicineSession[]>('/telemedicine/sessions/mine')).data;

export const fetchSession = async (id: string) =>
  (await api.get<TelemedicineSession>(`/telemedicine/sessions/${id}`)).data;

export const startCall = async (id: string) =>
  (await api.post(`/telemedicine/sessions/${id}/start`)).data;

export const endCall = async (id: string, notes?: string) =>
  (await api.post(`/telemedicine/sessions/${id}/end`, { notes })).data;

export const STATUS_LABELS: Record<string, string> = {
  waiting: 'Aguardando',
  in_progress: 'Em andamento',
  completed: 'Concluida',
  cancelled: 'Cancelada',
  no_show: 'Nao compareceu',
};
