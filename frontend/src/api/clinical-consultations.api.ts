import api from './client';

export interface ClinicalConsultation {
  id: string;
  patientId: string;
  date: string;
  specialty: string | null;
  bpSystolic: number | null;
  bpDiastolic: number | null;
  heartRate: number | null;
  temperature: number | null;
  spo2: number | null;
  weightKg: number | null;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  icd10Codes: string[] | null;
  diagnosis: string | null;
  alerts: { level: string; message: string }[] | null;
}

export const fetchClinicalConsultations = async (patientId: string) =>
  (await api.get(`/patients/${patientId}/clinical-consultations`)).data;

export const createClinicalConsultation = async (patientId: string, dto: Record<string, unknown>) =>
  (await api.post(`/patients/${patientId}/clinical-consultations`, dto)).data;

export const updateClinicalConsultation = async (id: string, dto: Record<string, unknown>) =>
  (await api.patch(`/clinical-consultations/${id}`, dto)).data;

export const deleteClinicalConsultation = async (id: string) =>
  (await api.delete(`/clinical-consultations/${id}`)).data;
