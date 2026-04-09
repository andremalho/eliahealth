import api from './client';

// ── Uploads — extracao por IA, arquivo descartado ──
export const extractFromFile = async (
  file: File,
  type: 'lab_result' | 'ultrasound',
): Promise<any> => {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post(`/uploads/extract?type=${type}`, form, {
    headers: { 'Content-Type': undefined as any },
    timeout: 90000, // 90s para o Claude processar
  });
  return data;
};

// ── BP Monitoring ──
export const fetchBpReadings = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/bp`)).data;

export const fetchBpTimeline = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/bp/timeline`)).data;

export const createBpReading = async (pregnancyId: string, dto: Record<string, unknown>) =>
  (await api.post(`/pregnancies/${pregnancyId}/bp`, dto)).data;

// ── Glucose Monitoring ──
export const fetchGlucoseDailyTable = async (pregnancyId: string, startDate?: string, endDate?: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/glucose/daily-table`, { params: { startDate, endDate } })).data;

export const fetchGlucoseSummary = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/glucose/summary`)).data;

export const createGlucoseReading = async (pregnancyId: string, dto: Record<string, unknown>) =>
  (await api.post(`/pregnancies/${pregnancyId}/glucose`, dto)).data;

// ── Ultrasounds ──
export const fetchUltrasounds = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/ultrasound-summaries`)).data;

export const createUltrasound = async (pregnancyId: string, dto: Record<string, unknown>) =>
  (await api.post(`/pregnancies/${pregnancyId}/ultrasounds`, dto)).data;

export const updateUltrasound = async (id: string, dto: Record<string, unknown>) =>
  (await api.patch(`/ultrasounds/${id}`, dto)).data;

export const deleteUltrasound = async (id: string) =>
  (await api.delete(`/ultrasounds/${id}`)).data;

// ── Lab Results ──
export const fetchLabResults = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/lab-results`)).data;

export const createLabResult = async (pregnancyId: string, dto: Record<string, unknown>) =>
  (await api.post(`/pregnancies/${pregnancyId}/lab-results`, dto)).data;

export const updateLabResult = async (id: string, dto: Record<string, unknown>) =>
  (await api.patch(`/lab-results/${id}`, dto)).data;

export const deleteLabResult = async (id: string) =>
  (await api.delete(`/lab-results/${id}`)).data;

// ── Vaccines ──
export const fetchVaccines = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/vaccines`)).data;

export const createVaccine = async (pregnancyId: string, dto: Record<string, unknown>) =>
  (await api.post(`/pregnancies/${pregnancyId}/vaccines`, dto)).data;

export const updateVaccine = async (id: string, dto: Record<string, unknown>) =>
  (await api.patch(`/vaccines/${id}`, dto)).data;

export const deleteVaccine = async (id: string) =>
  (await api.delete(`/vaccines/${id}`)).data;

// ── Vaginal Swabs ──
export const fetchVaginalSwabs = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/vaginal-swabs`)).data;

export const createVaginalSwab = async (pregnancyId: string, dto: Record<string, unknown>) =>
  (await api.post(`/pregnancies/${pregnancyId}/vaginal-swabs`, dto)).data;

export const updateVaginalSwab = async (id: string, dto: Record<string, unknown>) =>
  (await api.patch(`/vaginal-swabs/${id}`, dto)).data;

export const deleteVaginalSwab = async (id: string) =>
  (await api.delete(`/vaginal-swabs/${id}`)).data;

// ── Biological Father ──
export const fetchBiologicalFather = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/biological-father`)).data;

export const upsertBiologicalFather = async (pregnancyId: string, dto: Record<string, unknown>) =>
  (await api.post(`/pregnancies/${pregnancyId}/biological-father`, dto)).data;

export const deleteBiologicalFather = async (pregnancyId: string) =>
  (await api.delete(`/pregnancies/${pregnancyId}/biological-father`)).data;

// ── Files ──
export const fetchFiles = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/files`)).data;

