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

// ── Lab Results ──
export const fetchLabResults = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/lab-results`)).data;

export const createLabResult = async (pregnancyId: string, dto: Record<string, unknown>) =>
  (await api.post(`/pregnancies/${pregnancyId}/lab-results`, dto)).data;

// ── Vaccines ──
export const fetchVaccines = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/vaccines`)).data;

export const createVaccine = async (pregnancyId: string, dto: Record<string, unknown>) =>
  (await api.post(`/pregnancies/${pregnancyId}/vaccines`, dto)).data;

// ── Vaginal Swabs ──
export const fetchVaginalSwabs = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/vaginal-swabs`)).data;

export const createVaginalSwab = async (pregnancyId: string, dto: Record<string, unknown>) =>
  (await api.post(`/pregnancies/${pregnancyId}/vaginal-swabs`, dto)).data;

// ── Biological Father ──
export const fetchBiologicalFather = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/biological-father`)).data;

export const upsertBiologicalFather = async (pregnancyId: string, dto: Record<string, unknown>) =>
  (await api.post(`/pregnancies/${pregnancyId}/biological-father`, dto)).data;

// ── Files ──
export const fetchFiles = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/files`)).data;

export const createFile = async (pregnancyId: string, dto: Record<string, unknown>) =>
  (await api.post(`/pregnancies/${pregnancyId}/files`, dto)).data;

// ── Prescriptions ──
export const fetchPrescriptions = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/prescriptions`)).data;

export const createPrescription = async (pregnancyId: string, dto: Record<string, unknown>) =>
  (await api.post(`/pregnancies/${pregnancyId}/prescriptions`, dto)).data;

// ── Other Exams ──
export const fetchOtherExams = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/other-exams`)).data;

// ── Copilot ──
export const analyzeCopilot = async (pregnancyId: string) =>
  (await api.post(`/pregnancies/${pregnancyId}/copilot/analyze`)).data;

export const fetchCopilotAlerts = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/copilot/alerts`)).data;
