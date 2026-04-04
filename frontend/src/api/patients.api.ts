import api from './client';

export interface Patient {
  id: string;
  fullName: string;
  cpf: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  bloodType: string | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
}) {
  const { data } = await api.post<Patient>('/patients', dto);
  return data;
}
