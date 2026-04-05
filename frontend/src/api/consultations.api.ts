import api from './client';

export interface Consultation {
  id: string;
  date: string;
  gestationalAgeDays: number;
  weightKg: number | null;
  bpSystolic: number | null;
  bpDiastolic: number | null;
  fetalHeartRate: number | null;
  fetalMovements: string | null;
  edemaGrade: string | null;
  fetalPresentation: string | null;
  fundalHeightCm: number | null;
  subjective: string | null;
  assessment: string | null;
  plan: string | null;
}

export async function fetchConsultations(pregnancyId: string, page = 1, limit = 50) {
  const { data } = await api.get(`/pregnancies/${pregnancyId}/consultations`, {
    params: { page, limit },
  });
  return data;
}

export async function fetchPregnancyDetail(pregnancyId: string) {
  const { data } = await api.get(`/pregnancies/${pregnancyId}`);
  return data;
}

export async function fetchPatient(patientId: string) {
  const { data } = await api.get(`/patients/${patientId}`);
  return data;
}
