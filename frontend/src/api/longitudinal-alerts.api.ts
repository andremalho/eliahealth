import api from './client';

export interface LongitudinalAlert {
  id: string;
  doctorId: string;
  patientId: string | null;
  alertType: string;
  title: string;
  description: string;
  suggestedAction: string | null;
  severity: string;
  readByDoctor: boolean;
  actedUpon: boolean;
  doctorResponse: string | null;
  createdAt: string;
}

export async function fetchLongitudinalAlerts(unreadOnly = false, page = 1, limit = 20) {
  const { data } = await api.get('/copilot/longitudinal-alerts', {
    params: { unreadOnly: unreadOnly ? 'true' : undefined, page, limit },
  });
  return data as { data: LongitudinalAlert[]; total: number; page: number; limit: number; totalPages: number };
}

export async function markAlertAsRead(id: string) {
  const { data } = await api.patch(`/copilot/longitudinal-alerts/${id}/read`);
  return data;
}

export async function respondToAlert(id: string, response: string) {
  const { data } = await api.patch(`/copilot/longitudinal-alerts/${id}/respond`, { response });
  return data;
}
