import api from './client';

export interface Patient {
  id: string;
  fullName: string;
  cpf: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  bloodType: string | null;
  address: string | null;
  zipCode: string | null;
  city: string | null;
  state: string | null;
  height: number | null;
  maritalStatus: string | null;
  profession: string | null;
  education: string | null;
  comorbidities: string | null;
  comorbiditiesSelected: string[] | null;
  comorbiditiesNotes: string | null;
  allergies: string | null;
  allergiesSelected: string[] | null;
  allergiesNotes: string | null;
  addictions: string | null;
  addictionsSelected: string[] | null;
  addictionsNotes: string | null;
  surgeries: string | null;
  familyHistory: string | null;
  menarcheAge: number | null;
  menstrualCycle: string | null;
  dysmenorrhea: boolean | null;
  profileNotes: string | null;
  profileCompletedAt: string | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function fetchPatient(id: string) {
  const { data } = await api.get<Patient>(`/patients/${id}`);
  return data;
}

export async function fetchPatients(page = 1, limit = 20) {
  const { data } = await api.get<PaginatedResponse<Patient>>('/patients', {
    params: { page, limit },
  });
  return data;
}

export async function searchPatients(q: string, page = 1, limit = 20) {
  const { data } = await api.get<PaginatedResponse<Patient>>('/patients/search', {
    params: { q, page, limit },
  });
  return data;
}

export async function createPatient(dto: {
  fullName: string;
  cpf: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  height?: number;
  maritalStatus?: string;
  profession?: string;
  education?: string;
}) {
  const { data } = await api.post<Patient>('/patients', dto);
  return data;
}

export async function updatePatient(id: string, dto: Record<string, unknown>) {
  const { data } = await api.patch<Patient>(`/patients/${id}`, dto);
  return data;
}