export const createFile = async (pregnancyId: string, dto: Record<string, unknown>) =>
  (await api.post(`/pregnancies/${pregnancyId}/files`, dto)).data;

export const updateFile = async (id: string, dto: Record<string, unknown>) =>
  (await api.patch(`/files/${id}`, dto)).data;

export const deleteFile = async (id: string) =>
  (await api.delete(`/files/${id}`)).data;

// ── Consultations ──
export const updateConsultation = async (id: string, dto: Record<string, unknown>) =>
  (await api.patch(`/consultations/${id}`, dto)).data;

export const deleteConsultation = async (id: string) =>
  (await api.delete(`/consultations/${id}`)).data;

// ── Export & Share ──
export const downloadPregnancyCard = async (pregnancyId: string, fileName: string) => {
  const response = await api.get(`/pregnancies/${pregnancyId}/card/pdf`, {
    responseType: 'blob',
  });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};

export const generateShareQrCode = async (pregnancyId: string) => {
  const { data } = await api.post(`/portal/share/public/by-pregnancy/${pregnancyId}`, {});
  return data as { shareToken: string; shareUrl: string; qrCodeData: string; expiresAt: string };
};

export const fetchPublicCard = async (token: string) => {
  // Endpoint público — não usa o axios principal pra evitar redirect em 401
  const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
  const res = await fetch(`${baseURL}/portal/share/public/${token}`);
  if (!res.ok) {
    const err: any = new Error('Falha');
    err.response = { status: res.status, data: await res.json().catch(() => ({})) };
    throw err;
  }
  return res.json();
};

// ── Timeline ──
export interface TimelineEvent {
  id: string;
  type: 'consultation' | 'ultrasound' | 'lab_result' | 'vaccine' | 'prescription' | 'alert';
  date: string;
  title: string;
  gestationalAgeDays?: number;
  details: any;
}

export const fetchTimeline = async (pregnancyId: string): Promise<TimelineEvent[]> => {
  const { data } = await api.get(`/pregnancies/${pregnancyId}/timeline`);
  return data;
};

// ── Prescriptions ──
export const fetchPrescriptions = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/prescriptions`)).data;

export const createPrescription = async (pregnancyId: string, dto: Record<string, unknown>) =>
  (await api.post(`/pregnancies/${pregnancyId}/prescriptions`, dto)).data;

export const updatePrescription = async (id: string, dto: Record<string, unknown>) =>
  (await api.patch(`/prescriptions/${id}`, dto)).data;

export const deletePrescription = async (id: string) =>
  (await api.delete(`/prescriptions/${id}`)).data;

// ── Other Exams ──
export const fetchOtherExams = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/other-exams`)).data;

// ── Postpartum Consultations ──
export const fetchPostpartumConsultations = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/postpartum-consultations`)).data;

export const fetchPostpartumByPatient = async (patientId: string) =>
  (await api.get(`/patients/${patientId}/postpartum-consultations`)).data;

export const createPostpartumConsultation = async (pregnancyId: string, dto: Record<string, unknown>) =>
  (await api.post(`/pregnancies/${pregnancyId}/postpartum-consultations`, dto)).data;

export const updatePostpartumConsultation = async (id: string, dto: Record<string, unknown>) =>
  (await api.patch(`/postpartum-consultations/${id}`, dto)).data;

export const deletePostpartumConsultation = async (id: string) =>
  (await api.delete(`/postpartum-consultations/${id}`)).data;

// ── Patient Exam Review (doctor side) ──
export const fetchPendingPatientExams = async (pregnancyId: string) =>
  (await api.get(`/portal/patient-exams/pending/${pregnancyId}`)).data;

export const reviewPatientExam = async (examId: string, status: 'confirmed' | 'rejected', notes?: string) =>
  (await api.patch(`/portal/patient-exams/${examId}/review`, { status, notes })).data;

// ── Copilot ──
export const analyzeCopilot = async (pregnancyId: string) =>
  (await api.post(`/pregnancies/${pregnancyId}/copilot/analyze`)).data;

export const fetchCopilotAlerts = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/copilot/alerts`)).data;
