import api from './client';

export const admitPatient = async (dto: Record<string, unknown>) =>
  (await api.post('/hospitalizations', dto)).data;

export const fetchActiveHospitalizations = async () =>
  (await api.get('/hospitalizations/active')).data;

export const fetchPatientHospitalizations = async (patientId: string) =>
  (await api.get(`/hospitalizations/patient/${patientId}`)).data;

export const fetchHospitalization = async (id: string) =>
  (await api.get(`/hospitalizations/${id}`)).data;

export const dischargePatient = async (id: string, dto: { dischargeSummary: string; dischargeDiagnosis?: string; dischargeInstructions?: string }) =>
  (await api.post(`/hospitalizations/${id}/discharge`, dto)).data;

export const addEvolution = async (hospId: string, dto: Record<string, unknown>) =>
  (await api.post(`/hospitalizations/${hospId}/evolutions`, dto)).data;

export const fetchEvolutions = async (hospId: string) =>
  (await api.get(`/hospitalizations/${hospId}/evolutions`)).data;

export const updateEvolution = async (id: string, dto: Record<string, unknown>) =>
  (await api.patch(`/evolutions/${id}`, dto)).data;

export const deleteEvolution = async (id: string) =>
  (await api.delete(`/evolutions/${id}`)).data;
