import api from './client';

export const fetchMyDoctors = async () =>
  (await api.get('/appointments/my-doctors')).data as {
    id: string;
    doctorId: string;
    doctorName: string | null;
    doctorEmail: string | null;
    specialty: string | null;
  }[];

export const fetchMySecretaries = async () =>
  (await api.get('/appointments/my-secretaries')).data as {
    id: string;
    secretaryId: string;
    secretaryName: string | null;
    secretaryEmail: string | null;
  }[];

export const assignSecretary = async (secretaryId: string, doctorId: string) =>
  (await api.post('/appointments/assign-secretary', { secretaryId, doctorId })).data;

export const removeAssignment = async (id: string) =>
  (await api.delete(`/appointments/assign-secretary/${id}`)).data;

export const fetchPregnanciesForDoctors = async (doctorIds: string[], status?: string, search?: string) => {
  const params: Record<string, string> = {};
  if (doctorIds.length > 0) params.doctorIds = doctorIds.join(',');
  if (status) params.status = status;
  if (search) params.search = search;
  const { data } = await api.get('/pregnancies/list', { params });
  return data;
};

export const fetchGynecologyPatientsForDoctors = async (doctorIds: string[]) => {
  // Busca pacientes com consultas ginecológicas dos médicos vinculados
  const { data } = await api.get('/patients', {
    params: { limit: 100 },
  });
  return (data?.data ?? data ?? []) as any[];
};
